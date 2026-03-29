import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { getWaterData, setWaterData, getWaterGoal, setWaterGoal, getWaterAlarm, setWaterAlarm, getHealthProfile } from '../storage';
import { scheduleWaterAlarms, requestPermissions } from '../notifications';

const INTERVAL_OPTIONS = [
  { min: 30, label: '30 dakika' },
  { min: 45, label: '45 dakika' },
  { min: 60, label: '1 saat' },
  { min: 90, label: '1.5 saat' },
  { min: 120, label: '2 saat' },
  { min: 180, label: '3 saat' },
];

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.5;

export default function WaterScreen() {
  const { theme } = useTheme();
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(8);
  const [weekData, setWeekData] = useState([]);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [tempGoal, setTempGoal] = useState('8');
  const [alarmSettings, setAlarmSettings] = useState({ enabled: false, intervalMin: 60, startHour: 8, endHour: 22 });
  const [recommendedGlasses, setRecommendedGlasses] = useState(null);

  useFocusEffect(
    useCallback(() => { loadAll(); }, [])
  );

  const loadAll = async () => {
    const g = await getWaterGoal();
    setGoal(g);
    setTempGoal(String(g));
    const c = await getWaterData();
    setCount(c);
    await loadWeekData(g);
    const alarm = await getWaterAlarm();
    setAlarmSettings(alarm);
    const profile = await getHealthProfile();
    if (profile.weight && parseFloat(profile.weight) > 0) {
      setRecommendedGlasses(Math.round(parseFloat(profile.weight) * 0.033 / 0.25));
    } else {
      setRecommendedGlasses(null);
    }
  };

  const loadWeekData = async () => {
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const c = await getWaterData(date.toDateString());
      data.push({ day: dayNames[date.getDay()], count: c, isToday: i === 0 });
    }
    setWeekData(data);
  };

  const addWater = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nc = count + 1;
    setCount(nc);
    await setWaterData(nc);
    setWeekData(prev => prev.map((d, i) => i === prev.length - 1 ? { ...d, count: nc } : d));
    if (nc >= goal) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeWater = async () => {
    if (count <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nc = count - 1;
    setCount(nc);
    await setWaterData(nc);
    setWeekData(prev => prev.map((d, i) => i === prev.length - 1 ? { ...d, count: nc } : d));
  };

  const saveGoal = async () => {
    const g = parseInt(tempGoal);
    if (!g || g < 1 || g > 20) return;
    await setWaterGoal(g);
    setGoal(g);
    setGoalModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveAlarm = async (newSettings) => {
    setAlarmSettings(newSettings);
    await setWaterAlarm(newSettings);
    if (newSettings.enabled) {
      await requestPermissions();
    }
    await scheduleWaterAlarms(newSettings);
    setAlarmModalVisible(false);
  };

  const percent = Math.round((count / goal) * 100);

  const getMessage = () => {
    if (percent === 0) return 'Haydi başlayalım! 💧';
    if (percent < 25) return 'İyi başlangıç, devam et!';
    if (percent < 50) return 'Harika gidiyorsun! 💪';
    if (percent < 75) return 'Yarıyı geçtin, az kaldı!';
    if (percent < 100) return 'Neredeyse tamam! Son hamle!';
    return 'Tebrikler! Hedefe ulaştın! 🎉';
  };

  const s = getStyles(theme);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Top Buttons */}
      <View style={s.topRow}>
        <TouchableOpacity style={s.goalBtn} onPress={() => setGoalModalVisible(true)} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={16} color={theme.primary} />
          <Text style={s.goalBtnText}>Hedef: {goal} bardak</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.goalBtn, alarmSettings.enabled && { backgroundColor: theme.accentLight }]} onPress={() => setAlarmModalVisible(true)} activeOpacity={0.7}>
          <Ionicons name={alarmSettings.enabled ? 'notifications' : 'notifications-outline'} size={16} color={alarmSettings.enabled ? theme.accent : theme.primary} />
          <Text style={[s.goalBtnText, alarmSettings.enabled && { color: theme.accent }]}>
            {alarmSettings.enabled ? `Her ${alarmSettings.intervalMin} dk` : 'Alarm'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Circle */}
      <View style={s.circleContainer}>
        <View style={s.circleOuter}>
          <View style={s.circleInner}>
            <Ionicons name="water" size={32} color={theme.primary} />
            <Text style={s.circleCount}>{count}</Text>
            <Text style={s.circleLabel}>/ {goal} bardak</Text>
          </View>
          {Array.from({ length: goal }).map((_, i) => {
            const angle = (i / goal) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const r = CIRCLE_SIZE / 2 + 8;
            const filled = i < count;
            return (
              <View key={i} style={[s.segmentDot, {
                transform: [{ translateX: Math.cos(rad) * r }, { translateY: Math.sin(rad) * r }],
                backgroundColor: filled ? theme.primary : theme.surface,
              }]}>
                <Text style={{ fontSize: 9, color: filled ? '#fff' : theme.textMuted }}>{i + 1}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.motivationText}>{getMessage()}</Text>
      </View>

      {/* Buttons */}
      <View style={s.buttonRow}>
        <TouchableOpacity style={s.removeBtn} onPress={removeWater} activeOpacity={0.7}>
          <Ionicons name="remove" size={24} color={theme.danger} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.addBtn, count >= goal && s.addBtnDone]} onPress={addWater} activeOpacity={0.7}>
          <Ionicons name={count >= goal ? 'checkmark-circle' : 'add-circle'} size={24} color="#fff" />
          <Text style={s.addBtnText}>{count >= goal ? 'Tamamlandı!' : 'Bardak Ekle'}</Text>
        </TouchableOpacity>
      </View>

      {/* Glasses */}
      <View style={s.glassSection}>
        <Text style={s.sectionTitle}>Bugünkü Bardaklar</Text>
        <View style={s.glassGrid}>
          {Array.from({ length: goal }).map((_, i) => (
            <View key={i} style={[s.glass, i < count && s.glassFull]}>
              <Ionicons name={i < count ? 'water' : 'water-outline'} size={24} color={i < count ? theme.primary : theme.textMuted} />
              <Text style={[s.glassNum, i < count && s.glassNumFull]}>{i + 1}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Weekly */}
      <View style={s.weekSection}>
        <Text style={s.sectionTitle}>Haftalık Geçmiş</Text>
        <View style={s.chartContainer}>
          {weekData.map((d, i) => (
            <View key={i} style={s.chartColumn}>
              <Text style={s.chartValue}>{d.count}</Text>
              <View style={s.chartBarBg}>
                <View style={[s.chartBarFill, {
                  height: `${Math.round((d.count / goal) * 100)}%`,
                  backgroundColor: d.isToday ? theme.primary : (d.count >= goal ? theme.accent : theme.primaryLight),
                }]} />
              </View>
              <Text style={[s.chartDay, d.isToday && { color: theme.primary, fontWeight: 'bold' }]}>{d.day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.infoCard}>
        <Ionicons name="information-circle" size={22} color={theme.accent} />
        <Text style={s.infoText}>Yetişkinlerin günde ortalama 2 litre (8 bardak) su içmesi önerilir.</Text>
      </View>

      <TouchableOpacity style={s.resetBtn} onPress={() => {
        Alert.alert('Sıfırla', 'Bugünkü su verisini sıfırlamak istediğinize emin misiniz?', [
          { text: 'İptal', style: 'cancel' },
          { text: 'Sıfırla', style: 'destructive', onPress: async () => { setCount(0); await setWaterData(0); } },
        ]);
      }}>
        <Ionicons name="refresh-outline" size={18} color={theme.danger} />
        <Text style={s.resetBtnText}>Bugünü Sıfırla</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />

      {/* Goal Modal */}
      <Modal visible={goalModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Su Hedefini Ayarla</Text>
            <Text style={s.modalSub}>Günlük kaç bardak su içmek istiyorsunuz?</Text>
            <View style={s.goalInputRow}>
              <TouchableOpacity style={s.goalAdjBtn} onPress={() => setTempGoal(String(Math.max(1, parseInt(tempGoal || '1') - 1)))}>
                <Ionicons name="remove" size={22} color={theme.primary} />
              </TouchableOpacity>
              <TextInput
                style={s.goalInput}
                value={tempGoal}
                onChangeText={setTempGoal}
                keyboardType="number-pad"
                maxLength={2}
              />
              <TouchableOpacity style={s.goalAdjBtn} onPress={() => setTempGoal(String(Math.min(20, parseInt(tempGoal || '0') + 1)))}>
                <Ionicons name="add" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <Text style={s.goalHint}>Önerilen: 8-10 bardak (2-2.5 litre)</Text>
            <TouchableOpacity style={s.saveBtn} onPress={saveGoal}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setGoalModalVisible(false)}>
              <Text style={s.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Water Alarm Modal */}
      <Modal visible={alarmModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Su Hatırlatıcı</Text>
            <Text style={s.modalSub}>Düzenli aralıklarla su içmeyi hatırlat</Text>

            {/* Enable/Disable */}
            <TouchableOpacity style={s.alarmToggleRow} onPress={() => setAlarmSettings(prev => ({ ...prev, enabled: !prev.enabled }))}>
              <Ionicons name={alarmSettings.enabled ? 'notifications' : 'notifications-off'} size={22} color={alarmSettings.enabled ? theme.primary : theme.textMuted} />
              <Text style={s.alarmToggleText}>{alarmSettings.enabled ? 'Hatırlatıcı Açık' : 'Hatırlatıcı Kapalı'}</Text>
              <View style={[s.alarmToggle, alarmSettings.enabled && s.alarmToggleActive]}>
                <View style={[s.alarmToggleDot, alarmSettings.enabled && s.alarmToggleDotActive]} />
              </View>
            </TouchableOpacity>

            {alarmSettings.enabled && (
              <>
                {/* Interval */}
                <Text style={s.alarmLabel}>Hatırlatma Aralığı</Text>
                <View style={s.intervalGrid}>
                  {INTERVAL_OPTIONS.map(opt => (
                    <TouchableOpacity key={opt.min} style={[s.intervalBtn, alarmSettings.intervalMin === opt.min && s.intervalBtnActive]} onPress={() => setAlarmSettings(prev => ({ ...prev, intervalMin: opt.min }))}>
                      <Text style={[s.intervalText, alarmSettings.intervalMin === opt.min && { color: '#fff' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Time Range */}
                <Text style={s.alarmLabel}>Aktif Saatler</Text>
                <View style={s.timeRangeRow}>
                  <View style={s.timeBox}>
                    <TouchableOpacity onPress={() => setAlarmSettings(prev => ({ ...prev, startHour: Math.max(5, prev.startHour - 1) }))}>
                      <Ionicons name="remove-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={s.timeText}>{String(alarmSettings.startHour).padStart(2, '0')}:00</Text>
                    <TouchableOpacity onPress={() => setAlarmSettings(prev => ({ ...prev, startHour: Math.min(prev.endHour - 1, prev.startHour + 1) }))}>
                      <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={s.timeSep}>—</Text>
                  <View style={s.timeBox}>
                    <TouchableOpacity onPress={() => setAlarmSettings(prev => ({ ...prev, endHour: Math.max(prev.startHour + 1, prev.endHour - 1) }))}>
                      <Ionicons name="remove-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                    <Text style={s.timeText}>{String(alarmSettings.endHour).padStart(2, '0')}:00</Text>
                    <TouchableOpacity onPress={() => setAlarmSettings(prev => ({ ...prev, endHour: Math.min(23, prev.endHour + 1) }))}>
                      <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity style={s.saveBtn} onPress={() => saveAlarm(alarmSettings)}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAlarmModalVisible(false)}>
              <Text style={s.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  topRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12, paddingHorizontal: 16 },
  goalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.primaryLight,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  goalBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  circleContainer: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  circleOuter: { width: CIRCLE_SIZE + 40, height: CIRCLE_SIZE + 40, alignItems: 'center', justifyContent: 'center' },
  circleInner: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.primary,
  },
  circleCount: { fontSize: 48, fontWeight: 'bold', color: theme.primary, marginTop: 4 },
  circleLabel: { fontSize: 15, color: theme.textSecondary },
  segmentDot: { position: 'absolute', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  motivationText: { fontSize: 16, color: theme.textSecondary, marginTop: 16, fontWeight: '600' },

  buttonRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 16 },
  removeBtn: { width: 56, height: 56, borderRadius: 16, backgroundColor: theme.dangerLight, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flex: 1, height: 56, borderRadius: 16, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnDone: { backgroundColor: theme.accent },
  addBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

  glassSection: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  glassGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  glass: {
    width: 68, height: 72, borderRadius: 16,
    backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 1,
  },
  glassFull: { backgroundColor: theme.primaryLight, borderWidth: 1.5, borderColor: theme.primary },
  glassNum: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  glassNumFull: { color: theme.primary, fontWeight: 'bold' },

  weekSection: {
    marginTop: 24, marginHorizontal: 16,
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
  },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartValue: { fontSize: 12, color: theme.textMuted, marginBottom: 4, fontWeight: '600' },
  chartBarBg: { width: 28, height: 80, backgroundColor: theme.surface, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 8 },
  chartDay: { fontSize: 12, color: theme.textMuted, marginTop: 6 },

  infoCard: {
    flexDirection: 'row', backgroundColor: theme.accentLight, borderRadius: 16,
    padding: 16, marginHorizontal: 16, marginTop: 16, gap: 12, alignItems: 'center',
  },
  infoText: { flex: 1, fontSize: 13, color: theme.accent, lineHeight: 20 },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: theme.danger + '40', backgroundColor: theme.dangerLight,
  },
  resetBtnText: { fontSize: 14, fontWeight: '600', color: theme.danger },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: theme.card, borderRadius: 24, padding: 28, width: width - 64, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  modalSub: { fontSize: 14, color: theme.textSecondary, marginBottom: 24 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  goalAdjBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  goalInput: {
    width: 70, height: 56, borderRadius: 14, borderWidth: 2, borderColor: theme.primary,
    textAlign: 'center', fontSize: 28, fontWeight: 'bold', color: theme.text, backgroundColor: theme.inputBg,
  },
  goalHint: { fontSize: 12, color: theme.textMuted, marginTop: 12, marginBottom: 24 },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingHorizontal: 48, paddingVertical: 14, marginBottom: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { padding: 10, paddingHorizontal: 20, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: theme.textSecondary },

  // Alarm styles
  alarmToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.bg, borderRadius: 14, padding: 14, marginBottom: 16,
  },
  alarmToggleText: { flex: 1, fontSize: 16, fontWeight: '600', color: theme.text },
  alarmToggle: {
    width: 48, height: 28, borderRadius: 14,
    backgroundColor: theme.surface, justifyContent: 'center', paddingHorizontal: 3,
  },
  alarmToggleActive: { backgroundColor: theme.primary },
  alarmToggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  alarmToggleDotActive: { alignSelf: 'flex-end' },
  alarmLabel: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginBottom: 8 },
  intervalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  intervalBtn: {
    backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  intervalBtnActive: { backgroundColor: theme.primary },
  intervalText: { fontSize: 14, fontWeight: '600', color: theme.text },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 },
  timeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.surface, borderRadius: 14, padding: 10,
  },
  timeText: { fontSize: 18, fontWeight: 'bold', color: theme.text, minWidth: 50, textAlign: 'center' },
  timeSep: { fontSize: 18, color: theme.textMuted, fontWeight: 'bold' },
});
