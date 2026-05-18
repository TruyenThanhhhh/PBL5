import React, { createContext, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'uiLanguage';

function readStoredLanguage() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'en' || s === 'vi') return s;
  } catch {
    /* ignore */
  }
  return 'vi';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  const setLanguage = (lang) => {
    const next = lang === 'en' || lang === 'vi' ? lang : 'vi';
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
