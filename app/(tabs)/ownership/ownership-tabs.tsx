import { APP_COLORS } from "@/constants/colors";
import { getMyanmarLeadingClass } from "@/constants/myanmar-font";
import { AppLocale } from "@/stores/client/locale-store";
import type { OwnershipTruckStatus } from "@/stores/server/ownership/search-columns";
import React from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Pressable, Text, View } from "react-native";

type OwnershipTabsProps = {
  value: OwnershipTruckStatus;
  onChange: (next: OwnershipTruckStatus) => void;
  labels: Record<OwnershipTruckStatus, string>;
  style?: StyleProp<TextStyle>;
  locale: AppLocale;
};

const TABS: OwnershipTruckStatus[] = ["ACTIVE", "SOLD_OUT"];

export function OwnershipTabs({
  value,
  onChange,
  labels,
  style,
  locale,
}: OwnershipTabsProps) {
  return (
    <View className="mb-3 flex-row rounded-2xl border border-slate-200 bg-white p-2">
      {TABS.map((tab) => {
        const active = tab === value;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            className="flex-1 items-center justify-center rounded-xl px-1 py-2.5"
            style={active ? { backgroundColor: APP_COLORS.primary } : undefined}
          >
            <Text
              className={`text-sm font-semibold ${getMyanmarLeadingClass(locale)} ${active ? "text-white" : "text-slate-500"}`}
              numberOfLines={1}
              style={style}
            >
              {labels[tab]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
