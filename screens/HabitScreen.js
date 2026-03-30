import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';
import {
  getHabits, saveHabits, getHabitLog, saveHabitLog,
  getFastingState, saveFastingState, getFastingHistory, saveFastingHistory,
} from '../storage';
import { scheduleHabitReminder, cancelHabitReminder } from '../notifications';

// ─── Fasting Protocols ────────────────────────────────────────────────────────
const PROTOCOLS = [
  { id: '16:8',  label: '16:8',  fastH: 16, desc: '16 saat oruç · 8 saat yemek' },
  { id: '18:6',  label: '18:6',  fastH: 18, desc: '18 saat oruç · 6 saat yemek' },
  { id: '20:4',  label: '20:4',  fastH: 20, desc: '20 saat oruç · 4 saat yemek' },
  { id: 'OMAD',  label: 'OMAD',  fastH: 23, desc: '23 saat oruç · 1 öğün' },
];

// ─── Habit Templates ──────────────────────────────────────────────────────────
const TEMPLATES = [
  { name: '10.000 Adım At',       emoji: '🚶', weeklyGoal: 7 },
  { name: 'Su İç (2L)',           emoji: '💧', weeklyGoal: 7 },
  { name: 'Spor Yap',             emoji: '🏃', weeklyGoal: 3 },
  { name: 'Kitap Oku (30 dk)',    emoji: '📚', weeklyGoal: 7 },
  { name: 'Meditasyon',           emoji: '🧘', weeklyGoal: 7 },
  { name: 'Sağlıklı Yemek',       emoji: '🥗', weeklyGoal: 7 },
  { name: 'Erken Kalk (07:00)',   emoji: '☀️', weeklyGoal: 5 },
  { name: 'Uyku (23:00\'da)',     emoji: '🛌', weeklyGoal: 7 },
  { name: 'Diş İpi Kullan',       emoji: '🦷', weeklyGoal: 7 },
  { name: 'Şükran Günlüğü',       emoji: '✍️', weeklyGoal: 7 },
  { name: 'Soğuk Duş',            emoji: '🚿', weeklyGoal: 5 },
  { name: 'Ekransız Saat',        emoji: '📵', weeklyGoal: 7 },
];

const EMOJI_LIST = ['💧','🏃','🧘','🛌','📚','🥗','🍎','💪','🚶','🧴','🌟','☀️','🎯','✍️','🎵','🧠','🦷','🙏','🚴','🏊','📵','🚿','🧹','🐾'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function formatElapsed(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function dateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toDateString();
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => dateString(i - 6));
}

function shortDay(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', { weekday: 'short' });
}

// ─── Circular Progress Ring ───────────────────────────────────────────────────
function ProgressRing({ progress, size = 200, strokeWidth = 14, color, bgColor, children }) {
  const half = size / 2;
  const p = Math.min(Math.max(progress, 0), 1);
  const rightDeg = p <= 0.5 ? -180 + p * 2 * 180 : 0;
  const leftDeg  = p <= 0.5 ? -180 : -180 + (p - 0.5) * 2 * 180;

  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: half, borderWidth: strokeWidth, borderColor: bgColor }} />
      <View style={{ position: 'absolute', left: half, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: -half, top: 0, width: size, height: size, borderRadius: half, borderWidth: strokeWidth, borderColor: p > 0 ? color : 'transparent', transform: [{ rotate: `${rightDeg}deg` }] }} />
      </View>
      <View style={{ position: 'absolute', left: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: half, borderWidth: strokeWidth, borderColor: p > 0.5 ? color : 'transparent', transform: [{ rotate: `${leftDeg}deg` }] }} />
      </View>
      <View style={{ position: 'absolute', top: strokeWidth, left: strokeWidth, width: size - strokeWidth * 2, height: size - strokeWidth * 2, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HabitScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  // Fasting
  const [selectedProto, setSelectedProto] = useState('16:8');
  const [fastingState, setFastingState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [fastHistory, setFastHistory] = useState([]);
  const [showFastHistory, setShowFastHistory] = useState(false);
  const timerRef = useRef(null);

  // Habits
  const [habits, setHabits] = useState([]);
  const [todayLog, setTodayLog] = useState({});
  const [weekLogs, setWeekLogs] = useState({}); // { dateStr: { habitId: bool } }
  const [addModal, setAddModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('🎯');
  const [habitWeeklyGoal, setHabitWeeklyGoal] = useState(7);
  const [habitReminder, setHabitReminder] = useState('');  // 'HH:MM' or ''

  useFocusEffect(useCallback(() => {
    loadAll();
    return () => stopTimer();
  }, []));

  async function loadAll() {
    const [h, log, fs, fh] = await Promise.all([
      getHabits(), getHabitLog(), getFastingState(), getFastingHistory(),
    ]);
    setHabits(h);
    setTodayLog(log);
    setFastHistory(fh);

    // Load last 7 days logs for week view
    const days = getLast7Days();
    const logs = await Promise.all(days.map(d => getHabitLog(d)));
    const weekMap = {};
    days.forEach((d, i) => { weekMap[d] = logs[i]; });
    setWeekLogs(weekMap);

    if (fs) {
      setFastingState(fs);
      setSelectedProto(fs.protocol);
      startTimer(fs.startTime);
    }
  }

  // ─── Timer ────────────────────────────────────────────────────────────────
  function startTimer(startTime) {
    stopTimer();
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    tick();
    timerRef.current = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // ─── Fasting ──────────────────────────────────────────────────────────────
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
            const proto = PROTOCOLS.find(p => p.id === fastingState.protocol);
            const targetSec = proto ? proto.fastH * 3600 : 0;
            const newEntry = {
              date: fastingState.startTime,
              protocol: fastingState.protocol,
              elapsedSec: elapsed,
              targetSec,
              completed: elapsed >= targetSec,
            };
            const updated = [newEntry, ...fastHistory].slice(0, 30);
            await saveFastingHistory(updated);
            setFastHistory(updated);
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
    const today = dateString();
    setTodayLog(newLog);
    await saveHabitLog(newLog);
    setWeekLogs(prev => ({ ...prev, [today]: newLog }));

    if (!done) return;
    const yesterday = dateString(-1);
    const updated = habits.map(h => {
      if (h.id !== habitId) return h;
      let streak = 1;
      if (h.lastDone === yesterday) streak = (h.streak || 0) + 1;
      else if (h.lastDone === today) streak = h.streak || 1;
      return { ...h, streak, bestStreak: Math.max(streak, h.bestStreak || 0), lastDone: today };
    });
    setHabits(updated);
    await saveHabits(updated);
  }

  function openAddModal() {
    setEditHabit(null);
    setHabitName('');
    setHabitEmoji('🎯');
    setHabitWeeklyGoal(7);
    setHabitReminder('');
    setAddModal(true);
    setShowTemplates(false);
  }

  function openEditModal(habit) {
    setEditHabit(habit);
    setHabitName(habit.name);
    setHabitEmoji(habit.emoji);
    setHabitWeeklyGoal(habit.weeklyGoal || 7);
    setHabitReminder(habit.reminder || '');
    setAddModal(true);
    setShowTemplates(false);
  }

  async function applyTemplate(tpl) {
    const newHabit = {
      id: Date.now().toString(),
      name: tpl.name,
      emoji: tpl.emoji,
      weeklyGoal: tpl.weeklyGoal,
      reminder: '',
      streak: 0, bestStreak: 0, lastDone: null,
      createdAt: new Date().toISOString(),
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    await saveHabits(updated);
    setShowTemplates(false);
  }

  async function saveHabit() {
    if (!habitName.trim()) return;
    let updated;
    if (editHabit) {
      // Update reminder if changed
      if (editHabit.reminder !== habitReminder) {
        await cancelHabitReminder(editHabit.id);
        if (habitReminder) {
          const [h, m] = habitReminder.split(':').map(Number);
          await scheduleHabitReminder(editHabit.id, habitName.trim(), habitEmoji, h, m);
        }
      }
      updated = habits.map(h => h.id === editHabit.id
        ? { ...h, name: habitName.trim(), emoji: habitEmoji, weeklyGoal: habitWeeklyGoal, reminder: habitReminder }
        : h);
    } else {
      const id = Date.now().toString();
      if (habitReminder) {
        const [h, m] = habitReminder.split(':').map(Number);
        await scheduleHabitReminder(id, habitName.trim(), habitEmoji, h, m);
      }
      const newHabit = {
        id,
        name: habitName.trim(),
        emoji: habitEmoji,
        weeklyGoal: habitWeeklyGoal,
        reminder: habitReminder,
        streak: 0, bestStreak: 0, lastDone: null,
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
          await cancelHabitReminder(habitId);
          const updated = habits.filter(h => h.id !== habitId);
          setHabits(updated);
          await saveHabits(updated);
        },
      },
    ]);
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const currentProto = PROTOCOLS.find(p => p.id === (fastingState?.protocol || selectedProto));
  const targetSec = (currentProto?.fastH || 16) * 3600;
  const progress = fastingState ? Math.min(elapsed / targetSec, 1) : 0;
  const remaining = Math.max(targetSec - elapsed, 0);
  const isCompleted = fastingState && elapsed >= targetSec;
  const completedToday = habits.filter(h => todayLog[h.id]).length;

  const days7 = getLast7Days();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Fasting Card ─────────────────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <View style={s.rowGap}>
              <Ionicons name="timer-outline" size={20} color={theme.primary} />
              <Text style={s.cardTitle}>Aralıklı Oruç</Text>
            </View>
            <TouchableOpacity onPress={() => setShowFastHistory(!showFastHistory)} style={s.histBtn}>
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[s.histBtnText, { color: theme.primary }]}>Geçmiş</Text>
            </TouchableOpacity>
          </View>

          {/* Protocol chips */}
          <View style={s.protoRow}>
            {PROTOCOLS.map(proto => (
              <TouchableOpacity
                key={proto.id}
                style={[s.protoChip, (fastingState?.protocol || selectedProto) === proto.id && s.protoChipActive, fastingState && { opacity: 0.6 }]}
                onPress={() => !fastingState && setSelectedProto(proto.id)}
                disabled={!!fastingState}
              >
                <Text style={[s.protoChipText, (fastingState?.protocol || selectedProto) === proto.id && { color: theme.primary, fontWeight: '700' }]}>
                  {proto.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.protoDesc}>{currentProto?.desc}</Text>

          {/* Progress ring */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <ProgressRing progress={progress} size={200} strokeWidth={14} color={isCompleted ? theme.accent : theme.primary} bgColor={theme.surface}>
              {fastingState ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: theme.textMuted }}>
                    {isCompleted ? '✅ TAMAMLANDI' : 'geçen süre'}
                  </Text>
                  <Text style={{ fontSize: 29, fontWeight: '800', color: isCompleted ? theme.accent : theme.primary, letterSpacing: 1 }}>
                    {formatElapsed(elapsed)}
                  </Text>
                  {!isCompleted && (
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 3 }}>
                      kalan {formatElapsed(remaining)}
                    </Text>
                  )}
                  <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginTop: 4 }}>
                    %{Math.round(progress * 100)}
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="timer-outline" size={36} color={theme.textMuted} />
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 8, textAlign: 'center' }}>Başlatmak için{'\n'}aşağıya bas</Text>
                </View>
              )}
            </ProgressRing>
          </View>

          {fastingState ? (
            <TouchableOpacity style={[s.bigBtn, { backgroundColor: theme.danger }]} onPress={handleStopFast}>
              <Ionicons name="stop-circle-outline" size={20} color="#fff" />
              <Text style={s.bigBtnText}>Orucu Bitir</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.bigBtn, { backgroundColor: theme.primary }]} onPress={handleStartFast}>
              <Ionicons name="play-circle-outline" size={20} color="#fff" />
              <Text style={s.bigBtnText}>Orucu Başlat</Text>
            </TouchableOpacity>
          )}

          {/* Fasting history */}
          {showFastHistory && (
            <View style={s.fastHistContainer}>
              <Text style={s.fastHistTitle}>Son Oruçlar</Text>
              {fastHistory.length === 0 ? (
                <Text style={{ color: theme.textMuted, fontSize: 13 }}>Henüz kayıt yok.</Text>
              ) : (
                fastHistory.slice(0, 7).map((f, i) => {
                  const h = Math.floor(f.elapsedSec / 3600);
                  const m = Math.floor((f.elapsedSec % 3600) / 60);
                  const d = new Date(f.date);
                  const label = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                  return (
                    <View key={i} style={s.fastHistRow}>
                      <Text style={s.fastHistEmoji}>{f.completed ? '✅' : '⏹️'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{f.protocol} · {label}</Text>
                        <Text style={{ fontSize: 12, color: theme.textMuted }}>{h} sa {m} dk {f.completed ? '(tamamlandı)' : '(yarıda bırakıldı)'}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* ── Habits Section ────────────────────────────────────────────── */}
        <View style={s.rowBetween}>
          <View>
            <Text style={s.sectionTitle}>Günlük Alışkanlıklar</Text>
            {habits.length > 0 && (
              <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
                {completedToday}/{habits.length} bugün tamamlandı
              </Text>
            )}
          </View>
          <View style={s.rowGap}>
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: theme.surface }]} onPress={() => setShowTemplates(true)}>
              <Ionicons name="copy-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: theme.primary }]} onPress={openAddModal}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {habits.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 44, marginBottom: 10 }}>🎯</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text, marginBottom: 6 }}>Henüz alışkanlık yok</Text>
            <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 }}>
              📋 butonuna bas ve hazır şablonlardan seç{'\n'}veya + ile kendi alışkanlığını ekle
            </Text>
          </View>
        ) : (
          habits.map(habit => {
            const done = !!todayLog[habit.id];
            const thisWeekDone = days7.filter(d => weekLogs[d]?.[habit.id]).length;
            const weeklyGoal = habit.weeklyGoal || 7;

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
                {/* Top row */}
                <View style={s.habitTop}>
                  <Text style={{ fontSize: 26, width: 34, textAlign: 'center' }}>{habit.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.habitName, done && { textDecorationLine: 'line-through', color: theme.textSecondary }]}>
                      {habit.name}
                    </Text>
                    <View style={s.rowGap}>
                      {(habit.streak || 0) > 0 && (
                        <Text style={{ fontSize: 11, color: theme.warning }}>🔥 {habit.streak} gün seri</Text>
                      )}
                      {(habit.bestStreak || 0) > 1 && (
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>⭐ En iyi: {habit.bestStreak}</Text>
                      )}
                      {habit.reminder ? (
                        <Text style={{ fontSize: 11, color: theme.primary }}>🔔 {habit.reminder}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={[s.checkbox, done && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                    {done && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </View>
                </View>

                {/* 7-day history */}
                <View style={s.weekRow}>
                  {days7.map((d, i) => {
                    const isDone = !!weekLogs[d]?.[habit.id];
                    const isToday = i === 6;
                    return (
                      <View key={d} style={s.dayCol}>
                        <Text style={[s.dayLabel, isToday && { color: theme.primary, fontWeight: '700' }]}>
                          {shortDay(d)}
                        </Text>
                        <View style={[
                          s.daydot,
                          isDone && { backgroundColor: theme.accent },
                          isToday && !isDone && { borderColor: theme.primary, borderWidth: 1.5 },
                        ]} />
                      </View>
                    );
                  })}
                </View>

                {/* Weekly progress bar */}
                <View style={s.weekProgressRow}>
                  <View style={s.weekProgressTrack}>
                    <View style={[s.weekProgressFill, { width: `${Math.min(thisWeekDone / weeklyGoal, 1) * 100}%`, backgroundColor: theme.primary }]} />
                  </View>
                  <Text style={s.weekProgressLabel}>{thisWeekDone}/{weeklyGoal} bu hafta</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── Templates Modal ───────────────────────────────────────────── */}
      <Modal visible={showTemplates} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { maxHeight: '80%' }]}>
            <View style={s.rowBetween}>
              <Text style={s.modalTitle}>Hazır Alışkanlıklar</Text>
              <TouchableOpacity onPress={() => setShowTemplates(false)}>
                <Ionicons name="close" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {TEMPLATES.filter(t => !habits.find(h => h.name === t.name)).map((tpl, i) => (
                <TouchableOpacity key={i} style={s.templateRow} onPress={() => applyTemplate(tpl)}>
                  <Text style={{ fontSize: 26 }}>{tpl.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{tpl.name}</Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>Haftada {tpl.weeklyGoal} gün hedef</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              ))}
              {TEMPLATES.every(t => habits.find(h => h.name === t.name)) && (
                <Text style={{ color: theme.textMuted, textAlign: 'center', padding: 20 }}>
                  Tüm şablonlar eklendi ✅
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity style={[s.bigBtn, { backgroundColor: theme.primary, marginTop: 12 }]} onPress={openAddModal}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={s.bigBtnText}>Kendin Oluştur</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit Habit Modal ─────────────────────────────────────── */}
      <Modal visible={addModal} transparent animationType="slide">
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editHabit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık'}</Text>

            {/* Emoji */}
            <Text style={s.modalLabel}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {EMOJI_LIST.map(em => (
                <TouchableOpacity
                  key={em}
                  style={[s.emojiOpt, habitEmoji === em && { backgroundColor: theme.primaryLight }]}
                  onPress={() => setHabitEmoji(em)}
                >
                  <Text style={{ fontSize: 22 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name */}
            <Text style={s.modalLabel}>Alışkanlık adı</Text>
            <TextInput
              style={s.input}
              placeholder="Örn. 10.000 adım at"
              placeholderTextColor={theme.textMuted}
              value={habitName}
              onChangeText={setHabitName}
              maxLength={40}
            />

            {/* Weekly goal */}
            <Text style={s.modalLabel}>Haftalık hedef</Text>
            <View style={s.rowGap}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[s.goalChip, habitWeeklyGoal === n && { backgroundColor: theme.primary }]}
                  onPress={() => setHabitWeeklyGoal(n)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: habitWeeklyGoal === n ? '#fff' : theme.textSecondary }}>{n}</Text>
                </TouchableOpacity>
              ))}
              <Text style={{ fontSize: 12, color: theme.textMuted, alignSelf: 'center' }}>gün/hafta</Text>
            </View>

            {/* Reminder */}
            <Text style={[s.modalLabel, { marginTop: 14 }]}>Hatırlatıcı (opsiyonel)</Text>
            <TextInput
              style={s.input}
              placeholder="SS:DD — Örn. 07:30"
              placeholderTextColor={theme.textMuted}
              value={habitReminder}
              onChangeText={setHabitReminder}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
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
    scroll: { padding: 16, gap: 16 },

    card: {
      backgroundColor: theme.card, borderRadius: 16, padding: 18,
      borderWidth: 1, borderColor: theme.cardBorder,
      shadowColor: theme.shadow, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    cardTitle: { fontSize: 17, fontWeight: '700', color: theme.text },

    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    histBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6, borderRadius: 8, backgroundColor: theme.primaryLight },
    histBtnText: { fontSize: 12, fontWeight: '600' },

    protoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    protoChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: theme.surface, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
    protoChipActive: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    protoChipText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
    protoDesc: { fontSize: 13, color: theme.textMuted, textAlign: 'center', marginBottom: 14 },

    bigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
    bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    fastHistContainer: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.cardBorder },
    fastHistTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 10 },
    fastHistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    fastHistEmoji: { fontSize: 18 },

    sectionTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

    habitCard: {
      backgroundColor: theme.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: theme.cardBorder,
      shadowColor: theme.shadow, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    habitCardDone: { borderColor: theme.accent + '50', backgroundColor: theme.accentLight },
    habitTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    habitName: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 },
    checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: theme.textMuted, alignItems: 'center', justifyContent: 'center' },

    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    dayCol: { alignItems: 'center', gap: 4 },
    dayLabel: { fontSize: 10, color: theme.textMuted },
    daydot: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.surface },

    weekProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    weekProgressTrack: { flex: 1, height: 6, backgroundColor: theme.surface, borderRadius: 3, overflow: 'hidden' },
    weekProgressFill: { height: '100%', borderRadius: 3 },
    weekProgressLabel: { fontSize: 11, color: theme.textMuted, minWidth: 70, textAlign: 'right' },

    emptyState: { alignItems: 'center', paddingVertical: 40 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' },
    modalBox: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
    templateRow: {
      flexDirection: 'row', alignItems: 'center', padding: 12,
      borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
    },

    emojiOpt: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 8, backgroundColor: theme.surface },
    input: { backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.inputBorder, borderRadius: 10, padding: 12, fontSize: 15, color: theme.text, marginBottom: 14 },

    goalChip: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },

    modalBtns: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.surface, alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center' },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
