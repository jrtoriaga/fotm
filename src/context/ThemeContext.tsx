import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Season } from '../types/app-types';

type ThemeColors = {
  primary: string; // Text color for headings/highlights
  secondary: string; // Background for active elements/badges
  accent: string; // Border colors
  background: string; // Page background
  text: string; // Body text
  navActive: string; // Active state in nav
};

type ThemeContextType = {
  season: Season;
  setSeason: (season: Season) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const seasonColors: Record<Season, ThemeColors> = {
  Spring: {
    primary: 'text-season-primary', secondary: 'bg-season-soft', accent: 'border-season',
    background: 'bg-app', text: 'text-ink', navActive: 'text-season-primary',
  },
  Summer: {
    primary: 'text-season-primary', secondary: 'bg-season-soft', accent: 'border-season',
    background: 'bg-app', text: 'text-ink', navActive: 'text-season-primary',
  },
  Fall: {
    primary: 'text-season-primary', secondary: 'bg-season-soft', accent: 'border-season',
    background: 'bg-app', text: 'text-ink', navActive: 'text-season-primary',
  },
  Winter: {
    primary: 'text-season-primary', secondary: 'bg-season-soft', accent: 'border-season',
    background: 'bg-app', text: 'text-ink', navActive: 'text-season-primary',
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<Season>('Spring');

  useEffect(() => {
    const saved = localStorage.getItem('fomt-season') as Season;
    if (saved && ['Spring', 'Summer', 'Fall', 'Winter'].includes(saved)) {
      setSeason(saved);
    }
  }, []);

  const handleSetSeason = (s: Season) => {
    setSeason(s);
    localStorage.setItem('fomt-season', s);
  };

  const colors = seasonColors[season];

  return (
    <ThemeContext.Provider value={{ season, setSeason: handleSetSeason, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
