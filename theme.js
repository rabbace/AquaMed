import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_PRESETS = {
  ocean:    { id: 'ocean',    name: 'Okyanus',     emoji: '🌊', primary: '#2196F3', primaryLight: '#E3F2FD', headerBg: '#1976D2', darkPrimaryLight: '#1a3a5c' },
  forest:   { id: 'forest',   name: 'Orman',       emoji: '🌿', primary: '#2E7D32', primaryLight: '#E8F5E9', headerBg: '#1B5E20', darkPrimaryLight: '#1a3524' },
  sunset:   { id: 'sunset',   name: 'Gün Batımı',  emoji: '🌅', primary: '#FF5722', primaryLight: '#FBE9E7', headerBg: '#BF360C', darkPrimaryLight: '#3d1a10' },
  lavender: { id: 'lavender', name: 'Lavanta',     emoji: '💜', primary: '#7B1FA2', primaryLight: '#F3E5F5', headerBg: '#4A148C', darkPrimaryLight: '#2a1a3e' },
  rose:     { id: 'rose',     name: 'Gül',         emoji: '🌹', primary: '#E91E63', primaryLight: '#FCE4EC', headerBg: '#880E4F', darkPrimaryLight: '#3d1a2a' },
  teal:     { id: 'teal',     name: 'Camgöbeği',   emoji: '🩵', primary: '#00897B', primaryLight: '#E0F2F1', headerBg: '#004D40', darkPrimaryLight: '#1a3530' },
  gold:     { id: 'gold',     name: 'Altın',       emoji: '✨', primary: '#F9A825', primaryLight: '#FFFDE7', headerBg: '#F57F17', darkPrimaryLight: '#3d2e00' },
};

function buildTheme(isDark, presetId) {
  const p = THEME_PRESETS[presetId] || THEME_PRESETS.ocean;

  if (isDark) {
    return {
      dark: true,
      bg: '#0d1117',
      card: '#161b22',
      cardBorder: '#21262d',
      text: '#e6edf3',
      textSecondary: '#8b949e',
      textMuted: '#6e7681',
      primary: p.primary,
      primaryLight: p.darkPrimaryLight,
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
  }

  return {
    dark: false,
    bg: '#f8f9fa',
    card: '#ffffff',
    cardBorder: '#f0f0f0',
    text: '#1a1a2e',
    textSecondary: '#666',
    textMuted: '#999',
    primary: p.primary,
    primaryLight: p.primaryLight,
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
    headerBg: p.headerBg,
    headerText: '#ffffff',
    inputBg: '#fafafa',
    inputBorder: '#e0e0e0',
    overlay: 'rgba(0,0,0,0.5)',
    shadow: '#000',
  };
}

export const ThemeContext = createContext({
  theme: buildTheme(false, 'ocean'),
  isDark: false,
  toggleTheme: () => {},
  autoTheme: false,
  toggleAutoTheme: () => {},
  themeId: 'ocean',
  setThemeById: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [autoTheme, setAutoThemeState] = useState(false);
  const [themeId, setThemeIdState] = useState('ocean');

  useEffect(() => {
    AsyncStorage.getItem('theme').then(val => { if (val === 'dark') setIsDark(true); });
    AsyncStorage.getItem('autoTheme').then(val => { if (val === 'true') setAutoThemeState(true); });
    AsyncStorage.getItem('themeId').then(val => { if (val && THEME_PRESETS[val]) setThemeIdState(val); });
  }, []);

  // Auto theme: dark between 20:00-07:00
  useEffect(() => {
    if (!autoTheme) return;
    const checkTime = () => {
      const h = new Date().getHours();
      setIsDark(h >= 20 || h < 7);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [autoTheme]);

  const toggleTheme = async () => {
    if (autoTheme) return;
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

  const setThemeById = async (id) => {
    if (!THEME_PRESETS[id]) return;
    setThemeIdState(id);
    await AsyncStorage.setItem('themeId', id);
  };

  const theme = buildTheme(isDark, themeId);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, autoTheme, toggleAutoTheme, themeId, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}
