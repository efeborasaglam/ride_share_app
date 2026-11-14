// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import de from "./src/locales/de.json";
import en from "./src/locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: getLocales()[0]?.languageCode ?? "de",
  fallbackLng: "en",
  keySeparator: false, // nötig, weil deine Keys "auth.login" flach sind
  interpolation: { escapeValue: false },
});

export default i18n;
