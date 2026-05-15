import { myanmarUITextStyle } from "@/constants/myanmar-font";
import type { UserTeamItem } from "@/stores/server/user/typed";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import {useTranslation} from "@/hooks/use-translation";

type TeamUserCardProps = {
  item: UserTeamItem;
  locale: "en" | "mm";
  onPress?: () => void;
};

export function TeamUserCard({ item, locale, onPress }: TeamUserCardProps) {
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const tLookup = useTranslation('lookup')

  return (
    <Pressable onPress={onPress}>
      <Card className="mb-3 ">
        <Card.Body className="px-4 py-4">
          <View className="flex-row items-start justify-between">
            <View className="max-w-[72%]">
              <Text className="text-[18px] font-bold text-slate-900" style={style}>
                {item.fullName}
              </Text>
              <Text className="mt-1 text-base text-slate-500">
                {item.phoneNumber || item.username}
              </Text>
              <Text className="text-base text-slate-500">{item.email}</Text>
            </View>

            <View className="rounded-xl bg-[#EAF1F8] px-3 py-2">
              <Text className="text-xs font-semibold text-[#3F5F87]">
                {(tLookup.roles as any) [item.role] || 'Unknown Role'}
              </Text>
            </View>
          </View>

          <View className="my-3 h-px bg-slate-200" />

          <View className="flex-row items-center gap-5">
            <View className="flex-row items-center gap-2">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.active ? "#22c55e" : "#94a3b8" }}
              />
              <Text className="text-sm leading-5 text-slate-600">
                {item.active ? "Active" : "Inactive"}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Ionicons
                name={item.notLocked ? "lock-open-outline" : "lock-closed-outline"}
                size={15}
                color={item.notLocked ? "#10b981" : "#ef4444"}
              />
              <Text className="text-sm leading-5 text-slate-600">
                {item.notLocked ? "Unlocked" : "Locked"}
              </Text>
            </View>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}
