import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {useAuth} from "@/hooks/use-auth";
import {useTranslation} from "@/hooks/use-translation";
import {useLocaleStore} from "@/stores/client/locale-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useRouter} from "expo-router";
import {Avatar, Button, Card} from "heroui-native";
import React, {useMemo} from "react";
import {Pressable, ScrollView, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useThrottledCallback} from '@/hooks/use-throttled-callback';

const SETTINGS_ROWS = [
    {
        key: "team",
        icon: "people" as const,
    },
    {
        key: "truck",
        icon: "car-sport" as const,
    },
    {
        key: "service",
        icon: "build" as const,
    },
    {
        key: "security",
        icon: "key" as const,
    },
    {
        key: "language",
        icon: "language" as const
    },
];

export default function ProfileScreen() {
    const router = useRouter();
    const {fullName, role, signOut} = useAuth();
    const locale = useLocaleStore((state) => state.locale);

    const name = useMemo(() => fullName ?? "Unknown User", [fullName]);
    const userRole = useMemo(() => role ?? "No role", [role]);
    const initial = name.charAt(0).toUpperCase();
    const tProfile = useTranslation("profile");
    const tCommon = useTranslation("common");
    const tLookup = useTranslation("lookup");
    const tLogout = useTranslation("logout");
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const textStyle = locale === "mm" ? mmTextStyle : undefined;
    const mmLeadingClass = useMemo(
        () => getMyanmarLeadingClass(locale),
        [locale],
    );
    const mmBodyStyle = useMemo(
        () => [mmTextStyle, {fontWeight: "400" as const}],
        [mmTextStyle],
    );

    const handleSignOut = useThrottledCallback(()=>{
        signOut();
        router.replace("/(auth)/login");
    },600)

    const handleManagementSettingPress = useThrottledCallback((row:{key:string,icon:string})=>{
        if (row.key === "team") return router.push("/(tabs)/profile/user");
        if (row.key === "truck") return router.push("/(tabs)/profile/truck");
        if (row.key === "service") return router.push("/(tabs)/profile/service");
        if (row.key === "security") return router.push("/(tabs)/profile/security");
        if (row.key === "language") return router.push("/(tabs)/profile/language");
    },600)

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: APP_COLORS.background}}>
            <ScrollView
                className=" px-4"
                contentContainerStyle={{paddingTop: 10, paddingBottom: 8}}
                showsVerticalScrollIndicator={false}
                bounces={false}
                alwaysBounceVertical={false}
            >
                <View className="mb-4 flex-row justify-between items-center ">
                    <View>
                        <Text
                            className={`text-sm ${mmLeadingClass}`}
                            style={[{color: APP_COLORS.textMuted}, textStyle]}
                        >
                            {tCommon.greeting}
                        </Text>
                        <Text
                            className={`mt-1 text-lg font-normal ${mmBodyStyle}`}
                            style={[textStyle, {color: APP_COLORS.textPrimary}]}
                        >
                            {name}
                        </Text>
                    </View>
                    <Text
                        className={`mt-0 text-lg font-bold ${mmLeadingClass}`}
                        style={[{color: APP_COLORS.textPrimary}, textStyle]}>
                        {tProfile.brand}
                    </Text>
                </View>

                <Card
                    className="mb-4"
                    style={{
                        backgroundColor: APP_COLORS.card,
                        borderColor: APP_COLORS.border,
                        borderWidth: 1
                    }}
                >
                    <Card.Body className="flex-row items-center gap-3">
                        <Avatar size="lg" alt={`${name} avatar`}>
                            <Avatar.Fallback style={{backgroundColor: APP_COLORS.primarySoft}}>{initial}</Avatar.Fallback>
                        </Avatar>
                        <View className="flex-1">
                            <Text
                                className={`text-lg font-normal  ${mmLeadingClass}`}
                                style={[textStyle, {color: APP_COLORS.textPrimary}]}
                            >
                                {name}
                            </Text>
                            { (userRole === 'ADMIN' || 'OWNER' || 'VIEWER') &&
                                <View className="mt-1 flex-row items-center gap-2">
                                    <View
                                        className="h-2 w-2 rounded-full"
                                        style={{backgroundColor: APP_COLORS.primary}}
                                    />
                                    <Text
                                        className={`text-sm  font-medium ${mmLeadingClass}`}
                                        style={[textStyle, {color: APP_COLORS.primary}]}
                                    >
                                        {(tLookup.roles as any)[userRole] }
                                    </Text>
                                </View>
                            }

                        </View>
                    </Card.Body>
                </Card>

                <Text
                    className={`mb-3 px-1 text-sm font-bold  ${mmLeadingClass}`}
                    style={[textStyle, {color: APP_COLORS.textMuted}]}
                >
                    {tProfile.managementSetting}
                </Text>

                <Card className="overflow-hidden"
                      style={{
                          backgroundColor: APP_COLORS.card,
                          borderColor: APP_COLORS.border,
                          borderWidth: 1
                      }}>
                    <Card.Body className="p-0">
                        {SETTINGS_ROWS.map((row, index) => (
                            <Pressable
                                key={row.key}
                                onPress={() => handleManagementSettingPress(row)}
                                style={({pressed}) => ({
                                    backgroundColor: pressed ? APP_COLORS.primarySoft : APP_COLORS.card,
                                    borderBottomWidth: index < SETTINGS_ROWS.length - 1 ? 1 : 0,
                                    borderBottomColor: APP_COLORS.border
                                })}
                            >
                                <View className="flex-row items-center gap-3 py-3">
                                    {/* Left Descriptive Icon Block Container */}
                                    <View className="h-11 w-11 items-center justify-center rounded-xl"
                                          style={{backgroundColor: APP_COLORS.background}}>
                                        <Ionicons name={row.icon} size={22} color={APP_COLORS.primary}/>
                                    </View>
                                    {/* Mid Content Section */}
                                    <View className="flex-1">
                                        <Text
                                            className={`text-sm font-medium  ${mmLeadingClass}`}
                                            style={[locale === "mm" ? mmBodyStyle : undefined, {color: APP_COLORS.textPrimary}]}
                                        >
                                            {tProfile.settingsRows[row.key as keyof typeof tProfile.settingsRows]}
                                        </Text>
                                        {row.key === "language" ? (
                                            <Text
                                                className={`text-sm font-medium ${mmLeadingClass}`}
                                                style={[locale === "mm" ? mmBodyStyle : undefined, {color: APP_COLORS.textMuted}]}
                                            >
                                                {locale === "mm" ? "မြန်မာ (Myanmar)" : "English"}
                                            </Text>
                                        ) : null}
                                    </View>
                                    <Ionicons name="chevron-forward" size={22} color={APP_COLORS.textMuted}/>
                                </View>
                            </Pressable>
                        ))}
                    </Card.Body>
                </Card>

                <Card className="mt-4"
                      style={{
                          backgroundColor: APP_COLORS.card,
                          borderColor: APP_COLORS.border,
                          borderWidth: 1
                      }}>
                    <Card.Body className="py-1">
                        <Button
                            variant="danger-soft"
                            className="w-full"
                            onPress={() => handleSignOut()}
                            style={({ pressed })=>({
                                backgroundColor: pressed ? APP_COLORS.errorSoft : 'transparent',
                            })}
                        >
                            <Text
                                className={`${mmLeadingClass} text-sm font-medium`}
                                style={[locale === "mm" ? mmBodyStyle : undefined,{color:APP_COLORS.error}]}
                            >
                                {tLogout.title}
                            </Text>
                        </Button>
                    </Card.Body>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}
