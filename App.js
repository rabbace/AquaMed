import { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from './theme';
import { hasSeenOnboarding } from './storage';
import { requestPermissions } from './notifications';
import HomeScreen from './screens/HomeScreen';
import WaterScreen from './screens/WaterScreen';
import MedicineScreen from './screens/MedicineScreen';
import FamilyScreen from './screens/FamilyScreen';
import AIChatScreen from './screens/AIChatScreen';
import CalorieScreen from './screens/CalorieScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import OnboardingScreen from './screens/OnboardingScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  'Ana Sayfa': { focused: 'home', unfocused: 'home-outline' },
  'Su': { focused: 'water', unfocused: 'water-outline' },
  'İlaçlar': { focused: 'medkit', unfocused: 'medkit-outline' },
  'Kalori': { focused: 'flame', unfocused: 'flame-outline' },
  'Asistan': { focused: 'chatbubble-ellipses', unfocused: 'chatbubble-ellipses-outline' },
  'İstatistik': { focused: 'bar-chart', unfocused: 'bar-chart-outline' },
  'Profil': { focused: 'people', unfocused: 'people-outline' },
};

function AppContent() {
  const { theme, isDark } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const seen = await hasSeenOnboarding();
    setShowOnboarding(!seen);
    await SplashScreen.hideAsync();
    requestPermissions();
  };

  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (showOnboarding) {
    return <OnboardingScreen onFinish={() => setShowOnboarding(false)} />;
  }

  const navTheme = {
    dark: isDark,
    colors: {
      primary: theme.primary,
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.cardBorder,
      notification: theme.danger,
    },
    fonts: DefaultTheme.fonts,
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            const icons = TAB_ICONS[route.name];
            const iconName = focused ? icons.focused : icons.unfocused;
            return <Ionicons name={iconName} size={22} color={color} />;
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: -2 },
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 85 : 62,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 6,
            backgroundColor: theme.tabBar,
            borderTopWidth: 1,
            borderTopColor: theme.tabBarBorder,
            elevation: 0,
          },
          headerStyle: {
            backgroundColor: theme.headerBg,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
        })}
      >
        <Tab.Screen name="Ana Sayfa" component={HomeScreen} options={{ headerShown: false }} />
        <Tab.Screen name="Su" component={WaterScreen} options={{ title: 'Su Takibi' }} />
        <Tab.Screen name="İlaçlar" component={MedicineScreen} />
        <Tab.Screen name="Kalori" component={CalorieScreen} options={{ title: 'Kalori Takibi' }} />
        <Tab.Screen name="Asistan" component={AIChatScreen} options={({ navigation }) => ({
          title: 'AI Asistan',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Ana Sayfa')} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={theme.headerText} />
            </TouchableOpacity>
          ),
        })} />
        <Tab.Screen name="İstatistik" component={StatisticsScreen} />
        <Tab.Screen name="Profil" component={FamilyScreen} options={{ title: 'Aile Profilleri' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
