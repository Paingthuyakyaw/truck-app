import {CompactTextInput} from "@/components/compact-text-input";
import {APP_COLORS} from "@/constants/colors";
import {COMPACT_ADVANCED_INPUT_CLASSNAME} from "@/constants/compact-input";
import {getMyanmarLeadingClass, myanmarUITextStyle} from "@/constants/myanmar-font";
import {useDebouncedValue} from "@/hooks/use-debounced-value";
import {useLocaleStore} from "@/stores/client/locale-store";
import {useServiceTypesInfinite} from "@/stores/server/service-type/query";
import {
    buildServiceTypeSearchColumns,
    type ServiceTypeAdvancedFilters,
} from "@/stores/server/service-type/search-columns";
import Ionicons from "@expo/vector-icons/Ionicons";
import {useRouter} from "expo-router";
import {Card, Select} from "heroui-native";
import React, {useCallback, useMemo, useState} from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    View,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {ServiceSearchToolbar} from "./components/service-search-toolbar";
import {ServiceTypeCardItem} from "./components/service-type-card";
import {useThrottledCallback} from "@/hooks/use-throttled-callback";
import {ServiceTypeItem} from "@/stores/server/service-type/typed";
import {useTranslation} from "@/hooks/use-translation";

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
    const t = useTranslation('serviceType')
    const {serviceTypeStatus: tStatus} = useTranslation('lookup')

    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;
    const [ui, setUi] = useState<ServiceListUiState>(initialServiceListUi);
    const [appliedAdvanced, setAppliedAdvanced] =
        useState<ServiceTypeAdvancedFilters>(() => ({
            ...defaultServiceAdvancedApplied,
        }));
    const patchUi = useCallback((next: Partial<ServiceListUiState>) => {
        setUi((prev) => ({...prev, ...next}));
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

    const handleCardPress = useThrottledCallback((item: ServiceTypeItem) => {
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
    }, 600);

    const handleAddPress = useThrottledCallback(() => {
        router.push("/(tabs)/profile/service/create")
    }, 600)

    return (
        <SafeAreaView className="flex-1 " style={{backgroundColor: APP_COLORS.background}}>

            {/* back button && title */}
            <View className="flex-row items-center px-4 pb-2 pt-1">
                <Pressable
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center rounded-full "
                    style={({pressed}) => ({
                        backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                    })}>
                    <Ionicons name="arrow-back" size={22} color={APP_COLORS.textPrimary}/>
                </Pressable>

                <Text
                    className="flex-1 px-3 text-center text-lg font-bold "
                    style={[style, {color: APP_COLORS.textPrimary}]}
                >
                    {t.master.title}
                </Text>

                <View className="h-11 w-11"/>
            </View>


            <FlatList
                data={items}
                className="px-4"
                keyExtractor={(item) => String(item.id)}
                renderItem={({item}) => (
                    <ServiceTypeCardItem
                        item={item}
                        locale={locale}
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
                        <ServiceSearchToolbar
                            locale={locale}
                            quickQuery={ui.quickQuery}
                            placeholder={t.master.searchPlaceholder}
                            advancedOpen={ui.advancedOpen}
                            onChangeQuickQuery={(quickQuery) => patchUi({quickQuery})}
                            onClearQuickQuery={() => patchUi({quickQuery: ""})}
                            onToggleAdvanced={() =>
                                setUi((s) => ({...s, advancedOpen: !s.advancedOpen}))
                            }
                            onPressAdd={() => handleAddPress()}
                        />

                        {ui.advancedOpen ? (
                            <Card
                                className="mb-4 p-5"
                                style={{
                                    backgroundColor: APP_COLORS.card,
                                    borderColor: APP_COLORS.border,
                                    borderWidth: 1
                                }}
                            >
                                <Card.Body className="gap-3">
                                    <Text
                                        className={`text-sm font-medium  ${getMyanmarLeadingClass(locale)}`}
                                        style={[style, {color: APP_COLORS.textPrimary}]}
                                    >
                                        {t.search.advancedTitle}
                                    </Text>

                                    <View className="flex-row gap-2">
                                        <View className="flex-1 gap-1">
                                            <Text
                                                className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                                                style={[style, {color: APP_COLORS.textMuted}]}
                                            >
                                                {t.search.english}
                                            </Text>
                                            <CompactTextInput
                                                locale={locale}
                                                compactVariant="advanced"
                                                value={ui.langEng}
                                                onChangeText={(langEng) => patchUi({langEng})}
                                                placeholder={t.search.placeholders.english}
                                                className={`font-normal ${COMPACT_ADVANCED_INPUT_CLASSNAME} ${getMyanmarLeadingClass(locale)}  `}
                                            />
                                        </View>
                                        <View className="flex-1 gap-1">
                                            <Text
                                                className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                                                style={[style, {color: APP_COLORS.textMuted}]}
                                            >
                                                {t.search.myanmar}
                                            </Text>
                                            <CompactTextInput
                                                locale={locale}
                                                compactVariant="advanced"
                                                value={ui.langMy}
                                                onChangeText={(langMy) => patchUi({langMy})}
                                                placeholder={t.search.placeholders.myanmar}
                                                className={`border border-slate-200 bg-white ${COMPACT_ADVANCED_INPUT_CLASSNAME}`}
                                            />
                                        </View>
                                    </View>

                                    <View className="gap-1">
                                        <Text
                                            className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                                            style={[style, {color: APP_COLORS.textMuted}]}
                                        >
                                            {t.search.status}
                                        </Text>
                                        <Select
                                            value={
                                                ui.active === null
                                                    ? {value: "all", label: tStatus.all}
                                                    : ui.active
                                                        ? {value: "active", label: tStatus.active}
                                                        : {value: "inactive", label: tStatus.inactive}
                                            }
                                            onValueChange={(next) => {
                                                if (!next || Array.isArray(next)) return;
                                                if (next.value === "all") patchUi({active: null});
                                                if (next.value === "active") patchUi({active: true});
                                                if (next.value === "inactive")
                                                    patchUi({active: false});
                                            }}
                                            presentation="popover"
                                        >
                                            <Select.Trigger
                                                className="rounded-xl border h-11  py-0  px-2.5"
                                                style={{
                                                    backgroundColor: APP_COLORS.inputBackground,
                                                    borderColor: APP_COLORS.border,
                                                    borderWidth: 1
                                                }}
                                            >
                                                <Select.Value
                                                    className={`text-sm font-normal py-0  ${getMyanmarLeadingClass(locale)} `}
                                                    placeholder=""
                                                    style={[{color: APP_COLORS.textPrimary}, style]}
                                                />
                                                <Select.TriggerIndicator/>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Overlay/>
                                                <Select.Content
                                                    className="rounded-2xl border"
                                                    style={{
                                                        backgroundColor: APP_COLORS.card,
                                                        borderColor: APP_COLORS.border,
                                                        borderWidth: 1
                                                    }}
                                                    presentation="popover"
                                                    width="trigger"
                                                >
                                                    <Select.Item value="all"
                                                                 label={tStatus.all}
                                                                 style={{
                                                                     paddingVertical: 12,
                                                                     paddingHorizontal: 16,
                                                                 }}
                                                    >
                                                        <Select.ItemLabel
                                                            className={`text-xs text-slate-900 ${getMyanmarLeadingClass(locale)}`}
                                                            style={style}
                                                        />
                                                        <Select.ItemIndicator/>
                                                    </Select.Item>
                                                    <Select.Item value="active"
                                                                 label={tStatus.active}
                                                                 style={{
                                                                     paddingVertical: 12,
                                                                     paddingHorizontal: 16,
                                                                 }}
                                                    >
                                                        <Select.ItemLabel
                                                            className={`text-xs text-slate-900 ${getMyanmarLeadingClass(locale)}`}
                                                            style={style}
                                                        />
                                                        <Select.ItemIndicator/>
                                                    </Select.Item>
                                                    <Select.Item
                                                        value="inactive"
                                                        label={tStatus.inactive}
                                                        style={{
                                                            paddingVertical: 12,
                                                            paddingHorizontal: 16,
                                                        }}
                                                    >
                                                        <Select.ItemLabel
                                                            className={`text-xs text-slate-900 ${getMyanmarLeadingClass(locale)}`}
                                                            style={style}
                                                        />
                                                        <Select.ItemIndicator/>
                                                    </Select.Item>
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select>
                                    </View>

                                    <View className="flex-row gap-2 pt-0.5">
                                        <Pressable
                                            onPress={() => {
                                                setAppliedAdvanced({...defaultServiceAdvancedApplied});
                                                patchUi({
                                                    quickQuery: "",
                                                    langEng: "",
                                                    langMy: "",
                                                    active: true,
                                                });
                                            }}
                                            className="flex-1 py-3 items-center justify-center rounded-xl "
                                            style={({pressed}) => ({
                                                backgroundColor: pressed ? APP_COLORS.errorSoft : 'transparent',
                                                borderColor: APP_COLORS.border,
                                                borderWidth: 1
                                            })}>
                                            <Text
                                                className={`text-xs font-semibold  ${getMyanmarLeadingClass(locale)}`}
                                                style={[style, {color: APP_COLORS.error}]}
                                            >
                                                {t.search.reset}
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            className=" flex-1 py-3 items-center justify-center rounded-xl"
                                            style={({pressed}) => ({
                                                backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary
                                            })}
                                            onPress={() => {
                                                setAppliedAdvanced({
                                                    langEng: ui.langEng,
                                                    langMy: ui.langMy,
                                                    active: ui.active,
                                                });
                                                patchUi({advancedOpen: false});
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
                            <ActivityIndicator color={APP_COLORS.primary}/>
                        </View>
                    ) : (
                        <Text
                            className="px-6 py-8 text-center text-slate-500"
                            style={style}
                        >
                            {isError ? t.master.empty : t.master.empty}
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
                contentContainerStyle={{paddingBottom: 0, flexGrow: 1}}
            />
        </SafeAreaView>
    );
}
