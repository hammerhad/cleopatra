import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { getJournalEntries } from '../../src/services/journal';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { SkeletonBox } from '../../src/components/skeletons/SkeletonBase';
import { DAILY_PROMPTS } from '../../src/types/journal';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius } from '../../src/theme';
import type { JournalEntry, MoodRating } from '../../src/types/journal';

const MOOD_EMOJIS: Record<MoodRating, string> = {
  1: '🌑', 2: '🌒', 3: '🌓', 4: '🌔', 5: '🌕',
};

const MOOD_LABELS: Record<MoodRating, string> = {
  1: 'Shattered', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Radiant',
};

const MOOD_COLORS: Record<MoodRating, string> = {
  1: Colors.ERROR, 2: '#7A3A6A', 3: Colors.DUST, 4: Colors.SUCCESS, 5: Colors.GOLD,
};

function formatEntryDate(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d');
}

function JournalSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <SkeletonBox width="60%" height={32} borderRadius={4} style={{ marginBottom: 16 }} />
      <SkeletonBox width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
      {[1, 2, 3].map((i) => (
        <View key={i} style={skeletonStyles.entryCard}>
          <View style={skeletonStyles.entryHeader}>
            <SkeletonBox width={80} height={12} />
            <SkeletonBox width={40} height={22} borderRadius={11} />
          </View>
          <SkeletonBox width="90%" height={14} style={{ marginTop: 8 }} />
          <SkeletonBox width="70%" height={12} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { padding: 20 },
  entryCard: {
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { prediction } = useCycleStore();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const todayPromptCat = (['gratitude', 'reflection', 'intention', 'achievement', 'challenge', 'free'] as const)[
    new Date().getDay() % 6
  ];
  const todayPrompts = DAILY_PROMPTS[todayPromptCat];
  const dailyPrompt = todayPrompts[Math.floor(Math.random() * todayPrompts.length)];

  async function loadEntries() {
    if (!user?.uid) return;
    try {
      const data = await getJournalEntries(user.uid, 30);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [user?.uid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  }, [user?.uid]);

  if (loading) return <JournalSkeleton />;

  const totalWords = entries.reduce((sum, e) => sum + (e.wordCount ?? 0), 0);
  const avgMood = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.mood, 0) / entries.length)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.GOLD} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Inner Sanctum</Text>
            <Text style={styles.title}>Journal</Text>
          </View>
          <GoldButton
            label="+ Entry"
            variant="outline"
            size="sm"
            onPress={() => router.push({ pathname: '/(modals)/journal-entry' })}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{entries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </CleoCard>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>{(totalWords / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>Words</Text>
          </CleoCard>
          <CleoCard style={styles.statCard}>
            <Text style={styles.statNum}>
              {avgMood > 0 ? MOOD_EMOJIS[avgMood as MoodRating] : '—'}
            </Text>
            <Text style={styles.statLabel}>Avg Mood</Text>
          </CleoCard>
        </View>

        {/* Daily Prompt Card */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/(modals)/journal-entry',
              params: { prompt: dailyPrompt, promptCategory: todayPromptCat },
            })
          }
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.ANTHRACITE, '#1A1410']}
            style={styles.promptCard}
          >
            <View style={styles.promptHeader}>
              <BadgeChip
                label={todayPromptCat.toUpperCase()}
                variant="gold"
                size="sm"
                emoji="✦"
              />
              <Text style={styles.promptCta}>Write now →</Text>
            </View>
            <Text style={styles.promptText}>"{dailyPrompt}"</Text>
            <Text style={styles.promptSub}>
              Today's royal decree from your inner oracle
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <GoldenDivider label="Recent Entries" />

        {/* Entries list */}
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📖</Text>
            <Text style={styles.emptyTitle}>Your scrolls are empty</Text>
            <Text style={styles.emptyBody}>
              Begin your chronicle. Every empire needs its history.
            </Text>
            <GoldButton
              label="Write First Entry"
              onPress={() => router.push({ pathname: '/(modals)/journal-entry' })}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onPress={() =>
                router.push({
                  pathname: '/(modals)/journal-entry',
                  params: { entryId: entry.id },
                })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function EntryCard({
  entry,
  onPress,
}: {
  entry: JournalEntry;
  onPress: () => void;
}) {
  const moodColor = MOOD_COLORS[entry.mood as MoodRating] ?? Colors.DUST;
  const moodEmoji = MOOD_EMOJIS[entry.mood as MoodRating] ?? '○';
  const preview = entry.content.slice(0, 120).trim() + (entry.content.length > 120 ? '...' : '');
  const hasCleoResponse = !!(entry as any).cleopatraResponse;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <CleoCard style={styles.entryCard}>
        {/* Color mood strip */}
        <View style={[styles.moodStrip, { backgroundColor: moodColor }]} />

        <View style={styles.entryInner}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryDate}>{formatEntryDate(entry.createdAt)}</Text>
            <View style={styles.entryMeta}>
              <Text style={styles.moodEmoji}>{moodEmoji}</Text>
              {entry.wordCount > 0 && (
                <Text style={styles.wordCount}>{entry.wordCount}w</Text>
              )}
            </View>
          </View>

          {entry.title && (
            <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
          )}

          <Text style={styles.entryPreview} numberOfLines={3}>{preview}</Text>

          {entry.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {entry.tags.slice(0, 3).map((tag) => (
                <BadgeChip key={tag} label={tag} variant="dark" size="sm" />
              ))}
            </View>
          )}

          {/* Cleopatra response indicator */}
          {hasCleoResponse && (
            <View style={styles.cleoIndicator}>
              <Text style={styles.cleoIndicatorEmoji}>𓂀</Text>
              <Text style={styles.cleoIndicatorText}>Cleopatra's wisdom awaits</Text>
            </View>
          )}
        </View>
      </CleoCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eyebrow: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDEST,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H1,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.GOLD,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptCard: {
    borderRadius: BorderRadius.XL,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptCta: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    letterSpacing: 0.5,
  },
  promptText: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  promptSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
  },
  emptyBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
  },
  entryCard: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
    gap: 0,
  },
  moodStrip: {
    width: 4,
    borderRadius: 0,
  },
  entryInner: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryDate: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodEmoji: { fontSize: 16 },
  wordCount: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
  },
  entryTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.BODY_MD,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  entryPreview: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.PARCHMENT,
    lineHeight: 20,
  },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  cleoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  cleoIndicatorEmoji: {
    fontSize: 12,
    color: Colors.GOLD,
  },
  cleoIndicatorText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: 0.5,
  },
});
