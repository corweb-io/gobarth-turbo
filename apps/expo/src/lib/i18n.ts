import { defaultNS, resources } from "@my-app/i18n";
import { getLocales } from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

i18next.use(initReactI18next).init({
  resources,
  defaultNS,
  lng: deviceLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
