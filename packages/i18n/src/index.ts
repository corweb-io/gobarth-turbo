import i18next from "i18next";
import en from "./locales/en";
import fr from "./locales/fr";

export const defaultNS = "translation";

export const resources = { en: { translation: en }, fr: { translation: fr } };

export type TranslationKeys = typeof en;

export { i18next };
