import { defaultNS, resources } from "@my-app/i18n";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

i18next.use(initReactI18next).init({
  resources,
  defaultNS,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18next;
