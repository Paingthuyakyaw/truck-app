import {CompactTextInput} from "@/components/compact-text-input";
import {APP_COLORS} from "@/constants/colors";
import {COMPACT_ADVANCED_INPUT_CLASSNAME} from "@/constants/compact-input";
import {myanmarUITextStyle} from "@/constants/myanmar-font";
import {useDebouncedValue} from "@/hooks/use-debounced-value";
import profileLocale from "@/locale/profile/profile.json";
import {useLocaleStore} from "@/stores/client/locale-store";
import {useTrucksInfinite} from "@/stores/server/truck/query";
import {
    buildTruckSearchColumns,
    type TruckAdvancedFilters,
} from "@/stores/server/truck/search-columns";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useRouter} from "expo-router";
import {Card} from "heroui-native";
import React, {useCallback, useMemo, useState} from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {TruckCardItem} from "./components/truck-card";
import {TruckSearchToolbar} from "./components/truck-search-toolbar";
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
    const tTruck = useTranslation('truck')
    const router = useRouter();
    const locale = useLocaleStore((state) => state.locale);

    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;

    const [ui, setUi] = useState<TruckListUiState>(initialTruckListUi);
    const [appliedAdvanced, setAppliedAdvanced] = useState<TruckAdvancedFilters>(
        () => ({...emptyTruckAdvancedApplied}),
    );
    const patchUi = useCallback((next: Partial<TruckListUiState>) => {
        setUi((prev) => ({...prev, ...next}));
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
        refetch,
        isRefetching,
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

    return (
        <SafeAreaView className="flex-1 bg-[#f3f7fb]">

            <View className="flex-row items-center px-4 pb-2 pt-1">
                <Pressable
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center rounded-full bg-[#eef2f6]"
                >
                    <Ionicons name="arrow-back" size={22} color="#475569"/>
                </Pressable>

                <Text
                    className="flex-1 px-3 text-center text-[18px] font-bold text-slate-900"
                    style={style}
                >
                    {tTruck.master.title}
                </Text>

                <View className="h-11 w-11"/>
            </View>

            <FlatList
                data={items}
                className="px-4"
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <TruckCardItem
                        item={item}
                        locale={locale}
                        labels={{
                            fuelType: tTruck.master.card.fuelType,
                            frontTire: tTruck.master.card.frontTire,
                            backTire:tTruck.master.card.backTire,
                            chassisNo:tTruck.master.card.chassisNo,
                            engineNo:tTruck.master.card.engineNo
                        }}
                        onPress={() => router.push(`/(tabs)/profile/truck/edit/${item.id}`)}
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
                            placeholder={tTruck.master.searchPlaceholder}
                            advancedOpen={ui.advancedOpen}
                            onChangeQuickQuery={(quickQuery) => patchUi({quickQuery})}
                            onClearQuickQuery={() => patchUi({quickQuery: ""})}
                            onToggleAdvanced={() =>
                                setUi((s) => ({...s, advancedOpen: !s.advancedOpen}))
                            }
                            onPressAdd={() => router.push("/(tabs)/profile/truck/create")}
                        />

                        {ui.advancedOpen ? (
                            <Card className="mb-4 p-5">
                                <Card.Body className="gap-3">
                                    <Text
                                        className="text-sm font-semibold text-slate-900"
                                        style={style}
                                    >
                                        {tTruck.search.advancedTitle}
                                    </Text>

                                    <View className="flex-row gap-2">
                                        <View className="flex-1 gap-1">
                                            <Text
                                                className="text-[10px] text-slate-500"
                                                style={style}
                                            >
                                                {tTruck.search.plateNo}
                                            </Text>
                                            <CompactTextInput
                                                locale={locale}
                                                compactVariant="advanced"
                                                value={ui.plateNo}
                                                onChangeText={(plateNo) => patchUi({plateNo})}
                                                placeholder={tTruck.search.placeholders.plateNo}
                                                className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                                            />
                                        </View>
                                        <View className="flex-1 gap-1">
                                            <Text
                                                className="text-[10px] text-slate-500"
                                                style={style}
                                            >
                                                {tTruck.search.model}
                                            </Text>
                                            <CompactTextInput
                                                locale={locale}
                                                compactVariant="advanced"
                                                value={ui.model}
                                                onChangeText={(model) => patchUi({model})}
                                                placeholder={tTruck.search.placeholders.model}
                                                className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                                            />
                                        </View>
                                    </View>

                                    <View className="flex-row gap-2">
                                        <View className="flex-1 gap-1">
                                            <Text
                                                className="text-[10px] text-slate-500"
                                                style={style}
                                            >
                                                {tTruck.search.modelYear}
                                            </Text>
                                            <CompactTextInput
                                                locale={locale}
                                                compactVariant="advanced"
                                                value={ui.modelYear}
                                                onChangeText={(modelYear) => patchUi({modelYear})}
                                                placeholder={tTruck.search.placeholders.modelYear}
                                                keyboardType="number-pad"
                                                className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                                            />
                                        </View>
                                        <View className="flex-1 gap-1">
                                            <Text
                                                className="text-[10px] text-slate-500"
                                                style={style}
                                            >
                                                {tTruck.search.chassisNo}
                                            </Text>
                                            <CompactTextInput
                                                locale={locale}
                                                compactVariant="advanced"
                                                value={ui.chassisNo}
                                                onChangeText={(chassisNo) => patchUi({chassisNo})}
                                                placeholder={tTruck.search.placeholders.chassisNo}
                                                className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                                            />
                                        </View>
                                    </View>

                                    <View className="flex-row gap-2 pt-0.5">
                                        <Pressable
                                            onPress={() => {
                                                setAppliedAdvanced({...emptyTruckAdvancedApplied});
                                                patchUi({
                                                    quickQuery: "",
                                                    ...Object.fromEntries(
                                                        advancedKeys.map((key) => [key, ""]),
                                                    ),
                                                });
                                            }}
                                            className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-3"
                                        >
                                            <Text
                                                className="text-xs font-semibold text-slate-700"
                                                style={style}
                                            >
                                                {tTruck.search.reset}
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            className="flex-1 items-center justify-center rounded-xl py-3"
                                            style={{backgroundColor: APP_COLORS.primary}}
                                            onPress={() => {
                                                setAppliedAdvanced({
                                                    plateNo: ui.plateNo,
                                                    model: ui.model,
                                                    modelYear: ui.modelYear,
                                                    engineNo: ui.engineNo,
                                                    chassisNo: ui.chassisNo,
                                                });
                                                patchUi({advancedOpen: false});
                                            }}
                                        >
                                            <Text
                                                className="text-xs font-semibold text-white"
                                                style={style}
                                            >
                                                {tTruck.search.search}
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
                            <ActivityIndicator color={APP_COLORS.primary}/>
                        </View>
                    ) : (
                        <Text
                            className="px-6 py-8 text-center text-slate-500"
                            style={style}
                        >
                            {tTruck.master.empty}
                        </Text>
                    )
                }
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <View className="py-4">
                            <ActivityIndicator color={APP_COLORS.primary}/>
                        </View>
                    ) : null
                }
                contentContainerStyle={{paddingBottom: 24, flexGrow: 1}}
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
