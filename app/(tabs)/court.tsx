import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { useAuthStore } from '../../src/stores/authStore';
import { useUIStore } from '../../src/stores/uiStore';
import {
  onUserCourtsChange,
  createCourt,
  sendCourtMessage,
  onCourtMessagesChange,
  inviteToCourt,
} from '../../src/services/court';
import { CleoCard } from '../../src/components/ui/CleoCard';
import { GoldButton } from '../../src/components/ui/GoldButton';
import { GoldInput } from '../../src/components/ui/GoldInput';
import { GoldenDivider } from '../../src/components/ui/GoldenDivider';
import { Colors, FontFamily, FontSize, LetterSpacing, BorderRadius, Spacing } from '../../src/theme';
import type { Court, CourtMessage } from '../../src/types/court';

// Deterministic color per member UID
const AVATAR_PALETTES: Array<[string, string]> = [
  [Colors.GOLD_DEEP, '#A07820'],
  ['#1A3A5A', '#2E6090'],
  ['#3A1058', '#5A2080'],
  ['#0A3A2A', '#1A6A4A'],
  ['#3A2010', '#6A3A18'],
  ['#1A1A4A', '#2A2A7A'],
];

function avatarColors(uid: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function avatarInitial(uid: string, senderName?: string): string {
  if (senderName) return senderName.charAt(0).toUpperCase();
  return uid.charAt(0).toUpperCase();
}

function formatMessageTime(date: Date): string {
  const d = date instanceof Date ? date : new Date((date as any).seconds * 1000);
  const mins = differenceInMinutes(new Date(), d);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, h:mm a');
}

export default function CourtScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

  const [courts, setCourts] = useState<Court[]>([]);
  const [activeCourt, setActiveCourt] = useState<Court | null>(null);
  const [messages, setMessages] = useState<CourtMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtDesc, setNewCourtDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onUserCourtsChange(user.uid, (c) => {
      setCourts(c);
      if (c.length > 0 && !activeCourt) setActiveCourt(c[0]);
    });
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!activeCourt) return;
    const unsub = onCourtMessagesChange(activeCourt.id, (msgs) => {
      setMessages(msgs);
      // Auto-scroll to latest message
      setTimeout(() => messagesScrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    return unsub;
  }, [activeCourt?.id]);

  async function handleCreateCourt() {
    if (!user?.uid || !newCourtName.trim()) return;
    setCreating(true);
    try {
      await createCourt(user.uid, {
        name: newCourtName.trim(),
        description: newCourtDesc.trim(),
        isPrivate: false,
      });
      showToast('Royal Court established!', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreateModal(false);
      setNewCourtName('');
      setNewCourtDesc('');
    } catch {
      showToast('Failed to create court', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function handleSendMessage() {
    if (!user?.uid || !activeCourt || !messageText.trim() || sending) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = messageText.trim();
    setMessageText('');
    try {
      await sendCourtMessage(
        user.uid,
        activeCourt.id,
        text,
        user.displayName,
        user.photoURL
      );
    } catch {
      showToast('Message failed to send', 'error');
      setMessageText(text);
    } finally {
      setSending(false);
    }
  }

  async function handleInvite() {
    if (!user?.uid || !activeCourt || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteToCourt(
        user.uid,
        user.displayName,
        activeCourt.id,
        activeCourt.name,
        inviteEmail.trim()
      );
      showToast('Invitation sent!', 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowInviteModal(false);
      setInviteEmail('');
    } catch {
      showToast('Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  }

  if (courts.length === 0 && !showCreateModal) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
        <View style={[styles.emptyScreen, { paddingTop: insets.top + 40 }]}>
          <LinearGradient
            colors={[Colors.GOLD_DEEP, Colors.GOLD]}
            style={styles.crownCircle}
          >
            <Text style={styles.crownEmoji}>👑</Text>
          </LinearGradient>
          <Text style={styles.emptyTitle}>Build Your Royal Court</Text>
          <Text style={styles.emptyBody}>
            Invite your sisters, form your court, rise together. Build accountability,
            streaks, and challenges with the queens in your life.
          </Text>
          <GoldButton
            label="ESTABLISH MY COURT"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCreateModal(true); }}
            size="lg"
            style={{ marginTop: 24 }}
          />
          <GoldenDivider label="or" style={{ marginVertical: 16 }} />
          <Text style={styles.joinText}>Have an invitation? Check your email.</Text>
        </View>

        {/* Create modal even in empty state */}
        {showCreateModal && (
          <CreateCourtModal
            name={newCourtName}
            desc={newCourtDesc}
            creating={creating}
            onChangeName={setNewCourtName}
            onChangeDesc={setNewCourtDesc}
            onCancel={() => setShowCreateModal(false)}
            onCreate={handleCreateCourt}
            insets={insets}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: Colors.ONYX }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header gradient */}
      <LinearGradient
        colors={[Colors.OBSIDIAN, Colors.ONYX]}
        style={[styles.headerGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Royal Court</Text>
            <Text style={styles.title} numberOfLines={1}>
              {activeCourt?.name ?? 'Your Court'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowInviteModal(true); }}
              style={styles.headerBtn}
            >
              <Text style={styles.headerBtnText}>+ Invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowCreateModal(true); }}
              style={[styles.headerBtn, { borderColor: Colors.STONE }]}
            >
              <Text style={[styles.headerBtnText, { color: Colors.DUST }]}>+ Court</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Court selector tabs */}
        {courts.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courtTabs}
          >
            {courts.map((court) => (
              <TouchableOpacity
                key={court.id}
                style={[styles.courtTab, activeCourt?.id === court.id && styles.courtTabActive]}
                onPress={() => { Haptics.selectionAsync(); setActiveCourt(court); }}
              >
                <Text style={[styles.courtTabText, activeCourt?.id === court.id && styles.courtTabTextActive]}>
                  {court.name}
                </Text>
                {/* Unread indicator (simplified) */}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </LinearGradient>

      {/* Member avatars strip */}
      {activeCourt && (
        <View style={styles.membersStrip}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.membersRow}
          >
            {activeCourt.memberIds.map((uid, idx) => {
              const isMe = uid === user?.uid;
              const colors = avatarColors(uid);
              return (
                <View key={uid} style={styles.memberItem}>
                  <View style={styles.memberAvatarWrapper}>
                    <LinearGradient
                      colors={colors}
                      style={[styles.memberAvatarGrad, isMe && styles.memberAvatarMe]}
                    >
                      <Text style={styles.memberInitial}>{isMe ? (user?.displayName?.charAt(0) ?? 'Y') : uid.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    {/* Online indicator dot (decorative / future-ready) */}
                    {idx < 2 && (
                      <View style={styles.onlineDot} />
                    )}
                  </View>
                  {isMe && <Text style={styles.youLabel}>You</Text>}
                </View>
              );
            })}
          </ScrollView>
          <Text style={styles.memberCount}>
            {activeCourt.memberIds.length}/{activeCourt.maxMembers ?? 10} members
          </Text>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={messagesScrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => messagesScrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.noMessages}>
            <Text style={styles.noMessagesEmoji}>𓂀</Text>
            <Text style={styles.noMessagesText}>
              The court awaits your first decree...
            </Text>
          </View>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.uid;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showSender = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
            const isSystem = msg.type === 'system' || msg.type === 'achievement';

            if (isSystem) {
              return (
                <View key={msg.id} style={styles.systemMsg}>
                  <Text style={styles.systemMsgText}>✦ {msg.text} ✦</Text>
                </View>
              );
            }

            const msgDate = msg.createdAt instanceof Date
              ? msg.createdAt
              : new Date((msg.createdAt as any).seconds * 1000);

            return (
              <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {/* Avatar for others */}
                {!isMe && (
                  <LinearGradient
                    colors={avatarColors(msg.senderId)}
                    style={[styles.msgAvatar, !showSender && styles.msgAvatarHidden]}
                  >
                    {showSender && (
                      <Text style={styles.msgAvatarText}>
                        {avatarInitial(msg.senderId, msg.senderName)}
                      </Text>
                    )}
                  </LinearGradient>
                )}

                <View style={styles.msgColumn}>
                  {/* Sender name */}
                  {showSender && !isMe && (
                    <Text style={styles.msgSender}>{msg.senderName}</Text>
                  )}
                  <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
                      {formatMessageTime(msgDate)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Message input bar */}
      {activeCourt && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 76 }]}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Decree something..."
            placeholderTextColor={Colors.DUST}
            multiline
            maxLength={1000}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          {messageText.length > 800 && (
            <Text style={styles.charCount}>{messageText.length}/1000</Text>
          )}
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={sending || !messageText.trim()}
            style={[styles.sendBtn, (!messageText.trim() || sending) && styles.sendBtnDisabled]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={messageText.trim() && !sending ? [Colors.GOLD_DEEP, Colors.GOLD] : [Colors.STONE, Colors.STONE]}
              style={styles.sendBtnGrad}
            >
              <Text style={styles.sendIcon}>{sending ? '…' : '→'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Court Modal */}
      {showCreateModal && (
        <CreateCourtModal
          name={newCourtName}
          desc={newCourtDesc}
          creating={creating}
          onChangeName={setNewCourtName}
          onChangeDesc={setNewCourtDesc}
          onCancel={() => setShowCreateModal(false)}
          onCreate={handleCreateCourt}
          insets={insets}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <View style={styles.modal}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowInviteModal(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Summon a Queen</Text>
            <Text style={styles.modalSubtitle}>
              She'll receive an invitation to join {activeCourt?.name}.
            </Text>
            <GoldInput
              label="Her Email"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="queen@empire.com"
              keyboardType="email-address"
              autoCapitalize="none"
              containerStyle={{ marginBottom: 20 }}
            />
            <View style={styles.modalActions}>
              <GoldButton
                label="Cancel"
                variant="ghost"
                onPress={() => setShowInviteModal(false)}
                style={{ flex: 1 }}
              />
              <GoldButton
                label="Send Summons"
                onPress={handleInvite}
                loading={inviting}
                disabled={!inviteEmail.trim()}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function CreateCourtModal({
  name, desc, creating, onChangeName, onChangeDesc, onCancel, onCreate, insets,
}: {
  name: string; desc: string; creating: boolean;
  onChangeName: (v: string) => void; onChangeDesc: (v: string) => void;
  onCancel: () => void; onCreate: () => void;
  insets: { bottom: number };
}) {
  return (
    <View style={styles.modal}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onCancel} />
      <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.modalTitle}>Establish Your Court</Text>
        <Text style={styles.modalSubtitle}>Create a private space for your inner circle.</Text>
        <GoldInput
          label="Court Name"
          value={name}
          onChangeText={onChangeName}
          placeholder="The Obsidian Sisters..."
          containerStyle={{ marginBottom: 12 }}
        />
        <GoldInput
          label="Description (optional)"
          value={desc}
          onChangeText={onChangeDesc}
          placeholder="What is your court's purpose?"
          multiline
          numberOfLines={3}
          containerStyle={{ marginBottom: 20 }}
        />
        <View style={styles.modalActions}>
          <GoldButton
            label="Cancel"
            variant="ghost"
            onPress={onCancel}
            style={{ flex: 1 }}
          />
          <GoldButton
            label="Establish"
            onPress={onCreate}
            loading={creating}
            disabled={!name.trim()}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  emptyScreen: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  crownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  crownEmoji: { fontSize: 38 },
  emptyTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_MD,
    color: Colors.DUST,
    textAlign: 'center',
    lineHeight: 24,
  },
  joinText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    textAlign: 'center',
  },

  headerGrad: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: FontSize.H2,
    color: Colors.IVORY,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.PILL,
    borderWidth: 1,
    borderColor: Colors.GOLD_MUTED,
  },
  headerBtnText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.GOLD,
    letterSpacing: 0.5,
  },

  courtTabs: { flexDirection: 'row', gap: 8 },
  courtTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.PILL,
    backgroundColor: Colors.ANTHRACITE,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  courtTabActive: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderColor: Colors.GOLD,
  },
  courtTabText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  courtTabTextActive: { color: Colors.GOLD },

  membersStrip: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.DIVIDER,
  },
  membersRow: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 12,
  },
  memberItem: { alignItems: 'center', gap: 3 },
  memberAvatarWrapper: { position: 'relative' },
  memberAvatarGrad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarMe: {
    borderWidth: 2,
    borderColor: Colors.GOLD,
  },
  memberInitial: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.SUCCESS,
    borderWidth: 1.5,
    borderColor: Colors.ONYX,
  },
  youLabel: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: 0.3,
  },
  memberCount: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.STONE,
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  messages: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 6,
  },
  noMessages: { alignItems: 'center', paddingTop: 60, gap: 8 },
  noMessagesEmoji: {
    fontSize: 40,
    color: Colors.STONE,
  },
  noMessagesText: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.DUST,
    textAlign: 'center',
  },

  systemMsg: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  systemMsgText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD_MUTED,
    letterSpacing: LetterSpacing.WIDE,
    textTransform: 'uppercase',
  },

  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  msgRowMe: { flexDirection: 'row-reverse' },

  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  msgAvatarHidden: { opacity: 0 },
  msgAvatarText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.IVORY,
  },

  msgColumn: { maxWidth: '72%', gap: 2 },
  msgSender: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: 0.4,
    paddingLeft: 4,
    marginBottom: 2,
  },
  msgBubble: {
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  msgBubbleMe: {
    backgroundColor: 'rgba(201,168,76,0.14)',
    borderBottomLeftRadius: BorderRadius.LG,
    borderBottomRightRadius: 4,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  msgText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.PARCHMENT,
    lineHeight: 20,
  },
  msgTextMe: { color: Colors.IVORY },
  msgTime: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.STONE,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  msgTimeMe: { alignSelf: 'flex-end', color: 'rgba(201,168,76,0.5)' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.ANTHRACITE,
    borderTopWidth: 1,
    borderTopColor: Colors.DIVIDER,
    gap: 10,
  },
  messageInput: {
    flex: 1,
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.IVORY,
    backgroundColor: Colors.ASH,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: Colors.STONE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  charCount: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.MICRO,
    color: Colors.DUST,
    position: 'absolute',
    right: 64,
    bottom: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: Colors.OBSIDIAN,
    fontFamily: FontFamily.BODY_BOLD,
  },

  modal: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.MODAL_BG,
  },
  modalContent: {
    backgroundColor: Colors.ANTHRACITE,
    borderTopLeftRadius: BorderRadius.XXL,
    borderTopRightRadius: BorderRadius.XXL,
    padding: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  modalTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.DUST,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
});
