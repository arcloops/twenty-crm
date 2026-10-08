import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  hasWorkspaceMembersPermission,
  hasWorkspacePermission,
  useAuth,
} from '@/auth/auth-context';
import { BannerStrip } from '@/banners/banner-strip';
import { useReconnectAccountBanner } from '@/banners/use-reconnect-account-banner';
import {
  formatTodayHeading,
  getDueLabel,
  getTimeOfDayGreeting,
} from '@/home/home-filters';
import { useHomeInsights } from '@/home/use-home-insights';
import { QuickActionFab } from '@/navigation/quick-action-fab';
import { ListRow, Screen, Spinner, useTheme } from '@/ui';
import { radius, spacing } from '@/ui/theme';

export default function HomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const reconnectBanner = useReconnectAccountBanner();
  const insights = useHomeInsights();

  const displayName =
    user?.workspaceMember?.name?.firstName ||
    user?.firstName ||
    user?.email ||
    'there';

  const isAdmin =
    hasWorkspacePermission(user) || hasWorkspaceMembersPermission(user);

  const showWorkspacePulse =
    isAdmin ||
    reconnectBanner.failedCount > 0 ||
    insights.workspaceMembersCount !== null;

  return (
    <View style={styles.root}>
      <Screen
        edges={['left', 'right']}
        style={styles.screen}
        contentStyle={styles.content}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <Text style={[styles.greeting, { color: theme.text.secondary }]}>
              {getTimeOfDayGreeting()}, {displayName}
            </Text>
            <Text style={[styles.name, { color: theme.text.primary }]}>
              {formatTodayHeading()}
            </Text>
            {insights.workspaceDisplayName ? (
              <Text style={{ color: theme.text.tertiary }}>
                {insights.workspaceDisplayName}
              </Text>
            ) : null}
          </View>

          {reconnectBanner.shouldShow ? (
            <BannerStrip
              message={`${reconnectBanner.failedCount} account${reconnectBanner.failedCount === 1 ? '' : 's'} need reconnecting.`}
              actionLabel="Fix"
              onAction={() => router.push('/(app)/settings/accounts')}
              onDismiss={reconnectBanner.dismiss}
            />
          ) : null}

          <View style={styles.statRow}>
            <StatChip
              label="Overdue"
              value={insights.overdueCount}
              tone={insights.overdueCount > 0 ? 'danger' : 'neutral'}
              onPress={() => router.navigate('/(app)/(drawer)/(tabs)/tasks')}
            />
            <StatChip
              label="Due soon"
              value={insights.dueSoonCount}
              tone="accent"
              onPress={() => router.navigate('/(app)/(drawer)/(tabs)/tasks')}
            />
            <StatChip
              label="Open deals"
              value={insights.pipelineTotal ?? 0}
              tone="neutral"
              onPress={() => router.navigate('/(app)/(drawer)/(tabs)/opportunities')}
            />
          </View>

          <View style={styles.quickRow}>
            <QuickChip
              icon="camera-outline"
              label="Scan card"
              onPress={() => router.push('/(app)/people/scan-card')}
            />
            <QuickChip
              icon="checkbox-outline"
              label="New task"
              onPress={() =>
                router.push({
                  pathname: '/(app)/object/[singular]/new',
                  params: { singular: 'task' },
                })
              }
            />
            <QuickChip
              icon="search-outline"
              label="Search"
              onPress={() => router.push('/(app)/search')}
            />
          </View>

          <SectionHeader
            title={
              insights.isAssignedToMe
                ? 'My follow-ups'
                : 'Upcoming follow-ups'
            }
            count={insights.followUpsTotal}
            onSeeAll={() => router.navigate('/(app)/(drawer)/(tabs)/tasks')}
          />
          {insights.followUpsLoading && insights.followUps.length === 0 ? (
            <Spinner />
          ) : null}
          {!insights.followUpsLoading && insights.followUps.length === 0 ? (
            <EmptyHint text="No open follow-ups. You're clear for now." />
          ) : null}
          {insights.followUps.map((item) => {
            const due = getDueLabel(
              typeof item.dueAt === 'string' ? item.dueAt : null,
            );
            const rightLabelTone =
              due.kind === 'overdue'
                ? 'danger'
                : due.kind === 'today'
                  ? 'accent'
                  : 'default';
            return (
              <ListRow
                key={String(item.id)}
                title={insights.getFollowUpTitle(item)}
                subtitle={insights.getFollowUpSubtitle(item)}
                rightLabel={due.label}
                rightLabelTone={rightLabelTone}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/object/[singular]/[id]',
                    params: { singular: 'task', id: String(item.id) },
                  })
                }
              />
            );
          })}

          <SectionHeader
            title="Pipeline to watch"
            count={insights.pipelineTotal}
            onSeeAll={() => router.navigate('/(app)/(drawer)/(tabs)/opportunities')}
          />
          {insights.pipelineLoading && insights.pipeline.length === 0 ? (
            <Spinner />
          ) : null}
          {!insights.pipelineLoading && insights.pipeline.length === 0 ? (
            <EmptyHint text="No open opportunities yet." />
          ) : null}
          {insights.pipeline.map((item) => (
            <ListRow
              key={String(item.id)}
              title={insights.getPipelineTitle(item)}
              subtitle={insights.getPipelineSubtitle(item)}
              onPress={() =>
                router.push({
                  pathname: '/(app)/object/[singular]/[id]',
                  params: {
                    singular: 'opportunity',
                    id: String(item.id),
                  },
                })
              }
            />
          ))}

          <SectionHeader
            title="Recent notes"
            count={insights.notesTotal}
            onSeeAll={
              insights.notesMetadata
                ? () =>
                    router.push({
                      pathname: '/(app)/objects/[plural]',
                      params: { plural: 'notes' },
                    })
                : undefined
            }
          />
          {insights.notesLoading && insights.notes.length === 0 ? (
            <Spinner />
          ) : null}
          {!insights.notesLoading && insights.notes.length === 0 ? (
            <EmptyHint text="No notes yet. Capture context from a record." />
          ) : null}
          {insights.notes.map((item) => (
            <ListRow
              key={String(item.id)}
              title={insights.getNoteTitle(item)}
              subtitle={insights.getNoteSubtitle(item)}
              onPress={() =>
                router.push({
                  pathname: '/(app)/object/[singular]/[id]',
                  params: { singular: 'note', id: String(item.id) },
                })
              }
            />
          ))}

          <SectionHeader title="What's happening" />
          {insights.activitiesLoading && insights.activities.length === 0 ? (
            <Spinner />
          ) : null}
          {!insights.activitiesLoading && insights.activities.length === 0 ? (
            <EmptyHint text="Activity across your workspace will show up here." />
          ) : null}
          {insights.activities.map((item) => (
            <ListRow
              key={item.id}
              title={item.name || 'Activity'}
              subtitle={
                [
                  item.linkedRecordCachedName,
                  item.happensAt
                    ? new Date(item.happensAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || undefined
              }
              showChevron={false}
            />
          ))}

          {showWorkspacePulse ? (
            <>
              <SectionHeader title="Workspace pulse" />
              <View
                style={[
                  styles.pulseCard,
                  {
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.primary,
                  },
                ]}
              >
                {insights.workspaceMembersCount !== null ? (
                  <PulseRow
                    icon="people-outline"
                    label="Members"
                    value={String(insights.workspaceMembersCount)}
                    onPress={
                      hasWorkspaceMembersPermission(user)
                        ? () => router.push('/(app)/settings/members')
                        : undefined
                    }
                  />
                ) : null}
                {reconnectBanner.failedCount > 0 ? (
                  <PulseRow
                    icon="warning-outline"
                    label="Accounts to reconnect"
                    value={String(reconnectBanner.failedCount)}
                    tone="danger"
                    onPress={() => router.push('/(app)/settings/accounts')}
                  />
                ) : (
                  <PulseRow
                    icon="link-outline"
                    label="Connected accounts"
                    value="OK"
                    onPress={() => router.push('/(app)/settings/accounts')}
                  />
                )}
                {isAdmin ? (
                  <PulseRow
                    icon="settings-outline"
                    label="Workspace settings"
                    value=""
                    onPress={() => router.push('/(app)/settings')}
                  />
                ) : null}
              </View>
            </>
          ) : null}
        </ScrollView>
      </Screen>
      <QuickActionFab mode="home" />
    </View>
  );
}

type StatChipProps = {
  label: string;
  value: number;
  tone: 'danger' | 'accent' | 'neutral';
  onPress: () => void;
};

const StatChip = ({ label, value, tone, onPress }: StatChipProps) => {
  const theme = useTheme();
  const valueColor =
    tone === 'danger'
      ? theme.text.danger
      : tone === 'accent'
        ? theme.accent.primary
        : theme.text.primary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.statChip,
        {
          backgroundColor: theme.background.secondary,
          borderColor: theme.border.primary,
        },
      ]}
    >
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={{ color: theme.text.tertiary, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
};

type QuickChipProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

const QuickChip = ({ icon, label, onPress }: QuickChipProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.quickChip,
        {
          backgroundColor: theme.accent.soft,
          borderColor: theme.border.primary,
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={theme.accent.primary} />
      <Text style={{ color: theme.accent.primary, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
};

type SectionHeaderProps = {
  title: string;
  count?: number | null;
  onSeeAll?: () => void;
};

const SectionHeader = ({ title, count, onSeeAll }: SectionHeaderProps) => {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>
        {title}
        {count !== null && count !== undefined ? ` · ${count}` : ''}
      </Text>
      {onSeeAll ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onSeeAll}>
          <Text style={{ color: theme.accent.primary, fontWeight: '600' }}>
            See all
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const EmptyHint = ({ text }: { text: string }) => {
  const theme = useTheme();

  return (
    <Text style={{ color: theme.text.tertiary, fontSize: 14 }}>{text}</Text>
  );
};

type PulseRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'danger' | 'neutral';
  onPress?: () => void;
};

const PulseRow = ({
  icon,
  label,
  value,
  tone = 'neutral',
  onPress,
}: PulseRowProps) => {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={styles.pulseRow}
    >
      <Ionicons
        name={icon}
        size={18}
        color={tone === 'danger' ? theme.text.danger : theme.text.secondary}
      />
      <Text style={{ color: theme.text.primary, flex: 1 }}>{label}</Text>
      {value ? (
        <Text
          style={{
            color:
              tone === 'danger' ? theme.text.danger : theme.text.secondary,
            fontWeight: '600',
          }}
        >
          {value}
        </Text>
      ) : null}
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={16}
          color={theme.text.tertiary}
        />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { paddingBottom: 0 },
  content: { flex: 1, paddingBottom: 0 },
  scroll: {
    gap: spacing(3),
    paddingBottom: spacing(24),
    paddingTop: spacing(2),
  },
  hero: { gap: spacing(1) },
  greeting: { fontSize: 15 },
  name: { fontSize: 24, fontWeight: '700' },
  statRow: {
    flexDirection: 'row',
    gap: spacing(2),
  },
  statChip: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(3),
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  quickChip: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing(1.5),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing(2),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  pulseCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing(1),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
  },
  pulseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing(2),
    minHeight: 40,
  },
});
