import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe JSON parse helper
function safeParse(str, fallback) {
  try { return str ? JSON.parse(str) : fallback; }
  catch { return fallback; }
}

// Get active profile ID
export async function getActiveProfileId() {
  try {
    const saved = await AsyncStorage.getItem('family');
    const members = safeParse(saved, []);
    const active = members.find(m => m.active);
    return active ? String(active.id) : '1';
  } catch { return '1'; }
}

export async function getActiveProfileName() {
  try {
    const saved = await AsyncStorage.getItem('family');
    const members = safeParse(saved, []);
    const active = members.find(m => m.active);
    return active ? active.name : 'Ben';
  } catch { return 'Ben'; }
}

// Water
export async function getWaterData(date) {
  try {
    const pid = await getActiveProfileId();
    const key = `water_${pid}_${date || new Date().toDateString()}`;
    const saved = await AsyncStorage.getItem(key);
    return saved ? parseInt(saved) || 0 : 0;
  } catch { return 0; }
}

export async function setWaterData(count, date) {
  try {
    const pid = await getActiveProfileId();
    const key = `water_${pid}_${date || new Date().toDateString()}`;
    await AsyncStorage.setItem(key, String(count));
  } catch {}
}

export async function getWaterGoal() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`waterGoal_${pid}`);
    return saved ? parseInt(saved) || 8 : 8;
  } catch { return 8; }
}

export async function setWaterGoal(goal) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`waterGoal_${pid}`, String(goal));
  } catch {}
}

// Water Alarm
export async function getWaterAlarm() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`waterAlarm_${pid}`);
    return safeParse(saved, { enabled: false, intervalMin: 60, startHour: 8, endHour: 22 });
  } catch { return { enabled: false, intervalMin: 60, startHour: 8, endHour: 22 }; }
}

export async function setWaterAlarm(settings) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`waterAlarm_${pid}`, JSON.stringify(settings));
  } catch {}
}

// Medicines
export async function getMedicines() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`medicines_${pid}`);
    return safeParse(saved, []);
  } catch { return []; }
}

export async function saveMedicines(medicines) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`medicines_${pid}`, JSON.stringify(medicines));
  } catch {}
}

// Calories
export async function getCalorieGoal() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`calorieGoal_${pid}`);
    return saved ? parseInt(saved) || 2000 : 2000;
  } catch { return 2000; }
}

export async function setCalorieGoal(goal) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`calorieGoal_${pid}`, String(goal));
  } catch {}
}

export async function getCalorieData(date) {
  try {
    const pid = await getActiveProfileId();
    const key = `calories_${pid}_${date || new Date().toDateString()}`;
    const saved = await AsyncStorage.getItem(key);
    return safeParse(saved, []);
  } catch { return []; }
}

export async function saveCalorieData(meals, date) {
  try {
    const pid = await getActiveProfileId();
    const key = `calories_${pid}_${date || new Date().toDateString()}`;
    await AsyncStorage.setItem(key, JSON.stringify(meals));
  } catch {}
}

// Gender
export async function getGender() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`gender_${pid}`);
    return saved || null;
  } catch { return null; }
}

export async function setGender(gender) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`gender_${pid}`, gender);
  } catch {}
}

// Health Profile (height, weight, activity)
export async function getHealthProfile() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`healthProfile_${pid}`);
    return safeParse(saved, { height: '', weight: '', activityLevel: 'moderate' });
  } catch { return { height: '', weight: '', activityLevel: 'moderate' }; }
}

export async function setHealthProfile(profile) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`healthProfile_${pid}`, JSON.stringify(profile));
  } catch {}
}

// Favorite Foods
export async function getFavoriteFoods() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`favorite_foods_${pid}`);
    return safeParse(saved, []);
  } catch { return []; }
}

export async function toggleFavoriteFood(foodName) {
  try {
    const pid = await getActiveProfileId();
    const key = `favorite_foods_${pid}`;
    const saved = await AsyncStorage.getItem(key);
    const favorites = safeParse(saved, []);
    const index = favorites.indexOf(foodName);
    if (index >= 0) favorites.splice(index, 1);
    else favorites.push(foodName);
    await AsyncStorage.setItem(key, JSON.stringify(favorites));
    return favorites;
  } catch { return []; }
}

// Onboarding
export async function hasSeenOnboarding() {
  try {
    const val = await AsyncStorage.getItem('onboarding_done');
    return val === 'true';
  } catch { return false; }
}

export async function setOnboardingDone() {
  try { await AsyncStorage.setItem('onboarding_done', 'true'); } catch {}
}

// Data cleanup - delete data older than N days
export async function cleanupOldData(daysToKeep = 90) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const now = new Date();
    const cutoff = new Date(now.getTime() - daysToKeep * 24 * 60 * 60 * 1000);
    const keysToDelete = [];

    for (const key of keys) {
      // Match water_PID_DATE and calories_PID_DATE patterns
      const match = key.match(/^(water|calories|habit_log)_\d+_(.+)$/);
      if (match) {
        const dateStr = match[2];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime()) && date < cutoff) {
          keysToDelete.push(key);
        }
      }
    }

    if (keysToDelete.length > 0) {
      await AsyncStorage.multiRemove(keysToDelete);
    }
    return keysToDelete.length;
  } catch { return 0; }
}

// Habits
export async function getHabits() {
  try {
    const pid = await getActiveProfileId();
    const saved = await AsyncStorage.getItem(`habits_${pid}`);
    return safeParse(saved, []);
  } catch { return []; }
}

export async function saveHabits(habits) {
  try {
    const pid = await getActiveProfileId();
    await AsyncStorage.setItem(`habits_${pid}`, JSON.stringify(habits));
  } catch {}
}

export async function getHabitLog(date) {
  try {
    const pid = await getActiveProfileId();
    const key = `habit_log_${pid}_${date || new Date().toDateString()}`;
    const saved = await AsyncStorage.getItem(key);
    return safeParse(saved, {});
  } catch { return {}; }
}

export async function saveHabitLog(log, date) {
  try {
    const pid = await getActiveProfileId();
    const key = `habit_log_${pid}_${date || new Date().toDateString()}`;
    await AsyncStorage.setItem(key, JSON.stringify(log));
  } catch {}
}

// Fasting
export async function getFastingState() {
  try {
    const saved = await AsyncStorage.getItem('fasting_state');
    return safeParse(saved, null);
  } catch { return null; }
}

export async function saveFastingState(state) {
  try {
    if (state === null) await AsyncStorage.removeItem('fasting_state');
    else await AsyncStorage.setItem('fasting_state', JSON.stringify(state));
  } catch {}
}

export async function getFastingHistory() {
  try {
    const saved = await AsyncStorage.getItem('fasting_history');
    return safeParse(saved, []);
  } catch { return []; }
}

export async function saveFastingHistory(history) {
  try {
    await AsyncStorage.setItem('fasting_history', JSON.stringify(history));
  } catch {}
}

// Allowed keys whitelist for backup validation
const ALLOWED_KEY_PREFIXES = [
  'family', 'water_', 'waterGoal_', 'waterAlarm_', 'medicines_',
  'calorieGoal_', 'calories_', 'gender_', 'healthProfile_',
  'favorite_foods_', 'onboarding_done', 'theme', 'autoTheme', 'ai_chat_',
  'habits_', 'habit_log_', 'fasting_state', 'fasting_history', 'themeId',
];

export function isValidBackupKey(key) {
  return ALLOWED_KEY_PREFIXES.some(prefix => key === prefix || key.startsWith(prefix));
}
