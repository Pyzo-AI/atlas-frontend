"use client";

import { useState } from "react";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

import enTranslations from "../i18n/locales/en.json";
import deTranslations from "../i18n/locales/de.json";

// Function to create a fresh instance per request/render with the correct initial locale
const initI18next = (locale) => {
  const instance = i18next.createInstance();
  instance.use(initReactI18next).init({
    resources: {
      en: { translation: enTranslations },
      de: { translation: deTranslations },
    },
    lng: locale || "en",
    fallbackLng: "en",
    supportedLngs: ["en", "de"],
    interpolation: {
      escapeValue: false,
    },
  });
  return instance;
};

export default function TranslationProvider({ children, locale }) {
  // Create the instance once per component lifecycle (works for both SSR and client)
  const [instance] = useState(() => initI18next(locale));

  // If the locale prop changes (e.g. client-side navigation), update the language synchronously
  if (instance.language !== locale) {
    instance.changeLanguage(locale);
  }

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
