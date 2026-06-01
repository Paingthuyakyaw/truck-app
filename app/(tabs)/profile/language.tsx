import {APP_COLORS} from "@/constants/colors";
import {getMyanmarLeadingClass, myanmarUITextStyle} from "@/constants/myanmar-font";
import {useLocaleStore} from "@/stores/client/locale-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useRouter} from "expo-router";
import {Card} from "heroui-native";
import React, {useMemo} from "react";
import {Pressable, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useTranslation} from "@/hooks/use-translation";

const LANGUAGES = [
    {key: "mm" as const, short: "မြ", english: "Myanmar"},
    {key: "en" as const, short: "En", english: "English"},
];

export default function LanguageScreen() {

    const router = useRouter();
    const locale = useLocaleStore((state) => state.locale);
    const setLocale = useLocaleStore((state) => state.setLocale);
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const textStyle = locale === "mm" ? mmTextStyle : undefined;
    const t = useTranslation('language')

    return (
        <SafeAreaView className="flex-1" style={{backgroundColor: APP_COLORS.background}}>

            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={() => router.navigate("/profile")}
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={({pressed}) => ({
                        backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                    })}
                >
                    <Ionicons name="arrow-back" size={22} color="#475569"/>
                </Pressable>
                <Text
                    className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)}  font-bold `}
                    style={[textStyle, {color: APP_COLORS.textPrimary}]}
                >
                    {t.languagePageTitle}
                </Text>
                <View className="h-11 w-11"/>
            </View>

            <View className="px-4">
                <Card
                    className=" p-2"
                    style={{
                        backgroundColor: APP_COLORS.card,
                        borderColor: APP_COLORS.border,
                        borderWidth: 1
                    }}
                >
                    <Card.Body className="p-0">
                        {LANGUAGES.map((item, index) => {
                            const active = locale === item.key;
                            return (
                                <Pressable
                                    key={item.key}
                                    onPress={() => setLocale(item.key)}
                                    style={({pressed}) => ({
                                        backgroundColor: pressed ? APP_COLORS.primarySoft : "#fff",
                                        borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
                                        borderBottomColor: "#e5e7eb",
                                    })}
                                >
                                    <View className="flex-row items-center gap-3 px-4 py-3">
                                        <View className="h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                                            <Text
                                                className={`text-sm font-bold text-slate-700 ${getMyanmarLeadingClass('mm')}`}
                                                style={textStyle}
                                            >
                                                {item.short}
                                            </Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text
                                                className={`text-sm font-semibold text-slate-900  ${getMyanmarLeadingClass('mm')}`}
                                                style={textStyle}
                                            >
                                                {item.key === "mm"
                                                    ? t.languageMyanmar
                                                    : t.languageEnglish}
                                            </Text>
                                            <Text
                                                className="text-sm text-slate-500"
                                                style={textStyle}
                                            >
                                                {item.english}
                                            </Text>
                                        </View>
                                        {active ? (
                                            <View
                                                className="h-5 w-5 items-center justify-center rounded-full"
                                                style={{backgroundColor: APP_COLORS.primary}}
                                            >
                                                <Ionicons name="checkmark" size={16} color="#fff"/>
                                            </View>
                                        ) : null}
                                    </View>
                                </Pressable>
                            );
                        })}
                    </Card.Body>
                </Card>
            </View>

        </SafeAreaView>
    );
}
