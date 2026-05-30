import type {AppLocale} from "@/stores/client/locale-store";
import {Input} from "heroui-native";
import React, {forwardRef} from "react";
import {
    Platform,
    TextInput,
    type TextInputProps
} from "react-native";
import {APP_COLORS} from "@/constants/colors";

export type CompactTextInputProps = TextInputProps & {
    locale: AppLocale;
    /** Use `advanced` for 12px advanced-filter fields. */
    compactVariant?: "line" | "advanced";
};

/**
 * Plain RN TextInput with compact typography (avoids HeroUI Input's fixed `py-3.5`,
 * which fights `h-10` and makes Myanmar placeholders look tall / bottom-heavy).
 */
export const CompactTextInput = forwardRef<TextInput, CompactTextInputProps>(
    function CompactTextInput(
        {locale, compactVariant = "line", className, style, ...rest},
        ref,
    ) {

        const {includeFontPadding: includeFontPaddingProp, ...inputRest} = rest;

        const includeFontPadding =
            Platform.OS === "android" && locale === "mm"
                ? false
                : includeFontPaddingProp;

        return (
            <Input
                ref={ref}
                className={className}
                placeholderTextColor={APP_COLORS.textMuted}
                style={[style, {
                    backgroundColor: APP_COLORS.inputBackground,
                    borderColor: APP_COLORS.border,
                    borderWidth: 1,
                    color: APP_COLORS.textPrimary
                }]}
                {...inputRest}
                {...(Platform.OS === "android" ? {includeFontPadding} : {})}
            />
        );
    },
);
