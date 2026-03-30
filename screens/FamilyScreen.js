import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, THEME_PRESETS } from '../theme';
import { getGender, setGender, getHealthProfile, setHealthProfile, isValidBackupKey } from '../storage';

const AVATAR_COLORS = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4', '#FF5722', '#3F51B5'];
const AVATAR_ICONS = ['person', 'woman', 'man', 'happy', 'heart', 'flower', 'star', 'diamond'];

const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Hareketsiz', desc: 'Masa başı iş, az hareket', icon: 'bed-outline', factor: 1.2 },
  { key: 'light', label: 'Hafif Aktif', desc: 'Haftada 1-3 gün egzersiz', icon: 'walk-outline', factor: 1.375 },
  { key: 'moderate', label: 'Orta Aktif', desc: 'Haftada 3-5 gün egzersiz', icon: 'bicycle-outline', factor: 1.55 },
  { key: 'active', label: 'Aktif', desc: 'Haftada 6-7 gün egzersiz', icon: 'fitness-outline', factor: 1.725 },
  { key: 'veryactive', label: 'Çok Aktif', desc: 'Yoğun antrenman / fiziksel iş', icon: 'barbell-outline', factor: 1.9 },
];

export default function FamilyScreen() {
  const { theme, themeId, setThemeById } = useTheme();
  const [members, setMembers] = useState([{ id: 1, name: 'Ben', active: true, avatar: 0, color: 0 }]);
  const [modalVisible, setModalVisible] = useState(false);
  const [healthModalVisible, setHealthModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);

  // Health profile state
  const [gender, setGenderState] = useState(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('moderate');

  // Backup/restore state
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreText, setRestoreText] = useState('');

  useEffect(() => { loadMembers(); }, []);

  useFocusEffect(
    useCallback(() => { loadHealthData(); }, [])
  );

  const loadMembers = async () => {
    const saved = await AsyncStorage.getItem('family');
    if (saved) setMembers(JSON.parse(saved));
  };

  const loadHealthData = async () => {
    const gen = await getGender();
    setGenderState(gen);
    const hp = await getHealthProfile();
    setHeight(hp.height || '');
    setWeight(hp.weight || '');
    setActivityLevel(hp.activityLevel || 'moderate');
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setNewName(member.name);
    setSelectedAvatar(member.avatar || 0);
    setSelectedColor(member.color || 0);
    setModalVisible(true);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setNewName('');
    setSelectedAvatar(0);
    setSelectedColor(0);
    setModalVisible(true);
  };

  const saveMember = async () => {
    if (!newName) return;
    let updated;
    if (editingMember) {
      updated = members.map(m => m.id === editingMember.id ? { ...m, name: newName, avatar: selectedAvatar, color: selectedColor } : m);
    } else {
      updated = [
        ...members.map(m => ({ ...m, active: false })),
        { id: Date.now(), name: newName, active: true, avatar: selectedAvatar, color: selectedColor },
      ];
    }
    setMembers(updated);
    await AsyncStorage.setItem('family', JSON.stringify(updated));
    setNewName(''); setSelectedAvatar(0); setSelectedColor(0);
    setEditingMember(null);
    setModalVisible(false);
  };

  const setActive = async (id) => {
    const updated = members.map(m => ({ ...m, active: m.id === id }));
    setMembers(updated);
    await AsyncStorage.setItem('family', JSON.stringify(updated));
    loadHealthData();
  };

  const deleteMember = async (id) => {
    if (members.length === 1) { Alert.alert('Uyarı', 'En az bir profil bulunmalıdır.'); return; }
    const member = members.find(m => m.id === id);
    Alert.alert('Profili Sil', `"${member.name}" profilini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          const updated = members.filter(m => m.id !== id);
          if (!updated.find(m => m.active)) updated[0].active = true;
          setMembers(updated);
          await AsyncStorage.setItem('family', JSON.stringify(updated));
        }
      },
    ]);
  };

  const saveHealthData = async () => {
    await setGender(gender);
    await setHealthProfile({ height, weight, activityLevel });
    setHealthModalVisible(false);
  };

  const exportBackup = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      const data = {};
      pairs.forEach(([k, v]) => { data[k] = v; });
      const json = JSON.stringify(data);
      await Share.share({ message: json, title: 'AquaMed Yedek' });
    } catch (e) {
      Alert.alert('Hata', 'Yedekleme sırasında bir hata oluştu.');
    }
  };

  const importBackup = async () => {
    try {
      const parsed = JSON.parse(restoreText);
      const entries = Object.entries(parsed);
      if (entries.length === 0) { Alert.alert('Hata', 'Geçersiz yedek verisi.'); return; }
      // Validate keys against whitelist
      const validEntries = entries.filter(([key]) => isValidBackupKey(key));
      const rejected = entries.length - validEntries.length;
      if (validEntries.length === 0) { Alert.alert('Hata', 'Geçerli veri bulunamadı.'); return; }
      // Size check - max 5MB
      const totalSize = validEntries.reduce((s, [k, v]) => s + k.length + v.length, 0);
      if (totalSize > 5 * 1024 * 1024) { Alert.alert('Hata', 'Yedek verisi çok büyük (max 5MB).'); return; }
      await AsyncStorage.multiSet(validEntries);
      setRestoreModalVisible(false);
      setRestoreText('');
      await loadMembers();
      await loadHealthData();
      Alert.alert('Başarılı', `${validEntries.length} veri geri yüklendi.${rejected > 0 ? ` ${rejected} geçersiz anahtar atlandı.` : ''} Uygulamayı yeniden başlatmanız önerilir.`);
    } catch (e) {
      Alert.alert('Hata', 'Geçersiz JSON formatı. Lütfen yedek verisini doğru yapıştırdığınızdan emin olun.');
    }
  };

  // BMI calculation
  const bmi = (height && weight) ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null;
  const getBmiCategory = (val) => {
    if (!val) return { text: '-', color: '#999' };
    const v = parseFloat(val);
    if (v < 18.5) return { text: 'Zayıf', color: '#2196F3' };
    if (v < 25) return { text: 'Normal', color: '#4CAF50' };
    if (v < 30) return { text: 'Fazla Kilolu', color: '#FF9800' };
    return { text: 'Obez', color: '#E91E63' };
  };
  const bmiCat = getBmiCategory(bmi);

  // Daily calorie need
  const getDailyCalorie = () => {
    if (!height || !weight || !gender) return null;
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const age = 30; // default estimate
    let bmr;
    if (gender === 'male') bmr = 10 * w + 6.25 * h - 5 * age + 5;
    else bmr = 10 * w + 6.25 * h - 5 * age - 161;
    const factor = ACTIVITY_LEVELS.find(a => a.key === activityLevel)?.factor || 1.55;
    return Math.round(bmr * factor);
  };

  const activeMember = members.find(m => m.active);
  const s = getStyles(theme);

  return (
    <View style={s.container}>
      {activeMember && (
        <View style={s.activeHeader}>
          <View style={[s.activeAvatar, { backgroundColor: AVATAR_COLORS[activeMember.color || 0] }]}>
            <Ionicons name={AVATAR_ICONS[activeMember.avatar || 0]} size={28} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.activeLabel}>Aktif Profil</Text>
            <Text style={s.activeName}>{activeMember.name}</Text>
          </View>
          <TouchableOpacity style={s.healthBtn} onPress={() => setHealthModalVisible(true)}>
            <Ionicons name="body-outline" size={18} color={theme.primary} />
            <Text style={s.healthBtnText}>Sağlık</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Health Summary Card */}
        <View style={s.healthCard}>
          <Text style={s.healthCardTitle}>Sağlık Profili</Text>
          <View style={s.healthRow}>
            <View style={s.healthItem}>
              <Ionicons name={gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'person-outline'} size={22} color={gender === 'male' ? '#1976D2' : gender === 'female' ? '#C2185B' : theme.textMuted} />
              <Text style={s.healthItemValue}>{gender === 'male' ? 'Erkek' : gender === 'female' ? 'Kadın' : '-'}</Text>
              <Text style={s.healthItemLabel}>Cinsiyet</Text>
            </View>
            <View style={s.healthDivider} />
            <View style={s.healthItem}>
              <Ionicons name="resize-outline" size={22} color={theme.primary} />
              <Text style={s.healthItemValue}>{height ? `${height} cm` : '-'}</Text>
              <Text style={s.healthItemLabel}>Boy</Text>
            </View>
            <View style={s.healthDivider} />
            <View style={s.healthItem}>
              <Ionicons name="scale-outline" size={22} color={theme.warning} />
              <Text style={s.healthItemValue}>{weight ? `${weight} kg` : '-'}</Text>
              <Text style={s.healthItemLabel}>Kilo</Text>
            </View>
            <View style={s.healthDivider} />
            <View style={s.healthItem}>
              <Ionicons name="speedometer-outline" size={22} color={bmiCat.color} />
              <Text style={[s.healthItemValue, { color: bmiCat.color }]}>{bmi || '-'}</Text>
              <Text style={s.healthItemLabel}>BKİ</Text>
            </View>
          </View>
          {bmi && (
            <View style={s.bmiBar}>
              <View style={s.bmiBarTrack}>
                <View style={[s.bmiBarSection, { flex: 18.5, backgroundColor: '#2196F3' }]} />
                <View style={[s.bmiBarSection, { flex: 6.5, backgroundColor: '#4CAF50' }]} />
                <View style={[s.bmiBarSection, { flex: 5, backgroundColor: '#FF9800' }]} />
                <View style={[s.bmiBarSection, { flex: 10, backgroundColor: '#E91E63' }]} />
              </View>
              <View style={[s.bmiIndicator, { left: `${Math.min(Math.max((parseFloat(bmi) / 40) * 100, 0), 100)}%` }]}>
                <View style={[s.bmiDot, { backgroundColor: bmiCat.color }]} />
              </View>
              <View style={s.bmiLabels}>
                <Text style={s.bmiLabel}>Zayıf</Text>
                <Text style={s.bmiLabel}>Normal</Text>
                <Text style={s.bmiLabel}>Kilolu</Text>
                <Text style={s.bmiLabel}>Obez</Text>
              </View>
            </View>
          )}
          {bmi && (
            <Text style={[s.bmiResult, { color: bmiCat.color }]}>
              {bmiCat.text} ({bmi}) {getDailyCalorie() ? `• Günlük ~${getDailyCalorie()} kcal` : ''}
            </Text>
          )}
          <TouchableOpacity style={s.editHealthBtn} onPress={() => setHealthModalVisible(true)}>
            <Ionicons name="create-outline" size={16} color={theme.primary} />
            <Text style={s.editHealthText}>{bmi ? 'Düzenle' : 'Sağlık bilgilerini gir'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.infoCard}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={s.infoText}>Profil seçmek için dokunun, silmek için basılı tutun.</Text>
        </View>

        <Text style={s.sectionTitle}>Tüm Profiller ({members.length})</Text>

        {members.map(member => (
          <TouchableOpacity key={member.id} style={[s.card, member.active && s.cardActive]}
            onPress={() => setActive(member.id)} onLongPress={() => deleteMember(member.id)} activeOpacity={0.7}>
            <View style={[s.avatar, { backgroundColor: AVATAR_COLORS[member.color || 0] }]}>
              <Ionicons name={AVATAR_ICONS[member.avatar || 0]} size={22} color="#fff" />
            </View>
            <View style={s.info}>
              <Text style={s.name}>{member.name}</Text>
              <Text style={s.status}>{member.active ? 'Aktif profil' : 'Seçmek için dokun'}</Text>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => openEditModal(member)}>
              <Ionicons name="create-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
            {member.active && (
              <View style={s.activeBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
                <Text style={s.activeBadgeText}>Aktif</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        {/* Theme Picker */}
        <View style={s.backupSection}>
          <Text style={s.backupTitle}>Uygulama Teması</Text>
          <View style={s.themeGrid}>
            {Object.values(THEME_PRESETS).map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={[s.themeCard, themeId === preset.id && { borderColor: preset.primary, borderWidth: 2.5 }]}
                onPress={() => setThemeById(preset.id)}
                activeOpacity={0.8}
              >
                <View style={[s.themeCircle, { backgroundColor: preset.primary }]}>
                  <Text style={{ fontSize: 16 }}>{preset.emoji}</Text>
                </View>
                <Text style={[s.themeLabel, themeId === preset.id && { color: preset.primary, fontWeight: '700' }]}>
                  {preset.name}
                </Text>
                {themeId === preset.id && (
                  <View style={[s.themeCheck, { backgroundColor: preset.primary }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Backup / Restore */}
        <View style={s.backupSection}>
          <Text style={s.backupTitle}>Veri Yedekleme</Text>
          <View style={s.backupRow}>
            <TouchableOpacity style={s.backupBtn} onPress={exportBackup} activeOpacity={0.7}>
              <Ionicons name="cloud-upload-outline" size={20} color={theme.primary} />
              <Text style={s.backupBtnText}>Verileri Yedekle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.backupBtn, s.restoreBtn]} onPress={() => setRestoreModalVisible(true)} activeOpacity={0.7}>
              <Ionicons name="cloud-download-outline" size={20} color={theme.accent} />
              <Text style={[s.backupBtnText, { color: theme.accent }]}>Verileri Geri Yükle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openAddModal} activeOpacity={0.8}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Profile Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={s.modal}>
                <View style={s.modalHandle} />
                <Text style={s.modalTitle}>{editingMember ? 'Profili Düzenle' : 'Yeni Profil'}</Text>
                <Text style={s.inputLabel}>İsim</Text>
                <TextInput style={s.input} placeholder="Örn: Anne, Baba, Ayşe..." value={newName} onChangeText={setNewName} placeholderTextColor={theme.textMuted} />

                <Text style={s.inputLabel}>Avatar</Text>
                <View style={s.avatarPicker}>
                  {AVATAR_ICONS.map((icon, i) => (
                    <TouchableOpacity key={i} style={[s.avatarOption, selectedAvatar === i && s.avatarOptionSelected]} onPress={() => setSelectedAvatar(i)}>
                      <Ionicons name={icon} size={24} color={selectedAvatar === i ? theme.primary : theme.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.inputLabel}>Renk</Text>
                <View style={s.colorPicker}>
                  {AVATAR_COLORS.map((color, i) => (
                    <TouchableOpacity key={i} style={[s.colorOption, { backgroundColor: color }, selectedColor === i && s.colorOptionSelected]} onPress={() => setSelectedColor(i)}>
                      {selectedColor === i && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={s.previewContainer}>
                  <View style={[s.previewAvatar, { backgroundColor: AVATAR_COLORS[selectedColor] }]}>
                    <Ionicons name={AVATAR_ICONS[selectedAvatar]} size={32} color="#fff" />
                  </View>
                  <Text style={s.previewName}>{newName || 'İsim'}</Text>
                </View>

                <TouchableOpacity style={[s.saveBtn, !newName && s.saveBtnDisabled]} onPress={saveMember} disabled={!newName}>
                  <Text style={s.saveBtnText}>{editingMember ? 'Kaydet' : 'Profil Ekle'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setModalVisible(false); setNewName(''); setEditingMember(null); }}>
                  <Text style={s.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal visible={restoreModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={s.modal}>
                <View style={s.modalHandle} />
                <Text style={s.modalTitle}>Verileri Geri Yükle</Text>
                <Text style={s.restoreDesc}>Daha önce yedeklediğiniz JSON verisini aşağıya yapıştırın.</Text>
                <TextInput
                  style={[s.input, s.restoreInput]}
                  placeholder='{"key": "value", ...}'
                  value={restoreText}
                  onChangeText={setRestoreText}
                  multiline
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity style={[s.saveBtn, !restoreText && s.saveBtnDisabled]} onPress={importBackup} disabled={!restoreText}>
                  <Text style={s.saveBtnText}>Geri Yükle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setRestoreModalVisible(false); setRestoreText(''); }}>
                  <Text style={s.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Health Profile Modal */}
      <Modal visible={healthModalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }}>
            <View style={s.modal}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>Sağlık Profili</Text>

              {/* Gender */}
              <Text style={s.inputLabel}>Cinsiyet</Text>
              <View style={s.genderRow}>
                <TouchableOpacity style={[s.genderBtn, gender === 'male' && s.genderBtnActive]} onPress={() => setGenderState('male')}>
                  <Ionicons name="male" size={22} color={gender === 'male' ? '#fff' : '#1976D2'} />
                  <Text style={[s.genderBtnText, gender === 'male' && { color: '#fff' }]}>Erkek</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.genderBtn, s.genderBtnF, gender === 'female' && s.genderBtnFActive]} onPress={() => setGenderState('female')}>
                  <Ionicons name="female" size={22} color={gender === 'female' ? '#fff' : '#C2185B'} />
                  <Text style={[s.genderBtnText, gender === 'female' && { color: '#fff' }]}>Kadın</Text>
                </TouchableOpacity>
              </View>

              {/* Height & Weight */}
              <View style={s.hwRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Boy (cm)</Text>
                  <TextInput style={s.input} placeholder="175" value={height} onChangeText={setHeight} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Kilo (kg)</Text>
                  <TextInput style={s.input} placeholder="70" value={weight} onChangeText={setWeight} keyboardType="number-pad" placeholderTextColor={theme.textMuted} />
                </View>
              </View>

              {/* Activity Level */}
              <Text style={s.inputLabel}>Fiziksel Aktivite Düzeyi</Text>
              {ACTIVITY_LEVELS.map(level => (
                <TouchableOpacity key={level.key} style={[s.activityBtn, activityLevel === level.key && s.activityBtnActive]} onPress={() => setActivityLevel(level.key)}>
                  <Ionicons name={level.icon} size={22} color={activityLevel === level.key ? '#fff' : theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.activityLabel, activityLevel === level.key && { color: '#fff' }]}>{level.label}</Text>
                    <Text style={[s.activityDesc, activityLevel === level.key && { color: 'rgba(255,255,255,0.8)' }]}>{level.desc}</Text>
                  </View>
                  {activityLevel === level.key && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={s.saveBtn} onPress={saveHealthData}>
                <Text style={s.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setHealthModalVisible(false)}>
                <Text style={s.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  activeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: theme.card, padding: 20,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
  },
  activeAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  activeLabel: { fontSize: 13, color: theme.textMuted },
  activeName: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginTop: 2 },
  healthBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.primaryLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  healthBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },

  // Health Card
  healthCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    margin: 16, marginBottom: 0,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
  },
  healthCardTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text, marginBottom: 14 },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  healthItem: { flex: 1, alignItems: 'center', gap: 4 },
  healthDivider: { width: 1, height: 40, backgroundColor: theme.cardBorder },
  healthItemValue: { fontSize: 15, fontWeight: 'bold', color: theme.text },
  healthItemLabel: { fontSize: 11, color: theme.textMuted },
  bmiBar: { marginTop: 14, position: 'relative' },
  bmiBarTrack: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  bmiBarSection: { height: 8 },
  bmiIndicator: { position: 'absolute', top: -2, marginLeft: -6 },
  bmiDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  bmiLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  bmiLabel: { fontSize: 9, color: theme.textMuted },
  bmiResult: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  editHealthBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12,
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  editHealthText: { fontSize: 14, fontWeight: '600', color: theme.primary },

  infoCard: { flexDirection: 'row', backgroundColor: theme.primaryLight, borderRadius: 12, padding: 14, margin: 16, marginBottom: 8, gap: 10, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: theme.primary, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginHorizontal: 16, marginTop: 12, marginBottom: 8 },

  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center',
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
  },
  cardActive: { borderWidth: 2, borderColor: theme.primary },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  status: { fontSize: 13, color: theme.textMuted, marginTop: 3 },
  editBtn: { padding: 8, marginRight: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accentLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { fontSize: 12, fontWeight: 'bold', color: theme.accent },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.surface, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: theme.inputBg, color: theme.text },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  avatarOption: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  avatarOptionSelected: { backgroundColor: theme.primaryLight, borderWidth: 2, borderColor: theme.primary },
  colorPicker: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  colorOption: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  colorOptionSelected: { borderWidth: 3, borderColor: theme.text },
  previewContainer: { alignItems: 'center', padding: 16, backgroundColor: theme.bg, borderRadius: 16, marginBottom: 16 },
  previewAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  previewName: { fontSize: 18, fontWeight: 'bold', color: theme.text },

  // Gender
  genderRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#E3F2FD', borderRadius: 14, padding: 14,
  },
  genderBtnActive: { backgroundColor: '#1976D2' },
  genderBtnF: { backgroundColor: '#FCE4EC' },
  genderBtnFActive: { backgroundColor: '#C2185B' },
  genderBtnText: { fontSize: 16, fontWeight: 'bold', color: theme.text },

  hwRow: { flexDirection: 'row', gap: 12 },

  // Activity
  activityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 8,
  },
  activityBtnActive: { backgroundColor: theme.primary },
  activityLabel: { fontSize: 15, fontWeight: '600', color: theme.text },
  activityDesc: { fontSize: 12, color: theme.textMuted, marginTop: 2 },

  // Theme picker
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: {
    width: '30%', alignItems: 'center', padding: 10,
    backgroundColor: theme.surface, borderRadius: 14,
    borderWidth: 2, borderColor: 'transparent', position: 'relative',
  },
  themeCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  themeLabel: { fontSize: 11, color: theme.textSecondary, textAlign: 'center' },
  themeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },

  // Backup
  backupSection: {
    marginHorizontal: 16, marginTop: 20, padding: 16,
    backgroundColor: theme.card, borderRadius: 16,
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder, elevation: theme.dark ? 0 : 2,
  },
  backupTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  backupRow: { flexDirection: 'row', gap: 10 },
  backupBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: theme.primaryLight, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10,
  },
  restoreBtn: { backgroundColor: theme.accentLight },
  backupBtnText: { fontSize: 13, fontWeight: '600', color: theme.primary },
  restoreDesc: { fontSize: 13, color: theme.textSecondary, marginBottom: 12, lineHeight: 18 },
  restoreInput: { height: 120, textAlignVertical: 'top' },

  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, padding: 16, paddingHorizontal: 20, alignItems: 'center', marginTop: 8 },
  saveBtnDisabled: { backgroundColor: theme.surface },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 14, paddingHorizontal: 20, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16 },
});
