import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Season } from '../types/app-types';

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
    primary: 'text-pink-600',
    secondary: 'bg-lime-200',
    accent: 'border-lime-400',
    background: 'bg-stone-50',
    text: 'text-stone-800',
    navActive: 'text-lime-300',
  },
  Summer: {
    primary: 'text-sky-600',
    secondary: 'bg-yellow-200',
    accent: 'border-sky-400',
    background: 'bg-stone-50',
    text: 'text-stone-800',
    navActive: 'text-yellow-300',
  },
  Fall: {
    primary: 'text-orange-700',
    secondary: 'bg-orange-200',
    accent: 'border-orange-500',
    background: 'bg-stone-50',
    text: 'text-stone-800',
    navActive: 'text-orange-300',
  },
  Winter: {
    primary: 'text-cyan-700',
    secondary: 'bg-cyan-100',
    accent: 'border-cyan-300',
    background: 'bg-stone-50',
    text: 'text-stone-800',
    navActive: 'text-cyan-200',
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
