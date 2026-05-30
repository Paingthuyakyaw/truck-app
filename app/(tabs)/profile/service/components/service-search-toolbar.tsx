import {APP_COLORS} from "@/constants/colors";
import {getMyanmarLeadingClass} from "@/constants/myanmar-font";
import type {AppLocale} from "@/stores/client/locale-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Input} from "heroui-native";
import React from "react";
import {Pressable, View} from "react-native";

type ServiceSearchToolbarProps = {
    locale: AppLocale;
    quickQuery: string;
    placeholder: string;
    advancedOpen: boolean;
    onChangeQuickQuery: (value: string) => void;
    onClearQuickQuery: () => void;
    onToggleAdvanced: () => void;
    onPressAdd: () => void;
};

export function ServiceSearchToolbar({
                                         locale: _locale,
                                         quickQuery,
                                         placeholder,
                                         advancedOpen,
                                         onChangeQuickQuery,
                                         onClearQuickQuery,
                                         onToggleAdvanced,
                                         onPressAdd,
                                     }: ServiceSearchToolbarProps) {
    return (
        <View className="mb-4 flex-row items-center gap-2">
            <View className="relative flex-1">
                <Input
                    value={quickQuery}
                    onChangeText={onChangeQuickQuery}
                    placeholder={placeholder}
                    placeholderTextColor={APP_COLORS.textMuted}
                    className={`flex-1 h-11 py-0 text-sm font-medium ${getMyanmarLeadingClass(_locale)}`}
                    style={{
                        paddingRight: 44,
                        backgroundColor:APP_COLORS.inputBackground,
                        borderColor:APP_COLORS.border,
                        borderWidth:1
                    }}
                />

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Advanced filters"
                    onPress={onToggleAdvanced}
                    className="absolute bottom-0 right-2 top-0 justify-center"
                    hitSlop={8}
                >
                    <Ionicons
                        name={advancedOpen ? "funnel" : "funnel-outline"}
                        size={22}
                        color={APP_COLORS.primary}
                    />
                </Pressable>
            </View>

            {!!quickQuery && (
                <Pressable
                    onPress={onClearQuickQuery}
                    className="items-center justify-center rounded-full border border-slate-200 bg-white p-2.5"
                >
                    <Ionicons name="close" size={22} color={APP_COLORS.primary} />
                </Pressable>
            )}

            <Pressable
                onPress={onPressAdd}
                className="items-center justify-center rounded-full p-2.5"
                style={({pressed}) => ({
                    backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary
                })}
            >
                <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
        </View>
    );
}
