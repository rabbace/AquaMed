import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme';

const DAILY_LIMIT = 5;

const HEALTH_RESPONSES = {
  greetings: [
    'Merhaba! Ben AquaMed sağlık asistanınızım. Size ilaçlar, su tüketimi, beslenme ve genel sağlık konularında yardımcı olabilirim. Nasıl yardımcı olabilirim?',
  ],
  water: [
    'Günlük su ihtiyacı kişiye göre değişir ancak genel olarak yetişkinlerin günde 2-2.5 litre (yaklaşık 8-10 bardak) su içmesi önerilir. Egzersiz yapıyorsanız, sıcak havalarda veya hamilelik/emzirme döneminde bu miktar artmalıdır.\n\n💡 İpuçları:\n• Sabah kalkar kalkmaz 1 bardak su için\n• Yanınızda su şişesi taşıyın\n• Her öğünden 30 dk önce su için\n• Kafein ve alkol su kaybını artırır',
    'Su içmenin faydaları çok geniştir:\n\n• Böbrek fonksiyonlarını destekler\n• Cilt sağlığını iyileştirir\n• Sindirim sistemini düzenler\n• Eklem ve kasları korur\n• Vücut ısısını dengeler\n• Toksinlerin atılmasına yardımcı olur\n\nSusuzluk belirtileri: baş ağrısı, yorgunluk, koyu renkli idrar, ağız kuruluğu.',
  ],
  medicine: [
    'İlaç kullanımında dikkat edilmesi gerekenler:\n\n💊 Genel Kurallar:\n• İlaçları her gün aynı saatte alın\n• Doktor tavsiyesi olmadan doz değiştirmeyin\n• İlaçları serin ve kuru yerde saklayın\n• Son kullanma tarihlerini kontrol edin\n\n⚠️ Önemli:\n• İlaçları başkalarıyla paylaşmayın\n• Yan etkileri doktorunuza bildirin\n• İlaç etkileşimlerine dikkat edin\n• Antibiyotik kürünü yarıda bırakmayın',
    'İlaç saatinizi kaçırdıysanız:\n\n• Hatırladığınız anda alın (bir sonraki doza çok yakın değilse)\n• Çift doz almayın\n• Düzenli unutuyorsanız alarm kurun\n• AquaMed uygulamasındaki hatırlatıcıları kullanın\n\nBazı ilaçlar aç karnına, bazıları tok karnına alınmalıdır. Prospektüsü mutlaka okuyun.',
  ],
  nutrition: [
    'Sağlıklı beslenme önerileri:\n\n🥗 Günlük Beslenme:\n• 5 porsiyon meyve-sebze\n• Tam tahıllı ürünler tercih edin\n• Yeterli protein alın (et, balık, baklagiller)\n• Sağlıklı yağlar tüketin (zeytinyağı, ceviz)\n• Şeker ve tuz tüketimini sınırlayın\n\n🕐 Öğün Düzeni:\n• Kahvaltıyı atlamayın\n• 3 ana + 2 ara öğün yapın\n• Akşam geç saatte yemekten kaçının',
  ],
  sleep: [
    'İyi uyku için öneriler:\n\n😴 Uyku Hijyeni:\n• Her gün aynı saatte yatıp kalkın\n• Yatak odası serin (18-22°C) ve karanlık olsun\n• Yatmadan 1 saat önce ekranlardan uzak durun\n• Kafeinli içecekleri öğleden sonra sınırlayın\n• Yatmadan önce ağır yemek yemeyin\n\n⏰ İdeal Uyku Süreleri:\n• Yetişkinler: 7-9 saat\n• Gençler: 8-10 saat\n• Çocuklar: 9-12 saat\n• Bebekler: 12-16 saat',
  ],
  exercise: [
    'Egzersiz önerileri:\n\n🏃 Haftalık Hedefler:\n• En az 150 dk orta yoğunlukta aerobik\n• Haftada 2 gün kas güçlendirme\n• Günde 10.000 adım\n\n🏠 Evde Yapılabilecek:\n• Yürüyüş / koşu\n• Yoga / pilates\n• Merdiven çıkma\n• Dans\n• Esneme hareketleri\n\n💡 Başlangıç için: Günde 15 dakika yürüyüşle başlayın, her hafta 5 dakika artırın.',
  ],
  stress: [
    'Stres yönetimi teknikleri:\n\n🧘 Rahatlatma Yöntemleri:\n• Derin nefes egzersizleri (4-7-8 tekniği)\n• Meditasyon ve mindfulness\n• Progresif kas gevşetme\n• Doğada yürüyüş\n\n🎯 Günlük Alışkanlıklar:\n• Günlük tutun\n• Sosyal bağlantılarınızı güçlendirin\n• Hobilerle ilgilenin\n• Düzenli egzersiz yapın\n• Yeterli uyuyun\n\n⚠️ Kronik stres ciddi sağlık sorunlarına yol açabilir. Gerekirse profesyonel destek alın.',
  ],
  headache: [
    'Baş ağrısı hakkında bilgiler:\n\n🔍 Yaygın Nedenler:\n• Dehidrasyon (su eksikliği)\n• Stres ve gerginlik\n• Uyku bozuklukları\n• Göz yorgunluğu\n• Kafein eksikliği/fazlası\n\n💊 İlk Müdahale:\n• Bol su için\n• Karanlık, sessiz bir odada dinlenin\n• Alnınıza soğuk kompres yapın\n• Boyun ve omuz masajı\n\n⚠️ Doktora başvurun: Ani ve şiddetli baş ağrısı, ateşle birlikte, görme bozukluğu varsa.',
  ],
  default: [
    'Bu konuda size genel bir bilgi verebilirim. Ancak önemli sağlık konularında mutlaka bir sağlık uzmanına danışmanızı öneririm.\n\nSize şu konularda yardımcı olabilirim:\n\n💧 Su tüketimi\n💊 İlaç kullanımı\n🥗 Beslenme\n😴 Uyku\n🏃 Egzersiz\n🧘 Stres yönetimi\n🤕 Baş ağrısı\n\nBu konulardan biri hakkında soru sorabilirsiniz!',
  ],
};

const QUICK_QUESTIONS = [
  { icon: 'water-outline', text: 'Günde kaç bardak su içmeliyim?' },
  { icon: 'medkit-outline', text: 'İlaç saatimi kaçırdım ne yapmalıyım?' },
  { icon: 'nutrition-outline', text: 'Sağlıklı beslenme nasıl olmalı?' },
  { icon: 'moon-outline', text: 'Uyku kalitemi nasıl artırabilirim?' },
];

function getResponse(message) {
  const lower = message.toLowerCase();

  if (/merhaba|selam|hey|naber|nasıl/i.test(lower)) return pick(HEALTH_RESPONSES.greetings);
  if (/su |su\?|bardak|litre|hidrasyon|susuz/i.test(lower)) return pick(HEALTH_RESPONSES.water);
  if (/ilaç|hap|tablet|doz|antibiyotik|ağrı kesici|prospektüs/i.test(lower)) return pick(HEALTH_RESPONSES.medicine);
  if (/beslen|yemek|diyet|vitamin|protein|kalori|meyve|sebze|öğün/i.test(lower)) return pick(HEALTH_RESPONSES.nutrition);
  if (/uyku|uyumak|uyanmak|insomnia|uyuyamıyorum/i.test(lower)) return pick(HEALTH_RESPONSES.sleep);
  if (/egzersiz|spor|yürüyüş|koşu|fitness|antrenman|adım/i.test(lower)) return pick(HEALTH_RESPONSES.exercise);
  if (/stres|kaygı|anksiyete|gergin|meditasyon|rahatla/i.test(lower)) return pick(HEALTH_RESPONSES.stress);
  if (/baş ağrı|migren|başım ağrı/i.test(lower)) return pick(HEALTH_RESPONSES.headache);
  return pick(HEALTH_RESPONSES.default);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INITIAL_MESSAGE = { id: 1, role: 'assistant', text: 'Merhaba! 👋 Ben AquaMed sağlık asistanınızım.\n\nSize su tüketimi, ilaç kullanımı, beslenme, uyku ve egzersiz konularında yardımcı olabilirim.\n\nAşağıdaki hızlı sorulardan birini seçebilir veya kendi sorunuzu yazabilirsiniz.' };

export default function AIChatScreen({ navigation }) {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const scrollRef = useRef(null);

  const getTodayKey = () => {
    const d = new Date();
    return `ai_chat_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  };

  useEffect(() => {
    const loadCount = async () => {
      try {
        const val = await AsyncStorage.getItem(getTodayKey());
        if (val) setDailyCount(parseInt(val) || 0);
      } catch {}
    };
    loadCount();
  }, []);

  const incrementCount = async () => {
    const next = dailyCount + 1;
    setDailyCount(next);
    try { await AsyncStorage.setItem(getTodayKey(), String(next)); } catch {}
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setInput('');
    setIsTyping(false);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={clearChat} style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="refresh" size={20} color={theme.headerText} />
          <Text style={{ color: theme.headerText, fontSize: 13, fontWeight: '600' }}>Yeni Sohbet</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  const remainingMessages = Math.max(DAILY_LIMIT - dailyCount, 0);
  const isLimitReached = dailyCount >= DAILY_LIMIT;

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    if (isLimitReached) {
      const limitMsg = { id: Date.now(), role: 'assistant', text: 'Günlük mesaj limitinize ulaştınız (5/5). Yarın tekrar soru sorabilirsiniz.\n\nAcil sağlık konularında lütfen bir sağlık kuruluşuna başvurun.' };
      setMessages(prev => [...prev, limitMsg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return;
    }

    const userMsg = { id: Date.now(), role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    incrementCount();

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    setTimeout(() => {
      const response = getResponse(msg);
      const aiMsg = { id: Date.now() + 1, role: 'assistant', text: response };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800 + Math.random() * 1200);
  };

  const s = getStyles(theme);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={s.chatArea}
        contentContainerStyle={s.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(msg => (
          <View key={msg.id} style={[s.bubble, msg.role === 'user' ? s.userBubble : s.aiBubble]}>
            {msg.role === 'assistant' && (
              <View style={s.aiAvatar}>
                <Ionicons name="medical" size={16} color="#fff" />
              </View>
            )}
            <View style={[s.bubbleContent, msg.role === 'user' ? s.userContent : s.aiContent]}>
              <Text style={[s.bubbleText, msg.role === 'user' ? s.userText : s.aiText]}>{msg.text}</Text>
            </View>
          </View>
        ))}

        {isTyping && (
          <View style={[s.bubble, s.aiBubble]}>
            <View style={s.aiAvatar}>
              <Ionicons name="medical" size={16} color="#fff" />
            </View>
            <View style={[s.bubbleContent, s.aiContent, s.typingBubble]}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={s.typingText}>Yazıyor...</Text>
            </View>
          </View>
        )}

        {/* Quick Questions - show only at start */}
        {messages.length === 1 && (
          <View style={s.quickSection}>
            <Text style={s.quickTitle}>Hızlı Sorular</Text>
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity key={i} style={s.quickBtn} onPress={() => sendMessage(q.text)} activeOpacity={0.7}>
                <Ionicons name={q.icon} size={20} color={theme.primary} />
                <Text style={s.quickText}>{q.text}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={s.inputBar}>
        <View style={s.limitBadge}>
          <Ionicons name="chatbubble-outline" size={12} color={isLimitReached ? theme.danger : theme.textMuted} />
          <Text style={[s.limitText, isLimitReached && { color: theme.danger }]}>{remainingMessages}/{DAILY_LIMIT}</Text>
        </View>
        <TextInput
          style={[s.input, isLimitReached && { opacity: 0.5 }]}
          placeholder={isLimitReached ? 'Günlük limit doldu' : 'Sağlıkla ilgili bir soru sorun...'}
          placeholderTextColor={theme.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          editable={!isLimitReached}
          onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || isLimitReached) && s.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || isTyping || isLimitReached}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={20} color={input.trim() && !isLimitReached ? '#fff' : theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Disclaimer - hide when keyboard is open */}
      {!keyboardVisible && (
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            ⚕️ Bu asistan genel bilgi verir, tıbbi tavsiye yerine geçmez.
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8 },

  bubble: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
    marginRight: 8, marginBottom: 2,
  },

  bubbleContent: { maxWidth: '78%', borderRadius: 18, padding: 14 },
  userContent: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  aiContent: {
    backgroundColor: theme.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },

  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: theme.text },

  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  typingText: { color: theme.textMuted, fontSize: 13 },

  quickSection: { marginTop: 8 },
  quickTitle: { fontSize: 14, fontWeight: '600', color: theme.textMuted, marginBottom: 10 },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: theme.cardBorder,
  },
  quickText: { flex: 1, fontSize: 14, color: theme.text },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  limitBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    position: 'absolute', top: -18, left: 16,
    backgroundColor: theme.card, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: theme.cardBorder,
  },
  limitText: { fontSize: 10, fontWeight: '600', color: theme.textMuted },
  input: {
    flex: 1, backgroundColor: theme.inputBg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 100, borderWidth: 1, borderColor: theme.inputBorder,
    color: theme.text,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: theme.surface },

  disclaimer: {
    paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.cardBorder,
  },
  disclaimerText: { fontSize: 11, color: theme.textMuted, textAlign: 'center' },
});
