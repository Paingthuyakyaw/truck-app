import { myanmarUITextStyle } from "@/constants/myanmar-font";
import type { TruckItem } from "@/stores/server/truck/typed";
import { Card } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

type TruckCardProps = {
  item: TruckItem;
  locale: "en" | "mm";
  labels: {
    fuelType: string;
    frontTire: string;
    backTire: string;
    chassisNo: string;
    engineNo: string;
  };
  onPress?: () => void;
};

function getTitle(model: string, year: string | number): string {
  const modelText = String(model ?? "").trim();
  const yearText = String(year ?? "").trim();
  if (modelText && yearText) return `${modelText} (${yearText})`;
  return modelText || yearText || "-";
}

export function TruckCardItem({
  item,
  locale,
  labels,
  onPress,
}: TruckCardProps) {
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const title = getTitle(item.model, item.modelYear);
  const plate = String(item.plateNo ?? "").trim() || "-";
  const fuel = String(item.fuelType ?? "").trim() || "-";
  const chassis = String(item.chassisNo ?? "").trim() || "-";
  const engine = String(item.engineNo ?? "").trim() || "-";
  const fTire = String(item.frontTire ?? "").trim() || "-";
  const bTire = String(item.backTire ?? "").trim() || "-";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
    >
      <Card className="mb-3 border border-slate-100 shadow-sm rounded-xl">
        <Card.Body className="p-4">
          {/* Top Header Row: Model Title & Branded License Plate Pill */}
          <View className="flex-row items-start justify-between border-b border-slate-100 pb-2.5 gap-x-3">
            <View className="flex-1 min-w-0">
              <Text
                className="text-base font-bold text-slate-900"
                style={style}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>

              {/* Secondary description field using the core primary color for value text */}
              <Text className="text-xs text-slate-400 mt-0.5" style={style}>
                {labels.fuelType}:{" "}
                <Text className="font-semibold text-[#3F5F87]">{fuel}</Text>
              </Text>
            </View>

            {/* Theme Upgraded: License Plate tag using primarySoft container and primary text colors */}
            <View className="shrink-0 bg-[#EAF1F8] px-2.5 py-1 rounded-md">
              <Text className="text-xs font-bold text-[#3F5F87] font-mono tracking-wide">
                {plate}
              </Text>
            </View>
          </View>

          {/* Grid Metadata Parameters Section */}
          <View className="mt-3 gap-y-3">
            {/* Row 1: Identification Layout (Chassis & Engine) */}
            <View className="flex-row justify-between gap-x-3">
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[10px] text-slate-400 font-bold uppercase tracking-wider"
                  style={style}
                >
                  {labels.chassisNo}
                </Text>
                <Text
                  className="text-xs font-semibold text-slate-800 font-mono mt-0.5"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {chassis}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[10px] text-slate-400 font-bold uppercase tracking-wider"
                  style={style}
                >
                  {labels.engineNo}
                </Text>
                <Text
                  className="text-xs font-semibold text-slate-800 font-mono mt-0.5"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {engine}
                </Text>
              </View>
            </View>

            {/* Row 2: Mechanical Wheel dimensions nested in primarySoft brand panels */}
            <View className="bg-[#EAF1F8]/30 border border-[#EAF1F8] rounded-lg p-2.5 flex-row justify-between gap-x-4">
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[9px] text-[#3F5F87] font-bold uppercase tracking-wide"
                  style={style}
                >
                  {labels.frontTire}
                </Text>
                <Text
                  className="text-xs font-semibold text-slate-700 mt-0.5"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {fTire}
                </Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-[9px] text-[#3F5F87] font-bold uppercase tracking-wide"
                  style={style}
                >
                  {labels.backTire}
                </Text>
                <Text
                  className="text-xs font-semibold text-slate-700 mt-0.5"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {bTire}
                </Text>
              </View>
            </View>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}
