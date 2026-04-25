import { createContext, useContext, useState } from 'react'
import { translations } from '../services/data'

const LanguageContext = createContext({ locale: 'en', setLocale: () => {}, t: translations.en })

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('en')
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
