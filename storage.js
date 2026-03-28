import AsyncStorage from '@react-native-async-storage/async-storage';

// Get active profile ID
export async function getActiveProfileId() {
  const saved = await AsyncStorage.getItem('family');
  if (saved) {
    const members = JSON.parse(saved);
    const active = members.find(m => m.active);
    if (active) return String(active.id);
  }
  return '1';
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

// Water Alarm
export async function getWaterAlarm() {
  const pid = await getActiveProfileId();
  const saved = await AsyncStorage.getItem(`waterAlarm_${pid}`);
  return saved ? JSON.parse(saved) : { enabled: false, intervalMin: 60, startHour: 8, endHour: 22 };
}

export async function setWaterAlarm(settings) {
  const pid = await getActiveProfileId();
  await AsyncStorage.setItem(`waterAlarm_${pid}`, JSON.stringify(settings));
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

// Gender
export async function getGender() {
  const pid = await getActiveProfileId();
  const saved = await AsyncStorage.getItem(`gender_${pid}`);
  return saved || null;
}

export async function setGender(gender) {
  const pid = await getActiveProfileId();
  await AsyncStorage.setItem(`gender_${pid}`, gender);
}

// Health Profile (height, weight, activity)
export async function getHealthProfile() {
  const pid = await getActiveProfileId();
  const saved = await AsyncStorage.getItem(`healthProfile_${pid}`);
  return saved ? JSON.parse(saved) : { height: '', weight: '', activityLevel: 'moderate' };
}

export async function setHealthProfile(profile) {
  const pid = await getActiveProfileId();
  await AsyncStorage.setItem(`healthProfile_${pid}`, JSON.stringify(profile));
}

// Onboarding
export async function hasSeenOnboarding() {
  const val = await AsyncStorage.getItem('onboarding_done');
  return val === 'true';
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem('onboarding_done', 'true');
}
