import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Dimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { getCalorieData, saveCalorieData, getCalorieGoal, setCalorieGoal, getGender, setGender } from '../storage';

const { width } = Dimensions.get('window');

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Kahvaltı', icon: 'sunny-outline', color: '#FF9800' },
  { key: 'lunch', label: 'Öğle Yemeği', icon: 'restaurant-outline', color: '#4CAF50' },
  { key: 'dinner', label: 'Akşam Yemeği', icon: 'moon-outline', color: '#2196F3' },
  { key: 'snack', label: 'Atıştırmalık', icon: 'cafe-outline', color: '#9C27B0' },
];

// p=protein(g), c=carb(g), f=fat(g)
const FOOD_DATABASE = [
  // ─── KAHVALTI ─────────────────────────────────
  { name: 'Yumurta (haşlanmış)', cal: 78, p: 6, c: 1, f: 5, icon: 'egg-outline', category: 'breakfast' },
  { name: 'Yumurta (sahanda)', cal: 120, p: 7, c: 1, f: 9, icon: 'egg-outline', category: 'breakfast' },
  { name: 'Menemen (1 porsiyon)', cal: 220, p: 12, c: 10, f: 15, icon: 'flame-outline', category: 'breakfast' },
  { name: 'Beyaz peynir (30g)', cal: 80, p: 5, c: 1, f: 6, icon: 'cube-outline', category: 'breakfast' },
  { name: 'Kaşar peyniri (30g)', cal: 110, p: 7, c: 0, f: 9, icon: 'cube-outline', category: 'breakfast' },
  { name: 'Tulum peyniri (30g)', cal: 90, p: 6, c: 0, f: 7, icon: 'cube-outline', category: 'breakfast' },
  { name: 'Zeytin (5 adet)', cal: 25, p: 0, c: 1, f: 2, icon: 'ellipse-outline', category: 'breakfast' },
  { name: 'Domates (1 adet)', cal: 22, p: 1, c: 5, f: 0, icon: 'nutrition-outline', category: 'breakfast' },
  { name: 'Salatalık (1 adet)', cal: 16, p: 1, c: 3, f: 0, icon: 'leaf-outline', category: 'breakfast' },
  { name: 'Bal (1 yemek k.)', cal: 64, p: 0, c: 17, f: 0, icon: 'water-outline', category: 'breakfast' },
  { name: 'Tereyağı (10g)', cal: 72, p: 0, c: 0, f: 8, icon: 'square-outline', category: 'breakfast' },
  { name: 'Reçel (1 yemek k.)', cal: 50, p: 0, c: 13, f: 0, icon: 'color-fill-outline', category: 'breakfast' },
  { name: 'Simit', cal: 280, p: 8, c: 48, f: 6, icon: 'radio-button-on-outline', category: 'breakfast' },
  { name: 'Poğaça', cal: 320, p: 6, c: 36, f: 17, icon: 'pie-chart-outline', category: 'breakfast' },
  { name: 'Ekmek (1 dilim)', cal: 80, p: 3, c: 15, f: 1, icon: 'reader-outline', category: 'breakfast' },
  { name: 'Tam buğday ekmek', cal: 70, p: 3, c: 12, f: 1, icon: 'reader-outline', category: 'breakfast' },
  { name: 'Börek (1 dilim)', cal: 250, p: 8, c: 24, f: 14, icon: 'layers-outline', category: 'breakfast' },
  { name: 'Sucuk (2 dilim)', cal: 140, p: 7, c: 1, f: 12, icon: 'ellipsis-horizontal-outline', category: 'breakfast' },
  { name: 'Çay (1 bardak)', cal: 2, p: 0, c: 0, f: 0, icon: 'cafe-outline', category: 'breakfast' },
  { name: 'Süt (1 bardak)', cal: 120, p: 6, c: 9, f: 6, icon: 'pint-outline', category: 'breakfast' },
  { name: 'Taze portakal suyu', cal: 112, p: 2, c: 26, f: 0, icon: 'pint-outline', category: 'breakfast' },

  // ─── ÖĞLE YEMEĞİ ─────────────────────────────
  { name: 'Mercimek çorbası', cal: 140, p: 9, c: 20, f: 3, icon: 'water-outline', category: 'lunch' },
  { name: 'Ezogelin çorbası', cal: 130, p: 6, c: 22, f: 2, icon: 'water-outline', category: 'lunch' },
  { name: 'Tavuk çorbası', cal: 100, p: 8, c: 10, f: 3, icon: 'water-outline', category: 'lunch' },
  { name: 'Pilav (1 porsiyon)', cal: 210, p: 4, c: 42, f: 3, icon: 'restaurant-outline', category: 'lunch' },
  { name: 'Bulgur pilavı', cal: 180, p: 5, c: 34, f: 3, icon: 'restaurant-outline', category: 'lunch' },
  { name: 'Makarna (1 porsiyon)', cal: 250, p: 8, c: 44, f: 4, icon: 'restaurant-outline', category: 'lunch' },
  { name: 'Tavuk göğsü (ızgara)', cal: 165, p: 31, c: 0, f: 4, icon: 'fitness-outline', category: 'lunch' },
  { name: 'Tavuk döner (1 p.)', cal: 350, p: 25, c: 28, f: 16, icon: 'fast-food-outline', category: 'lunch' },
  { name: 'Et döner (1 porsiyon)', cal: 450, p: 28, c: 30, f: 24, icon: 'fast-food-outline', category: 'lunch' },
  { name: 'Kuru fasulye (1 p.)', cal: 190, p: 11, c: 28, f: 4, icon: 'leaf-outline', category: 'lunch' },
  { name: 'Nohut yemeği (1 p.)', cal: 200, p: 10, c: 30, f: 5, icon: 'leaf-outline', category: 'lunch' },
  { name: 'Karnıyarık (1 p.)', cal: 280, p: 14, c: 18, f: 18, icon: 'nutrition-outline', category: 'lunch' },
  { name: 'İmam bayıldı', cal: 180, p: 3, c: 14, f: 13, icon: 'nutrition-outline', category: 'lunch' },
  { name: 'Salata (1 tabak)', cal: 45, p: 2, c: 8, f: 1, icon: 'leaf-outline', category: 'lunch' },
  { name: 'Çoban salata', cal: 65, p: 2, c: 6, f: 4, icon: 'leaf-outline', category: 'lunch' },
  { name: 'Ayran (1 bardak)', cal: 66, p: 3, c: 5, f: 3, icon: 'pint-outline', category: 'lunch' },
  { name: 'Cacık (1 kase)', cal: 80, p: 4, c: 6, f: 4, icon: 'snow-outline', category: 'lunch' },
  { name: 'Lahmacun (1 adet)', cal: 270, p: 14, c: 32, f: 10, icon: 'pizza-outline', category: 'lunch' },
  { name: 'Pide (kuşbaşılı)', cal: 480, p: 24, c: 52, f: 18, icon: 'pizza-outline', category: 'lunch' },
  { name: 'Tost (kaşarlı)', cal: 320, p: 14, c: 30, f: 16, icon: 'fast-food-outline', category: 'lunch' },
  { name: 'Hamburger', cal: 500, p: 26, c: 40, f: 26, icon: 'fast-food-outline', category: 'lunch' },

  // ─── AKŞAM YEMEĞİ ────────────────────────────
  { name: 'Köfte (4 adet)', cal: 300, p: 24, c: 8, f: 20, icon: 'ellipse-outline', category: 'dinner' },
  { name: 'Izgara köfte (4 adet)', cal: 260, p: 26, c: 6, f: 15, icon: 'flame-outline', category: 'dinner' },
  { name: 'Adana kebap (1 p.)', cal: 380, p: 28, c: 4, f: 28, icon: 'flame-outline', category: 'dinner' },
  { name: 'Urfa kebap (1 p.)', cal: 350, p: 26, c: 4, f: 26, icon: 'flame-outline', category: 'dinner' },
  { name: 'Tavuk kanat (6 adet)', cal: 420, p: 30, c: 12, f: 28, icon: 'fitness-outline', category: 'dinner' },
  { name: 'Izgara balık (200g)', cal: 200, p: 34, c: 0, f: 7, icon: 'fish-outline', category: 'dinner' },
  { name: 'Somon (ızgara, 200g)', cal: 280, p: 36, c: 0, f: 14, icon: 'fish-outline', category: 'dinner' },
  { name: 'Sebze yemeği (1 p.)', cal: 120, p: 4, c: 16, f: 5, icon: 'leaf-outline', category: 'dinner' },
  { name: 'Zeytinyağlı fasulye', cal: 140, p: 4, c: 14, f: 8, icon: 'leaf-outline', category: 'dinner' },
  { name: 'Etli türlü (1 p.)', cal: 250, p: 16, c: 18, f: 13, icon: 'restaurant-outline', category: 'dinner' },
  { name: 'Mantı (1 porsiyon)', cal: 350, p: 14, c: 42, f: 14, icon: 'restaurant-outline', category: 'dinner' },
  { name: 'Kıymalı pide', cal: 450, p: 22, c: 48, f: 18, icon: 'pizza-outline', category: 'dinner' },
  { name: 'Çorba (1 kase)', cal: 100, p: 5, c: 14, f: 3, icon: 'water-outline', category: 'dinner' },
  { name: 'Yoğurt (1 kase)', cal: 90, p: 5, c: 7, f: 4, icon: 'snow-outline', category: 'dinner' },
  { name: 'Pirinç pilavı', cal: 210, p: 4, c: 42, f: 3, icon: 'restaurant-outline', category: 'dinner' },
  { name: 'Sarma/Dolma (5 adet)', cal: 220, p: 6, c: 28, f: 10, icon: 'layers-outline', category: 'dinner' },
  { name: 'Börek (su böreği)', cal: 300, p: 10, c: 30, f: 16, icon: 'layers-outline', category: 'dinner' },
  { name: 'Pizza (1 dilim)', cal: 270, p: 12, c: 30, f: 12, icon: 'pizza-outline', category: 'dinner' },

  // ─── ATIŞTIRMALIK ─────────────────────────────
  { name: 'Muz (1 adet)', cal: 105, p: 1, c: 27, f: 0, icon: 'nutrition-outline', category: 'snack' },
  { name: 'Elma (1 adet)', cal: 95, p: 0, c: 25, f: 0, icon: 'nutrition-outline', category: 'snack' },
  { name: 'Portakal (1 adet)', cal: 62, p: 1, c: 15, f: 0, icon: 'nutrition-outline', category: 'snack' },
  { name: 'Üzüm (1 salkım)', cal: 110, p: 1, c: 28, f: 0, icon: 'nutrition-outline', category: 'snack' },
  { name: 'Çilek (1 kase)', cal: 50, p: 1, c: 12, f: 0, icon: 'heart-outline', category: 'snack' },
  { name: 'Karpuz (1 dilim)', cal: 85, p: 2, c: 21, f: 0, icon: 'nutrition-outline', category: 'snack' },
  { name: 'Ceviz (30g)', cal: 185, p: 4, c: 4, f: 18, icon: 'leaf-outline', category: 'snack' },
  { name: 'Badem (30g)', cal: 170, p: 6, c: 6, f: 15, icon: 'leaf-outline', category: 'snack' },
  { name: 'Fındık (30g)', cal: 180, p: 4, c: 5, f: 17, icon: 'leaf-outline', category: 'snack' },
  { name: 'Kuru kayısı (5 adet)', cal: 80, p: 1, c: 20, f: 0, icon: 'sunny-outline', category: 'snack' },
  { name: 'Hurma (3 adet)', cal: 120, p: 1, c: 32, f: 0, icon: 'sunny-outline', category: 'snack' },
  { name: 'Yoğurt (meyveli)', cal: 150, p: 5, c: 24, f: 3, icon: 'snow-outline', category: 'snack' },
  { name: 'Bisküvi (3 adet)', cal: 120, p: 2, c: 18, f: 5, icon: 'grid-outline', category: 'snack' },
  { name: 'Çikolata (25g)', cal: 135, p: 2, c: 15, f: 8, icon: 'square-outline', category: 'snack' },
  { name: 'Dondurma (1 top)', cal: 140, p: 2, c: 18, f: 7, icon: 'snow-outline', category: 'snack' },
  { name: 'Kek (1 dilim)', cal: 250, p: 3, c: 36, f: 11, icon: 'cafe-outline', category: 'snack' },
  { name: 'Baklava (1 dilim)', cal: 320, p: 5, c: 38, f: 18, icon: 'layers-outline', category: 'snack' },
  { name: 'Sütlaç (1 kase)', cal: 200, p: 5, c: 34, f: 5, icon: 'snow-outline', category: 'snack' },
  { name: 'Türk kahvesi', cal: 8, p: 0, c: 1, f: 0, icon: 'cafe-outline', category: 'snack' },
  { name: 'Latte', cal: 180, p: 8, c: 18, f: 8, icon: 'cafe-outline', category: 'snack' },
  { name: 'Cappuccino', cal: 120, p: 6, c: 10, f: 6, icon: 'cafe-outline', category: 'snack' },
  { name: 'Meyve suyu (1 b.)', cal: 110, p: 1, c: 26, f: 0, icon: 'pint-outline', category: 'snack' },
  { name: 'Gazlı içecek (330ml)', cal: 140, p: 0, c: 36, f: 0, icon: 'pint-outline', category: 'snack' },
  { name: 'Protein bar', cal: 200, p: 20, c: 22, f: 6, icon: 'barbell-outline', category: 'snack' },
  { name: 'Gofret (1 adet)', cal: 160, p: 2, c: 20, f: 8, icon: 'grid-outline', category: 'snack' },
  { name: 'Patlamış mısır', cal: 100, p: 3, c: 20, f: 1, icon: 'ellipse-outline', category: 'snack' },
  { name: 'Cips (30g)', cal: 160, p: 2, c: 15, f: 10, icon: 'triangle-outline', category: 'snack' },
  { name: 'Kuru üzüm (30g)', cal: 90, p: 1, c: 22, f: 0, icon: 'ellipse-outline', category: 'snack' },
];

// Gender-based macro recommendations
const MACRO_GOALS = {
  male: { cal: 2500, p: 65, c: 325, f: 80 },
  female: { cal: 2000, p: 50, c: 260, f: 65 },
  default: { cal: 2000, p: 55, c: 275, f: 70 },
};

const MACRO_COLORS = { p: '#E91E63', c: '#FF9800', f: '#2196F3' };

export default function CalorieScreen() {
  const { theme } = useTheme();
  const [meals, setMeals] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [gender, setGenderState] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [searchText, setSearchText] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [customP, setCustomP] = useState('');
  const [customC, setCustomC] = useState('');
  const [customF, setCustomF] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [tempGoal, setTempGoal] = useState('2000');
  // Multi-select: { foodIndex: quantity }
  const [selectedFoods, setSelectedFoods] = useState({});

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    const data = await getCalorieData();
    setMeals(data);
    const g = await getCalorieGoal();
    setGoal(g);
    setTempGoal(String(g));
    const gen = await getGender();
    setGenderState(gen);
  };

  const toggleFood = (index) => {
    setSelectedFoods(prev => {
      const copy = { ...prev };
      if (copy[index] !== undefined) {
        delete copy[index];
      } else {
        copy[index] = 1;
      }
      return copy;
    });
  };

  const setFoodQty = (index, qty) => {
    const val = parseInt(qty) || 0;
    if (val <= 0) {
      setSelectedFoods(prev => { const c = { ...prev }; delete c[index]; return c; });
    } else {
      setSelectedFoods(prev => ({ ...prev, [index]: Math.min(val, 20) }));
    }
  };

  const saveSelectedFoods = async () => {
    const entries = Object.entries(selectedFoods);
    if (entries.length === 0) return;
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const newItems = entries.map(([idx, qty]) => {
      const food = filteredFoods[parseInt(idx)];
      return {
        id: Date.now() + parseInt(idx),
        name: qty > 1 ? `${food.name} x${qty}` : food.name,
        cal: food.cal * qty,
        p: (food.p || 0) * qty,
        c: (food.c || 0) * qty,
        f: (food.f || 0) * qty,
        icon: food.icon || 'restaurant-outline',
        mealType: selectedMealType,
        time,
      };
    });
    const updated = [...meals, ...newItems];
    setMeals(updated);
    await saveCalorieData(updated);
    setSelectedFoods({});
    setModalVisible(false);
  };

  const addCustomFood = async () => {
    if (!customName || !customCal) return;
    const cal = parseInt(customCal);
    if (isNaN(cal) || cal <= 0) return;
    const entry = {
      id: Date.now(),
      name: customName,
      cal,
      p: parseInt(customP) || 0,
      c: parseInt(customC) || 0,
      f: parseInt(customF) || 0,
      icon: 'create-outline',
      mealType: selectedMealType,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...meals, entry];
    setMeals(updated);
    await saveCalorieData(updated);
    setCustomName(''); setCustomCal(''); setCustomP(''); setCustomC(''); setCustomF('');
    setShowCustom(false);
    setModalVisible(false);
  };

  const selectedCount = Object.keys(selectedFoods).length;
  const selectedTotalCal = Object.entries(selectedFoods).reduce((sum, [idx, qty]) => {
    const food = filteredFoods[parseInt(idx)];
    return food ? sum + food.cal * qty : sum;
  }, 0);

  const removeFood = async (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    await saveCalorieData(updated);
  };

  const saveGoalVal = async () => {
    const g = parseInt(tempGoal);
    if (!g || g < 500 || g > 5000) return;
    await setCalorieGoal(g);
    setGoal(g);
    setGoalModalVisible(false);
  };

  const selectGender = async (g) => {
    await setGender(g);
    setGenderState(g);
    const rec = MACRO_GOALS[g];
    setTempGoal(String(rec.cal));
    await setCalorieGoal(rec.cal);
    setGoal(rec.cal);
    setGenderModalVisible(false);
  };

  const totalCal = meals.reduce((sum, m) => sum + m.cal, 0);
  const totalP = meals.reduce((sum, m) => sum + (m.p || 0), 0);
  const totalC = meals.reduce((sum, m) => sum + (m.c || 0), 0);
  const totalF = meals.reduce((sum, m) => sum + (m.f || 0), 0);
  const percent = Math.min(Math.round((totalCal / goal) * 100), 100);
  const remaining = Math.max(goal - totalCal, 0);

  const macroGoals = MACRO_GOALS[gender] || MACRO_GOALS.default;

  const getMealCalories = (type) => meals.filter(m => m.mealType === type).reduce((s, m) => s + m.cal, 0);
  const getMealMacros = (type) => {
    const items = meals.filter(m => m.mealType === type);
    return {
      p: items.reduce((s, m) => s + (m.p || 0), 0),
      c: items.reduce((s, m) => s + (m.c || 0), 0),
      f: items.reduce((s, m) => s + (m.f || 0), 0),
    };
  };

  const filteredFoods = FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(searchText.toLowerCase())
  ).sort((a, b) => {
    if (a.category === selectedMealType && b.category !== selectedMealType) return -1;
    if (a.category !== selectedMealType && b.category === selectedMealType) return 1;
    return 0;
  });

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Buttons */}
        <View style={s.topRow}>
          <TouchableOpacity style={s.goalBtn} onPress={() => setGoalModalVisible(true)}>
            <Ionicons name="flag-outline" size={16} color={theme.primary} />
            <Text style={s.goalBtnText}>Hedef: {goal} kcal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.goalBtn, { backgroundColor: gender === 'male' ? '#E3F2FD' : gender === 'female' ? '#FCE4EC' : theme.primaryLight }]} onPress={() => setGenderModalVisible(true)}>
            <Ionicons name={gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'person-outline'} size={16} color={gender === 'male' ? '#1976D2' : gender === 'female' ? '#C2185B' : theme.primary} />
            <Text style={[s.goalBtnText, { color: gender === 'male' ? '#1976D2' : gender === 'female' ? '#C2185B' : theme.primary }]}>
              {gender === 'male' ? 'Erkek' : gender === 'female' ? 'Kadın' : 'Cinsiyet'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Circular Summary */}
        <View style={s.summaryContainer}>
          <View style={s.circle}>
            <Ionicons name="flame" size={28} color={totalCal > goal ? theme.danger : theme.primary} />
            <Text style={[s.circleValue, totalCal > goal && { color: theme.danger }]}>{totalCal}</Text>
            <Text style={s.circleLabel}>/ {goal} kcal</Text>
          </View>
          <View style={s.summaryCards}>
            <View style={s.summaryItem}>
              <Text style={s.summaryItemValue}>{remaining}</Text>
              <Text style={s.summaryItemLabel}>Kalan</Text>
            </View>
            <View style={[s.summaryDivider, { backgroundColor: theme.cardBorder }]} />
            <View style={s.summaryItem}>
              <Text style={s.summaryItemValue}>%{percent}</Text>
              <Text style={s.summaryItemLabel}>Tamamlanan</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={s.progressContainer}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, {
              width: `${percent}%`,
              backgroundColor: totalCal > goal ? theme.danger : theme.primary,
            }]} />
          </View>
          {totalCal > goal && (
            <Text style={s.overText}>Hedefi {totalCal - goal} kcal aştınız!</Text>
          )}
        </View>

        {/* Macro Nutrient Cards */}
        <View style={s.macroSection}>
          <Text style={s.sectionTitle}>Makro Besinler</Text>
          <View style={s.macroRow}>
            {/* Protein */}
            <View style={s.macroCard}>
              <View style={[s.macroIconBg, { backgroundColor: MACRO_COLORS.p + '18' }]}>
                <Ionicons name="fitness-outline" size={20} color={MACRO_COLORS.p} />
              </View>
              <Text style={s.macroName}>Protein</Text>
              <Text style={[s.macroValue, { color: MACRO_COLORS.p }]}>{totalP}g</Text>
              <View style={s.macroBarBg}>
                <View style={[s.macroBarFill, { width: `${Math.min((totalP / macroGoals.p) * 100, 100)}%`, backgroundColor: MACRO_COLORS.p }]} />
              </View>
              <Text style={s.macroGoal}>/ {macroGoals.p}g</Text>
            </View>
            {/* Carbs */}
            <View style={s.macroCard}>
              <View style={[s.macroIconBg, { backgroundColor: MACRO_COLORS.c + '18' }]}>
                <Ionicons name="flash-outline" size={20} color={MACRO_COLORS.c} />
              </View>
              <Text style={s.macroName}>Karbonhidrat</Text>
              <Text style={[s.macroValue, { color: MACRO_COLORS.c }]}>{totalC}g</Text>
              <View style={s.macroBarBg}>
                <View style={[s.macroBarFill, { width: `${Math.min((totalC / macroGoals.c) * 100, 100)}%`, backgroundColor: MACRO_COLORS.c }]} />
              </View>
              <Text style={s.macroGoal}>/ {macroGoals.c}g</Text>
            </View>
            {/* Fat */}
            <View style={s.macroCard}>
              <View style={[s.macroIconBg, { backgroundColor: MACRO_COLORS.f + '18' }]}>
                <Ionicons name="water-outline" size={20} color={MACRO_COLORS.f} />
              </View>
              <Text style={s.macroName}>Yağ</Text>
              <Text style={[s.macroValue, { color: MACRO_COLORS.f }]}>{totalF}g</Text>
              <View style={s.macroBarBg}>
                <View style={[s.macroBarFill, { width: `${Math.min((totalF / macroGoals.f) * 100, 100)}%`, backgroundColor: MACRO_COLORS.f }]} />
              </View>
              <Text style={s.macroGoal}>/ {macroGoals.f}g</Text>
            </View>
          </View>
        </View>

        {/* Meal Type Cards */}
        <Text style={s.sectionTitle}>Öğünler</Text>
        {MEAL_TYPES.map(type => {
          const mealItems = meals.filter(m => m.mealType === type.key);
          const mealCal = getMealCalories(type.key);
          const mealMacros = getMealMacros(type.key);
          return (
            <View key={type.key} style={s.mealCard}>
              <TouchableOpacity
                style={s.mealHeader}
                onPress={() => { setSelectedMealType(type.key); setSelectedFoods({}); setModalVisible(true); setSearchText(''); setShowCustom(false); }}
                activeOpacity={0.7}
              >
                <View style={[s.mealIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon} size={22} color={type.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.mealLabel}>{type.label}</Text>
                  <Text style={s.mealCal}>{mealCal} kcal</Text>
                  {mealItems.length > 0 && (
                    <View style={s.mealMacroRow}>
                      <Text style={[s.mealMacroText, { color: MACRO_COLORS.p }]}>P:{mealMacros.p}g</Text>
                      <Text style={[s.mealMacroText, { color: MACRO_COLORS.c }]}>K:{mealMacros.c}g</Text>
                      <Text style={[s.mealMacroText, { color: MACRO_COLORS.f }]}>Y:{mealMacros.f}g</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[s.addMealBtn, { backgroundColor: type.color }]}
                  onPress={() => { setSelectedMealType(type.key); setSelectedFoods({}); setModalVisible(true); setSearchText(''); setShowCustom(false); }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
              {mealItems.length > 0 && (
                <View style={s.mealItems}>
                  {mealItems.map(item => (
                    <View key={item.id} style={s.mealItemRow}>
                      <View style={[s.mealItemIcon, { backgroundColor: type.color + '15' }]}>
                        <Ionicons name={item.icon || 'restaurant-outline'} size={16} color={type.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.mealItemName}>{item.name}</Text>
                        <View style={s.mealItemMacroRow}>
                          <Text style={s.mealItemTime}>{item.time}</Text>
                          {(item.p > 0 || item.c > 0 || item.f > 0) && (
                            <Text style={s.mealItemMacro}>P:{item.p || 0} K:{item.c || 0} Y:{item.f || 0}</Text>
                          )}
                        </View>
                      </View>
                      <Text style={s.mealItemCal}>{item.cal}</Text>
                      <TouchableOpacity onPress={() => removeFood(item.id)} style={s.removeItemBtn}>
                        <Ionicons name="close-circle" size={20} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Food Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {MEAL_TYPES.find(t => t.key === selectedMealType)?.label} Ekle
            </Text>

            <View style={s.searchBar}>
              <Ionicons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Yiyecek ara..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={theme.textMuted}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                  <Ionicons name="close-circle" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {!searchText && (
              <View style={s.categoryHint}>
                <Ionicons name="star" size={14} color={MEAL_TYPES.find(t => t.key === selectedMealType)?.color} />
                <Text style={s.categoryHintText}>
                  {MEAL_TYPES.find(t => t.key === selectedMealType)?.label} önerileri önce gösteriliyor
                </Text>
              </View>
            )}

            <ScrollView style={s.foodList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredFoods.map((food, i) => {
                const isRecommended = food.category === selectedMealType;
                const isSelected = selectedFoods[i] !== undefined;
                const qty = selectedFoods[i] || 0;
                return (
                  <TouchableOpacity key={i} style={[s.foodItem, isRecommended && s.foodItemRecommended, isSelected && s.foodItemSelected]} onPress={() => toggleFood(i)} activeOpacity={0.7}>
                    <View style={[s.checkBox, isSelected && s.checkBoxActive]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={[s.foodIcon, { backgroundColor: (MEAL_TYPES.find(t => t.key === food.category)?.color || '#999') + '18' }]}>
                      <Ionicons name={food.icon} size={18} color={MEAL_TYPES.find(t => t.key === food.category)?.color || '#999'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.foodName}>{food.name}</Text>
                      <Text style={s.foodMacro}>P:{food.p}g  K:{food.c}g  Y:{food.f}g</Text>
                    </View>
                    <Text style={s.foodCal}>{food.cal} kcal</Text>
                    {isSelected && (
                      <View style={s.qtyContainer}>
                        <TouchableOpacity style={s.qtyBtn} onPress={() => setFoodQty(i, qty - 1)}>
                          <Ionicons name="remove" size={16} color={theme.primary} />
                        </TouchableOpacity>
                        <Text style={s.qtyText}>{qty}</Text>
                        <TouchableOpacity style={s.qtyBtn} onPress={() => setFoodQty(i, qty + 1)}>
                          <Ionicons name="add" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {filteredFoods.length === 0 && (
                <Text style={s.noResult}>Sonuç bulunamadı</Text>
              )}
            </ScrollView>

            {/* Selected summary bar */}
            {selectedCount > 0 && (
              <View style={s.selectionBar}>
                <Text style={s.selectionText}>{selectedCount} öğe seçildi  •  {selectedTotalCal} kcal</Text>
                <TouchableOpacity style={s.saveSelectedBtn} onPress={saveSelectedFoods} activeOpacity={0.7}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={s.saveSelectedText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={s.customToggle} onPress={() => setShowCustom(!showCustom)}>
              <Ionicons name={showCustom ? 'chevron-up' : 'add-circle-outline'} size={20} color={theme.primary} />
              <Text style={s.customToggleText}>Elle giriş yap</Text>
            </TouchableOpacity>

            {showCustom && (
              <View style={s.customForm}>
                <TextInput style={s.input} placeholder="Yiyecek adı" value={customName} onChangeText={setCustomName} placeholderTextColor={theme.textMuted} />
                <View style={s.customRow}>
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Kalori" value={customCal} onChangeText={setCustomCal} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Protein (g)" value={customP} onChangeText={setCustomP} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                </View>
                <View style={s.customRow}>
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Karb. (g)" value={customC} onChangeText={setCustomC} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Yağ (g)" value={customF} onChangeText={setCustomF} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                  <TouchableOpacity style={[s.customAddBtn, (!customName || !customCal) && { backgroundColor: theme.surface }]} onPress={addCustomFood} disabled={!customName || !customCal}>
                    <Text style={s.customAddText}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={s.cancelBtn} onPress={() => { setSelectedFoods({}); setModalVisible(false); }}>
              <Text style={s.cancelBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Goal Modal */}
      <Modal visible={goalModalVisible} transparent animationType="fade">
        <View style={s.goalModalOverlay}>
          <View style={s.goalModal}>
            <Text style={s.goalModalTitle}>Kalori Hedefi</Text>
            <Text style={s.goalModalSub}>Günlük kalori hedefinizi belirleyin</Text>
            <View style={s.goalInputRow}>
              <TouchableOpacity style={s.goalAdjBtn} onPress={() => setTempGoal(String(Math.max(500, parseInt(tempGoal || '500') - 100)))}>
                <Ionicons name="remove" size={22} color={theme.primary} />
              </TouchableOpacity>
              <TextInput style={s.goalInput} value={tempGoal} onChangeText={setTempGoal} keyboardType="number-pad" maxLength={4} />
              <TouchableOpacity style={s.goalAdjBtn} onPress={() => setTempGoal(String(Math.min(5000, parseInt(tempGoal || '0') + 100)))}>
                <Ionicons name="add" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
            <Text style={s.goalHint}>
              {gender === 'male' ? 'Erkek önerilen: 2200-2800 kcal' : gender === 'female' ? 'Kadın önerilen: 1800-2200 kcal' : 'Önerilen: Kadın 1800-2200 / Erkek 2200-2800 kcal'}
            </Text>
            <TouchableOpacity style={s.saveBtn} onPress={saveGoalVal}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setGoalModalVisible(false)}>
              <Text style={s.cancelBtnText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Gender Modal */}
      <Modal visible={genderModalVisible} transparent animationType="fade">
        <View style={s.goalModalOverlay}>
          <View style={s.goalModal}>
            <Text style={s.goalModalTitle}>Cinsiyet Seçin</Text>
            <Text style={s.goalModalSub}>Makro besin hedefleriniz buna göre ayarlanacak</Text>

            <TouchableOpacity style={[s.genderBtn, gender === 'male' && s.genderBtnActive]} onPress={() => selectGender('male')}>
              <Ionicons name="male" size={24} color={gender === 'male' ? '#fff' : '#1976D2'} />
              <View style={{ flex: 1 }}>
                <Text style={[s.genderBtnTitle, gender === 'male' && { color: '#fff' }]}>Erkek</Text>
                <Text style={[s.genderBtnSub, gender === 'male' && { color: 'rgba(255,255,255,0.8)' }]}>2500 kcal | P:65g K:325g Y:80g</Text>
              </View>
              {gender === 'male' && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity style={[s.genderBtn, s.genderBtnFemale, gender === 'female' && s.genderBtnFemaleActive]} onPress={() => selectGender('female')}>
              <Ionicons name="female" size={24} color={gender === 'female' ? '#fff' : '#C2185B'} />
              <View style={{ flex: 1 }}>
                <Text style={[s.genderBtnTitle, gender === 'female' && { color: '#fff' }]}>Kadın</Text>
                <Text style={[s.genderBtnSub, gender === 'female' && { color: 'rgba(255,255,255,0.8)' }]}>2000 kcal | P:50g K:260g Y:65g</Text>
              </View>
              {gender === 'female' && <Ionicons name="checkmark-circle" size={22} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setGenderModalVisible(false)}>
              <Text style={s.cancelBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },

  topRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 12, paddingHorizontal: 16 },
  goalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.primaryLight, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  goalBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  summaryContainer: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  circle: {
    width: width * 0.38, height: width * 0.38, borderRadius: width * 0.19,
    backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.primary,
  },
  circleValue: { fontSize: 30, fontWeight: 'bold', color: theme.primary, marginTop: 2 },
  circleLabel: { fontSize: 12, color: theme.textSecondary },
  summaryCards: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 24 },
  summaryItem: { alignItems: 'center' },
  summaryItemValue: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  summaryItemLabel: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 28 },

  progressContainer: { paddingHorizontal: 24, marginTop: 10 },
  progressBar: { height: 8, backgroundColor: theme.surface, borderRadius: 4 },
  progressFill: { height: 8, borderRadius: 4 },
  overText: { fontSize: 12, color: theme.danger, textAlign: 'center', marginTop: 6, fontWeight: '600' },

  // Macro section
  macroSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  macroRow: { flexDirection: 'row', gap: 10 },
  macroCard: {
    flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
  },
  macroIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  macroName: { fontSize: 11, color: theme.textMuted, fontWeight: '600' },
  macroValue: { fontSize: 20, fontWeight: 'bold', marginTop: 2 },
  macroBarBg: { width: '100%', height: 5, backgroundColor: theme.surface, borderRadius: 3, marginTop: 6 },
  macroBarFill: { height: 5, borderRadius: 3 },
  macroGoal: { fontSize: 10, color: theme.textMuted, marginTop: 3 },

  mealCard: {
    backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 10,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
    overflow: 'hidden',
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  mealIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  mealCal: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  mealMacroRow: { flexDirection: 'row', gap: 8, marginTop: 3 },
  mealMacroText: { fontSize: 11, fontWeight: '600' },
  addMealBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  mealItems: { borderTopWidth: 1, borderTopColor: theme.cardBorder },
  mealItemRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder, gap: 10,
  },
  mealItemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  mealItemName: { fontSize: 14, color: theme.text },
  mealItemMacroRow: { flexDirection: 'row', gap: 8, marginTop: 2, alignItems: 'center' },
  mealItemTime: { fontSize: 11, color: theme.textMuted },
  mealItemMacro: { fontSize: 10, color: theme.textSecondary, fontWeight: '500' },
  mealItemCal: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginRight: 4 },
  removeItemBtn: { padding: 4 },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingTop: 12, maxHeight: '85%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.surface, alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.inputBorder,
    paddingHorizontal: 14, marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.text },

  categoryHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 4, marginBottom: 4 },
  categoryHintText: { fontSize: 12, color: theme.textMuted, fontStyle: 'italic' },

  foodList: { maxHeight: 280 },
  foodItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 4, gap: 10,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
  },
  foodItemRecommended: {
    backgroundColor: theme.primaryLight + '40',
    borderRadius: 10, marginHorizontal: -4, paddingHorizontal: 8,
  },
  foodItemSelected: {
    backgroundColor: theme.primary + '12',
    borderRadius: 10, marginHorizontal: -4, paddingHorizontal: 8,
  },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: theme.textMuted, alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: {
    backgroundColor: theme.primary, borderColor: theme.primary,
  },
  qtyContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.surface, borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2,
    marginLeft: 6,
  },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: 'bold', color: theme.text, minWidth: 20, textAlign: 'center' },
  selectionBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  selectionText: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  saveSelectedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
  },
  saveSelectedText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  foodIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  foodName: { fontSize: 14, color: theme.text },
  foodMacro: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  foodCal: { fontSize: 14, fontWeight: '600', color: theme.primary },
  noResult: { textAlign: 'center', color: theme.textMuted, paddingVertical: 20, fontSize: 14 },

  customToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  customToggleText: { fontSize: 15, fontWeight: '600', color: theme.primary },
  customForm: { gap: 8, marginBottom: 8 },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12,
    padding: 10, fontSize: 14, backgroundColor: theme.inputBg, color: theme.text,
  },
  customAddBtn: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
  },
  customAddText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16 },

  goalModalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' },
  goalModal: { backgroundColor: theme.card, borderRadius: 24, padding: 28, width: width - 48, alignItems: 'center' },
  goalModalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  goalModalSub: { fontSize: 14, color: theme.textSecondary, marginBottom: 20, textAlign: 'center' },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  goalAdjBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  goalInput: {
    width: 90, height: 56, borderRadius: 14, borderWidth: 2, borderColor: theme.primary,
    textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: theme.text, backgroundColor: theme.inputBg,
  },
  goalHint: { fontSize: 11, color: theme.textMuted, marginTop: 12, marginBottom: 20, textAlign: 'center' },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingHorizontal: 48, paddingVertical: 14, marginBottom: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Gender modal
  genderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    backgroundColor: '#E3F2FD', borderRadius: 16, padding: 16, marginBottom: 10,
  },
  genderBtnActive: { backgroundColor: '#1976D2' },
  genderBtnFemale: { backgroundColor: '#FCE4EC' },
  genderBtnFemaleActive: { backgroundColor: '#C2185B' },
  genderBtnTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  genderBtnSub: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
});
