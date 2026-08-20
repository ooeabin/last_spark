import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "@last-spark/shared";

import ko from "./locales/ko.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import es from "./locales/es.json";

const resources = { ko: { translation: ko }, en: { translation: en }, ja: { translation: ja }, es: { translation: es } };

function detectLocale(): SupportedLocale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
  return (SUPPORTED_LOCALES as readonly string[]).includes(deviceLocale)
    ? (deviceLocale as SupportedLocale)
    : DEFAULT_LOCALE;
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: { escapeValue: false },
});

export default i18n;
