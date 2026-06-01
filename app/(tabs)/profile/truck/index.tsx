import { CompactTextInput } from "@/components/compact-text-input";
import { APP_COLORS } from "@/constants/colors";
import { COMPACT_ADVANCED_INPUT_CLASSNAME } from "@/constants/compact-input";
import {getMyanmarLeadingClass, myanmarUITextStyle} from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useTrucksInfinite } from "@/stores/server/truck/query";
import {
  buildTruckSearchColumns,
  type TruckAdvancedFilters,
} from "@/stores/server/truck/search-columns";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Card } from "heroui-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TruckCardItem } from "./components/truck-card";
import { TruckSearchToolbar } from "./components/truck-search-toolbar";
import {useThrottledCallback} from '@/hooks/use-throttled-callback'
import {TruckItem} from "@/stores/server/truck/typed";
import {useTranslation} from "@/hooks/use-translation";

type TruckListUiState = {
  quickQuery: string;
  advancedOpen: boolean;
  plateNo: string;
  model: string;
  modelYear: string;
  engineNo: string;
  chassisNo: string;
};

const initialTruckListUi: TruckListUiState = {
  quickQuery: "",
  advancedOpen: false,
  plateNo: "",
  model: "",
  modelYear: "",
  engineNo: "",
  chassisNo: "",
};

const emptyTruckAdvancedApplied: TruckAdvancedFilters = {
  plateNo: "",
  model: "",
  modelYear: "",
  engineNo: "",
  chassisNo: "",
};

export default function TruckManagementScreen() {
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const t = useTranslation('truck');

  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const [ui, setUi] = useState<TruckListUiState>(initialTruckListUi);
  const [appliedAdvanced, setAppliedAdvanced] = useState<TruckAdvancedFilters>(
    () => ({ ...emptyTruckAdvancedApplied }),
  );
  const patchUi = useCallback((next: Partial<TruckListUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  }, []);
  const debouncedQuickQuery = useDebouncedValue(ui.quickQuery, 500);

  const filters = useMemo(
    () => ({
      quickQuery: debouncedQuickQuery,
      plateNo: appliedAdvanced.plateNo,
      model: appliedAdvanced.model,
      modelYear: appliedAdvanced.modelYear,
      engineNo: appliedAdvanced.engineNo,
      chassisNo: appliedAdvanced.chassisNo,
    }),
    [debouncedQuickQuery, appliedAdvanced],
  );

  const columns = useMemo(() => buildTruckSearchColumns(filters), [filters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useTrucksInfinite(columns);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data.data) ?? [],
    [data],
  );

  const advancedKeys: (keyof TruckAdvancedFilters)[] = [
    "plateNo",
    "model",
    "modelYear",
    "engineNo",
    "chassisNo",
  ];

  const handleCardPress = useThrottledCallback((item :TruckItem)=>{
    router.push(`/(tabs)/profile/truck/edit/${item.id}`)
  },600)

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor:APP_COLORS.background}}>
      <View className="flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full "
          style={({pressed})=> ({
            backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
          })}
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>

        <Text
          className="flex-1 px-3 text-center text-[18px] font-bold"
          style={[style,{color:APP_COLORS.textPrimary}]}
        >
          {t.master.title}
        </Text>

        <View className="h-11 w-11" />
      </View>

      <FlatList
        data={items}
        className="px-4"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TruckCardItem
            item={item}
            locale={locale}
            labels={{
              fuelType: t.master.card.fuelType,
              frontTire: t.master.card.frontTire,
              backTire: t.master.card.backTire,
              chassisNo: t.master.card.chassisNo,
              engineNo: t.master.card.engineNo,
            }}
            onPress={() => handleCardPress(item)}
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
            <TruckSearchToolbar
              locale={locale}
              quickQuery={ui.quickQuery}
              placeholder={t.master.searchPlaceholder}
              advancedOpen={ui.advancedOpen}
              onChangeQuickQuery={(quickQuery) => patchUi({ quickQuery })}
              onClearQuickQuery={() => patchUi({ quickQuery: "" })}
              onToggleAdvanced={() =>
                setUi((s) => ({ ...s, advancedOpen: !s.advancedOpen }))
              }
              onPressAdd={() => router.push("/(tabs)/profile/truck/create")}
            />

            {ui.advancedOpen ? (
              <Card className="mb-4 p-5">
                <Card.Body className="gap-3">
                  <Text
                      className={`text-sm font-medium  ${getMyanmarLeadingClass(locale)}`}
                      style={[style,{color:APP_COLORS.textPrimary}]}
                  >
                    {t.search.advancedTitle}
                  </Text>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text
                          className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                          style={[style,{color:APP_COLORS.textMuted}]}
                      >
                        {t.search.plateNo}
                      </Text>
                      <CompactTextInput
                        locale={locale}
                        compactVariant="advanced"
                        value={ui.plateNo}
                        onChangeText={(plateNo) => patchUi({ plateNo })}
                        placeholder={t.search.placeholders.plateNo}
                        className={`${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                        style={[style,{
                          backgroundColor: APP_COLORS.inputBackground,
                          borderColor:  APP_COLORS.border,
                          borderWidth: 1,
                          color: APP_COLORS.textPrimary
                        }]}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text
                          className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                          style={[style,{color:APP_COLORS.textMuted}]}
                      >
                        {t.search.model}
                      </Text>
                      <CompactTextInput
                        locale={locale}
                        compactVariant="advanced"
                        value={ui.model}
                        onChangeText={(model) => patchUi({ model })}
                        placeholder={t.search.placeholders.model}
                        className={`${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                        style={[style,{
                          backgroundColor: APP_COLORS.inputBackground,
                          borderColor:  APP_COLORS.border,
                          borderWidth: 1,
                          color: APP_COLORS.textPrimary
                        }]}
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text
                          className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                          style={[style,{color:APP_COLORS.textMuted}]}
                      >
                        {t.search.modelYear}
                      </Text>
                      <CompactTextInput
                        locale={locale}
                        compactVariant="advanced"
                        value={ui.modelYear}
                        onChangeText={(modelYear) => patchUi({ modelYear })}
                        placeholder={t.search.placeholders.modelYear}
                        keyboardType="number-pad"
                        className={`${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                        style={[style,{
                          backgroundColor: APP_COLORS.inputBackground,
                          borderColor:  APP_COLORS.border,
                          borderWidth: 1,
                          color: APP_COLORS.textPrimary
                        }]}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                            style={[style,{color:APP_COLORS.textMuted}]}>
                        {t.search.chassisNo}
                      </Text>
                      <CompactTextInput
                          locale={locale}
                          compactVariant="advanced"
                          value={ui.chassisNo}
                          onChangeText={(chassisNo) => patchUi({ chassisNo })}
                          placeholder={t.search.placeholders.chassisNo}
                          className={`${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                          style={[style,{
                            backgroundColor: APP_COLORS.inputBackground,
                            borderColor:  APP_COLORS.border,
                            borderWidth: 1,
                            color: APP_COLORS.textPrimary
                          }]}
                      />
                    </View>
                  </View>


                  <View className="flex-row gap-2 pt-0.5">
                    <Pressable
                      onPress={() => {
                        setAppliedAdvanced({ ...emptyTruckAdvancedApplied });
                        patchUi({
                          quickQuery: "",
                          ...Object.fromEntries(
                            advancedKeys.map((key) => [key, ""]),
                          ),
                        });
                      }}
                      className="flex-1 items-center justify-center rounded-xl"
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? APP_COLORS.errorSoft : 'transparent',
                        borderColor: APP_COLORS.border,
                        borderWidth: 1
                      })}
                    >
                      <Text
                          className={`text-xs font-semibold  ${getMyanmarLeadingClass(locale)}`}
                          style={[style,{color:APP_COLORS.error}]}
                      >
                        {t.search.reset}
                      </Text>
                    </Pressable>

                    <Pressable
                      className="flex-1 items-center justify-center rounded-xl py-3"
                      style={ ({pressed})=>({
                        backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary
                      })}
                      onPress={() => {
                        setAppliedAdvanced({
                          plateNo: ui.plateNo,
                          model: ui.model,
                          modelYear: ui.modelYear,
                          engineNo: ui.engineNo,
                          chassisNo: ui.chassisNo,
                        });
                        patchUi({ advancedOpen: false });
                      }}
                    >
                      <Text
                        className={`text-xs font-semibold text-white ${getMyanmarLeadingClass(locale)}`}
                        style={style}
                      >
                        {t.search.search}
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
              {t.master.empty}
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
      />
    </SafeAreaView>
  );
}
