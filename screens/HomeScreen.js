import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { getWaterData, getWaterGoal, getMedicines, getActiveProfileName, getCalorieData, getCalorieGoal } from '../storage';

const healthTips = [
  { icon: 'water', tip: 'Sabah kalktığınızda bir bardak su için, metabolizmanızı hızlandırır.' },
  { icon: 'walk', tip: 'Günde en az 30 dakika yürüyüş yapın.' },
  { icon: 'nutrition', tip: 'Her öğünde en az bir porsiyon meyve/sebze tüketin.' },
  { icon: 'moon', tip: 'Yeterli uyku sağlığınız için çok önemlidir. 7-8 saat uyuyun.' },
  { icon: 'happy', tip: 'Stres yönetimi için günde 10 dakika meditasyon deneyin.' },
  { icon: 'medkit', tip: 'İlaçlarınızı her gün aynı saatte almaya özen gösterin.' },
  { icon: 'restaurant', tip: 'Sağlıklı beslenme bağışıklık sisteminizi güçlendirir.' },
  { icon: 'sunny', tip: 'D vitamini için günde 15-20 dakika güneşlenin.' },
];

export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [waterCount, setWaterCount] = useState(0);
  const [waterGoal, setWaterGoalState] = useState(8);
  const [medicines, setMedicines] = useState([]);
  const [totalCal, setTotalCal] = useState(0);
  const [calGoal, setCalGoal] = useState(2000);
  const [activeMember, setActiveMember] = useState('Ben');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setTipIndex(new Date().getDate() % healthTips.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const name = await getActiveProfileName();
      setActiveMember(name);
      const goal = await getWaterGoal();
      setWaterGoalState(goal);
      const water = await getWaterData();
      setWaterCount(water);
      const meds = await getMedicines();
      setMedicines(meds);
      const cg = await getCalorieGoal();
      setCalGoal(cg);
      const calData = await getCalorieData();
      setTotalCal(calData.reduce((s, m) => s + m.cal, 0));
    } catch (e) {}
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: 'İyi Geceler', icon: 'moon' };
    if (hour < 12) return { text: 'Günaydın', icon: 'sunny' };
    if (hour < 18) return { text: 'İyi Günler', icon: 'partly-sunny' };
    return { text: 'İyi Akşamlar', icon: 'cloudy-night' };
  };

  const greeting = getGreeting();
  const waterPercent = Math.round((waterCount / waterGoal) * 100);
  const takenMeds = medicines.filter(m => m.taken).length;
  const calPercent = calGoal > 0 ? Math.round((totalCal / calGoal) * 100) : 0;
  const todayTip = healthTips[tipIndex];
  const s = getStyles(theme);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Ionicons name={greeting.icon} size={28} color="rgba(255,255,255,0.9)" />
          <Text style={s.greetingText}>{greeting.text},</Text>
          <Text style={s.userName}>{activeMember}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleTheme(); }} style={s.themeBtn}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.dateText}>
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </Text>
          <Text style={s.dayText}>
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
          </Text>
        </View>
      </View>

      {/* Summary Cards */}
      <Text style={s.sectionTitle}>Günlük Özet</Text>
      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="water" size={28} color={theme.primary} />
          <Text style={s.summaryValue}>{waterCount}/{waterGoal}</Text>
          <Text style={s.summaryLabel}>Bardak Su</Text>
          <View style={s.miniProgress}>
            <View style={[s.miniProgressFill, { width: `${Math.min(waterPercent, 100)}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>
        <View style={[s.summaryCard, { backgroundColor: theme.purpleLight }]}>
          <Ionicons name="medkit" size={28} color={theme.purple} />
          <Text style={s.summaryValue}>{takenMeds}/{medicines.length}</Text>
          <Text style={s.summaryLabel}>İlaç Alındı</Text>
          <View style={s.miniProgress}>
            <View style={[s.miniProgressFill, {
              width: medicines.length > 0 ? `${Math.round((takenMeds / medicines.length) * 100)}%` : '0%',
              backgroundColor: theme.purple,
            }]} />
          </View>
        </View>
      </View>

      {/* Calorie Card */}
      <View style={s.calorieCard}>
        <View style={s.waterCardHeader}>
          <View>
            <Text style={s.waterCardTitle}>Kalori Takibi</Text>
            <Text style={s.waterCardSub}>{calGoal - totalCal > 0 ? `${calGoal - totalCal} kcal kaldı` : 'Hedefe ulaştın!'}</Text>
          </View>
          <View style={[s.waterBadge, { backgroundColor: theme.warningLight }]}>
            <Text style={[s.waterBadgeText, { color: theme.warning }]}>{totalCal} kcal</Text>
          </View>
        </View>
        <View style={s.calorieProgress}>
          <View style={[s.progressFillCal, { width: `${Math.min(calPercent, 100)}%` }]} />
        </View>
        <Text style={s.calorieHint}>Hedef: {calGoal} kcal  |  %{Math.min(calPercent, 100)}</Text>
      </View>

      {/* Water Card */}
      <View style={s.waterCard}>
        <View style={s.waterCardHeader}>
          <View>
            <Text style={s.waterCardTitle}>Su Takibi</Text>
            <Text style={s.waterCardSub}>{waterGoal - waterCount > 0 ? `${waterGoal - waterCount} bardak daha iç` : 'Hedefe ulaştın!'}</Text>
          </View>
          <View style={s.waterBadge}>
            <Text style={s.waterBadgeText}>%{Math.min(waterPercent, 100)}</Text>
          </View>
        </View>
        <View style={s.waterGlasses}>
          {Array.from({ length: Math.min(waterGoal, 10) }).map((_, i) => (
            <View key={i} style={[s.waterGlass, i < waterCount && s.waterGlassFull]}>
              <Ionicons name={i < waterCount ? 'water' : 'water-outline'} size={16} color={i < waterCount ? theme.primary : theme.textMuted} />
            </View>
          ))}
          {waterGoal > 10 && <Text style={s.moreText}>+{waterGoal - 10}</Text>}
        </View>
      </View>

      {/* Medicines Card */}
      <View style={s.medsCard}>
        <Text style={s.medsCardTitle}>Bugünkü İlaçlar</Text>
        {medicines.length === 0 ? (
          <View style={s.emptyMeds}>
            <Ionicons name="medkit-outline" size={36} color={theme.textMuted} />
            <Text style={s.emptyMedsText}>Henüz ilaç eklenmedi</Text>
          </View>
        ) : (
          medicines.slice(0, 3).map(med => (
            <View key={med.id} style={s.medItem}>
              <View style={[s.medDot, { backgroundColor: med.taken ? theme.accent : theme.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.medName, med.taken && s.medNameTaken]}>{med.name}</Text>
                <Text style={s.medTime}>{med.time}</Text>
              </View>
              <Ionicons name={med.taken ? 'checkmark-circle' : 'time-outline'} size={20} color={med.taken ? theme.accent : theme.warning} />
            </View>
          ))
        )}
        {medicines.length > 3 && (
          <Text style={s.moreLink}>+{medicines.length - 3} ilaç daha...</Text>
        )}
      </View>

      {/* Health Tip */}
      <View style={s.tipCard}>
        <View style={s.tipHeader}>
          <Ionicons name="bulb" size={18} color={theme.warning} />
          <Text style={s.tipBadge}>Günün İpucu</Text>
        </View>
        <Ionicons name={todayTip.icon} size={32} color={theme.text} style={{ marginBottom: 8 }} />
        <Text style={s.tipText}>{todayTip.tip}</Text>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  header: {
    backgroundColor: theme.primary,
    padding: 24, paddingTop: 50, paddingBottom: 32,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  greetingText: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  userName: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 2 },
  themeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  dateText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  dayText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' },

  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: theme.text,
    marginHorizontal: 16, marginTop: 20, marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginTop: 8 },
  summaryLabel: { fontSize: 13, color: theme.textSecondary, marginTop: 4, marginBottom: 10 },
  miniProgress: { width: '100%', height: 6, backgroundColor: theme.surface, borderRadius: 3 },
  miniProgressFill: { height: 6, borderRadius: 3 },

  calorieCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 16,
    elevation: 2, borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
  },
  calorieProgress: { height: 8, backgroundColor: theme.surface, borderRadius: 4, marginTop: 12 },
  progressFillCal: { height: 8, borderRadius: 4, backgroundColor: theme.warning },
  calorieHint: { fontSize: 12, color: theme.textMuted, marginTop: 6 },

  waterCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 16,
    elevation: 2, borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
  },
  waterCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  waterCardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  waterCardSub: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  waterBadge: { backgroundColor: theme.primaryLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  waterBadgeText: { fontSize: 14, fontWeight: 'bold', color: theme.primary },
  waterGlasses: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterGlass: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center',
  },
  waterGlassFull: { backgroundColor: theme.primaryLight },
  moreText: { fontSize: 12, color: theme.textMuted, fontWeight: '600' },

  medsCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 12,
    elevation: 2, borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
  },
  medsCardTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  emptyMeds: { alignItems: 'center', paddingVertical: 16 },
  emptyMedsText: { fontSize: 14, color: theme.textMuted, marginTop: 8 },
  medItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
  },
  medDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  medName: { fontSize: 16, fontWeight: '600', color: theme.text },
  medNameTaken: { textDecorationLine: 'line-through', color: theme.textMuted },
  medTime: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
  moreLink: { fontSize: 13, color: theme.primary, textAlign: 'center', marginTop: 12 },

  tipCard: {
    backgroundColor: theme.warningLight, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 12,
    borderWidth: 1, borderColor: theme.dark ? theme.cardBorder : '#FFE082',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  tipBadge: { fontSize: 13, fontWeight: 'bold', color: theme.warning },
  tipText: { fontSize: 15, color: theme.text, lineHeight: 22 },
});
