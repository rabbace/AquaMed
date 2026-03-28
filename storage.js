import AsyncStorage from '@react-native-async-storage/async-storage';

// Get active profile ID
export async function getActiveProfileId() {
  const saved = await AsyncStorage.getItem('family');
  if (saved) {
    const members = JSON.parse(saved);
    const active = members.find(m => m.active);
    if (active) return String(active.id);
  }
  return '1'; // default
}

export async function getActiveProfileName() {
  const saved = await AsyncStorage.getItem('family');
  if (saved) {
    const members = JSON.parse(saved);
    const active = members.find(m => m.active);
    if (active) return active.name;
  }
  return 'Ben';
}

// Water
export async function getWaterData(date) {
  const pid = await getActiveProfileId();
  const key = `water_${pid}_${date || new Date().toDateString()}`;
  const saved = await AsyncStorage.getItem(key);
  return saved ? parseInt(saved) : 0;
}

export async function setWaterData(count, date) {
  const pid = await getActiveProfileId();
  const key = `water_${pid}_${date || new Date().toDateString()}`;
  await AsyncStorage.setItem(key, String(count));
}

export async function getWaterGoal() {
  const pid = await getActiveProfileId();
  const saved = await AsyncStorage.getItem(`waterGoal_${pid}`);
  return saved ? parseInt(saved) : 8;
}

export async function setWaterGoal(goal) {
  const pid = await getActiveProfileId();
  await AsyncStorage.setItem(`waterGoal_${pid}`, String(goal));
}

// Medicines
export async function getMedicines() {
  const pid = await getActiveProfileId();
  const saved = await AsyncStorage.getItem(`medicines_${pid}`);
  return saved ? JSON.parse(saved) : [];
}

export async function saveMedicines(medicines) {
  const pid = await getActiveProfileId();
  await AsyncStorage.setItem(`medicines_${pid}`, JSON.stringify(medicines));
}

// Calories
export async function getCalorieGoal() {
  const pid = await getActiveProfileId();
  const saved = await AsyncStorage.getItem(`calorieGoal_${pid}`);
  return saved ? parseInt(saved) : 2000;
}

export async function setCalorieGoal(goal) {
  const pid = await getActiveProfileId();
  await AsyncStorage.setItem(`calorieGoal_${pid}`, String(goal));
}

export async function getCalorieData(date) {
  const pid = await getActiveProfileId();
  const key = `calories_${pid}_${date || new Date().toDateString()}`;
  const saved = await AsyncStorage.getItem(key);
  return saved ? JSON.parse(saved) : [];
}

export async function saveCalorieData(meals, date) {
  const pid = await getActiveProfileId();
  const key = `calories_${pid}_${date || new Date().toDateString()}`;
  await AsyncStorage.setItem(key, JSON.stringify(meals));
}

// Onboarding
export async function hasSeenOnboarding() {
  const val = await AsyncStorage.getItem('onboarding_done');
  return val === 'true';
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem('onboarding_done', 'true');
}
