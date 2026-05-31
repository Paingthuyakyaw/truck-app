import {myanmarUITextStyle, getMyanmarLeadingClass} from "@/constants/myanmar-font";
import type {ServiceTypeItem} from "@/stores/server/service-type/typed";
import React, {useMemo} from "react";
import {Pressable, Text, View} from "react-native";
import {APP_COLORS} from "@/constants/colors";
import {Card} from "heroui-native";

type Props = {
    item: ServiceTypeItem;
    locale: "en" | "mm";
    onPress?: () => void;
};

export function ServiceTypeCardItem({item, locale, onPress}: Props) {

    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;

    const code = (item.serviceType ?? "").trim() || "—";
    const eng = (item.langEng ?? "").trim() || "—";
    const my = (item.langMy ?? "").trim() || "—";

    const isClickable = !!onPress;

    return (
        <Pressable
            onPress={onPress}
            disabled={!isClickable}
            style={({pressed}) => [{opacity: pressed ? 0.7 : 1}]}
        >
            <Card
                className="mb-3 shadow-sm"
                style={{
                    backgroundColor: APP_COLORS.card,
                    borderColor: APP_COLORS.border,
                    borderWidth: 1
                }}
            >
                <Card.Body className="p-0">

                    <View className="flex-row items-center justify-between gap-x-2 pb-1">
                        <Text
                            className={`text-sm font-bold ${getMyanmarLeadingClass(locale)}`}
                            style={[style, {color: APP_COLORS.textPrimary}]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {code}
                        </Text>

                    </View>

                    <View className="mt-1 flex-row items-center w-full">

                        <View style={{width: 65}}>
                            <Text
                                className={`text-xs font-normal ${getMyanmarLeadingClass(locale)}`}
                                style={[{color: APP_COLORS.textMuted}, style]}
                            >
                                English
                            </Text>
                        </View>

                        <Text style={[{color: APP_COLORS.textMuted}, style]} className="text-xs mr-2">:</Text>

                        <View style={{flex: 1}}>
                            <Text
                                className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                                style={[{color: APP_COLORS.textSecondary}, style]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {eng}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-0.5 flex-row items-center w-full">

                        <View style={{width: 65}}>
                            <Text
                                className={`text-xs font-normal ${getMyanmarLeadingClass('mm')}`}
                                style={[{color: APP_COLORS.textMuted}, style]}
                            >
                                မြန်မာ
                            </Text>
                        </View>

                        <Text style={[{color: APP_COLORS.textMuted}, style]} className="text-xs mr-2">:</Text>

                        <View style={{flex: 1}}>
                            <Text
                                className={`text-xs font-semibold ${getMyanmarLeadingClass('mm')}`}
                                style={[{color: APP_COLORS.textSecondary}, style]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {my}
                            </Text>
                        </View>
                    </View>
                </Card.Body>
            </Card>
        </Pressable>
    );
}
