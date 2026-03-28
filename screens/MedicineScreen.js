import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { getMedicines, saveMedicines } from '../storage';
import { scheduleMedicineAlarm, cancelMedicineAlarm, getMedicineTimes, requestPermissions } from '../notifications';

const COLORS = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4', '#795548', '#607D8B'];

const PERIOD_OPTIONS = [
  { key: 'morning', label: 'Sabah', times: '08:00', icon: 'sunny-outline' },
  { key: 'noon', label: 'Öğle', times: '12:00', icon: 'partly-sunny-outline' },
  { key: 'evening', label: 'Akşam', times: '20:00', icon: 'moon-outline' },
  { key: 'morning-evening', label: 'Sabah-Akşam', times: '08:00, 20:00', icon: 'repeat-outline' },
  { key: 'morning-noon-evening', label: 'Sabah-Öğle-Akşam', times: '08:00, 12:00, 20:00', icon: 'time-outline' },
  { key: 'once-daily', label: 'Günde 1 Kez', times: 'Saat seçin', icon: 'alarm-outline' },
  { key: 'twice-daily', label: 'Günde 2 Kez', times: '08:00, 20:00', icon: 'repeat-outline' },
  { key: 'three-daily', label: 'Günde 3 Kez', times: '08:00, 14:00, 20:00', icon: 'time-outline' },
  { key: 'every-4h', label: 'Her 4 Saatte', times: '08:00, 12:00, 16:00, 20:00', icon: 'timer-outline' },
  { key: 'every-6h', label: 'Her 6 Saatte', times: '06:00, 12:00, 18:00, 00:00', icon: 'timer-outline' },
  { key: 'every-8h', label: 'Her 8 Saatte', times: '08:00, 16:00, 00:00', icon: 'timer-outline' },
  { key: 'custom', label: 'Özel Saat', times: 'Saat girin', icon: 'create-outline' },
];

const STOMACH_OPTIONS = [
  { key: 'any', label: 'Farketmez', icon: 'remove-circle-outline', color: '#607D8B' },
  { key: 'empty', label: 'Aç Karnına', icon: 'water-outline', color: '#FF9800' },
  { key: 'full', label: 'Tok Karnına', icon: 'restaurant-outline', color: '#4CAF50' },
];

export default function MedicineScreen() {
  const { theme } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const [period, setPeriod] = useState('morning');
  const [stomach, setStomach] = useState('any');
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  useFocusEffect(
    useCallback(() => { loadMedicines(); }, [])
  );

  const loadMedicines = async () => {
    const meds = await getMedicines();
    setMedicines(meds);
  };

  const saveMedicine = async () => {
    if (!name) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    const color = COLORS[medicines.length % COLORS.length];
    const newMed = {
      id: Date.now(), name, time, dose, notes, period, stomach, alarmEnabled,
      taken: false, color,
    };
    const updated = [...medicines, newMed];
    setMedicines(updated);
    await saveMedicines(updated);

    if (alarmEnabled) {
      await requestPermissions();
      await scheduleMedicineAlarm(newMed);
    }

    resetForm();
    setModalVisible(false);
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
  };

  const resetForm = () => {
    setName(''); setTime('08:00'); setDose(''); setNotes('');
    setPeriod('morning'); setStomach('any'); setAlarmEnabled(true);
    setShowPeriodPicker(false);
  };

  const toggleTaken = async (id) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    const updated = medicines.map(m => m.id === id ? { ...m, taken: !m.taken } : m);
    setMedicines(updated);
    await saveMedicines(updated);
  };

  const deleteMedicine = async (id) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch (e) {}
    const med = medicines.find(m => m.id === id);
    Alert.alert('İlacı Sil', `"${med.name}" ilacını silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await cancelMedicineAlarm(id);
          const updated = medicines.filter(m => m.id !== id);
          setMedicines(updated);
          await saveMedicines(updated);
        }
      },
    ]);
  };

  const takenCount = medicines.filter(m => m.taken).length;
  const totalCount = medicines.length;
  const percent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
  const s = getStyles(theme);

  const getPeriodLabel = (p) => PERIOD_OPTIONS.find(o => o.key === p)?.label || p;
  const getStomachLabel = (st) => STOMACH_OPTIONS.find(o => o.key === st)?.label || '';
  const getStomachIcon = (st) => STOMACH_OPTIONS.find(o => o.key === st)?.icon || 'remove-circle-outline';
  const getStomachColor = (st) => STOMACH_OPTIONS.find(o => o.key === st)?.color || '#607D8B';

  return (
    <View style={s.container}>
      {totalCount > 0 && (
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Bugünkü İlerleme</Text>
            <Text style={s.headerSub}>{takenCount}/{totalCount} ilaç alındı</Text>
          </View>
          <View style={s.percentBadge}>
            <Text style={s.percentText}>%{percent}</Text>
          </View>
        </View>
      )}
      {totalCount > 0 && (
        <View style={s.progressBarContainer}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${percent}%` }]} />
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {totalCount === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconContainer}>
              <Ionicons name="medkit-outline" size={48} color={theme.purple} />
            </View>
            <Text style={s.emptyTitle}>Henüz ilaç eklenmedi</Text>
            <Text style={s.emptyText}>İlaçlarınızı ekleyin, alarmlarla hatırlatma alın</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={s.emptyBtnText}>İlk İlacı Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.listContainer}>
            {medicines.map((med) => {
              const times = getMedicineTimes(med);
              return (
                <TouchableOpacity
                  key={med.id} style={[s.card, med.taken && s.cardTaken]}
                  onPress={() => toggleTaken(med.id)}
                  onLongPress={() => deleteMedicine(med.id)} activeOpacity={0.7}
                >
                  <View style={[s.colorStripe, { backgroundColor: med.color || theme.primary }]} />
                  <View style={s.cardContent}>
                    <View style={s.cardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.medName, med.taken && s.medNameTaken]}>{med.name}</Text>
                        <View style={s.medDetails}>
                          <View style={s.detailChip}>
                            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                            <Text style={s.medTime}>{times.join(', ')}</Text>
                          </View>
                          {med.dose ? (
                            <View style={s.detailChip}>
                              <Ionicons name="medical-outline" size={14} color={theme.textSecondary} />
                              <Text style={s.medDose}>{med.dose}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={s.medTags}>
                          <View style={[s.tag, { backgroundColor: (med.color || theme.primary) + '20' }]}>
                            <Text style={[s.tagText, { color: med.color || theme.primary }]}>{getPeriodLabel(med.period || 'custom')}</Text>
                          </View>
                          {med.stomach && med.stomach !== 'any' && (
                            <View style={[s.tag, { backgroundColor: getStomachColor(med.stomach) + '20' }]}>
                              <Ionicons name={getStomachIcon(med.stomach)} size={12} color={getStomachColor(med.stomach)} />
                              <Text style={[s.tagText, { color: getStomachColor(med.stomach) }]}>{getStomachLabel(med.stomach)}</Text>
                            </View>
                          )}
                          {med.alarmEnabled && (
                            <Ionicons name="notifications" size={14} color={theme.warning} />
                          )}
                        </View>
                        {med.notes ? <Text style={s.medNotes}>{med.notes}</Text> : null}
                      </View>
                      <View style={[s.checkbox, med.taken && s.checkboxTaken]}>
                        {med.taken && <Ionicons name="checkmark" size={18} color="#fff" />}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            <Text style={s.hintText}>Silmek için basılı tutun</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {} setModalVisible(true); }} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Medicine Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={s.modal}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Yeni İlaç Ekle</Text>

              <Text style={s.inputLabel}>İlaç Adı *</Text>
              <TextInput style={s.input} placeholder="Örn: Parol, Aspirin..." value={name} onChangeText={setName} placeholderTextColor={theme.textMuted} />

              <Text style={s.inputLabel}>Doz</Text>
              <TextInput style={s.input} placeholder="Örn: 1 tablet, 5ml, 500mg..." value={dose} onChangeText={setDose} placeholderTextColor={theme.textMuted} />

              {/* Period Selection */}
              <Text style={s.inputLabel}>Kullanım Periyodu *</Text>
              <TouchableOpacity style={s.periodSelector} onPress={() => setShowPeriodPicker(!showPeriodPicker)}>
                <Ionicons name={PERIOD_OPTIONS.find(o => o.key === period)?.icon || 'time-outline'} size={20} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.periodSelectedText}>{getPeriodLabel(period)}</Text>
                  <Text style={s.periodSelectedTimes}>{PERIOD_OPTIONS.find(o => o.key === period)?.times}</Text>
                </View>
                <Ionicons name={showPeriodPicker ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textMuted} />
              </TouchableOpacity>

              {showPeriodPicker && (
                <View style={s.periodList}>
                  {PERIOD_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.key} style={[s.periodOption, period === opt.key && s.periodOptionActive]} onPress={() => { setPeriod(opt.key); setShowPeriodPicker(false); }}>
                      <Ionicons name={opt.icon} size={18} color={period === opt.key ? '#fff' : theme.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.periodLabel, period === opt.key && { color: '#fff' }]}>{opt.label}</Text>
                        <Text style={[s.periodTimes, period === opt.key && { color: 'rgba(255,255,255,0.7)' }]}>{opt.times}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Custom Time - show for custom and once-daily */}
              {(period === 'custom' || period === 'once-daily') && (
                <>
                  <Text style={s.inputLabel}>Saat *</Text>
                  <TextInput style={s.input} placeholder="Örn: 08:00" value={time} onChangeText={setTime} placeholderTextColor={theme.textMuted} />
                </>
              )}

              {/* Stomach */}
              <Text style={s.inputLabel}>Aç / Tok Karnına</Text>
              <View style={s.stomachRow}>
                {STOMACH_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.key} style={[s.stomachBtn, stomach === opt.key && { backgroundColor: opt.color }]} onPress={() => setStomach(opt.key)}>
                    <Ionicons name={opt.icon} size={18} color={stomach === opt.key ? '#fff' : opt.color} />
                    <Text style={[s.stomachText, stomach === opt.key && { color: '#fff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={s.inputLabel}>Not</Text>
              <TextInput style={[s.input, { minHeight: 50, textAlignVertical: 'top' }]} placeholder="Ek bilgi..." value={notes} onChangeText={setNotes} multiline placeholderTextColor={theme.textMuted} />

              {/* Alarm Toggle */}
              <TouchableOpacity style={s.alarmRow} onPress={() => setAlarmEnabled(!alarmEnabled)}>
                <Ionicons name={alarmEnabled ? 'notifications' : 'notifications-off'} size={22} color={alarmEnabled ? theme.primary : theme.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={s.alarmText}>Alarm / Bildirim</Text>
                  <Text style={s.alarmHint}>{alarmEnabled ? 'Her gün belirtilen saatlerde bildirim alacaksınız' : 'Bildirim kapalı'}</Text>
                </View>
                <View style={[s.toggle, alarmEnabled && s.toggleActive]}>
                  <View style={[s.toggleDot, alarmEnabled && s.toggleDotActive]} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[s.saveBtn, !name && s.saveBtnDisabled]} onPress={saveMedicine} disabled={!name}>
                <Text style={s.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={s.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  headerSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  percentBadge: { backgroundColor: theme.accentLight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  percentText: { fontSize: 16, fontWeight: 'bold', color: theme.accent },
  progressBarContainer: { paddingHorizontal: 20, paddingBottom: 8 },
  progressBar: { height: 8, backgroundColor: theme.surface, borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: theme.accent, borderRadius: 4 },

  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.purpleLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 24 },
  emptyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  listContainer: { padding: 16 },
  card: {
    backgroundColor: theme.card, borderRadius: 16, marginBottom: 12,
    flexDirection: 'row', overflow: 'hidden',
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
  },
  cardTaken: { opacity: 0.55 },
  colorStripe: { width: 5 },
  cardContent: { flex: 1, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  medName: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  medNameTaken: { textDecorationLine: 'line-through', color: theme.textMuted },
  medDetails: { flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  medTime: { fontSize: 13, color: theme.textSecondary },
  medDose: { fontSize: 13, color: theme.textSecondary },
  medTags: { flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  medNotes: { fontSize: 12, color: theme.textMuted, marginTop: 6, fontStyle: 'italic' },
  checkbox: { width: 32, height: 32, borderRadius: 16, borderWidth: 2.5, borderColor: theme.inputBorder, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  checkboxTaken: { backgroundColor: theme.accent, borderColor: theme.accent },
  hintText: { textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 8 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay },
  modal: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.surface, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: theme.inputBg, color: theme.text },

  // Period
  periodSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.primaryLight, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  periodSelectedText: { fontSize: 15, fontWeight: '600', color: theme.text },
  periodSelectedTimes: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
  periodList: { marginBottom: 10 },
  periodOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surface, borderRadius: 10, padding: 12, marginBottom: 4,
  },
  periodOptionActive: { backgroundColor: theme.primary },
  periodLabel: { fontSize: 14, fontWeight: '600', color: theme.text },
  periodTimes: { fontSize: 11, color: theme.textMuted },

  // Stomach
  stomachRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  stomachBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 12,
  },
  stomachText: { fontSize: 12, fontWeight: '600', color: theme.text },

  // Alarm
  alarmRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.bg, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  alarmText: { fontSize: 15, fontWeight: '600', color: theme.text },
  alarmHint: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: theme.surface, justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: theme.primary },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  toggleDotActive: { alignSelf: 'flex-end' },

  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { backgroundColor: theme.surface },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16 },
});
