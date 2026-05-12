import type { AppLocale } from "@/stores/client/locale-store";
import { Platform, type TextStyle } from "react-native";
import { myanmarUITextStyle } from "./myanmar-font";

/** Single-line list/search inputs: same numeric typography for en and mm; mm adds font only. */
/** Avoid `py-*` here so vertical padding from `compact*InputTextStyle` is not overridden by NativeWind. */
export const COMPACT_LINE_INPUT_CLASSNAME =
  "h-10 max-h-10 rounded-xl px-3 text-sm";

/** Advanced filter single-line fields (12px) — en/mm share the same metrics. */
export const COMPACT_ADVANCED_INPUT_CLASSNAME =
  "h-11 py-0 rounded-xl px-2.5 text-xs";

/** Search toolbar: outer shell with border; filter/clear render inside the row. */
export const COMPACT_SEARCH_BAR_ROW_CLASSNAME =
  "min-h-10 flex-1 flex-row items-center rounded-xl border border-slate-200 bg-white";

/** Text field inside {@link COMPACT_SEARCH_BAR_ROW_CLASSNAME} (shell draws the outline). */
export const COMPACT_SEARCH_BAR_INPUT_CLASSNAME =
  " py-0   flex-1 border-0 bg-transparent px-3 text-sm";

const androidSingleLineAlign: TextStyle =
  Platform.OS === "android" ? { textAlignVertical: "center" } : {};

const LINE_METRICS: TextStyle = {
  fontSize: 14,
  lineHeight: 20,
  paddingVertical: 0,
  paddingTop: 0,
  paddingBottom: 0,
  ...androidSingleLineAlign,
};

const ADVANCED_METRICS: TextStyle = {
  fontSize: 12,
  lineHeight: 18,
  paddingVertical: 0,
  paddingTop: 0,
  paddingBottom: 0,
  ...androidSingleLineAlign,
};

function withMyanmarFont(locale: AppLocale, metrics: TextStyle): TextStyle {
  if (locale === "mm") {
    return { ...metrics, ...myanmarUITextStyle() };
  }
  return metrics;
}

/** Myanmar Sangam MN / Noto metrics sit high in the line box on iOS; nudge baseline down slightly. */
function mmIosSingleLineNudge(locale: AppLocale): TextStyle {
  if (locale !== "mm" || Platform.OS !== "ios") return {};
  return { paddingTop: 3 };
}

export function compactLineInputTextStyle(locale: AppLocale): TextStyle {
  return withMyanmarFont(locale, {
    ...LINE_METRICS,
    ...mmIosSingleLineNudge(locale),
  });
}

export function compactAdvancedInputTextStyle(locale: AppLocale): TextStyle {
  return withMyanmarFont(locale, {
    ...ADVANCED_METRICS,
    ...mmIosSingleLineNudge(locale),
  });
}

const MULTILINE_METRICS: TextStyle = {
  fontSize: 14,
  lineHeight: 22,
  paddingTop: Platform.OS === "ios" ? 10 : 8,
  paddingBottom: Platform.OS === "ios" ? 10 : 8,
};

export function compactMultilineInputTextStyle(locale: AppLocale): TextStyle {
  return withMyanmarFont(locale, MULTILINE_METRICS);
}
