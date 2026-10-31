"use client";

import { useEffect, useSyncExternalStore } from "react";

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
    products: "ផលិតផល",
    searchProducts: "ស្វែងរកផលិតផល...",
    all: "ទាំងអស់",
    createOrder: "បង្កើតការបញ្ជាទិញ",
    addProduct: "បន្ថែមផលិតផល",
    loadingProducts: "កំពុងផ្ទុកផលិតផល...",
    noProducts: "រកមិនឃើញផលិតផលទេ។",
    retry: "ព្យាយាមម្តងទៀត",
    previousPage: "ទំព័រមុន",
    nextPage: "ទំព័របន្ទាប់",
    pageOf: "ទំព័រ {page} នៃ {total}",
    backToProducts: "ត្រឡប់ទៅផលិតផល",
    loadingProduct: "កំពុងផ្ទុកផលិតផល...",
    productLoadError: "មិនអាចផ្ទុកផលិតផលនេះបានទេ។",
    invalidProduct: "ផលិតផលមិនត្រឹមត្រូវ។",
    noDescription: "គ្មានការពិពណ៌នា។",
    quantity: "ចំនួន",
    changeLanguage: "ប្តូរភាសា",
  },
  en: {
    price: "Price",
    outOfStock: "Out of stock",
    code: "Code",
    viewDetails: "View details",
    products: "Products",
    searchProducts: "Search products...",
    all: "All",
    createOrder: "Create order",
    addProduct: "Add product",
    loadingProducts: "Loading products...",
    noProducts: "No products found.",
    retry: "Retry",
    previousPage: "Previous page",
    nextPage: "Next page",
    pageOf: "Page {page} of {total}",
    backToProducts: "Back to products",
    loadingProduct: "Loading product...",
    productLoadError: "Couldn't load this product. Is the API running?",
    invalidProduct: "Invalid product.",
    noDescription: "No description.",
    quantity: "Qty",
    changeLanguage: "Change language",
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
  // Placeholders like {page} are filled from vars.
  const t = (key: MessageKey, vars?: Record<string, string | number>) =>
    messages[language][key].replace(/\{(\w+)\}/g, (match, name: string) =>
      vars && name in vars ? String(vars[name]) : match
    );
  return { language, setLanguage, t };
}

const SITE_NAME = "sfs-shop";

/**
 * Keeps the browser tab title and <html lang> in step with the chosen language.
 * The static metadata title can't do this since the language lives in localStorage.
 */
export function useDocumentTitle(title?: string) {
  const { language } = useLanguage();
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [language, title]);
}
