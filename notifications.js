// Safe notification wrapper - works in APK builds, no-ops in Expo Go
let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {}

export async function requestPermissions() {
  try {
    if (!Notifications) return false;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      await Notifications.setNotificationChannelAsync('medicine', {
        name: 'İlaç Hatırlatıcı',
        importance: Notifications.AndroidImportance?.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync('water', {
        name: 'Su Hatırlatıcı',
        importance: Notifications.AndroidImportance?.HIGH,
        sound: 'default',
      });
      return true;
    }
    return false;
  } catch (e) { return false; }
}

export async function scheduleMedicineAlarm(med) {
  try {
    if (!Notifications) return;
    // Cancel existing notifications for this medicine
    await cancelMedicineAlarm(med.id);

    if (!med.alarmEnabled) return;

    const times = getMedicineTimes(med);
    for (let i = 0; i < times.length; i++) {
      const [hour, minute] = times[i].split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 İlaç Zamanı!',
          body: `${med.name}${med.stomach === 'full' ? ' (tok karnına)' : med.stomach === 'empty' ? ' (aç karnına)' : ''} - ${med.dose || ''}`,
          sound: 'default',
          channelId: 'medicine',
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
        },
        identifier: `med_${med.id}_${i}`,
      });
    }
  } catch (e) {}
}

export async function cancelMedicineAlarm(medId) {
  try {
    if (!Notifications) return;
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.identifier?.startsWith(`med_${medId}_`)) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch (e) {}
}

export async function scheduleWaterAlarms(settings) {
  try {
    if (!Notifications) return;
    // Cancel all water alarms first
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if (n.identifier?.startsWith('water_')) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    if (!settings.enabled) return;

    const messages = [
      '💧 Su içme zamanı! Bir bardak su iç.',
      '💧 Sağlığın için su içmeyi unutma!',
      '💧 Vücudun suya ihtiyaç duyuyor!',
      '💧 Bir bardak su vakti geldi!',
    ];

    // Calculate alarm times using total minutes from start
    const startTotal = settings.startHour * 60;
    const endTotal = settings.endHour * 60;
    const alarms = [];

    for (let t = startTotal + settings.intervalMin; t <= endTotal; t += settings.intervalMin) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      if (h >= 24) break;
      alarms.push({ h, m });
    }

    for (let i = 0; i < alarms.length; i++) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Su Hatırlatıcı',
          body: messages[i % messages.length],
          sound: 'default',
          channelId: 'water',
        },
        trigger: {
          type: 'daily',
          hour: alarms[i].h,
          minute: alarms[i].m,
        },
        identifier: `water_${alarms[i].h}_${alarms[i].m}`,
      });
    }
  } catch (e) {}
}

export function getMedicineTimes(med) {
  if (!med.period || med.period === 'custom') return [med.time || '08:00'];

  const periods = {
    'morning': ['08:00'],
    'noon': ['12:00'],
    'evening': ['20:00'],
    'morning-evening': ['08:00', '20:00'],
    'morning-noon-evening': ['08:00', '12:00', '20:00'],
    'once-daily': [med.time || '08:00'],
    'twice-daily': ['08:00', '20:00'],
    'three-daily': ['08:00', '14:00', '20:00'],
    'every-4h': ['08:00', '12:00', '16:00', '20:00'],
    'every-6h': ['06:00', '12:00', '18:00', '00:00'],
    'every-8h': ['08:00', '16:00', '00:00'],
  };
  return periods[med.period] || [med.time || '08:00'];
}
