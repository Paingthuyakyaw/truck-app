import { APP_COLORS } from "@/constants/colors";
import type { AppLocale } from "@/stores/client/locale-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Input } from "heroui-native";
import React from "react";
import { Pressable, View } from "react-native";

const TEAM_SEARCH_INPUT_CLASSNAME =
  "flex-1 border h-11 py-0 text-sm border-slate-200 bg-white ";

type TeamSearchToolbarProps = {
  locale: AppLocale;
  quickQuery: string;
  placeholder: string;
  advancedOpen: boolean;
  onChangeQuickQuery: (value: string) => void;
  onClearQuickQuery: () => void;
  onToggleAdvanced: () => void;
  onPressAdd: () => void;
};

export function TeamSearchToolbar({
  locale: _locale,
  quickQuery,
  placeholder,
  advancedOpen,
  onChangeQuickQuery,
  onClearQuickQuery,
  onToggleAdvanced,
  onPressAdd,
}: TeamSearchToolbarProps) {
  return (
    <View className="mb-4 flex-row items-center gap-2">
      <View className="relative flex-1">
        <Input
          value={quickQuery}
          onChangeText={onChangeQuickQuery}
          placeholder={placeholder}
          className={TEAM_SEARCH_INPUT_CLASSNAME}
          style={{ paddingRight: 44 }}
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
            size={20}
            color={APP_COLORS.primary}
          />
        </Pressable>
      </View>

      {!!quickQuery && (
        <Pressable
          onPress={onClearQuickQuery}
          className="items-center justify-center rounded-full border border-slate-200 bg-white p-2.5"
        >
          <Ionicons name="close" size={18} color="#4A7CFF" />
        </Pressable>
      )}

      <Pressable
        onPress={onPressAdd}
        className="items-center justify-center rounded-full p-2.5"
        style={{ backgroundColor: APP_COLORS.primary }}
      >
        <Ionicons name="add" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}
