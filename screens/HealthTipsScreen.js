import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

const CATEGORIES = [
  { key: 'all', label: 'Tümü', icon: 'grid' },
  { key: 'water', label: 'Su', icon: 'water' },
  { key: 'nutrition', label: 'Beslenme', icon: 'nutrition' },
  { key: 'exercise', label: 'Egzersiz', icon: 'fitness' },
  { key: 'sleep', label: 'Uyku', icon: 'moon' },
  { key: 'mental', label: 'Mental', icon: 'happy' },
];

const TIPS = [
  { category: 'water', icon: 'water', title: 'Sabah Suyu', text: 'Sabah kalktığınızda bir bardak ılık su için. Metabolizmanızı hızlandırır ve vücudunuzu uyandırır.' },
  { category: 'water', icon: 'water', title: 'Su İçme Zamanlaması', text: 'Yemeklerden 30 dakika önce su için. Sindirime yardımcı olur ve tokluk hissi verir.' },
  { category: 'water', icon: 'water', title: 'Susuzluk Belirtileri', text: 'Baş ağrısı, yorgunluk ve konsantrasyon kaybı susuzluk belirtisi olabilir. Düzenli su için.' },
  { category: 'nutrition', icon: 'nutrition', title: 'Renkli Tabak', text: 'Tabağınızda ne kadar çok renk varsa, o kadar çeşitli vitamin ve mineral alırsınız.' },
  { category: 'nutrition', icon: 'nutrition', title: 'Lif Alımı', text: 'Günde 25-30g lif tüketmeye çalışın. Tam tahıllar, sebzeler ve meyveler iyi kaynaklardır.' },
  { category: 'nutrition', icon: 'restaurant', title: 'Omega-3', text: 'Haftada 2-3 kez balık tüketin. Omega-3 yağ asitleri beyin ve kalp sağlığını destekler.' },
  { category: 'exercise', icon: 'walk', title: '10.000 Adım', text: 'Günde 10.000 adım atmayı hedefleyin. Asansör yerine merdiven kullanarak başlayabilirsiniz.' },
  { category: 'exercise', icon: 'body', title: 'Esneme Egzersizleri', text: 'Her saat başı 5 dakika esneme yapın. Masa başı çalışanlar için özellikle önemlidir.' },
  { category: 'exercise', icon: 'fitness', title: 'Düzenli Egzersiz', text: 'Haftada en az 150 dakika orta yoğunlukta fiziksel aktivite yapın.' },
  { category: 'sleep', icon: 'moon', title: 'Uyku Düzeni', text: 'Her gün aynı saatte yatıp kalkın. Düzensiz uyku bağışıklık sistemini zayıflatır.' },
  { category: 'sleep', icon: 'phone-portrait', title: 'Mavi Işık', text: 'Yatmadan 1 saat önce telefon ve bilgisayar kullanmayı bırakın. Mavi ışık uyku kalitesini düşürür.' },
  { category: 'sleep', icon: 'bed', title: 'İdeal Uyku Süresi', text: 'Yetişkinler için ideal uyku süresi 7-9 saattir. 6 saatten az uyumak sağlığa zararlıdır.' },
  { category: 'mental', icon: 'happy', title: 'Meditasyon', text: 'Günde 10 dakika meditasyon yapın. Stres seviyenizi düşürür ve odaklanmanızı artırır.' },
  { category: 'mental', icon: 'book', title: 'Kitap Okuma', text: 'Günde en az 15 dakika kitap okuyun. Beyin sağlığını destekler ve stresi azaltır.' },
  { category: 'mental', icon: 'leaf', title: 'Doğada Vakit Geçirin', text: 'Haftada birkaç saat doğada vakit geçirmek ruh sağlığınızı iyileştirir.' },
];

const CAT_COLORS = {
  water: { bg: 'primaryLight', border: 'primary', icon: 'primary' },
  nutrition: { bg: 'warningLight', border: 'warning', icon: 'warning' },
  exercise: { bg: 'accentLight', border: 'accent', icon: 'accent' },
  sleep: { bg: 'purpleLight', border: 'purple', icon: 'purple' },
  mental: { bg: 'pinkLight', border: 'danger', icon: 'danger' },
};

export default function HealthTipsScreen() {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTips = activeCategory === 'all' ? TIPS : TIPS.filter(t => t.category === activeCategory);
  const featured = TIPS[new Date().getDate() % TIPS.length];
  const s = getStyles(theme);

  return (
    <View style={s.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoryScroll} contentContainerStyle={s.categoryContent}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity key={cat.key} style={[s.categoryChip, activeCategory === cat.key && s.categoryChipActive]} onPress={() => setActiveCategory(cat.key)}>
            <Ionicons name={cat.icon} size={16} color={activeCategory === cat.key ? '#fff' : theme.textSecondary} />
            <Text style={[s.categoryLabel, activeCategory === cat.key && s.categoryLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.tipsContainer}>
        <View style={s.featuredCard}>
          <View style={s.featuredBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={s.featuredBadgeText}>Günün Önerisi</Text>
          </View>
          <Ionicons name={featured.icon} size={40} color="rgba(255,255,255,0.9)" style={{ marginBottom: 12 }} />
          <Text style={s.featuredTitle}>{featured.title}</Text>
          <Text style={s.featuredText}>{featured.text}</Text>
        </View>

        <Text style={s.sectionTitle}>
          {activeCategory === 'all' ? 'Tüm İpuçları' : CATEGORIES.find(c => c.key === activeCategory)?.label + ' İpuçları'} ({filteredTips.length})
        </Text>

        {filteredTips.map((tip, index) => {
          const colors = CAT_COLORS[tip.category];
          return (
            <View key={index} style={[s.tipCard, { backgroundColor: theme[colors.bg], borderColor: theme.dark ? theme.cardBorder : theme[colors.border] + '40' }]}>
              <View style={s.tipHeader}>
                <Ionicons name={tip.icon} size={22} color={theme[colors.icon]} />
                <Text style={s.tipTitle}>{tip.title}</Text>
              </View>
              <Text style={s.tipText}>{tip.text}</Text>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  categoryScroll: { maxHeight: 56, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.cardBorder },
  categoryContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  categoryChipActive: { backgroundColor: theme.primary },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  categoryLabelActive: { color: '#fff' },
  tipsContainer: { padding: 16 },
  featuredCard: { backgroundColor: theme.primary, borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 },
  featuredBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  featuredTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  featuredText: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  tipCard: { borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tipTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text },
  tipText: { fontSize: 14, color: theme.textSecondary, lineHeight: 21 },
});
