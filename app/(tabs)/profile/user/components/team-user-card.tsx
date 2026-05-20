import { myanmarUITextStyle } from "@/constants/myanmar-font";
import type { UserTeamItem } from "@/stores/server/user/typed";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "@/hooks/use-translation";

type TeamUserCardProps = {
    item: UserTeamItem;
    locale: "en" | "mm";
    onPress?: () => void;
};

export function TeamUserCard({ item, locale, onPress }: TeamUserCardProps) {
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;
    const tLookup = useTranslation('lookup');

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
            <Card className="mb-3 border border-slate-100 shadow-sm">
                <Card.Body className="p-4">

                    {/* Top Row: Name and Role Badge Only */}
                    <View className="flex-row items-start justify-between gap-x-3">
                        <View className="flex-1 min-w-0">
                            <Text
                                className="text-base font-bold text-slate-900"
                                style={style}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {item.fullName || "-"}
                            </Text>

                            {/* Phone / Contact Field */}
                            <View className="mt-1.5 flex-row items-center gap-x-1.5">
                                <Ionicons name="call-outline" size={13} color="#94a3b8" />
                                <Text className="text-xs font-medium text-slate-500 font-mono">
                                    {item.phoneNumber || "-"}
                                </Text>
                            </View>
                        </View>

                        {/* Right Tag Column (Keeps its clean structure) */}
                        <View className="shrink-0 bg-[#EAF1F8] rounded-md px-2.5 py-1.5">
                            <Text className="text-[12px] font-bold text-[#3F5F87] font-mono tracking-wide" style={style}>
                                {(tLookup.roles as any)[item.role] || "-"}
                            </Text>
                        </View>
                    </View>

                    {/* Middle Row: Full Width Email Field (Spans start to end) */}
                    <View className="mt-2 flex-row items-center gap-x-1.5 w-full">
                        <Ionicons name="mail-outline" size={13} color="#94a3b8" />
                        <Text
                            className="text-xs text-slate-500 flex-1"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {item.email || "-"}
                        </Text>
                    </View>

                    {/* Lightweight visual divider */}
                    <View className="my-3 h-[0.5px] bg-slate-200/60" />

                    {/* Bottom Section: Explicit Status Flags */}
                    <View className="flex-row items-center flex-wrap gap-y-2">

                        {/* Active Status Badge */}
                        <View className="flex-row items-center mr-5">
                            <View
                                className="h-2 w-2 rounded-full mr-1.5"
                                style={{ backgroundColor: item.active ? "#10b981" : "#94a3b8" }}
                            />
                            <Text className="text-xs font-medium text-slate-600" style={style}>
                                {item.active ? "Active" : "Inactive"}
                            </Text>
                        </View>

                        {/* Security Status Badge */}
                        <View className="flex-row items-center">
                            <View className="mr-1.5">
                                <Ionicons
                                    name={item.notLocked ? "lock-open-outline" : "lock-closed-outline"}
                                    size={13}
                                    color={item.notLocked ? "#10b981" : "#ef4444"}
                                />
                            </View>
                            <Text className="text-xs font-medium text-slate-600" style={style}>
                                {item.notLocked ? "Unlocked" : "Locked"}
                            </Text>
                        </View>

                    </View>
                </Card.Body>
            </Card>
        </Pressable>
    );
}
