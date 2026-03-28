import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { getWaterData, getWaterGoal, getMedicines, getActiveProfileName, getCalorieData, getCalorieGoal } from '../storage';

export default function StatisticsScreen() {
  const { theme } = useTheme();
  const [profileName, setProfileName] = useState('');
  const [waterGoal, setWaterGoal] = useState(8);
  const [weekWater, setWeekWater] = useState([]);
  const [todayMeds, setTodayMeds] = useState({ taken: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [totalWater, setTotalWater] = useState(0);
  const [weekCalories, setWeekCalories] = useState([]);
  const [calorieGoal, setCalorieGoalState] = useState(2000);

  useFocusEffect(
    useCallback(() => { loadStats(); }, [])
  );

  const loadStats = async () => {
    const name = await getActiveProfileName();
    setProfileName(name);
    const goal = await getWaterGoal();
    setWaterGoal(goal);

    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const data = [];
    let streakCount = 0;
    let total = 0;
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = await getWaterData(date.toDateString());
      data.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        count,
        isToday: i === 0,
      });
      total += count;
    }

    // Calculate streak from today backwards
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i].count >= goal) {
        streakCount++;
      } else {
        break;
      }
    }

    setWeekWater(data);
    setStreak(streakCount);
    setTotalWater(total);

    const meds = await getMedicines();
    setTodayMeds({ taken: meds.filter(m => m.taken).length, total: meds.length });

    // Calorie data
    const cGoal = await getCalorieGoal();
    setCalorieGoalState(cGoal);
    const calWeek = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const calData = await getCalorieData(date.toDateString());
      const dayCal = calData.reduce((s, m) => s + m.cal, 0);
      calWeek.push({ day: dayNames[date.getDay()], cal: dayCal, isToday: i === 0 });
    }
    setWeekCalories(calWeek);
  };

  const avgWater = weekWater.length > 0 ? (totalWater / 7).toFixed(1) : 0;
  const bestDay = weekWater.length > 0 ? Math.max(...weekWater.map(d => d.count)) : 0;
  const s = getStyles(theme);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Profile Badge */}
      <View style={s.profileBadge}>
        <Ionicons name="person-circle" size={20} color={theme.primary} />
        <Text style={s.profileText}>{profileName} profili</Text>
      </View>

      {/* Stat Cards Row */}
      <View style={s.statRow}>
        <View style={[s.statCard, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="flame" size={24} color={theme.primary} />
          <Text style={s.statValue}>{streak}</Text>
          <Text style={s.statLabel}>Gün Seri</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="trending-up" size={24} color={theme.accent} />
          <Text style={s.statValue}>{avgWater}</Text>
          <Text style={s.statLabel}>Ort. Bardak</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: theme.purpleLight }]}>
          <Ionicons name="trophy" size={24} color={theme.purple} />
          <Text style={s.statValue}>{bestDay}</Text>
          <Text style={s.statLabel}>En İyi Gün</Text>
        </View>
      </View>

      {/* Weekly Water Chart */}
      <View style={s.chartCard}>
        <View style={s.chartHeader}>
          <Text style={s.chartTitle}>Haftalık Su Tüketimi</Text>
          <View style={s.goalBadge}>
            <Ionicons name="flag" size={14} color={theme.primary} />
            <Text style={s.goalText}>Hedef: {waterGoal}</Text>
          </View>
        </View>
        <View style={s.chart}>
          {weekWater.map((d, i) => {
            const pct = waterGoal > 0 ? Math.min((d.count / waterGoal) * 100, 100) : 0;
            const hitGoal = d.count >= waterGoal;
            return (
              <View key={i} style={s.chartCol}>
                <Text style={s.chartValue}>{d.count}</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, {
                    height: `${pct}%`,
                    backgroundColor: d.isToday ? theme.primary : (hitGoal ? theme.accent : theme.primaryLight),
                  }]} />
                </View>
                <Text style={[s.chartDay, d.isToday && { color: theme.primary, fontWeight: 'bold' }]}>{d.day}</Text>
                <Text style={[s.chartDate, d.isToday && { color: theme.primary }]}>{d.date}</Text>
              </View>
            );
          })}
        </View>
        {/* Goal line label */}
        <View style={s.goalLine}>
          <View style={[s.goalDash, { backgroundColor: theme.danger }]} />
          <Text style={[s.goalLineText, { color: theme.danger }]}>Hedef çizgisi ({waterGoal} bardak)</Text>
        </View>
      </View>

      {/* Medicine Stats */}
      <View style={s.medsCard}>
        <Text style={s.chartTitle}>Bugünkü İlaç Durumu</Text>
        <View style={s.medsRow}>
          <View style={s.medsCircle}>
            <Text style={s.medsCircleValue}>
              {todayMeds.total > 0 ? Math.round((todayMeds.taken / todayMeds.total) * 100) : 0}%
            </Text>
          </View>
          <View style={s.medsInfo}>
            <View style={s.medsInfoRow}>
              <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
              <Text style={s.medsInfoText}>{todayMeds.taken} ilaç alındı</Text>
            </View>
            <View style={s.medsInfoRow}>
              <Ionicons name="time" size={18} color={theme.warning} />
              <Text style={s.medsInfoText}>{todayMeds.total - todayMeds.taken} ilaç bekliyor</Text>
            </View>
            <View style={s.medsInfoRow}>
              <Ionicons name="medical" size={18} color={theme.purple} />
              <Text style={s.medsInfoText}>{todayMeds.total} toplam ilaç</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Calorie Chart */}
      <View style={s.chartCard}>
        <View style={s.chartHeader}>
          <Text style={s.chartTitle}>Haftalık Kalori</Text>
          <View style={s.goalBadge}>
            <Ionicons name="flame" size={14} color={theme.warning} />
            <Text style={[s.goalText, { color: theme.warning }]}>Hedef: {calorieGoal}</Text>
          </View>
        </View>
        <View style={s.chart}>
          {weekCalories.map((d, i) => {
            const pct = calorieGoal > 0 ? Math.min((d.cal / calorieGoal) * 100, 100) : 0;
            return (
              <View key={i} style={s.chartCol}>
                <Text style={s.chartValue}>{d.cal > 0 ? d.cal : '-'}</Text>
                <View style={s.barBg}>
                  <View style={[s.barFill, {
                    height: `${pct}%`,
                    backgroundColor: d.isToday ? theme.warning : (d.cal >= calorieGoal ? theme.danger : theme.warningLight.replace ? theme.warning + '60' : theme.warning),
                  }]} />
                </View>
                <Text style={[s.chartDay, d.isToday && { color: theme.warning, fontWeight: 'bold' }]}>{d.day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Achievements */}
      <View style={s.achieveCard}>
        <Text style={s.chartTitle}>Başarılar</Text>
        <View style={s.achieveRow}>
          <View style={[s.achieveItem, streak >= 1 && s.achieveUnlocked]}>
            <Ionicons name="water" size={28} color={streak >= 1 ? '#2196F3' : theme.textMuted} />
            <Text style={[s.achieveLabel, streak >= 1 && { color: theme.text }]}>İlk Gün</Text>
          </View>
          <View style={[s.achieveItem, streak >= 3 && s.achieveUnlocked]}>
            <Ionicons name="flame" size={28} color={streak >= 3 ? '#FF9800' : theme.textMuted} />
            <Text style={[s.achieveLabel, streak >= 3 && { color: theme.text }]}>3 Gün Seri</Text>
          </View>
          <View style={[s.achieveItem, streak >= 7 && s.achieveUnlocked]}>
            <Ionicons name="trophy" size={28} color={streak >= 7 ? '#FFD700' : theme.textMuted} />
            <Text style={[s.achieveLabel, streak >= 7 && { color: theme.text }]}>Hafta Şampiyonu</Text>
          </View>
          <View style={[s.achieveItem, totalWater >= 56 && s.achieveUnlocked]}>
            <Ionicons name="diamond" size={28} color={totalWater >= 56 ? '#9C27B0' : theme.textMuted} />
            <Text style={[s.achieveLabel, totalWater >= 56 && { color: theme.text }]}>Su Ustası</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'center', backgroundColor: theme.primaryLight,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 12,
  },
  profileText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginTop: 6 },
  statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },

  chartCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 16,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
    elevation: theme.dark ? 0 : 2,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  goalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  goalText: { fontSize: 12, fontWeight: '600', color: theme.primary },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  chartCol: { alignItems: 'center', flex: 1 },
  chartValue: { fontSize: 11, fontWeight: '600', color: theme.textMuted, marginBottom: 4 },
  barBg: { width: 28, height: 100, backgroundColor: theme.surface, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 8 },
  chartDay: { fontSize: 11, color: theme.textMuted, marginTop: 6 },
  chartDate: { fontSize: 10, color: theme.textMuted },
  goalLine: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  goalDash: { width: 16, height: 2, borderRadius: 1 },
  goalLineText: { fontSize: 11 },

  medsCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 16,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
    elevation: theme.dark ? 0 : 2,
  },
  medsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 20 },
  medsCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.accentLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.accent,
  },
  medsCircleValue: { fontSize: 20, fontWeight: 'bold', color: theme.accent },
  medsInfo: { flex: 1, gap: 8 },
  medsInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medsInfoText: { fontSize: 14, color: theme.text },

  achieveCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginTop: 16,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
    elevation: theme.dark ? 0 : 2,
  },
  achieveRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  achieveItem: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 14,
    backgroundColor: theme.surface, opacity: 0.5,
  },
  achieveUnlocked: { opacity: 1, backgroundColor: theme.primaryLight },
  achieveLabel: { fontSize: 10, color: theme.textMuted, marginTop: 6, textAlign: 'center' },
});
