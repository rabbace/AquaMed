import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';

const AVATAR_COLORS = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#E91E63', '#00BCD4', '#FF5722', '#3F51B5'];
const AVATAR_ICONS = ['person', 'woman', 'man', 'happy', 'heart', 'flower', 'star', 'diamond'];

export default function FamilyScreen() {
  const { theme } = useTheme();
  const [members, setMembers] = useState([{ id: 1, name: 'Ben', active: true, avatar: 0, color: 0 }]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    const saved = await AsyncStorage.getItem('family');
    if (saved) setMembers(JSON.parse(saved));
  };

  const addMember = async () => {
    if (!newName) return;
    const updated = [
      ...members.map(m => ({ ...m, active: false })),
      { id: Date.now(), name: newName, active: true, avatar: selectedAvatar, color: selectedColor },
    ];
    setMembers(updated);
    await AsyncStorage.setItem('family', JSON.stringify(updated));
    setNewName(''); setSelectedAvatar(0); setSelectedColor(0);
    setModalVisible(false);
  };

  const setActive = async (id) => {
    const updated = members.map(m => ({ ...m, active: m.id === id }));
    setMembers(updated);
    await AsyncStorage.setItem('family', JSON.stringify(updated));
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

  const activeMember = members.find(m => m.active);
  const s = getStyles(theme);

  return (
    <View style={s.container}>
      {activeMember && (
        <View style={s.activeHeader}>
          <View style={[s.activeAvatar, { backgroundColor: AVATAR_COLORS[activeMember.color || 0] }]}>
            <Ionicons name={AVATAR_ICONS[activeMember.avatar || 0]} size={28} color="#fff" />
          </View>
          <View>
            <Text style={s.activeLabel}>Aktif Profil</Text>
            <Text style={s.activeName}>{activeMember.name}</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.infoCard}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={s.infoText}>Aktif profile göre su ve ilaç takibi yapılır. Profil seçmek için dokunun, silmek için basılı tutun.</Text>
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
            {member.active && (
              <View style={s.activeBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
                <Text style={s.activeBadgeText}>Aktif</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Ionicons name="person-add" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Yeni Profil</Text>
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

            <TouchableOpacity style={[s.saveBtn, !newName && s.saveBtnDisabled]} onPress={addMember} disabled={!newName}>
              <Text style={s.saveBtnText}>Profil Ekle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setModalVisible(false); setNewName(''); setSelectedAvatar(0); setSelectedColor(0); }}>
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
  activeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: theme.card, padding: 20,
    borderBottomWidth: 1, borderBottomColor: theme.cardBorder,
  },
  activeAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  activeLabel: { fontSize: 13, color: theme.textMuted },
  activeName: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginTop: 2 },

  infoCard: { flexDirection: 'row', backgroundColor: theme.primaryLight, borderRadius: 12, padding: 14, margin: 16, marginBottom: 8, gap: 10, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 13, color: theme.primary, lineHeight: 18 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginHorizontal: 16, marginTop: 12, marginBottom: 8 },

  card: {
    backgroundColor: theme.card, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: theme.dark ? 1 : 0, borderColor: theme.cardBorder,
    elevation: theme.dark ? 0 : 2,
  },
  cardActive: { borderWidth: 2, borderColor: theme.primary },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  status: { fontSize: 13, color: theme.textMuted, marginTop: 3 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.accentLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeBadgeText: { fontSize: 12, fontWeight: 'bold', color: theme.accent },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },

  modalOverlay: { flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 16 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.surface, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: theme.inputBorder, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, backgroundColor: theme.inputBg, color: theme.text },
  avatarPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  avatarOption: { width: 46, height: 46, borderRadius: 14, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
  avatarOptionSelected: { backgroundColor: theme.primaryLight, borderWidth: 2, borderColor: theme.primary },
  colorPicker: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  colorOption: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  colorOptionSelected: { borderWidth: 3, borderColor: theme.text },
  previewContainer: { alignItems: 'center', padding: 16, backgroundColor: theme.bg, borderRadius: 16, marginBottom: 16 },
  previewAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  previewName: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: theme.surface },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelBtnText: { color: theme.textSecondary, fontSize: 16 },
});
