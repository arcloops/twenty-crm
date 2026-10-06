import React, { useLayoutEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';

import { buildPersonInputFromBusinessCardDraft } from '@/business-card/build-person-input-from-draft';
import { useBusinessCardScan } from '@/business-card/use-business-card-scan';
import { useObjects } from '@/metadata/objects-provider';
import {
  useCreateRecord,
  useRecordDetail,
} from '@/records/use-records';
import { Button, Screen, TextInput, useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

const isNonEmptyString = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export default function ScanBusinessCardScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const existingPersonId =
    typeof personId === 'string' && personId.length > 0 ? personId : null;
  const isAttachingToExisting = existingPersonId !== null;

  const { getBySingular } = useObjects();
  const personObject = getBySingular('person');
  const { createRecord } = useCreateRecord(personObject);
  const { record: existingPerson, updateRecord } = useRecordDetail(
    personObject,
    existingPersonId ?? undefined,
  );
  const {
    frontImage,
    backImage,
    captureSide,
    clearSide,
    extractFromCaptured,
    attachCardImagesToPerson,
    isWorking,
    error,
    setError,
  } = useBusinessCardScan();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isAttachingToExisting
        ? 'Add business card'
        : 'Scan business card',
    });
  }, [isAttachingToExisting, navigation]);

  const handleScan = async () => {
    setError(null);
    try {
      const extraction = await extractFromCaptured();
      if (!extraction) {
        return;
      }
      setFirstName(extraction.firstName ?? '');
      setLastName(extraction.lastName ?? '');
      setJobTitle(extraction.jobTitle ?? '');
      setEmail(extraction.emails[0] ?? '');
      setPhone(extraction.phones[0] ?? '');
      setWebsite(extraction.website ?? '');
      setCompanyName(extraction.companyName ?? '');
      setCompanyId(extraction.companyId);
      setWarnings(extraction.warnings);
      setHasScanned(true);
    } catch {
      // error state set in hook
    }
  };

  const handleAttachOnly = async () => {
    if (!existingPersonId) {
      return;
    }

    if (!frontImage) {
      setError('Capture the front of the business card first');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await attachCardImagesToPerson(existingPersonId);
      router.back();
    } catch (attachError) {
      setError(
        attachError instanceof Error
          ? attachError.message
          : 'Failed to attach business card',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!personObject) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const personInput = buildPersonInputFromBusinessCardDraft(
        {
          firstName,
          lastName,
          jobTitle,
          email,
          phone,
          website,
          companyId,
        },
        isAttachingToExisting
          ? {
              emptyFieldsOnly: true,
              existingPerson: existingPerson
                ? {
                    name: existingPerson.name as
                      | {
                          firstName?: string | null;
                          lastName?: string | null;
                        }
                      | null
                      | undefined,
                    jobTitle:
                      typeof existingPerson.jobTitle === 'string'
                        ? existingPerson.jobTitle
                        : null,
                    emails: existingPerson.emails as
                      | { primaryEmail?: string | null }
                      | null
                      | undefined,
                    phones: existingPerson.phones as
                      | { primaryPhoneNumber?: string | null }
                      | null
                      | undefined,
                    linkedinLink: existingPerson.linkedinLink as
                      | { primaryLinkUrl?: string | null }
                      | null
                      | undefined,
                    companyId:
                      typeof existingPerson.companyId === 'string'
                        ? existingPerson.companyId
                        : null,
                  }
                : null,
            }
          : undefined,
      );

      if (isAttachingToExisting && existingPersonId) {
        if (Object.keys(personInput).length > 0) {
          await updateRecord(personInput);
        }

        try {
          await attachCardImagesToPerson(existingPersonId);
        } catch (attachError) {
          setError(
            attachError instanceof Error
              ? `Person updated, but saving card images failed: ${attachError.message}`
              : 'Person updated, but saving card images failed',
          );
          return;
        }

        router.back();
        return;
      }

      const created = await createRecord(personInput);
      if (created?.id) {
        try {
          await attachCardImagesToPerson(String(created.id));
        } catch (attachError) {
          setError(
            attachError instanceof Error
              ? `Person created, but saving card images failed: ${attachError.message}`
              : 'Person created, but saving card images failed',
          );
        }

        router.replace({
          pathname: '/(app)/object/[singular]/[id]',
          params: {
            singular: 'person',
            id: String(created.id),
          },
        });
      } else {
        router.back();
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : isAttachingToExisting
            ? 'Failed to update person'
            : 'Failed to create person',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen edges={['left', 'right']} scroll>
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Business card
      </Text>
      <Text style={{ color: theme.text.secondary, marginBottom: spacing(2) }}>
        {isAttachingToExisting
          ? 'Photograph the front and back, then attach to this person. Scanning fills only empty fields.'
          : 'Photograph the front and back of the card (or pick from the library), scan fields, review, then create the person with card images attached.'}
      </Text>

      <View style={styles.sidesRow}>
        <View
          style={[
            styles.sideCard,
            {
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.primary,
            },
          ]}
        >
          <Text style={[styles.sideLabel, { color: theme.text.primary }]}>
            Front
          </Text>
          {frontImage ? (
            <Image
              source={{ uri: frontImage.uri }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.previewPlaceholder,
                { backgroundColor: theme.background.tertiary },
              ]}
            >
              <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
                Required
              </Text>
            </View>
          )}
          <Button
            label="Take photo"
            variant="secondary"
            disabled={isWorking || isSaving}
            onPress={() => {
              void captureSide('front', 'camera');
            }}
          />
          <Button
            label="Library"
            variant="ghost"
            disabled={isWorking || isSaving}
            onPress={() => {
              void captureSide('front', 'library');
            }}
          />
          {frontImage ? (
            <Button
              label="Clear"
              variant="ghost"
              disabled={isWorking || isSaving}
              onPress={() => clearSide('front')}
            />
          ) : null}
        </View>

        <View
          style={[
            styles.sideCard,
            {
              backgroundColor: theme.background.secondary,
              borderColor: theme.border.primary,
            },
          ]}
        >
          <Text style={[styles.sideLabel, { color: theme.text.primary }]}>
            Back
          </Text>
          {backImage ? (
            <Image
              source={{ uri: backImage.uri }}
              style={styles.preview}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.previewPlaceholder,
                { backgroundColor: theme.background.tertiary },
              ]}
            >
              <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
                Optional
              </Text>
            </View>
          )}
          <Button
            label="Take photo"
            variant="secondary"
            disabled={isWorking || isSaving}
            onPress={() => {
              void captureSide('back', 'camera');
            }}
          />
          <Button
            label="Library"
            variant="ghost"
            disabled={isWorking || isSaving}
            onPress={() => {
              void captureSide('back', 'library');
            }}
          />
          {backImage ? (
            <Button
              label="Clear"
              variant="ghost"
              disabled={isWorking || isSaving}
              onPress={() => clearSide('back')}
            />
          ) : null}
        </View>
      </View>

      <Button
        label={hasScanned ? 'Scan again' : 'Scan card fields'}
        loading={isWorking}
        disabled={!frontImage || isWorking || isSaving}
        onPress={() => {
          void handleScan();
        }}
      />

      {isAttachingToExisting ? (
        <Button
          label="Attach images only"
          variant="secondary"
          loading={isSaving && !hasScanned}
          disabled={!frontImage || isWorking || isSaving}
          onPress={() => {
            void handleAttachOnly();
          }}
        />
      ) : null}

      {warnings.map((warning) => (
        <Text key={warning} style={{ color: theme.danger, fontSize: 13 }}>
          {warning}
        </Text>
      ))}
      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

      {hasScanned ? (
        <View style={styles.form}>
          {isAttachingToExisting ? (
            <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
              Only empty fields on this person will be filled.
            </Text>
          ) : null}
          <TextInput
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            label="Job title"
            value={jobTitle}
            onChangeText={setJobTitle}
          />
          <TextInput label="Email" value={email} onChangeText={setEmail} />
          <TextInput label="Phone" value={phone} onChangeText={setPhone} />
          <TextInput
            label="Website"
            value={website}
            onChangeText={setWebsite}
          />
          <TextInput
            label="Company"
            value={companyName}
            onChangeText={(value) => {
              setCompanyName(value);
              setCompanyId(null);
            }}
            editable={!isNonEmptyString(companyId)}
          />
          {isNonEmptyString(companyId) ? (
            <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
              Company will be linked automatically.
            </Text>
          ) : null}
          <Text style={{ color: theme.text.tertiary, fontSize: 13 }}>
            Card image{backImage ? 's' : ''} will be saved on the person.
          </Text>
          <Button
            label={isAttachingToExisting ? 'Save to person' : 'Create person'}
            loading={isSaving}
            disabled={isWorking || isSaving}
            onPress={() => {
              void handleSave();
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  sidesRow: {
    flexDirection: 'row',
    gap: spacing(2),
    marginBottom: spacing(2),
  },
  sideCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing(1),
    padding: spacing(2),
  },
  sideLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    borderRadius: radius.sm,
    height: 120,
    width: '100%',
  },
  previewPlaceholder: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 120,
    justifyContent: 'center',
    width: '100%',
  },
  form: {
    gap: spacing(2),
    marginTop: spacing(2),
  },
});
