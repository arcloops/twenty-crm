import { useCallback, useEffect, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';

import { useAuth } from '@/auth/auth-context';
import { useObjects } from '@/metadata/objects-provider';
import {
  COMPLETE_FILE_UPLOAD,
  CREATE_ATTACHMENT,
  CREATE_FILE_UPLOAD,
  FIND_ATTACHMENTS,
  getTargetFieldIdName,
} from '@/files/queries';

export type AttachmentRecord = {
  id: string;
  name: string;
  createdAt?: string;
  file?: Array<{
    fileId?: string;
    label?: string;
    url?: string;
    path?: string;
  }> | null;
};

export const useAttachments = (
  objectNameSingular: string | undefined,
  recordId: string | undefined,
) => {
  const { apolloClients } = useAuth();
  const { getBySingular } = useObjects();
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      setAttachments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const targetField = getTargetFieldIdName(objectNameSingular);
      const result = await apolloClients.coreClient.query({
        query: FIND_ATTACHMENTS,
        variables: {
          limit: 50,
          filter: {
            [targetField]: { eq: recordId },
          },
        },
        fetchPolicy: 'network-only',
      });

      const edges = result.data?.attachments?.edges ?? [];
      setAttachments(
        edges.map((edge: { node: AttachmentRecord }) => edge.node),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load attachments',
      );
    } finally {
      setIsLoading(false);
    }
  }, [apolloClients, objectNameSingular, recordId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const uploadAttachment = useCallback(async () => {
    if (!apolloClients || !objectNameSingular || !recordId) {
      return;
    }

    const attachmentObject = getBySingular('attachment');
    const filesFieldMetadataId = attachmentObject?.fieldsList.find(
      (field) => field.type === 'FILES' && field.name === 'file',
    )?.id;

    if (!filesFieldMetadataId) {
      setError('Attachment file field metadata not found');
      return;
    }

    const picked = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (picked.canceled || !picked.assets?.[0]) {
      return;
    }

    const asset = picked.assets[0];
    setIsUploading(true);
    setError(null);

    try {
      const createResult = await apolloClients.metadataClient.mutate({
        mutation: CREATE_FILE_UPLOAD,
        variables: {
          filename: asset.name,
          size: asset.size ?? 0,
          fileFolder: 'files-field',
          fieldMetadataId: filesFieldMetadataId,
        },
      });

      const uploadTarget = createResult.data?.createFileUpload;
      if (!uploadTarget) {
        throw new Error('Failed to create file upload');
      }

      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();

      // Signed upload URL must not send workspace Bearer (matches web)
      const putResponse = await fetch(uploadTarget.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type':
            uploadTarget.contentType ||
            asset.mimeType ||
            'application/octet-stream',
        },
        body: blob,
      });

      if (!putResponse.ok) {
        throw new Error(`Upload failed (${putResponse.status})`);
      }

      const completeResult = await apolloClients.metadataClient.mutate({
        mutation: COMPLETE_FILE_UPLOAD,
        variables: { fileId: uploadTarget.fileId },
      });

      const uploaded = completeResult.data?.completeFileUpload;
      if (!uploaded?.id) {
        throw new Error('Failed to complete upload');
      }

      const targetField = getTargetFieldIdName(objectNameSingular);
      await apolloClients.coreClient.mutate({
        mutation: CREATE_ATTACHMENT,
        variables: {
          input: {
            name: asset.name,
            [targetField]: recordId,
            file: [
              {
                fileId: uploaded.id,
                label: asset.name,
              },
            ],
          },
        },
      });

      await reload();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload file',
      );
    } finally {
      setIsUploading(false);
    }
  }, [
    apolloClients,
    getBySingular,
    objectNameSingular,
    recordId,
    reload,
  ]);

  const openAttachment = useCallback(async (attachment: AttachmentRecord) => {
    const url = attachment.file?.[0]?.url;
    if (!url) {
      setError('This file has no download URL');
      return;
    }
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      setError('Cannot open this file URL on device');
      return;
    }
    await Linking.openURL(url);
  }, []);

  return {
    attachments,
    isLoading,
    isUploading,
    error,
    reload,
    uploadAttachment,
    openAttachment,
  };
};
