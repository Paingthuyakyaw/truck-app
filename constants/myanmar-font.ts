import type { AppLocale } from "@/stores/client/locale-store";
import type { TextStyle } from "react-native";
import { Platform } from "react-native";

/**
 * Single Myanmar UI face per platform (no mixed font stacks).
 * Use the same `fontSize` / `lineHeight` as English; only `fontFamily` changes for `mm`.
 */
export function getMyanmarFontFamily(): string {
  if (Platform.OS === "web") {
    return "Noto Sans Myanmar";
  }
  return (
    Platform.select({
      ios: "Myanmar Sangam MN",
      android: "Noto Sans Myanmar",
      default: "sans-serif",
    }) ?? "sans-serif"
  );
}

/** Myanmar text: `fontFamily` only — match English sizing via className or shared metrics. */
export function myanmarUITextStyle(): TextStyle {
  return { fontFamily: getMyanmarFontFamily() };
}

/**
 * Tailwind class for tight Myanmar line metrics on **iOS only** (`leading-0`).
 * On Android and web, returns `""` so line boxes don’t collapse / hide glyphs.
 */
export function getMyanmarLeadingClass(locale: AppLocale): string {
  return locale === "mm" && Platform.OS === "ios" ? "leading-0" : "";
}
