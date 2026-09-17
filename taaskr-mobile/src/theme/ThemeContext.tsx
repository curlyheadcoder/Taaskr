import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { colors } from './colors';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  themeColors: typeof colors.dark;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const THEME_STORE_KEY = 'taaskr_user_theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
  themeColors: colors.dark,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_STORE_KEY);
        if (stored === 'light' || stored === 'dark') {
          setThemeState(stored);
        }
      } catch (e) {
        // Fallback to default dark
      }
    })();
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      await SecureStore.setItemAsync(THEME_STORE_KEY, mode);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const themeColors = theme === 'dark' ? colors.dark : colors.light;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeColors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
