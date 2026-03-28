import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { getMedicines, saveMedicines } from '../storage';

const COLORS = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4', '#795548', '#607D8B'];

// Notifications disabled in Expo Go - works in production builds
async function scheduleMedicineNotification() {}
async function rescheduleAll() {}

export default function MedicineScreen() {
  const { theme } = useTheme();
  const [medicines, setMedicines] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => { loadMedicines(); }, [])
  );

  const loadMedicines = async () => {
    const meds = await getMedicines();
    setMedicines(meds);
  };

  const saveMedicine = async () => {
    if (!name || !time) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const color = COLORS[medicines.length % COLORS.length];
    const newMed = { id: Date.now(), name, time, dose, notes, taken: false, color, notify: notifyEnabled };
    const updated = [...medicines, newMed].sort((a, b) => a.time.localeCompare(b.time));
    setMedicines(updated);
    await saveMedicines(updated);
    if (notifyEnabled) {
      await scheduleMedicineNotification(newMed);
    }
    setName(''); setTime(''); setDose(''); setNotes(''); setNotifyEnabled(true);
    setModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleTaken = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = medicines.map(m => m.id === id ? { ...m, taken: !m.taken } : m);
    setMedicines(updated);
    await saveMedicines(updated);
    await rescheduleAll(updated);
  };

  const deleteMedicine = async (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const med = medicines.find(m => m.id === id);
    Alert.alert('İlacı Sil', `"${med.name}" ilacını silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          const updated = medicines.filter(m => m.id !== id);
          setMedicines(updated);
          await saveMedicines(updated);
          await rescheduleAll(updated);
        }
      },
    ]);
  };

  const takenCount = medicines.filter(m => m.taken).length;
  const totalCount = medicines.length;
  const percent = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
  const s = getStyles(theme);

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
            <Text style={s.emptyText}>İlaçlarınızı ekleyin, bildirimlerle hatırlatma alın</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => setModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={s.emptyBtnText}>İlk İlacı Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.listContainer}>
            {medicines.map((med) => (
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
                          <Text style={s.medTime}>{med.time}</Text>
                        </View>
                        {med.dose ? (
                          <View style={s.detailChip}>
                            <Ionicons name="medical-outline" size={14} color={theme.textSecondary} />
                            <Text style={s.medDose}>{med.dose}</Text>
                          </View>
                        ) : null}
                        {med.notify !== false && (
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
            ))}
            <Text style={s.hintText}>Silmek için basılı tutun</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalVisible(true); }} activeOpacity={0.8}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Yeni İlaç Ekle</Text>
            <Text style={s.inputLabel}>İlaç Adı *</Text>
            <TextInput style={s.input} placeholder="Örn: Parol, Aspirin..." value={name} onChangeText={setName} placeholderTextColor={theme.textMuted} />
            <Text style={s.inputLabel}>Saat *</Text>
            <TextInput style={s.input} placeholder="Örn: 08:00" value={time} onChangeText={setTime} placeholderTextColor={theme.textMuted} />
            <Text style={s.inputLabel}>Doz</Text>
            <TextInput style={s.input} placeholder="Örn: 1 tablet, 5ml..." value={dose} onChangeText={setDose} placeholderTextColor={theme.textMuted} />
            <Text style={s.inputLabel}>Not</Text>
            <TextInput style={[s.input, { minHeight: 50, textAlignVertical: 'top' }]} placeholder="Yemekten sonra al..." value={notes} onChangeText={setNotes} multiline placeholderTextColor={theme.textMuted} />

            {/* Notification Toggle */}
            <TouchableOpacity style={s.notifyRow} onPress={() => setNotifyEnabled(!notifyEnabled)}>
              <Ionicons name={notifyEnabled ? 'notifications' : 'notifications-off'} size={22} color={notifyEnabled ? theme.primary : theme.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={s.notifyText}>Bildirim Hatırlatması</Text>
                <Text style={s.notifyHint}>Her gün belirtilen saatte bildirim alın</Text>
              </View>
              <View style={[s.toggle, notifyEnabled && s.toggleActive]}>
                <View style={[s.toggleDot, notifyEnabled && s.toggleDotActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.saveBtn, (!name || !time) && s.saveBtnDisabled]} onPress={saveMedicine} disabled={!name || !time}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setModalVisible(false); setName(''); setTime(''); setDose(''); setNotes(''); setNotifyEnabled(true); }}>
              <Text style={s.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
          </View>
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
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  medName: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  medNameTaken: { textDecorationLine: 'line-through', color: theme.textMuted },
  medDetails: { flexDirection: 'row', gap: 12, marginTop: 6, alignItems: 'center' },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  medTime: { fontSize: 13, color: theme.textSecondary },
  medDose: { fontSize: 13, color: theme.textSecondary },
  medNotes: { fontSize: 12, color: theme.textMuted, marginTop: 6, fontStyle: 'italic' },
  checkbox: { width: 32, height: 32, borderRadius: 16, borderWidth: 2.5, borderColor: theme.inputBorder, alignItems: 'center', justifyContent: 'center' },
  checkboxTaken: { backgroundColor: theme.accent, borderColor: theme.accent },
  hintText: { textAlign: 'center', fontSize: 12, color: theme.textMuted, marginTop: 8 },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.surface, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: theme.inputBg, color: theme.text },

  notifyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.bg, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  notifyText: { fontSize: 15, fontWeight: '600', color: theme.text },
  notifyHint: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  toggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: theme.surface, justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: theme.primary },
  toggleDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
  },
  toggleDotActive: { alignSelf: 'flex-end' },

  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnDisabled: { backgroundColor: theme.surface },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16 },
});
