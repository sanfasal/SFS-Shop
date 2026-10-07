"use client";

import { useSyncExternalStore } from "react";

export const LANGUAGES = {
  km: "ខ្មែរ",
  en: "English",
} as const;

export type Language = keyof typeof LANGUAGES;

const DEFAULT_LANGUAGE: Language = "km";
const STORAGE_KEY = "sfs-shop:language";
const CHANGE_EVENT = "sfs-shop:language-change";

// Static storefront text. Product data (names, codes) comes from the API as-is.
const messages = {
  km: {
    price: "តម្លៃ",
    outOfStock: "អស់ពីស្តុក",
    code: "លេខកូដ",
    viewDetails: "មើលលម្អិត",
  },
  en: {
    price: "Price",
    outOfStock: "Out of stock",
    code: "Code",
    viewDetails: "View details",
  },
} satisfies Record<Language, Record<string, string>>;

export type MessageKey = keyof (typeof messages)["km"];

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && value in LANGUAGES;
}

function getSnapshot(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function subscribe(onChange: () => void) {
  // Same-tab changes come through our event; other tabs through "storage".
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function setLanguage(language: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage unavailable (private mode); nothing to persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LANGUAGE);
  const t = (key: MessageKey) => messages[language][key];
  return { language, setLanguage, t };
}
