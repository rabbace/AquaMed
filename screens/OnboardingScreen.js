import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { setOnboardingDone } from '../storage';

// Dimensions available if needed

const PAGES = [
  {
    icon: 'heart-circle',
    color: '#2196F3',
    title: 'AquaMed\'e Hoş Geldiniz',
    subtitle: 'Sağlığınızı takip etmenin en kolay yolu',
    description: 'Su tüketimi, ilaç takibi ve aile profilleri ile sağlığınızı kontrol altında tutun.',
  },
  {
    icon: 'water',
    color: '#00BCD4',
    title: 'Su Takibi',
    subtitle: 'Günlük su hedefinize ulaşın',
    description: 'Kişisel su hedefinizi belirleyin, bardak bardak takip edin ve haftalık istatistiklerinizi görün.',
  },
  {
    icon: 'medkit',
    color: '#9C27B0',
    title: 'İlaç Hatırlatıcı',
    subtitle: 'İlaçlarınızı asla unutmayın',
    description: 'İlaçlarınızı ekleyin, saatlerini belirleyin ve bildirimlerle hatırlatma alın.',
  },
  {
    icon: 'people',
    color: '#FF9800',
    title: 'Aile Profilleri',
    subtitle: 'Tüm ailenin sağlığını takip edin',
    description: 'Her aile üyesi için ayrı profil oluşturun. Herkesin su ve ilaç takibi bağımsız olsun.',
  },
  {
    icon: 'chatbubble-ellipses',
    color: '#4CAF50',
    title: 'AI Sağlık Asistanı',
    subtitle: 'Sorularınıza anında yanıt',
    description: 'Beslenme, uyku, egzersiz ve ilaç kullanımı hakkında yapay zeka destekli bilgi alın.',
  },
];

export default function OnboardingScreen({ onFinish }) {
  const [currentPage, setCurrentPage] = useState(0);
  const page = PAGES[currentPage];
  const isLast = currentPage === PAGES.length - 1;

  const goNext = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    if (isLast) {
      await setOnboardingDone();
      onFinish();
    } else {
      setCurrentPage(currentPage + 1);
    }
  };

  const skip = async () => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    await setOnboardingDone();
    onFinish();
  };

  return (
    <View style={[styles.container, { backgroundColor: page.color }]}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name={page.icon} size={80} color={page.color} />
        </View>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.subtitle}>{page.subtitle}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === currentPage && styles.dotActive]} />
        ))}
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.8}>
        <Text style={styles.nextText}>{isLast ? 'Başlayalım!' : 'Devam'}</Text>
        <Ionicons name={isLast ? 'checkmark-circle' : 'arrow-forward'} size={22} color={page.color} />
      </TouchableOpacity>

      {/* Page counter */}
      <Text style={styles.counter}>{currentPage + 1} / {PAGES.length}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  skipBtn: {
    position: 'absolute', top: 56, right: 24,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  skipText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  content: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  iconCircle: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  title: {
    fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 17, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: 20, fontWeight: '600',
  },
  description: {
    fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 16,
  },

  dots: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  dot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: '#fff', width: 28, borderRadius: 5 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 36, paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  nextText: { fontSize: 18, fontWeight: 'bold' },

  counter: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 16 },
});
