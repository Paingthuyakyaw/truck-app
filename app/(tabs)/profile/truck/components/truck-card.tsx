import {myanmarUITextStyle} from "@/constants/myanmar-font";
import type {TruckItem} from "@/stores/server/truck/typed";
import {Card} from "heroui-native";
import React, {useMemo} from "react";
import {Pressable, Text, View} from "react-native";

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

export function TruckCardItem({item, locale, labels, onPress}: TruckCardProps) {
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;


    const title = getTitle(item.model, item.modelYear);
    const plate = String(item.plateNo ?? "").trim() || "-";
    const fuel = String(item.fuelType ?? "").trim() || "-";
    const chassis = String(item.chassisNo ?? "").trim() || "-";
    const engine = String(item.engineNo ?? "").trim() || "-";
    const fTire = String(item.frontTire ?? item.frontTire ?? "").trim() || "-";
    const bTire = String(item.backTire ?? item.backTire ?? "").trim() || "-";

    return (
        <Pressable onPress={onPress} disabled={!onPress}>
            <Card className="mb-3">
                <Card.Body className="px-2 py-3">
                    {/* Header Row : Plate Number && Vehicle Title Info */}
                    <View className="flex-row items-center justify-between border-b border-slate-100 pb-2">
                        <View className="flex-1 pr-2">
                            <Text className="text-[17px] font-bold text-slate-900" style={style}>
                                {title}
                            </Text>
                        </View>
                        <View className="bg-slate-100 px-2 py-0.5 rounded">
                            <Text className="text-sm font-semibold text-slate-700" style={style}>
                                {plate}
                            </Text>
                        </View>
                    </View>
                    {/* Details Body Grid layout */}
                    <View className="mt-2.5 gap-y-1.5">
                        {/* Row 1: Chassis & Engine Numbers */}
                        <View className="flex-row justify-between">
                            <View className="flex-1 pr-1">
                                <Text className="text-xs text-slate-500" style={style} numberOfLines={1}>
                                    {labels.chassisNo} | <Text className="font-medium text-slate-800">{chassis}</Text>
                                </Text>
                            </View>
                            <View className="flex-1 pl-1">
                                <Text className="text-xs text-slate-500" style={style} numberOfLines={1}>
                                    {labels.engineNo} | <Text className="font-medium text-slate-800">{engine}</Text>
                                </Text>
                            </View>
                        </View>

                        {/* Row 2: Tires Config  */}
                        <View className="flex-row justify-between">
                            <View className="flex-1 pr-1">
                                <Text className="text-xs text-slate-500" style={style} numberOfLines={1}>
                                    {labels.frontTire} | <Text className="font-medium text-slate-800">{fTire}</Text>
                                </Text>
                            </View>
                            <View className="flex-1 pl-1">
                                <Text className="text-xs text-slate-500" style={style} numberOfLines={1}>
                                    {labels.backTire} | <Text className="font-medium text-slate-800">{bTire}</Text>
                                </Text>
                            </View>
                        </View>

                        {/* Row 3: Fuel Type */}
                        <View className="flex-row justify-between pt-0.5">
                            <Text className="text-xs text-slate-500" style={style}>
                                {labels.fuelType} | <Text className="font-medium text-slate-800">{fuel}</Text>
                            </Text>
                        </View>

                    </View>

                </Card.Body>
            </Card>
        </Pressable>
    );
}
