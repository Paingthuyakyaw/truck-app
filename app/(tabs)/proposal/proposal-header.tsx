import { getMyanmarLeadingClass } from "@/constants/myanmar-font";
import { AppLocale } from "@/stores/client/locale-store";
import React from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Text, View } from "react-native";

type ProposalHeaderProps = {
  title: string;
  welcomeLabel: string;
  fullName: string;
  style?: StyleProp<TextStyle>;
  locale: AppLocale;
};

export function ProposalHeader({
  title,
  welcomeLabel,
  fullName,
  style,
  locale,
}: ProposalHeaderProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <View className="max-w-[72%]">
        <Text className="text-xs text-slate-500" style={style}>
          {welcomeLabel}
        </Text>
        <Text
          className="mt-1 text-[18px] font-semibold text-slate-900"
          style={style}
        >
          {fullName}
        </Text>
      </View>

      <Text
        className={`text-sm font-bold text-[#3b4f6b] ${getMyanmarLeadingClass(locale)}`}
        style={style}
      >
        {title}
      </Text>
    </View>
  );
}
