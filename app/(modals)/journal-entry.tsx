import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { useCycleStore } from '../../src/stores/cycleStore';
import { createJournalEntry, updateJournalEntry, getJournalEntry } from '../../src/services/journal';
import { journalCol } from '../../src/services/firebase';
import { askCleopatraStreaming } from '../../src/services/gemini';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { BadgeChip } from '../../src/components/ui/BadgeChip';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Spacing } from '../../src/theme';
import type { JournalEntry, MoodRating } from '../../src/types/journal';

const MOODS: { value: MoodRating; emoji: string; label: string; color: string }[] = [
  { value: 1, emoji: '🌑', label: 'Shattered', color: Colors.ERROR },
  { value: 2, emoji: '🌒', label: 'Low', color: '#7A3A6A' },
  { value: 3, emoji: '🌓', label: 'Neutral', color: Colors.DUST },
  { value: 4, emoji: '🌔', label: 'Good', color: Colors.SUCCESS },
  { value: 5, emoji: '🌕', label: 'Radiant', color: Colors.GOLD },
];

// Animated typing cursor for Cleopatra's response
function TypingCursor() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(
      withTiming(0, { duration: 500 }),
      withTiming(1, { duration: 500 }),
    ), -1, false);
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.Text style={[cursorStyles.cursor, style]}>|</Animated.Text>;
}
const cursorStyles = StyleSheet.create({
  cursor: { color: Colors.GOLD, fontFamily: FontFamily.DISPLAY, fontSize: FontSize.H4 },
});

export default function JournalEntryModal() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { prediction } = useCycleStore();
  const params = useLocalSearchParams<{
    entryId?: string;
    prompt?: string;
    promptCategory?: string;
  }>();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodRating>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  // Cleopatra AI state
  const [cleoResponse, setCleoResponse] = useState('');
  const [cleoStreaming, setCleoStreaming] = useState(false);
  const [cleoStreamBuffer, setCleoStreamBuffer] = useState('');
  const [cleoError, setCleoError] = useState('');
  const [cleoAsked, setCleoAsked] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(!params.entryId);
  const [wordCount, setWordCount] = useState(0);

  const scrollRef = useRef<ScrollView>(null);

  // Gold glow animation for Cleo section
  const cleoGlow = useSharedValue(0);
  const cleoGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: withTiming(cleoGlow.value ? 0.5 : 0, { duration: 1000 }),
    shadowRadius: withTiming(cleoGlow.value ? 20 : 0, { duration: 1000 }),
  }));

  useEffect(() => {
    if (params.entryId) {
      loadEntry(params.entryId);
    }
  }, [params.entryId]);

  async function loadEntry(id: string) {
    if (!user?.uid) return;
    const entry = await getJournalEntry(user.uid, id);
    if (!entry) return;
    setExistingEntry(entry);
    setTitle(entry.title ?? '');
    setContent(entry.content);
    setMood(entry.mood as MoodRating);
    setTags(entry.tags);
    setIsPrivate(entry.isPrivate);
    setWordCount(entry.wordCount);
    setIsEditing(false);

    // Load saved Cleo response if any
    const snap = await journalCol(user.uid).doc(id).get();
    const data = snap.data();
    if (data?.cleopatraResponse) {
      setCleoResponse(data.cleopatraResponse);
      setCleoAsked(true);
    }
  }

  function handleContentChange(text: string) {
    setContent(text);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!user?.uid || !content.trim()) return;
    setSaving(true);

    try {
      if (existingEntry) {
        await updateJournalEntry(user.uid, existingEntry.id, {
          title: title.trim() || undefined,
          content: content.trim(),
          mood,
          tags,
          isPrivate,
        });
      } else {
        const id = await createJournalEntry(user.uid, {
          title: title.trim() || undefined,
          content: content.trim(),
          mood,
          tags,
          isPrivate,
          prompt: params.prompt,
          promptCategory: params.promptCategory as any,
        });
        // Load the new entry so we can ask Cleo
        const entry = await getJournalEntry(user.uid, id);
        setExistingEntry(entry);
      }
      setIsEditing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Save failed', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function askCleopatra() {
    if (!content.trim() || cleoStreaming) return;

    setCleoStreaming(true);
    setCleoStreamBuffer('');
    setCleoResponse('');
    setCleoError('');
    setCleoAsked(true);
    cleoGlow.value = 1;

    // Scroll to bottom to reveal Cleo response
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);

    await askCleopatraStreaming(
      content,
      {
        cyclePhase: prediction?.currentPhase,
        mood,
        streakCount: user?.streakCount,
      },
      // onChunk
      (chunk) => {
        setCleoStreamBuffer((prev) => prev + chunk);
      },
      // onComplete
      async (fullText) => {
        setCleoResponse(fullText);
        setCleoStreamBuffer('');
        setCleoStreaming(false);
        cleoGlow.value = 0;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Persist to Firestore
        if (user?.uid && existingEntry) {
          await journalCol(user.uid).doc(existingEntry.id).update({
            cleopatraResponse: fullText,
            cleopatraAskedAt: new Date(),
          });
        }
      },
      // onError
      (err) => {
        setCleoStreaming(false);
        setCleoAsked(false);
        cleoGlow.value = 0;
        setCleoError('Cleopatra is unavailable. Check your connection and try again.');
      },
    );
  }

  const displayedCleoText = cleoStreaming ? cleoStreamBuffer : cleoResponse;
  const canAskCleo = content.trim().split(/\s+/).length >= 10 && !cleoStreaming;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background */}
      <LinearGradient
        colors={[Colors.OBSIDIAN, Colors.ONYX]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.topBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>
            {existingEntry ? (isEditing ? 'Editing' : 'Entry') : 'New Entry'}
          </Text>
          {wordCount > 0 && (
            <Text style={styles.wordCountText}>{wordCount} words</Text>
          )}
        </View>

        <View style={styles.topRight}>
          {isEditing ? (
            <GoldButton
              label="Save"
              size="sm"
              onPress={handleSave}
              loading={saving}
              disabled={!content.trim()}
            />
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Prompt banner */}
        {params.prompt && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.promptBanner}>
            <Text style={styles.promptBannerLabel}>Today's Prompt</Text>
            <Text style={styles.promptBannerText}>"{params.prompt}"</Text>
          </Animated.View>
        )}

        {/* Title */}
        {isEditing ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Give your entry a title..."
            placeholderTextColor={Colors.STONE}
            maxLength={120}
          />
        ) : title ? (
          <Text style={styles.titleDisplay}>{title}</Text>
        ) : null}

        {/* Date */}
        <Text style={styles.dateText}>
          {existingEntry
            ? existingEntry.createdAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Mood selector */}
        {isEditing && (
          <View style={styles.moodRow}>
            <Text style={styles.moodLabel}>How do you feel?</Text>
            <View style={styles.moodOptions}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMood(m.value)}
                  style={[styles.moodOption, mood === m.value && { borderColor: m.color, borderWidth: 2 }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodOptionEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.moodCurrent, { color: MOODS[mood - 1].color }]}>
              {MOODS[mood - 1].label}
            </Text>
          </View>
        )}

        {/* Content */}
        <GoldenDivider />

        {isEditing ? (
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={handleContentChange}
            placeholder="Begin your chronicle..."
            placeholderTextColor={Colors.STONE}
            multiline
            autoFocus={!params.entryId}
            textAlignVertical="top"
          />
        ) : (
          <Text style={styles.contentDisplay}>{content}</Text>
        )}

        {/* Tags */}
        {isEditing && (
          <View style={styles.tagsSection}>
            <View style={styles.tagsRow}>
              {tags.map((tag) => (
                <TouchableOpacity key={tag} onPress={() => removeTag(tag)} activeOpacity={0.7}>
                  <BadgeChip label={`${tag} ×`} variant="dark" size="sm" />
                </TouchableOpacity>
              ))}
            </View>
            {tags.length < 5 && (
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                placeholder="+ add tag"
                placeholderTextColor={Colors.STONE}
                returnKeyType="done"
                blurOnSubmit={false}
                maxLength={20}
              />
            )}
          </View>
        )}

        {/* ──────────────── ASK CLEOPATRA ──────────────────────────────────────── */}
        {!isEditing && content.trim() && (
          <>
            <GoldenDivider style={{ marginTop: 24 }} />

            {/* Ask button or response */}
            {!cleoAsked ? (
              <Animated.View entering={FadeIn.duration(600)} style={styles.askCleoSection}>
                <View style={styles.askCleoHeader}>
                  <Text style={styles.askCleoAnkh}>𓂀</Text>
                  <View>
                    <Text style={styles.askCleoTitle}>Ask Cleopatra</Text>
                    <Text style={styles.askCleoSub}>
                      Let the Queen illuminate your words with ancient wisdom
                    </Text>
                  </View>
                </View>
                {!canAskCleo && (
                  <Text style={styles.askCleoHint}>
                    Write at least 10 words to unlock Cleopatra's insight.
                  </Text>
                )}
                <GoldButton
                  label="𓂀  ASK CLEOPATRA"
                  onPress={askCleopatra}
                  disabled={!canAskCleo}
                  fullWidth
                  size="lg"
                  style={{ marginTop: 12 }}
                />
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeInDown.duration(500)}
                style={[styles.cleoResponseSection, cleoGlowStyle]}
              >
                {/* Cleopatra header */}
                <LinearGradient
                  colors={['rgba(201,168,76,0.08)', 'rgba(201,168,76,0.03)', Colors.OBSIDIAN]}
                  style={styles.cleoResponseGrad}
                >
                  <View style={styles.cleoResponseHeader}>
                    <View style={styles.cleoAvatarGlow}>
                      <Text style={styles.cleoAvatar}>𓂀</Text>
                    </View>
                    <View>
                      <Text style={styles.cleoNameLabel}>CLEOPATRA</Text>
                      <Text style={styles.cleoNameSub}>Queen of Egypt · Your Oracle</Text>
                    </View>
                    {cleoStreaming && (
                      <View style={styles.cleoTypingIndicator}>
                        <ActivityIndicator size="small" color={Colors.GOLD} />
                        <Text style={styles.cleoTypingText}>Reflecting...</Text>
                      </View>
                    )}
                  </View>

                  {/* Gold separator with hieroglyph */}
                  <View style={styles.cleoSeparator}>
                    <View style={styles.cleoSepLine} />
                    <Text style={styles.cleoSepGlyph}>𓋹</Text>
                    <View style={styles.cleoSepLine} />
                  </View>

                  {/* Response text */}
                  <View style={styles.cleoResponseTextWrap}>
                    <Text style={styles.cleoResponseText}>
                      {displayedCleoText}
                    </Text>
                    {cleoStreaming && <TypingCursor />}
                  </View>

                  {/* Error */}
                  {cleoError ? (
                    <Text style={styles.cleoErrorText}>{cleoError}</Text>
                  ) : null}

                  {/* Ask again button */}
                  {!cleoStreaming && (cleoResponse || cleoError) && (
                    <TouchableOpacity
                      onPress={() => {
                        setCleoAsked(false);
                        setCleoResponse('');
                        setCleoError('');
                      }}
                      style={styles.askAgainBtn}
                    >
                      <Text style={styles.askAgainText}>Ask again →</Text>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
    gap: 12,
  },
  topBtn: {
    width: 32,
    alignItems: 'center',
  },
  topBtnText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.BODY_MD,
    color: Colors.DUST,
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  wordCountText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    marginTop: 1,
  },
  topRight: { width: 60, alignItems: 'flex-end' },
  editBtn: { paddingVertical: 4 },
  editBtnText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.BODY_SM,
    color: Colors.GOLD,
  },
  scroll: { paddingHorizontal: 20, gap: 16, paddingTop: 20 },
  promptBanner: {
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    padding: 14,
    gap: 6,
  },
  promptBannerLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDER,
    textTransform: 'uppercase',
  },
  promptBannerText: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.PARCHMENT,
    lineHeight: 24,
  },
  titleInput: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    paddingVertical: 0,
  },
  titleDisplay: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  dateText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDER,
    textTransform: 'uppercase',
  },
  moodRow: { gap: 10 },
  moodLabel: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    letterSpacing: LetterSpacing.WIDER,
    textTransform: 'uppercase',
  },
  moodOptions: { flexDirection: 'row', gap: 10 },
  moodOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.ANTHRACITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  moodOptionEmoji: { fontSize: 22 },
  moodCurrent: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    letterSpacing: 0.5,
  },
  contentInput: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_LG,
    color: Colors.IVORY,
    lineHeight: FontSize.BODY_LG * 1.8,
    minHeight: 200,
    paddingVertical: 0,
  },
  contentDisplay: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_LG,
    color: Colors.PARCHMENT,
    lineHeight: FontSize.BODY_LG * 1.8,
  },
  tagsSection: { gap: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagInput: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
    borderBottomWidth: 1,
    borderBottomColor: Colors.STONE,
    paddingVertical: 6,
  },

  // ── Ask Cleopatra ─────────────────────────────────────────────────────────
  askCleoSection: { gap: 8 },
  askCleoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  askCleoAnkh: {
    fontSize: 40,
    color: Colors.GOLD,
    textShadowColor: Colors.GOLD,
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  askCleoTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H3,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
  },
  askCleoSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    marginTop: 2,
  },
  askCleoHint: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
    fontStyle: 'italic',
  },

  // ── Cleopatra Response ───────────────────────────────────────────────────
  cleoResponseSection: {
    shadowColor: Colors.GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    shadowOpacity: 0,
  },
  cleoResponseGrad: {
    borderRadius: BorderRadius.XL,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
  },
  cleoResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  cleoAvatarGlow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(201,168,76,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  cleoAvatar: {
    fontSize: 26,
    color: Colors.GOLD,
  },
  cleoNameLabel: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    letterSpacing: LetterSpacing.WIDEST,
  },
  cleoNameSub: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    marginTop: 1,
  },
  cleoTypingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  cleoTypingText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    fontStyle: 'italic',
  },
  cleoSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  cleoSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  cleoSepGlyph: {
    fontSize: 16,
    color: Colors.GOLD,
    opacity: 0.6,
  },
  cleoResponseTextWrap: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  cleoResponseText: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.PARCHMENT,
    lineHeight: FontSize.H4 * 1.75,
    letterSpacing: -0.2,
    flex: 1,
  },
  cleoErrorText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.ERROR,
    paddingHorizontal: 20,
    paddingBottom: 16,
    fontStyle: 'italic',
  },
  askAgainBtn: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignSelf: 'flex-end',
  },
  askAgainText: {
    fontFamily: FontFamily.BODY_MEDIUM,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD_MUTED,
    letterSpacing: 0.5,
  },
});
