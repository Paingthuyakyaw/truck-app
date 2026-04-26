import { APP_COLORS } from "@/constants/colors";
import { myanmarUITextStyle } from "@/constants/myanmar-font";
import { useAuth } from "@/hooks/use-auth";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Avatar, Button, Card } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SETTINGS_ROWS = [
  {
    key: "team",
    icon: "people-outline" as const,
  },
  {
    key: "truck",
    icon: "swap-horizontal-outline" as const,
  },
  {
    key: "service",
    icon: "settings-outline" as const,
  },
  {
    key: "security",
    icon: "lock-closed-outline" as const,
  },
  { key: "language", icon: "language-outline" as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { fullName, role, signOut } = useAuth();
  const locale = useLocaleStore((state) => state.locale);

  const name = useMemo(
    () => fullName ?? "Unknown User",
    [fullName],
  );
  const userRole = useMemo(
    () => role ?? "No role",
    [role],
  );
  const initial = name.charAt(0).toUpperCase();
  const t = profileLocale[locale];
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const textStyle = locale === "mm" ? mmTextStyle : undefined;
  const mmLeadingClass = locale === "mm" ? "leading-0" : "";
  const mmBodyStyle = useMemo(
    () => [mmTextStyle, { lineHeight: 0, fontWeight: "400" as const }],
    [mmTextStyle],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="flex-1 bg-[#f5f8fc]">
      <ScrollView
        className=" px-4"
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
      >
        <View className="mb-4 flex-row justify-between items-center ">
          <View>
            <Text
              className={`text-xs text-slate-500 leading-0 ${mmLeadingClass}`}
            >
              {t.greeting}
            </Text>
            <Text
              className={`mt-1 text-base font-bold text-slate-900 ${mmLeadingClass}`}
            >
              {name}
            </Text>
          </View>
          <Text
            className={`text-lg font-bold text-slate-900 ${mmLeadingClass}`}
            style={textStyle}
          >
            {t.brand}
          </Text>
        </View>

        <Card className="mb-4">
          <Card.Body className="flex-row items-center gap-3">
            <Avatar size="lg" alt={`${name} avatar`}>
              <Avatar.Fallback>{initial}</Avatar.Fallback>
            </Avatar>
            <View className="flex-1">
              <Text
                className={`text-base font-semibold text-slate-900 ${mmLeadingClass}`}
              >
                {name}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: APP_COLORS.primary }}
                />
                <Text
                  className={`text-base text-slate-600 font-semibold ${mmLeadingClass}`}
                >
                  {userRole}
                </Text>
              </View>
            </View>
          </Card.Body>
        </Card>

        <Text
          className={`mb-3 px-1 text-sm font-semibold text-slate-500 ${mmLeadingClass}`}
          style={textStyle}
        >
          {t.settingsHeading}
        </Text>

        <Card className="overflow-hidden">
          <Card.Body className="p-0">
            {SETTINGS_ROWS.map((row, index) => (
              <Pressable
                key={row.key}
                onPress={() => {
                  if (row.key === "team") {
                    router.push("/(tabs)/profile/user");
                    return;
                  }
                  if (row.key === "truck") {
                    router.push("/(tabs)/profile/truck");
                    return;
                  }
                  if (row.key === "service") {
                    router.push("/(tabs)/profile/service");
                    return;
                  }
                  if (row.key === "security") {
                    router.push("/(tabs)/profile/security");
                    return;
                  }
                  if (row.key === "language") {
                    router.push("/(tabs)/profile/language");
                  }
                }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? APP_COLORS.primarySoft : "#fff",
                  borderBottomWidth: index < SETTINGS_ROWS.length - 1 ? 1 : 0,
                  borderBottomColor: "#e5e7eb",
                })}
              >
                <View className="flex-row items-center gap-3 py-3">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                    <Ionicons name={row.icon} size={21} color="#334155" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-medium text-slate-900 ${mmLeadingClass}`}
                      style={locale === "mm" ? mmBodyStyle : undefined}
                    >
                      {t.settingsRows[row.key as keyof typeof t.settingsRows]}
                    </Text>
                    {row.key === "language" ? (
                      <Text
                        className={`text-xs text-slate-500 ${mmLeadingClass}`}
                        style={locale === "mm" ? mmBodyStyle : undefined}
                      >
                        {locale === "mm" ? "မြန်မာ (Myanmar)" : "English"}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="#94a3b8" />
                </View>
              </Pressable>
            ))}
          </Card.Body>
        </Card>

        <Card className="mt-4">
          <Card.Body className="py-1">
            <Button
              variant="danger-soft"
              className="w-full"
              onPress={() => {
                signOut();
                router.replace("/(auth)/login");
              }}
            >
              <Text
                className={mmLeadingClass}
                style={locale === "mm" ? mmBodyStyle : undefined}
              >
                {t.logout}
              </Text>
            </Button>
          </Card.Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
