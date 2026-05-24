import { CompactTextInput } from "@/components/compact-text-input";
import { APP_COLORS } from "@/constants/colors";
import { COMPACT_ADVANCED_INPUT_CLASSNAME } from "@/constants/compact-input";
import { myanmarUITextStyle } from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useServiceTypesInfinite } from "@/stores/server/service-type/query";
import {
  buildServiceTypeSearchColumns,
  type ServiceTypeAdvancedFilters,
} from "@/stores/server/service-type/search-columns";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Card, Select } from "heroui-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ServiceSearchToolbar } from "./components/service-search-toolbar";
import { ServiceTypeCardItem } from "./components/service-type-card";

type ServiceListUiState = {
  quickQuery: string;
  advancedOpen: boolean;
  langEng: string;
  langMy: string;
  active: ServiceTypeAdvancedFilters["active"];
};

const initialServiceListUi: ServiceListUiState = {
  quickQuery: "",
  advancedOpen: false,
  langEng: "",
  langMy: "",
  active: true,
};

const defaultServiceAdvancedApplied: ServiceTypeAdvancedFilters = {
  langEng: "",
  langMy: "",
  active: true,
};

export default function ServiceTypeManagementScreen() {
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const t = profileLocale[locale].serviceTypeScreen;
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const [ui, setUi] = useState<ServiceListUiState>(initialServiceListUi);
  const [appliedAdvanced, setAppliedAdvanced] =
    useState<ServiceTypeAdvancedFilters>(() => ({
      ...defaultServiceAdvancedApplied,
    }));
  const patchUi = useCallback((next: Partial<ServiceListUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  }, []);
  const debouncedQuickQuery = useDebouncedValue(ui.quickQuery, 500);

  const filters = useMemo(
    () => ({
      quickQuery: debouncedQuickQuery,
      langEng: appliedAdvanced.langEng,
      langMy: appliedAdvanced.langMy,
      active: appliedAdvanced.active,
    }),
    [debouncedQuickQuery, appliedAdvanced],
  );

  const columns = useMemo(
    () => buildServiceTypeSearchColumns(filters),
    [filters],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useServiceTypesInfinite(columns);

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
        className="px-4"
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ServiceTypeCardItem
            item={item}
            locale={locale}
            labels={{
              english: t.labels.english,
              myanmar: t.labels.myanmar,
            }}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/profile/service/edit/[id]",
                params: {
                  id: String(item.id),
                  version: String(item.version ?? 0),
                  serviceType: item.serviceType ?? "",
                  langEng: item.langEng ?? "",
                  langMy: item.langMy ?? "",
                  active: String(item.active ?? true),
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
          <View className="pb-3">
            <ServiceSearchToolbar
              locale={locale}
              quickQuery={ui.quickQuery}
              placeholder={t.searchPlaceholder}
              advancedOpen={ui.advancedOpen}
              onChangeQuickQuery={(quickQuery) => patchUi({ quickQuery })}
              onClearQuickQuery={() => patchUi({ quickQuery: "" })}
              onToggleAdvanced={() =>
                setUi((s) => ({ ...s, advancedOpen: !s.advancedOpen }))
              }
              onPressAdd={() => router.push("/(tabs)/profile/service/create")}
            />

            {ui.advancedOpen ? (
              <Card className="mb-4 p-5">
                <Card.Body className="gap-3">
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
                        {t.labels.english}
                      </Text>
                      <CompactTextInput
                        locale={locale}
                        compactVariant="advanced"
                        value={ui.langEng}
                        onChangeText={(langEng) => patchUi({ langEng })}
                        placeholder={t.placeholders.english}
                        className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text
                        className="text-[10px] text-slate-500"
                        style={style}
                      >
                        {t.labels.myanmar}
                      </Text>
                      <CompactTextInput
                        locale={locale}
                        compactVariant="advanced"
                        value={ui.langMy}
                        onChangeText={(langMy) => patchUi({ langMy })}
                        placeholder={t.placeholders.myanmar}
                        className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                      />
                    </View>
                  </View>

                  <View className="gap-1">
                    <Text className="text-[10px] text-slate-500" style={style}>
                      {t.labels.status}
                    </Text>
                    <Select
                      value={
                        ui.active === null
                          ? { value: "all", label: t.status.all }
                          : ui.active
                            ? { value: "active", label: t.status.active }
                            : { value: "inactive", label: t.status.inactive }
                      }
                      onValueChange={(next) => {
                        if (!next || Array.isArray(next)) return;
                        if (next.value === "all") patchUi({ active: null });
                        if (next.value === "active") patchUi({ active: true });
                        if (next.value === "inactive")
                          patchUi({ active: false });
                      }}
                    >
                      <Select.Trigger className="rounded-xl border border-slate-200 bg-white px-2.5">
                        <Select.Value
                          className="text-xs text-slate-900"
                          placeholder=""
                          style={style}
                        />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content
                          className="rounded-2xl border border-slate-200 bg-white"
                          presentation="popover"
                          width="trigger"
                        >
                          <Select.Item value="all" label={t.status.all}>
                            <Select.ItemLabel
                              className="text-xs text-slate-900"
                              style={style}
                            />
                            <Select.ItemIndicator />
                          </Select.Item>
                          <Select.Item value="active" label={t.status.active}>
                            <Select.ItemLabel
                              className="text-xs text-slate-900"
                              style={style}
                            />
                            <Select.ItemIndicator />
                          </Select.Item>
                          <Select.Item
                            value="inactive"
                            label={t.status.inactive}
                          >
                            <Select.ItemLabel
                              className="text-xs text-slate-900"
                              style={style}
                            />
                            <Select.ItemIndicator />
                          </Select.Item>
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  </View>

                  <View className="flex-row gap-2 pt-0.5">
                    <Pressable
                      onPress={() => {
                        setAppliedAdvanced({ ...defaultServiceAdvancedApplied });
                        patchUi({
                          quickQuery: "",
                          langEng: "",
                          langMy: "",
                          active: true,
                        });
                      }}
                      className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-3"
                    >
                      <Text
                        className="text-xs font-semibold text-slate-700"
                        style={style}
                      >
                        {t.reset}
                      </Text>
                    </Pressable>

                    <Pressable
                      className="flex-1 items-center justify-center rounded-xl py-3"
                      style={{ backgroundColor: APP_COLORS.primary }}
                      onPress={() => {
                        setAppliedAdvanced({
                          langEng: ui.langEng,
                          langMy: ui.langMy,
                          active: ui.active,
                        });
                        patchUi({ advancedOpen: false });
                      }}
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
              {isError ? t.error : t.empty}
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
        contentContainerStyle={{ paddingBottom: 0, flexGrow: 1 }}
      />
    </SafeAreaView>
  );
}
