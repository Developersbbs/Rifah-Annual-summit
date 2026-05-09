"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import "@/lib/i18n" // ensure i18n is initialized

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="font-bold border-2"
    >
      {i18n.language === 'en' ? 'தமிழ்' : 'English'}
    </Button>
  )
}
