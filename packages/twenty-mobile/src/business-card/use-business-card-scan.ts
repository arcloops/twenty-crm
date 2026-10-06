import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '@/auth/auth-context';
import {
  EXTRACT_PERSON_FROM_BUSINESS_CARD,
  type BusinessCardExtraction,
  type BusinessCardSide,
  type CapturedCardImage,
} from '@/business-card/queries';
import {
  COMPLETE_FILE_UPLOAD,
  CREATE_ATTACHMENT,
  CREATE_FILE_UPLOAD,
  getTargetFieldIdName,
} from '@/files/queries';
import { useObjects } from '@/metadata/objects-provider';

type CaptureSource = 'camera' | 'library';

const IMAGE_QUALITY = 0.85;

const mimeFromUri = (uri: string, fallback = 'image/jpeg') => {
  const lowered = uri.toLowerCase();
  if (lowered.endsWith('.png')) {
    return 'image/png';
  }
  if (lowered.endsWith('.webp')) {
    return 'image/webp';
  }
  return fallback;
};

const filenameForSide = (side: BusinessCardSide, mimeType: string) => {
  const extension =
    mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `business-card-${side}.${extension}`;
};

export const useBusinessCardScan = () => {
  const { apolloClients } = useAuth();
  const { getBySingular } = useObjects();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<BusinessCardExtraction | null>(
    null,
  );
  const [frontImage, setFrontImage] = useState<CapturedCardImage | null>(null);
  const [backImage, setBackImage] = useState<CapturedCardImage | null>(null);

  const ensurePermission = useCallback(async (source: CaptureSource) => {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Camera permission is required to photograph cards');
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo library permission is required');
    }
  }, []);

  const captureSide = useCallback(
    async (side: BusinessCardSide, source: CaptureSource) => {
      setError(null);

      try {
        await ensurePermission(source);

        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: IMAGE_QUALITY,
                allowsEditing: true,
                aspect: [16, 10],
              })
            : await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: IMAGE_QUALITY,
                allowsEditing: true,
                aspect: [16, 10],
              });

        if (result.canceled || !result.assets?.[0]) {
          return null;
        }

        const asset = result.assets[0];
        const mimeType =
          asset.mimeType || mimeFromUri(asset.uri, 'image/jpeg');
        const captured: CapturedCardImage = {
          side,
          uri: asset.uri,
          mimeType,
          filename: filenameForSide(side, mimeType),
        };

        if (side === 'front') {
          setFrontImage(captured);
        } else {
          setBackImage(captured);
        }

        return captured;
      } catch (captureError) {
        const message =
          captureError instanceof Error
            ? captureError.message
            : 'Failed to capture card image';
        setError(message);
        throw captureError;
      }
    },
    [ensurePermission],
  );

  const clearSide = useCallback((side: BusinessCardSide) => {
    if (side === 'front') {
      setFrontImage(null);
    } else {
      setBackImage(null);
    }
  }, []);

  const uploadImage = useCallback(
    async (image: CapturedCardImage) => {
      if (!apolloClients) {
        throw new Error('Not authenticated');
      }

      const blob = await (await fetch(image.uri)).blob();
      const size = blob.size > 0 ? blob.size : 1;

      const createResult = await apolloClients.metadataClient.mutate({
        mutation: CREATE_FILE_UPLOAD,
        variables: {
          filename: image.filename,
          size,
          fileFolder: 'agent-chat',
        },
      });

      const uploadTarget = createResult.data?.createFileUpload;
      if (!uploadTarget?.uploadUrl || !uploadTarget?.fileId) {
        throw new Error('Failed to create file upload');
      }

      const putResponse = await fetch(uploadTarget.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type':
            uploadTarget.contentType || image.mimeType || 'image/jpeg',
        },
        body: blob,
      });

      if (!putResponse.ok) {
        throw new Error(`Upload failed (${putResponse.status})`);
      }

      await apolloClients.metadataClient.mutate({
        mutation: COMPLETE_FILE_UPLOAD,
        variables: { fileId: uploadTarget.fileId },
      });

      return uploadTarget.fileId as string;
    },
    [apolloClients],
  );

  const extractFromCaptured = useCallback(async () => {
    if (!apolloClients) {
      throw new Error('Not authenticated');
    }

    if (!frontImage) {
      throw new Error('Capture the front of the business card first');
    }

    setIsWorking(true);
    setError(null);

    try {
      const images = [frontImage, backImage].filter(
        (image): image is CapturedCardImage => image !== null,
      );
      const fileIds: string[] = [];

      for (const image of images) {
        fileIds.push(await uploadImage(image));
      }

      const extractResult = await apolloClients.metadataClient.mutate<{
        extractPersonFromBusinessCard: BusinessCardExtraction;
      }>({
        mutation: EXTRACT_PERSON_FROM_BUSINESS_CARD,
        variables: { fileIds },
      });

      const next = extractResult.data?.extractPersonFromBusinessCard;
      if (!next) {
        throw new Error('Empty extraction response');
      }

      setExtraction(next);
      return next;
    } catch (scanError) {
      const message =
        scanError instanceof Error
          ? scanError.message
          : 'Failed to scan business card';
      setError(message);
      throw scanError;
    } finally {
      setIsWorking(false);
    }
  }, [apolloClients, backImage, frontImage, uploadImage]);

  const attachCardImagesToPerson = useCallback(
    async (personId: string) => {
      if (!apolloClients) {
        throw new Error('Not authenticated');
      }

      const images = [frontImage, backImage].filter(
        (image): image is CapturedCardImage => image !== null,
      );

      if (images.length === 0) {
        return;
      }

      const attachmentObject = getBySingular('attachment');
      const filesFieldMetadataId = attachmentObject?.fieldsList.find(
        (field) => field.type === 'FILES' && field.name === 'file',
      )?.id;

      if (!filesFieldMetadataId) {
        throw new Error('Attachment file field metadata not found');
      }

      const targetField = getTargetFieldIdName('person');

      for (const image of images) {
        const blob = await (await fetch(image.uri)).blob();
        const size = blob.size > 0 ? blob.size : 1;

        const createResult = await apolloClients.metadataClient.mutate({
          mutation: CREATE_FILE_UPLOAD,
          variables: {
            filename: image.filename,
            size,
            fileFolder: 'files-field',
            fieldMetadataId: filesFieldMetadataId,
          },
        });

        const uploadTarget = createResult.data?.createFileUpload;
        if (!uploadTarget?.uploadUrl || !uploadTarget?.fileId) {
          throw new Error('Failed to create attachment upload');
        }

        const putResponse = await fetch(uploadTarget.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type':
              uploadTarget.contentType || image.mimeType || 'image/jpeg',
          },
          body: blob,
        });

        if (!putResponse.ok) {
          throw new Error(`Attachment upload failed (${putResponse.status})`);
        }

        const completeResult = await apolloClients.metadataClient.mutate({
          mutation: COMPLETE_FILE_UPLOAD,
          variables: { fileId: uploadTarget.fileId },
        });

        const uploaded = completeResult.data?.completeFileUpload;
        if (!uploaded?.id) {
          throw new Error('Failed to complete attachment upload');
        }

        await apolloClients.coreClient.mutate({
          mutation: CREATE_ATTACHMENT,
          variables: {
            input: {
              name: image.filename,
              [targetField]: personId,
              file: [
                {
                  fileId: uploaded.id,
                  label: image.filename,
                },
              ],
            },
          },
        });
      }
    },
    [apolloClients, backImage, frontImage, getBySingular],
  );

  return {
    frontImage,
    backImage,
    captureSide,
    clearSide,
    extractFromCaptured,
    attachCardImagesToPerson,
    isWorking,
    error,
    extraction,
    setExtraction,
    setError,
  };
};
