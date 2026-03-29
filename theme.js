import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  dark: false,
  bg: '#f8f9fa',
  card: '#ffffff',
  cardBorder: '#f0f0f0',
  text: '#1a1a2e',
  textSecondary: '#666',
  textMuted: '#999',
  primary: '#2196F3',
  primaryLight: '#E3F2FD',
  accent: '#4CAF50',
  accentLight: '#E8F5E9',
  danger: '#EF5350',
  dangerLight: '#FFEBEE',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  purple: '#9C27B0',
  purpleLight: '#F3E5F5',
  pinkLight: '#FCE4EC',
  surface: '#f0f0f0',
  tabBar: '#ffffff',
  tabBarBorder: '#e0e0e0',
  headerBg: '#2196F3',
  headerText: '#ffffff',
  inputBg: '#fafafa',
  inputBorder: '#e0e0e0',
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000',
};

export const darkTheme = {
  dark: true,
  bg: '#0d1117',
  card: '#161b22',
  cardBorder: '#21262d',
  text: '#e6edf3',
  textSecondary: '#8b949e',
  textMuted: '#6e7681',
  primary: '#58a6ff',
  primaryLight: '#1a3a5c',
  accent: '#3fb950',
  accentLight: '#1a3524',
  danger: '#f85149',
  dangerLight: '#3d1214',
  warning: '#d29922',
  warningLight: '#3d2e00',
  purple: '#bc8cff',
  purpleLight: '#2a1a3e',
  pinkLight: '#3d1a2a',
  surface: '#21262d',
  tabBar: '#161b22',
  tabBarBorder: '#21262d',
  headerBg: '#161b22',
  headerText: '#e6edf3',
  inputBg: '#0d1117',
  inputBorder: '#30363d',
  overlay: 'rgba(0,0,0,0.7)',
  shadow: '#000',
};

export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [autoTheme, setAutoThemeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => {
      if (val === 'dark') setIsDark(true);
    });
    AsyncStorage.getItem('autoTheme').then(val => {
      if (val === 'true') setAutoThemeState(true);
    });
  }, []);

  // Auto theme: dark between 20:00-07:00
  useEffect(() => {
    if (!autoTheme) return;
    const checkTime = () => {
      const h = new Date().getHours();
      const shouldBeDark = h >= 20 || h < 7;
      setIsDark(shouldBeDark);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [autoTheme]);

  const toggleTheme = async () => {
    if (autoTheme) return; // ignore manual toggle when auto is on
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  const toggleAutoTheme = async () => {
    const newVal = !autoTheme;
    setAutoThemeState(newVal);
    await AsyncStorage.setItem('autoTheme', newVal ? 'true' : 'false');
    if (newVal) {
      const h = new Date().getHours();
      setIsDark(h >= 20 || h < 7);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, autoTheme, toggleAutoTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
