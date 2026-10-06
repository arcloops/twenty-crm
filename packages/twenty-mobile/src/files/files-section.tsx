import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  useAttachments,
  type AttachmentRecord,
} from '@/files/use-attachments';
import { Button, EmptyState, ListRow, Spinner, useTheme, spacing } from '@/ui';

type FilesSectionProps = {
  objectNameSingular: string;
  recordId: string;
};

export const FilesSection = ({
  objectNameSingular,
  recordId,
}: FilesSectionProps) => {
  const theme = useTheme();
  const {
    attachments,
    isLoading,
    isUploading,
    error,
    uploadAttachment,
    openAttachment,
  } = useAttachments(objectNameSingular, recordId);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Files</Text>
        <View style={styles.headerActions}>
          {objectNameSingular === 'person' ? (
            <Button
              label="Scan card"
              variant="ghost"
              onPress={() => {
                router.push({
                  pathname: '/(app)/people/scan-card',
                  params: { personId: recordId },
                });
              }}
            />
          ) : null}
          <Button
            label={isUploading ? 'Uploading…' : 'Upload'}
            variant="ghost"
            loading={isUploading}
            onPress={() => {
              void uploadAttachment();
            }}
          />
        </View>
      </View>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}
      {isLoading && attachments.length === 0 ? <Spinner /> : null}

      {attachments.map((attachment: AttachmentRecord) => (
        <ListRow
          key={attachment.id}
          title={attachment.name || attachment.file?.[0]?.label || 'File'}
          subtitle={attachment.createdAt?.slice(0, 10)}
          onPress={() => {
            void openAttachment(attachment);
          }}
        />
      ))}

      {!isLoading && attachments.length === 0 ? (
        <EmptyState
          title="No files"
          description="Upload an attachment to this record."
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { gap: spacing(2) },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing(1),
  },
  title: { fontSize: 17, fontWeight: '700' },
});
