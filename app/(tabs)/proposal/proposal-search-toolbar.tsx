import { APP_COLORS } from "@/constants/colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Input } from "heroui-native";
import React from "react";
import { Pressable, View } from "react-native";

type ProposalSearchToolbarProps = {
  quickQuery: string;
  placeholder: string;
  advancedOpen: boolean;
  onChangeQuickQuery: (next: string) => void;
  onClearQuickQuery: () => void;
  onToggleAdvanced: () => void;
  onPressAdd: () => void;
};

export function ProposalSearchToolbar({
  quickQuery,
  placeholder,
  advancedOpen,
  onChangeQuickQuery,
  onClearQuickQuery,
  onToggleAdvanced,
  onPressAdd,
}: ProposalSearchToolbarProps) {
  return (
    <View className="mb-4 flex-row items-center gap-2">
      <Input
        value={quickQuery}
        onChangeText={onChangeQuickQuery}
        placeholder={placeholder}
        className="flex-1 border border-slate-200 bg-white"
      />

      {!!quickQuery && (
        <Pressable
          onPress={onClearQuickQuery}
          className="items-center justify-center rounded-full border border-slate-200 bg-white p-2.5"
        >
          <Ionicons name="close" size={18} color={APP_COLORS.primary} />
        </Pressable>
      )}

      <Pressable
        onPress={onToggleAdvanced}
        className="items-center justify-center rounded-full border border-slate-200 bg-white p-2.5"
      >
        <Ionicons
          name={advancedOpen ? "funnel" : "funnel-outline"}
          size={18}
          color={APP_COLORS.primary}
        />
      </Pressable>

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
