import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
    const unsub = onCourtMessagesChange(activeCourt.id, setMessages);
    return unsub;
  }, [activeCourt?.id]);

  async function handleCreateCourt() {
    if (!user?.uid || !newCourtName.trim()) return;
    setCreating(true);
    try {
      const courtId = await createCourt(user.uid, {
        name: newCourtName.trim(),
        description: newCourtDesc.trim(),
        isPrivate: false,
      });
      showToast('Royal Court established!', 'success');
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
    if (!user?.uid || !activeCourt || !messageText.trim()) return;
    setSending(true);
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
          <Text style={styles.crownEmoji}>👑</Text>
          <Text style={styles.emptyTitle}>Build Your Royal Court</Text>
          <Text style={styles.emptyBody}>
            Invite your sisters, form your court, rise together. Build accountability, streaks,
            and challenges with the queens in your life.
          </Text>
          <GoldButton
            label="ESTABLISH MY COURT"
            onPress={() => setShowCreateModal(true)}
            size="lg"
            style={{ marginTop: 24 }}
          />
          <GoldenDivider label="or" style={{ marginVertical: 16 }} />
          <Text style={styles.joinText}>Have an invitation? Check your email.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.ONYX }]}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.OBSIDIAN, Colors.ONYX]}
        style={[styles.headerGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Royal Court</Text>
            <Text style={styles.title}>
              {activeCourt?.name ?? 'Your Court'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowInviteModal(true)}
              style={styles.headerBtn}
            >
              <Text style={styles.headerBtnText}>+ Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Court selector */}
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
                onPress={() => setActiveCourt(court)}
              >
                <Text style={[styles.courtTabText, activeCourt?.id === court.id && styles.courtTabTextActive]}>
                  {court.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.courtTab}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.courtTabText}>+ New</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </LinearGradient>

      {/* Members */}
      {activeCourt && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersRow}
        >
          {activeCourt.memberIds.map((uid) => (
            <View key={uid} style={styles.memberAvatar}>
              <LinearGradient
                colors={[Colors.GOLD_DEEP, Colors.GOLD]}
                style={styles.memberAvatarGrad}
              >
                <Text style={styles.memberInitial}>Q</Text>
              </LinearGradient>
              {uid === user?.uid && (
                <View style={styles.youBadge}>
                  <Text style={styles.youText}>You</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Messages */}
      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.noMessages}>
            <Text style={styles.noMessagesText}>
              The court awaits your first decree...
            </Text>
          </View>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <View key={msg.id} style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgAvatarText}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                  {!isMe && (
                    <Text style={styles.msgSender}>{msg.senderName}</Text>
                  )}
                  <Text style={[styles.msgText, isMe && styles.msgTextMe]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Message Input */}
      {activeCourt && (
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 80 }]}>
          <TextInput
            style={styles.messageInput}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Decree something..."
            placeholderTextColor={Colors.DUST}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={sending || !messageText.trim()}
            style={[styles.sendBtn, (!messageText.trim() || sending) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Create Court Modal */}
      {showCreateModal && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Establish Your Court</Text>
            <GoldInput
              label="Court Name"
              value={newCourtName}
              onChangeText={setNewCourtName}
              placeholder="The Obsidian Sisters..."
              containerStyle={{ marginBottom: 12 }}
            />
            <GoldInput
              label="Description (optional)"
              value={newCourtDesc}
              onChangeText={setNewCourtDesc}
              placeholder="What is your court's purpose?"
              multiline
              numberOfLines={3}
              containerStyle={{ marginBottom: 20 }}
            />
            <View style={styles.modalActions}>
              <GoldButton
                label="Cancel"
                variant="ghost"
                onPress={() => setShowCreateModal(false)}
                style={{ flex: 1 }}
              />
              <GoldButton
                label="Establish"
                onPress={handleCreateCourt}
                loading={creating}
                disabled={!newCourtName.trim()}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Summon a Queen</Text>
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
  crownEmoji: { fontSize: 56 },
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
    gap: 12,
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
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderColor: Colors.GOLD,
  },
  courtTabText: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.DUST,
  },
  courtTabTextActive: { color: Colors.GOLD },
  membersRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  memberAvatar: { alignItems: 'center', gap: 4 },
  memberAvatarGrad: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.GOLD,
  },
  memberInitial: {
    fontFamily: FontFamily.DISPLAY_MEDIUM,
    fontSize: FontSize.H4,
    color: Colors.OBSIDIAN,
  },
  youBadge: {
    backgroundColor: Colors.GOLD,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.MICRO,
    color: Colors.OBSIDIAN,
  },
  messages: { flex: 1 },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  noMessages: { alignItems: 'center', paddingTop: 40 },
  noMessagesText: {
    fontFamily: FontFamily.DISPLAY_ITALIC,
    fontSize: FontSize.H4,
    color: Colors.DUST,
    textAlign: 'center',
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
    backgroundColor: Colors.STONE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgAvatarText: {
    fontFamily: FontFamily.BODY_BOLD,
    fontSize: FontSize.CAPTION,
    color: Colors.IVORY,
  },
  msgBubble: {
    maxWidth: '75%',
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    borderBottomLeftRadius: 4,
    padding: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: Colors.STONE,
  },
  msgBubbleMe: {
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderBottomLeftRadius: BorderRadius.LG,
    borderBottomRightRadius: 4,
    borderColor: 'rgba(201,168,76,0.3)',
  },
  msgSender: {
    fontFamily: FontFamily.BODY_SEMIBOLD,
    fontSize: FontSize.MICRO,
    color: Colors.GOLD,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  msgText: {
    fontFamily: FontFamily.BODY,
    fontSize: FontSize.BODY_SM,
    color: Colors.PARCHMENT,
    lineHeight: 20,
  },
  msgTextMe: { color: Colors.IVORY },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
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
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.STONE },
  sendIcon: {
    fontSize: 18,
    color: Colors.OBSIDIAN,
    fontFamily: FontFamily.BODY_BOLD,
  },
  modal: {
    position: 'absolute',
    inset: 0,
    backgroundColor: Colors.MODAL_BG,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.ANTHRACITE,
    borderTopLeftRadius: BorderRadius.XXL,
    borderTopRightRadius: BorderRadius.XXL,
    padding: 24,
    gap: 0,
    borderTopWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  modalTitle: {
    fontFamily: FontFamily.DISPLAY,
    fontSize: FontSize.H2,
    color: Colors.IVORY,
    letterSpacing: LetterSpacing.TIGHT,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
});
