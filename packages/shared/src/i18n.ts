/** 지원 언어 (기획서 1장) */
export const SUPPORTED_LOCALES = ["ko", "en", "ja", "es"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";
