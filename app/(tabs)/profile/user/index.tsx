import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useUsersInfinite } from "@/stores/server/user/query";
import type { BoolFilter } from "@/stores/server/user/search-columns";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Card, Input } from "heroui-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompactSelect } from "./components/compact-select";
import { TeamSearchToolbar } from "./components/team-search-toolbar";
import { TeamUserCard } from "./components/team-user-card";

type SelectBoolValue = "all" | "true" | "false";

type TeamListUiState = {
  quickQuery: string;
  advancedOpen: boolean;
  fullName: string;
  phoneNumber: string;
  role: string;
  email: string;
  isActive: SelectBoolValue;
  isNotLocked: SelectBoolValue;
};

type AdvancedDraftSlice = Pick<
  TeamListUiState,
  "fullName" | "phoneNumber" | "role" | "email" | "isActive" | "isNotLocked"
>;

const initialAdvancedDraft: AdvancedDraftSlice = {
  fullName: "",
  phoneNumber: "",
  role: "",
  email: "",
  isActive: "all",
  isNotLocked: "all",
};

const initialTeamListUi: TeamListUiState = {
  quickQuery: "",
  advancedOpen: false,
  ...initialAdvancedDraft,
};

function mapSelectToBoolFilter(value: SelectBoolValue): BoolFilter {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export default function TeamManagementScreen() {
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const t = profileLocale[locale].teamScreen;

  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const [ui, setUi] = useState<TeamListUiState>(initialTeamListUi);
  /** Committed advanced filters — API uses this; form edits stay in `ui` until Apply. */
  const [appliedAdvanced, setAppliedAdvanced] =
    useState<AdvancedDraftSlice>(initialAdvancedDraft);
  const appliedAdvancedRef = useRef(appliedAdvanced);
  useEffect(() => {
    appliedAdvancedRef.current = appliedAdvanced;
  }, [appliedAdvanced]);

  const patchUi = useCallback((next: Partial<TeamListUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  }, []);
  const debouncedQuickQuery = useDebouncedValue(ui.quickQuery, 500);

  const onToggleAdvanced = useCallback(() => {
    setUi((s) => {
      const a = appliedAdvancedRef.current;
      const fromApplied: AdvancedDraftSlice = {
        fullName: a.fullName,
        phoneNumber: a.phoneNumber,
        role: a.role,
        email: a.email,
        isActive: a.isActive,
        isNotLocked: a.isNotLocked,
      };
      if (s.advancedOpen) {
        return { ...s, advancedOpen: false, ...fromApplied };
      }
      return { ...s, advancedOpen: true, ...fromApplied };
    });
  }, []);

  const onApplyAdvanced = useCallback(() => {
    setAppliedAdvanced({
      fullName: ui.fullName,
      phoneNumber: ui.phoneNumber,
      role: ui.role,
      email: ui.email,
      isActive: ui.isActive,
      isNotLocked: ui.isNotLocked,
    });
    patchUi({ advancedOpen: false });
  }, [
    ui.fullName,
    ui.phoneNumber,
    ui.role,
    ui.email,
    ui.isActive,
    ui.isNotLocked,
    patchUi,
  ]);

  const activeOptions = useMemo(
    () => [
      {
        value: "all",
        labelEn: t.tri?.any || "Any",
        labelMm: t.tri?.any || "အားလုံး",
      },
      {
        value: "true",
        labelEn: "Active",
        labelMm: "Active",
      },
      {
        value: "false",
        labelEn: "Inactive",
        labelMm: "Inactive",
      },
    ],
    [t],
  );

  const lockOptions = useMemo(
    () => [
      {
        value: "all",
        labelEn: t.tri?.any || "Any",
        labelMm: t.tri?.any || "အားလုံး",
      },
      {
        value: "true",
        labelEn: "Unlocked",
        labelMm: "Unlocked",
      },
      {
        value: "false",
        labelEn: "Locked",
        labelMm: "Locked",
      },
    ],
    [t],
  );

  /** Advanced role filter: empty string = any (no API constraint). */
  const roleFilterOptions = useMemo(
    () => [
      {
        value: "",
        labelEn: t.tri?.any || "Any",
        labelMm: t.tri?.any || "အားလုံး",
      },
      { value: "ADMIN", labelEn: "ADMIN", labelMm: "စီမံ" },
      { value: "OWNER", labelEn: "OWNER", labelMm: "ပိုင်ရှင်" },
      { value: "WORKER", labelEn: "WORKER", labelMm: "ဝန်ထမ်း" },
      { value: "VIEWER", labelEn: "VIEWER", labelMm: "ကြည့်ရှုသူ" },
    ],
    [t],
  );

  const advancedInputClass = `border border-slate-200 text-sm ${getMyanmarLeadingClass(locale)} bg-white py-0 h-11`;

  const filters = useMemo(
    () => ({
      quickQuery: debouncedQuickQuery,
      fullName: appliedAdvanced.fullName,
      phoneNumber: appliedAdvanced.phoneNumber,
      role: appliedAdvanced.role,
      email: appliedAdvanced.email,
      isActive: mapSelectToBoolFilter(appliedAdvanced.isActive),
      isNotLocked: mapSelectToBoolFilter(appliedAdvanced.isNotLocked),
    }),
    [debouncedQuickQuery, appliedAdvanced],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
    isRefetching,
  } = useUsersInfinite(filters);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data.data) ?? [],
    [data],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#eef2f6]"
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>

        <Text
          className="flex-1 px-3 text-center text-[18px] font-bold text-slate-900"
          style={style}
        >
          {t.title}
        </Text>

        <View className="h-11 w-11" />
      </View>

      <FlatList
        data={items}
        className=" px-4"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TeamUserCard
            item={item}
            locale={locale}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/profile/user/[id]",
                params: {
                  id: item.id,
                  fullName: item.fullName,
                  email: item.email,
                  phoneNumber: item.phoneNumber || item.username,
                  role: item.role,
                  active: String(item.active),
                  notLocked: String(item.notLocked),
                },
              })
            }
          />
        )}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View className=" pb-3">
            <TeamSearchToolbar
              locale={locale}
              quickQuery={ui.quickQuery}
              placeholder={t.searchPlaceholder}
              advancedOpen={ui.advancedOpen}
              onChangeQuickQuery={(quickQuery) => patchUi({ quickQuery })}
              onClearQuickQuery={() => patchUi({ quickQuery: "" })}
              onToggleAdvanced={onToggleAdvanced}
              onPressAdd={() => router.push("/(tabs)/profile/user/create")}
            />

            {ui.advancedOpen ? (
              <Card className="mb-4 p-5 ">
                <Card.Body className="gap-3 ">
                  <Text
                    className="text-sm font-semibold text-slate-900"
                    style={style}
                  >
                    {t.advancedTitle}
                  </Text>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text
                        className="text-[10px] text-slate-500"
                        style={style}
                      >
                        {t.labels?.fullName || "Full Name"}
                      </Text>
                      <Input
                        value={ui.fullName}
                        onChangeText={(fullName) => patchUi({ fullName })}
                        placeholder={t.placeholders?.fullName || "Full Name"}
                        className={advancedInputClass}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text
                        className="text-[10px] text-slate-500"
                        style={style}
                      >
                        {t.labels?.phoneNumber || "Phone Number"}
                      </Text>
                      <Input
                        value={ui.phoneNumber}
                        onChangeText={(phoneNumber) => patchUi({ phoneNumber })}
                        placeholder={
                          t.placeholders?.phoneNumber || "Phone Number"
                        }
                        keyboardType="phone-pad"
                        className={advancedInputClass}
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <CompactSelect
                        label={t.labels?.role || "Role"}
                        value={ui.role}
                        onChange={(role) => patchUi({ role })}
                        locale={locale}
                        placeholder={t.placeholders?.role || "Role"}
                        options={roleFilterOptions}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text
                        className="text-[10px] text-slate-500"
                        style={style}
                      >
                        {t.labels?.email || "Email"}
                      </Text>
                      <Input
                        value={ui.email}
                        onChangeText={(email) => patchUi({ email })}
                        placeholder={t.placeholders?.email || "Email"}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className={advancedInputClass}
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <CompactSelect
                      label={t.labels?.isActive || "Active"}
                      value={ui.isActive}
                      onChange={(value) =>
                        patchUi({ isActive: value as SelectBoolValue })
                      }
                      locale={locale}
                      placeholder={t.tri?.any || "Any"}
                      options={activeOptions}
                    />

                    <CompactSelect
                      label={t.labels?.isNotLocked || "Lock"}
                      value={ui.isNotLocked}
                      onChange={(value) =>
                        patchUi({ isNotLocked: value as SelectBoolValue })
                      }
                      locale={locale}
                      placeholder={t.tri?.any || "Any"}
                      options={lockOptions}
                    />
                  </View>

                  <View className="flex-row gap-2 pt-0.5">
                    <Pressable
                      onPress={() => {
                        setAppliedAdvanced(initialAdvancedDraft);
                        patchUi({
                          quickQuery: "",
                          ...initialAdvancedDraft,
                        });
                      }}
                      className="flex-1 py-3 items-center justify-center rounded-xl bg-slate-100"
                    >
                      <Text
                        className="text-xs font-semibold text-slate-700"
                        style={style}
                      >
                        {t.reset}
                      </Text>
                    </Pressable>

                    <Pressable
                      className=" flex-1 py-3 items-center justify-center rounded-xl"
                      style={{ backgroundColor: APP_COLORS.primary }}
                      onPress={onApplyAdvanced}
                    >
                      <Text
                        className="text-xs font-semibold text-white"
                        style={style}
                      >
                        {t.apply}
                      </Text>
                    </Pressable>
                  </View>
                </Card.Body>
              </Card>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <View className="items-center py-10">
              <ActivityIndicator color={APP_COLORS.primary} />
            </View>
          ) : (
            <Text
              className="px-6 py-8 text-center text-slate-500"
              style={style}
            >
              {t.empty}
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color={APP_COLORS.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={refetch}
            tintColor={APP_COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
