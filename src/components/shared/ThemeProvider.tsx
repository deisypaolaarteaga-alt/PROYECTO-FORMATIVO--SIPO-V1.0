'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ACCENT_THEMES, type AccentTheme } from '@/lib/design-tokens';

export interface UserPreferences {
  accentColor: string;
  density: 'compact' | 'normal' | 'spacious';
  showCompanyName: boolean;
  defaultCity: string;
}

const DEFAULT_PREFS: UserPreferences = {
  accentColor: '#E8571A',
  density: 'normal',
  showCompanyName: true,
  defaultCity: 'Bogotá',
};

interface ThemeContextType {
  prefs: UserPreferences;
  updatePref: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPrefs: () => void;
  accentThemeKey: AccentTheme;
}

const ThemeContext = createContext<ThemeContextType>({
  prefs: DEFAULT_PREFS,
  updatePref: () => {},
  resetPrefs: () => {},
  accentThemeKey: 'orange',
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getAccentKey(color: string): AccentTheme {
  for (const [key, val] of Object.entries(ACCENT_THEMES)) {
    if (val.primary === color) return key as AccentTheme;
  }
  return 'orange';
}

function applyCSS(prefs: UserPreferences) {
  const key = getAccentKey(prefs.accentColor);
  const theme = ACCENT_THEMES[key];
  const root = document.documentElement;
  root.style.setProperty('--accent-primary', theme.primary);
  root.style.setProperty('--accent-hover', theme.hover);
  root.style.setProperty('--accent-pale', theme.pale);

  // Density
  const densityMap = { compact: '13px', normal: '15px', spacious: '16px' };
  root.style.setProperty('font-size', densityMap[prefs.density]);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  // Load from Supabase
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (profile?.preferences) {
        const merged = { ...DEFAULT_PREFS, ...profile.preferences };
        setPrefs(merged);
        applyCSS(merged);
      } else {
        applyCSS(DEFAULT_PREFS);
      }
      setLoaded(true);
    })();
  }, []);

  // Save with debounce
  const savePrefs = useCallback(
    (() => {
      let timer: NodeJS.Timeout;
      return (newPrefs: UserPreferences) => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase
            .from('profiles')
            .update({ preferences: newPrefs })
            .eq('id', user.id);
        }, 1000);
      };
    })(),
    []
  );

  const updatePref = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        applyCSS(next);
        savePrefs(next);
        return next;
      });
    },
    [savePrefs]
  );

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
    applyCSS(DEFAULT_PREFS);
    savePrefs(DEFAULT_PREFS);
  }, [savePrefs]);

  const accentThemeKey = getAccentKey(prefs.accentColor);

  // Apply on first load
  useEffect(() => {
    if (loaded) applyCSS(prefs);
  }, [loaded]);

  return (
    <ThemeContext.Provider value={{ prefs, updatePref, resetPrefs, accentThemeKey }}>
      {children}
    </ThemeContext.Provider>
  );
}
