import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import {
  getHabits, saveHabits, getHabitLog, saveHabitLog,
  getFastingState, saveFastingState, getFastingHistory, saveFastingHistory,
} from '../storage';

// ─── Fasting Protocols ────────────────────────────────────────────────────────
const PROTOCOLS = [
  { id: '16:8',  label: '16:8',  fastH: 16, desc: '16 saat oruç · 8 saat yemek' },
  { id: '18:6',  label: '18:6',  fastH: 18, desc: '18 saat oruç · 6 saat yemek' },
  { id: '20:4',  label: '20:4',  fastH: 20, desc: '20 saat oruç · 4 saat yemek' },
  { id: 'OMAD',  label: 'OMAD',  fastH: 23, desc: '23 saat oruç · 1 öğün' },
];

// ─── Emoji suggestions for habits ────────────────────────────────────────────
const EMOJI_LIST = ['💧','🏃','🧘','🛌','📚','🥗','🍎','💪','🚶','🧴','🌟','☀️','🎯','✍️','🎵','🧠','🦷','🙏','🚴','🏊'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function formatElapsed(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatRemaining(sec) {
  if (sec <= 0) return '00:00:00';
  return formatElapsed(sec);
}

// ─── Circular Progress Ring (two-halves technique) ───────────────────────────
function ProgressRing({ progress, size = 200, strokeWidth = 14, color, bgColor, children }) {
  const half = size / 2;
  const p = Math.min(Math.max(progress, 0), 1);

  // Right half reveals 0→50%, left half reveals 50→100%
  const rightDeg = p <= 0.5 ? -180 + p * 2 * 180 : 0;
  const leftDeg  = p <= 0.5 ? -180 : -180 + (p - 0.5) * 2 * 180;

  return (
    <View style={{ width: size, height: size }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth, borderColor: bgColor,
      }} />

      {/* Right half (0–50%) */}
      <View style={{
        position: 'absolute', left: half, top: 0,
        width: half, height: size, overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute', left: -half, top: 0,
          width: size, height: size,
          borderRadius: half, borderWidth: strokeWidth,
          borderColor: p > 0 ? color : 'transparent',
          transform: [{ rotate: `${rightDeg}deg` }],
        }} />
      </View>

      {/* Left half (50–100%) */}
      <View style={{
        position: 'absolute', left: 0, top: 0,
        width: half, height: size, overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute', left: 0, top: 0,
          width: size, height: size,
          borderRadius: half, borderWidth: strokeWidth,
          borderColor: p > 0.5 ? color : 'transparent',
          transform: [{ rotate: `${leftDeg}deg` }],
        }} />
      </View>

      {/* Center content */}
      <View style={{
        position: 'absolute',
        top: strokeWidth, left: strokeWidth,
        width: size - strokeWidth * 2,
        height: size - strokeWidth * 2,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HabitScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // ── Fasting state
  const [selectedProto, setSelectedProto] = useState('16:8');
  const [fastingState, setFastingState] = useState(null); // { startTime, protocol }
  const [elapsed, setElapsed] = useState(0); // seconds
  const timerRef = useRef(null);

  // ── Habit state
  const [habits, setHabits] = useState([]);
  const [todayLog, setTodayLog] = useState({});
  const [addModal, setAddModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null); // habit being edited (or null for add)
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('🎯');

  // ─── Load data when screen focused ────────────────────────────────────────
  useFocusEffect(useCallback(() => {
    loadAll();
    return () => stopTimer();
  }, []));

  async function loadAll() {
    const [h, log, fs] = await Promise.all([
      getHabits(), getHabitLog(), getFastingState(),
    ]);
    setHabits(h);
    setTodayLog(log);
    if (fs) {
      setFastingState(fs);
      setSelectedProto(fs.protocol);
      startTimer(fs.startTime);
    }
  }

  // ─── Timer ────────────────────────────────────────────────────────────────
  function startTimer(startTime) {
    stopTimer();
    const tick = () => {
      const sec = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(sec);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ─── Fasting actions ──────────────────────────────────────────────────────
  async function handleStartFast() {
    const proto = PROTOCOLS.find(p => p.id === selectedProto);
    const startTime = new Date().toISOString();
    const state = { startTime, protocol: selectedProto, fastH: proto.fastH };
    await saveFastingState(state);
    setFastingState(state);
    setElapsed(0);
    startTimer(startTime);
  }

  async function handleStopFast() {
    Alert.alert('Orucu Bitir', 'Orucu bitirmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Bitir', style: 'destructive', onPress: async () => {
          stopTimer();
          if (fastingState) {
            const history = await getFastingHistory();
            const proto = PROTOCOLS.find(p => p.id === fastingState.protocol);
            const target = proto ? proto.fastH * 3600 : 0;
            history.unshift({
              date: fastingState.startTime,
              protocol: fastingState.protocol,
              elapsedSec: elapsed,
              targetSec: target,
              completed: elapsed >= target,
            });
            await saveFastingHistory(history.slice(0, 30));
          }
          await saveFastingState(null);
          setFastingState(null);
          setElapsed(0);
        },
      },
    ]);
  }

  // ─── Habits ───────────────────────────────────────────────────────────────
  async function toggleHabit(habitId) {
    const done = !todayLog[habitId];
    const newLog = { ...todayLog, [habitId]: done };
    setTodayLog(newLog);
    await saveHabitLog(newLog);

    // Update streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      if (!done) return h; // unchecking doesn't reduce streak
      let streak = 1;
      if (h.lastDone === yesterday) streak = (h.streak || 0) + 1;
      else if (h.lastDone === today) streak = h.streak || 1;
      const bestStreak = Math.max(streak, h.bestStreak || 0);
      return { ...h, streak, bestStreak, lastDone: today };
    });
    setHabits(updated);
    await saveHabits(updated);
  }

  function openAddModal() {
    setEditHabit(null);
    setHabitName('');
    setHabitEmoji('🎯');
    setAddModal(true);
  }

  function openEditModal(habit) {
    setEditHabit(habit);
    setHabitName(habit.name);
    setHabitEmoji(habit.emoji);
    setAddModal(true);
  }

  async function saveHabit() {
    if (!habitName.trim()) return;
    let updated;
    if (editHabit) {
      updated = habits.map(h => h.id === editHabit.id ? { ...h, name: habitName.trim(), emoji: habitEmoji } : h);
    } else {
      const newHabit = {
        id: Date.now().toString(),
        name: habitName.trim(),
        emoji: habitEmoji,
        streak: 0,
        bestStreak: 0,
        lastDone: null,
        createdAt: new Date().toISOString(),
      };
      updated = [...habits, newHabit];
    }
    setHabits(updated);
    await saveHabits(updated);
    setAddModal(false);
  }

  async function deleteHabit(habitId) {
    Alert.alert('Alışkanlığı Sil', 'Bu alışkanlığı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          const updated = habits.filter(h => h.id !== habitId);
          setHabits(updated);
          await saveHabits(updated);
        },
      },
    ]);
  }

  // ─── Computed values ──────────────────────────────────────────────────────
  const currentProto = PROTOCOLS.find(p => p.id === (fastingState?.protocol || selectedProto));
  const targetSec = (currentProto?.fastH || 16) * 3600;
  const progress = fastingState ? Math.min(elapsed / targetSec, 1) : 0;
  const remaining = Math.max(targetSec - elapsed, 0);
  const isCompleted = fastingState && elapsed >= targetSec;

  const completedToday = habits.filter(h => todayLog[h.id]).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Fasting Card ─────────────────────────────────────────────── */}
        <View style={s.fastingCard}>
          <View style={s.fastingHeader}>
            <Ionicons name="timer-outline" size={20} color={theme.primary} />
            <Text style={s.fastingTitle}>Aralıklı Oruç</Text>
          </View>

          {/* Protocol selector */}
          <View style={s.protoRow}>
            {PROTOCOLS.map(proto => (
              <TouchableOpacity
                key={proto.id}
                style={[
                  s.protoChip,
                  (fastingState?.protocol || selectedProto) === proto.id && s.protoChipActive,
                  fastingState && s.protoChipDisabled,
                ]}
                onPress={() => !fastingState && setSelectedProto(proto.id)}
                disabled={!!fastingState}
              >
                <Text style={[
                  s.protoChipText,
                  (fastingState?.protocol || selectedProto) === proto.id && s.protoChipTextActive,
                ]}>
                  {proto.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.protoDesc}>{currentProto?.desc}</Text>

          {/* Progress Ring */}
          <View style={s.ringContainer}>
            <ProgressRing
              progress={progress}
              size={200}
              strokeWidth={14}
              color={isCompleted ? theme.accent : theme.primary}
              bgColor={theme.surface}
            >
              {fastingState ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={[s.timerLabel, { color: theme.textMuted }]}>
                    {isCompleted ? 'TAMAMLANDI' : 'geçen süre'}
                  </Text>
                  <Text style={[s.timerText, { color: isCompleted ? theme.accent : theme.primary }]}>
                    {formatElapsed(elapsed)}
                  </Text>
                  {!isCompleted && (
                    <Text style={[s.timerLabel, { color: theme.textMuted, marginTop: 4 }]}>
                      kalan: {formatRemaining(remaining)}
                    </Text>
                  )}
                  <Text style={[s.timerPct, { color: isCompleted ? theme.accent : theme.text }]}>
                    %{Math.round(progress * 100)}
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="timer-outline" size={36} color={theme.textMuted} />
                  <Text style={[s.timerLabel, { color: theme.textMuted, marginTop: 8 }]}>
                    Başlatmak için{'\n'}aşağıya bas
                  </Text>
                </View>
              )}
            </ProgressRing>
          </View>

          {/* Start / Stop button */}
          {fastingState ? (
            <TouchableOpacity style={[s.fastBtn, { backgroundColor: theme.danger }]} onPress={handleStopFast}>
              <Ionicons name="stop-circle-outline" size={20} color="#fff" />
              <Text style={s.fastBtnText}>Orucu Bitir</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.fastBtn, { backgroundColor: theme.primary }]} onPress={handleStartFast}>
              <Ionicons name="play-circle-outline" size={20} color="#fff" />
              <Text style={s.fastBtnText}>Orucu Başlat</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Habits Section ────────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionTitle}>Günlük Alışkanlıklar</Text>
            {habits.length > 0 && (
              <Text style={s.sectionSub}>{completedToday}/{habits.length} tamamlandı</Text>
            )}
          </View>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: theme.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🎯</Text>
            <Text style={s.emptyText}>Henüz alışkanlık yok</Text>
            <Text style={s.emptySubText}>Sağlıklı bir rutin oluşturmak için{'\n'}+ butonuna bas</Text>
          </View>
        ) : (
          habits.map(habit => {
            const done = !!todayLog[habit.id];
            return (
              <TouchableOpacity
                key={habit.id}
                style={[s.habitCard, done && s.habitCardDone]}
                onPress={() => toggleHabit(habit.id)}
                onLongPress={() => Alert.alert(habit.name, 'Ne yapmak istersiniz?', [
                  { text: 'Düzenle', onPress: () => openEditModal(habit) },
                  { text: 'Sil', style: 'destructive', onPress: () => deleteHabit(habit.id) },
                  { text: 'İptal', style: 'cancel' },
                ])}
              >
                <Text style={s.habitEmoji}>{habit.emoji}</Text>
                <View style={s.habitInfo}>
                  <Text style={[s.habitName, done && s.habitNameDone]}>{habit.name}</Text>
                  <View style={s.streakRow}>
                    {(habit.streak || 0) > 0 && (
                      <Text style={s.streakText}>🔥 {habit.streak} gün seri</Text>
                    )}
                    {(habit.bestStreak || 0) > 0 && (
                      <Text style={s.bestStreakText}>  ⭐ En iyi: {habit.bestStreak}</Text>
                    )}
                  </View>
                </View>
                <View style={[s.checkbox, done && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                  {done && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Add / Edit Habit Modal ─────────────────────────────────────── */}
      <Modal visible={addModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editHabit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}</Text>

            {/* Emoji picker */}
            <Text style={s.modalLabel}>Emoji seç</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.emojiScroll}>
              {EMOJI_LIST.map(em => (
                <TouchableOpacity
                  key={em}
                  style={[s.emojiOption, habitEmoji === em && { backgroundColor: theme.primaryLight }]}
                  onPress={() => setHabitEmoji(em)}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.modalLabel}>Alışkanlık adı</Text>
            <TextInput
              style={s.input}
              placeholder="Örn. 10.000 adım at"
              placeholderTextColor={theme.textMuted}
              value={habitName}
              onChangeText={setHabitName}
              maxLength={40}
            />

            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setAddModal(false)}>
                <Text style={s.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, !habitName.trim() && { opacity: 0.5 }]}
                onPress={saveHabit}
                disabled={!habitName.trim()}
              >
                <Text style={s.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scroll: { padding: 16 },

    // Fasting card
    fastingCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      shadowColor: theme.shadow,
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    fastingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    fastingTitle: { fontSize: 17, fontWeight: '700', color: theme.text },

    protoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    protoChip: {
      flex: 1, paddingVertical: 8, borderRadius: 10,
      backgroundColor: theme.surface, alignItems: 'center',
      borderWidth: 1.5, borderColor: 'transparent',
    },
    protoChipActive: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    protoChipDisabled: { opacity: 0.6 },
    protoChipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    protoChipTextActive: { color: theme.primary },

    protoDesc: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginBottom: 16 },

    ringContainer: { alignItems: 'center', marginBottom: 20 },

    timerLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
    timerText: { fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 1 },
    timerPct: { fontSize: 14, fontWeight: '600', marginTop: 4 },

    fastBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 14, borderRadius: 12,
    },
    fastBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Habits
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    sectionSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
    addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    habitCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: theme.card, borderRadius: 14, padding: 14,
      marginBottom: 10, borderWidth: 1, borderColor: theme.cardBorder,
      shadowColor: theme.shadow, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    habitCardDone: { borderColor: theme.accent + '60', backgroundColor: theme.accentLight },
    habitEmoji: { fontSize: 28, width: 36, textAlign: 'center' },
    habitInfo: { flex: 1 },
    habitName: { fontSize: 15, fontWeight: '600', color: theme.text },
    habitNameDone: { textDecorationLine: 'line-through', color: theme.textSecondary },
    streakRow: { flexDirection: 'row', marginTop: 3 },
    streakText: { fontSize: 12, color: theme.warning },
    bestStreakText: { fontSize: 12, color: theme.textMuted },
    checkbox: {
      width: 28, height: 28, borderRadius: 14,
      borderWidth: 2, borderColor: theme.textMuted,
      alignItems: 'center', justifyContent: 'center',
    },

    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 17, fontWeight: '700', color: theme.text, marginBottom: 8 },
    emptySubText: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },

    // Modal
    modalOverlay: {
      flex: 1, backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
    },
    modalBox: {
      backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },

    emojiScroll: { marginBottom: 16 },
    emojiOption: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 8, backgroundColor: theme.surface,
    },

    input: {
      backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder,
      borderRadius: 10, padding: 12, fontSize: 15, color: theme.text,
      marginBottom: 20,
    },
    modalBtns: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 12,
      backgroundColor: theme.surface, alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
    saveBtn: {
      flex: 1, paddingVertical: 14, borderRadius: 12,
      backgroundColor: theme.primary, alignItems: 'center',
    },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
