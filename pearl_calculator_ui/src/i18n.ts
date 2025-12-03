import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import zh from './locales/zh.json';

export const defaultNS = 'translation';
export const resources = {
    en,
    zh,
} as const;

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        debug: import.meta.env.DEV,
        fallbackLng: 'en',
        lng: localStorage.getItem('i18nextLng') || 'en',
        detection: {
            order: ['localStorage'],
            caches: ['localStorage'],
        },
        defaultNS,
        resources,
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
