import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Dimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { getCalorieData, saveCalorieData, getCalorieGoal, setCalorieGoal } from '../storage';

const { width } = Dimensions.get('window');

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Kahvaltı', icon: 'sunny-outline', color: '#FF9800' },
  { key: 'lunch', label: 'Öğle Yemeği', icon: 'restaurant-outline', color: '#4CAF50' },
  { key: 'dinner', label: 'Akşam Yemeği', icon: 'moon-outline', color: '#2196F3' },
  { key: 'snack', label: 'Atıştırmalık', icon: 'cafe-outline', color: '#9C27B0' },
];

const FOOD_DATABASE = [
  { name: 'Yumurta (1 adet)', cal: 78, category: 'breakfast' },
  { name: 'Beyaz peynir (30g)', cal: 80, category: 'breakfast' },
  { name: 'Domates (1 adet)', cal: 22, category: 'breakfast' },
  { name: 'Salatalık (1 adet)', cal: 16, category: 'breakfast' },
  { name: 'Zeytin (5 adet)', cal: 25, category: 'breakfast' },
  { name: 'Ekmek (1 dilim)', cal: 80, category: 'breakfast' },
  { name: 'Bal (1 yemek k.)', cal: 64, category: 'breakfast' },
  { name: 'Çay (1 bardak)', cal: 2, category: 'breakfast' },
  { name: 'Simit', cal: 280, category: 'breakfast' },
  { name: 'Tavuk göğsü (150g)', cal: 165, category: 'lunch' },
  { name: 'Pilav (1 porsiyon)', cal: 210, category: 'lunch' },
  { name: 'Makarna (1 porsiyon)', cal: 250, category: 'lunch' },
  { name: 'Mercimek çorbası', cal: 140, category: 'lunch' },
  { name: 'Kuru fasulye (1 p.)', cal: 190, category: 'lunch' },
  { name: 'Salata (1 tabak)', cal: 45, category: 'lunch' },
  { name: 'Ayran (1 bardak)', cal: 66, category: 'lunch' },
  { name: 'Köfte (4 adet)', cal: 300, category: 'dinner' },
  { name: 'Kıymalı pide', cal: 450, category: 'dinner' },
  { name: 'Lahmacun', cal: 270, category: 'dinner' },
  { name: 'Izgara balık (200g)', cal: 200, category: 'dinner' },
  { name: 'Sebze yemeği (1 p.)', cal: 120, category: 'dinner' },
  { name: 'Çorba (1 kase)', cal: 100, category: 'dinner' },
  { name: 'Yoğurt (1 kase)', cal: 90, category: 'dinner' },
  { name: 'Muz (1 adet)', cal: 105, category: 'snack' },
  { name: 'Elma (1 adet)', cal: 95, category: 'snack' },
  { name: 'Ceviz (30g)', cal: 185, category: 'snack' },
  { name: 'Badem (30g)', cal: 170, category: 'snack' },
  { name: 'Bisküvi (3 adet)', cal: 120, category: 'snack' },
  { name: 'Çikolata (25g)', cal: 135, category: 'snack' },
  { name: 'Türk kahvesi', cal: 8, category: 'snack' },
  { name: 'Portakal suyu (1 b.)', cal: 110, category: 'snack' },
  { name: 'Tost', cal: 320, category: 'snack' },
];

export default function CalorieScreen() {
  const { theme } = useTheme();
  const [meals, setMeals] = useState([]);
  const [goal, setGoal] = useState(2000);
  const [modalVisible, setModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [searchText, setSearchText] = useState('');
  const [customName, setCustomName] = useState('');
  const [customCal, setCustomCal] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [tempGoal, setTempGoal] = useState('2000');

  useFocusEffect(
    useCallback(() => { loadData(); }, [])
  );

  const loadData = async () => {
    const data = await getCalorieData();
    setMeals(data);
    const g = await getCalorieGoal();
    setGoal(g);
    setTempGoal(String(g));
  };

  const addFood = async (food) => {
    const entry = {
      id: Date.now(),
      name: food.name,
      cal: food.cal,
      mealType: selectedMealType,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...meals, entry];
    setMeals(updated);
    await saveCalorieData(updated);
  };

  const addCustomFood = async () => {
    if (!customName || !customCal) return;
    const cal = parseInt(customCal);
    if (isNaN(cal) || cal <= 0) return;
    await addFood({ name: customName, cal });
    setCustomName('');
    setCustomCal('');
    setShowCustom(false);
    setModalVisible(false);
  };

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

  const totalCal = meals.reduce((sum, m) => sum + m.cal, 0);
  const percent = Math.min(Math.round((totalCal / goal) * 100), 100);
  const remaining = Math.max(goal - totalCal, 0);

  const getMealCalories = (type) => meals.filter(m => m.mealType === type).reduce((s, m) => s + m.cal, 0);

  const filteredFoods = FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Goal button */}
        <TouchableOpacity style={s.goalBtn} onPress={() => setGoalModalVisible(true)}>
          <Ionicons name="flag-outline" size={16} color={theme.primary} />
          <Text style={s.goalBtnText}>Hedef: {goal} kcal</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        </TouchableOpacity>

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

        {/* Meal Type Cards */}
        <Text style={s.sectionTitle}>Öğünler</Text>
        {MEAL_TYPES.map(type => {
          const mealItems = meals.filter(m => m.mealType === type.key);
          const mealCal = getMealCalories(type.key);
          return (
            <View key={type.key} style={s.mealCard}>
              <TouchableOpacity
                style={s.mealHeader}
                onPress={() => { setSelectedMealType(type.key); setModalVisible(true); setSearchText(''); setShowCustom(false); }}
                activeOpacity={0.7}
              >
                <View style={[s.mealIcon, { backgroundColor: type.color + '20' }]}>
                  <Ionicons name={type.icon} size={22} color={type.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.mealLabel}>{type.label}</Text>
                  <Text style={s.mealCal}>{mealCal} kcal</Text>
                </View>
                <TouchableOpacity
                  style={[s.addMealBtn, { backgroundColor: type.color }]}
                  onPress={() => { setSelectedMealType(type.key); setModalVisible(true); setSearchText(''); setShowCustom(false); }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
              {mealItems.length > 0 && (
                <View style={s.mealItems}>
                  {mealItems.map(item => (
                    <View key={item.id} style={s.mealItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.mealItemName}>{item.name}</Text>
                        <Text style={s.mealItemTime}>{item.time}</Text>
                      </View>
                      <Text style={s.mealItemCal}>{item.cal} kcal</Text>
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

            {/* Search */}
            <View style={s.searchBar}>
              <Ionicons name="search" size={20} color={theme.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Yiyecek ara..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={theme.textMuted}
              />
            </View>

            <ScrollView style={s.foodList} showsVerticalScrollIndicator={false}>
              {filteredFoods.map((food, i) => (
                <TouchableOpacity key={i} style={s.foodItem} onPress={() => { addFood(food); setModalVisible(false); }} activeOpacity={0.7}>
                  <Text style={s.foodName}>{food.name}</Text>
                  <Text style={s.foodCal}>{food.cal} kcal</Text>
                </TouchableOpacity>
              ))}
              {filteredFoods.length === 0 && (
                <Text style={s.noResult}>Sonuç bulunamadı</Text>
              )}
            </ScrollView>

            {/* Custom food toggle */}
            <TouchableOpacity style={s.customToggle} onPress={() => setShowCustom(!showCustom)}>
              <Ionicons name={showCustom ? 'chevron-up' : 'add-circle-outline'} size={20} color={theme.primary} />
              <Text style={s.customToggleText}>Elle giriş yap</Text>
            </TouchableOpacity>

            {showCustom && (
              <View style={s.customForm}>
                <TextInput style={s.input} placeholder="Yiyecek adı" value={customName} onChangeText={setCustomName} placeholderTextColor={theme.textMuted} />
                <View style={s.customRow}>
                  <TextInput style={[s.input, { flex: 1 }]} placeholder="Kalori (kcal)" value={customCal} onChangeText={setCustomCal} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                  <TouchableOpacity style={[s.customAddBtn, (!customName || !customCal) && { backgroundColor: theme.surface }]} onPress={addCustomFood} disabled={!customName || !customCal}>
                    <Text style={s.customAddText}>Ekle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
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
            <Text style={s.goalHint}>Önerilen: Kadın 1800-2200 / Erkek 2200-2800 kcal</Text>
            <TouchableOpacity style={s.saveBtn} onPress={saveGoalVal}>
              <Text style={s.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setGoalModalVisible(false)}>
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

  goalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
    backgroundColor: theme.primaryLight, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 12,
  },
  goalBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  summaryContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  circle: {
    width: width * 0.4, height: width * 0.4, borderRadius: width * 0.2,
    backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: theme.primary,
  },
  circleValue: { fontSize: 32, fontWeight: 'bold', color: theme.primary, marginTop: 2 },
  circleLabel: { fontSize: 13, color: theme.textSecondary },
  summaryCards: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 24,
  },
  summaryItem: { alignItems: 'center' },
  summaryItemValue: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  summaryItemLabel: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 30 },

  progressContainer: { paddingHorizontal: 24, marginTop: 12 },
  progressBar: { height: 10, backgroundColor: theme.surface, borderRadius: 5 },
  progressFill: { height: 10, borderRadius: 5 },
  overText: { fontSize: 12, color: theme.danger, textAlign: 'center', marginTop: 6, fontWeight: '600' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },

  mealCard: {
    backgroundColor: theme.card, borderRadius: 16, marginHorizontal: 16, marginBottom: 10,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
    overflow: 'hidden',
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  mealIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  mealCal: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  addMealBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  mealItems: { borderTopWidth: 1, borderTopColor: theme.cardBorder },
  mealItemRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
  },
  mealItemName: { fontSize: 14, color: theme.text },
  mealItemTime: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
  mealItemCal: { fontSize: 14, fontWeight: '600', color: theme.textSecondary, marginRight: 8 },
  removeItemBtn: { padding: 4 },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingTop: 12, maxHeight: '80%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.surface, alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.inputBg, borderRadius: 12, borderWidth: 1, borderColor: theme.inputBorder,
    paddingHorizontal: 14, marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: theme.text },

  foodList: { maxHeight: 250 },
  foodItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
  },
  foodName: { fontSize: 15, color: theme.text, flex: 1 },
  foodCal: { fontSize: 14, fontWeight: '600', color: theme.primary },
  noResult: { textAlign: 'center', color: theme.textMuted, paddingVertical: 20, fontSize: 14 },

  customToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  customToggleText: { fontSize: 15, fontWeight: '600', color: theme.primary },
  customForm: { gap: 10, marginBottom: 8 },
  customRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12,
    padding: 12, fontSize: 15, backgroundColor: theme.inputBg, color: theme.text,
  },
  customAddBtn: {
    backgroundColor: theme.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14,
  },
  customAddText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16 },

  goalModalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' },
  goalModal: { backgroundColor: theme.card, borderRadius: 24, padding: 28, width: width - 64, alignItems: 'center' },
  goalModalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  goalModalSub: { fontSize: 14, color: theme.textSecondary, marginBottom: 24 },
  goalInputRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  goalAdjBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  goalInput: {
    width: 90, height: 56, borderRadius: 14, borderWidth: 2, borderColor: theme.primary,
    textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: theme.text, backgroundColor: theme.inputBg,
  },
  goalHint: { fontSize: 11, color: theme.textMuted, marginTop: 12, marginBottom: 24, textAlign: 'center' },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, paddingHorizontal: 48, paddingVertical: 14, marginBottom: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
