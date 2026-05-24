import { APP_COLORS } from "@/constants/colors";
import { myanmarUITextStyle } from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuthStore } from "@/stores/auth-store";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useOwnershipsInfinite } from "@/stores/server/ownership/query";
import type {
  OwnershipAdvancedFilters as OwnershipAdvancedFilterValues,
  OwnershipTruckStatus,
} from "@/stores/server/ownership/search-columns";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OwnershipAdvancedFilters } from "./ownership-advanced-filters";
import { OwnershipCard } from "./ownership-card";
import { OwnershipHeader } from "./ownership-header";
import { OwnershipSearchToolbar } from "./ownership-search-toolbar";
import { OwnershipTabs } from "./ownership-tabs";

type OwnershipListUiState = OwnershipAdvancedFilterValues & {
  quickQuery: string;
  advancedOpen: boolean;
};

const initialOwnershipListUi: OwnershipListUiState = {
  quickQuery: "",
  advancedOpen: false,
  plateNo: "",
  licenseCity: "",
  licenseEndDate: "",
  profit: "",
  ownerIdCsv: "",
};

const ownershipCopy = {
  en: {
    title: "Ownerships",
    welcome: "Welcome",
    searchPlaceholder: "Search plate number...",
    empty: "No ownerships found",
    addComingSoonTitle: "Coming Soon",
    addComingSoonBody: "Create ownership is not available yet.",
    tabs: {
      ACTIVE: "Active",
      SOLD_OUT: "Sold Out",
    },
    advanced: {
      title: "Advanced Search",
      plateNo: "Plate No",
      licenseCity: "License City",
      licenseEndDate: "License End Date",
      profit: "Profit",
      ownerIdCsv: "Owner ID",
      datePlaceholder: "DD/MM/YYYY",
      reset: "Reset",
      apply: "Apply",
    },
    card: {
      licenseStartDate: "License Start",
      licenseEndDate: "License End",
      balance: "Balance",
      licenseCity: "License City",
      profit: "Profit",
      monthSuffix: "mo",
    },
  },
  mm: {
    title: "ပိုင်ဆိုင်မှု",
    welcome: "မင်္ဂလာပါ",
    searchPlaceholder: "ကားနံပါတ်ရှာရန်...",
    empty: "ပိုင်ဆိုင်မှု မတွေ့ရှိပါ",
    addComingSoonTitle: "မကြာမီ",
    addComingSoonBody: "ပိုင်ဆိုင်မှု အသစ်ထည့်ရန် မရသေးပါ။",
    tabs: {
      ACTIVE: "လက်ရှိ",
      SOLD_OUT: "ရောင်းပြီး",
    },
    advanced: {
      title: "အသေးစိတ်ရှာဖွေမှု",
      plateNo: "ကားနံပါတ်",
      licenseCity: "လိုင်စင်မြို့",
      licenseEndDate: "လိုင်စင်ကုန်ဆုံးရက်",
      profit: "အမြတ်",
      ownerIdCsv: "Owner ID",
      datePlaceholder: "DD/MM/YYYY",
      reset: "ရှင်းလင်းမည်",
      apply: "ရှာမည်",
    },
    card: {
      licenseStartDate: "လက်ရှိမှတ်",
      licenseEndDate: "ကုန်ဆုံးရက်",
      balance: "လက်ကျန်",
      licenseCity: "လိုင်စင်မြို့",
      profit: "အမြတ်",
      monthSuffix: "လ",
    },
  },
} as const;

export default function OwnerShip() {
  const locale = useLocaleStore((state) => state.locale);
  const fullName = useAuthStore((state) => state.fullName);
  const role = useAuthStore((state) => state.role);
  const t = ownershipCopy[locale];
  const showOwnerId = (role || "").toUpperCase() === "ADMIN";

  const [status, setStatus] = useState<OwnershipTruckStatus>("ACTIVE");
  const [ui, setUi] = useState<OwnershipListUiState>(initialOwnershipListUi);
  const patchUi = useCallback((next: Partial<OwnershipListUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  }, []);
  const debouncedQuickQuery = useDebouncedValue(ui.quickQuery, 500);

  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const filters = useMemo(
    () => ({
      quickQuery: debouncedQuickQuery,
      plateNo: ui.plateNo,
      licenseCity: ui.licenseCity,
      licenseEndDate: ui.licenseEndDate,
      profit: ui.profit,
      ownerIdCsv: ui.ownerIdCsv,
    }),
    [debouncedQuickQuery, ui],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useOwnershipsInfinite(status, filters, role);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data.data) ?? [],
    [data],
  );

  const advancedFilters: OwnershipAdvancedFilterValues = useMemo(
    () => ({
      plateNo: ui.plateNo,
      licenseCity: ui.licenseCity,
      licenseEndDate: ui.licenseEndDate,
      profit: ui.profit,
      ownerIdCsv: ui.ownerIdCsv,
    }),
    [ui],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <FlatList
        data={items}
        className="px-4"
        keyExtractor={(item, index) => item.id || `${item.plateNo}-${index}`}
        renderItem={({ item }) => (
          <OwnershipCard item={item} locale={locale} labels={t.card} />
        )}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View className="pb-3 pt-1">
            <OwnershipHeader
              title={t.title}
              welcomeLabel={t.welcome}
              fullName={fullName || "-"}
              style={style}
            />
            <OwnershipTabs
              value={status}
              onChange={setStatus}
              labels={t.tabs}
              style={style}
            />
            <OwnershipSearchToolbar
              locale={locale}
              quickQuery={ui.quickQuery}
              placeholder={t.searchPlaceholder}
              advancedOpen={ui.advancedOpen}
              onChangeQuickQuery={(quickQuery) => patchUi({ quickQuery })}
              onClearQuickQuery={() => patchUi({ quickQuery: "" })}
              onToggleAdvanced={() =>
                setUi((prev) => ({
                  ...prev,
                  advancedOpen: !prev.advancedOpen,
                }))
              }
              onPressAdd={() =>
                Alert.alert(t.addComingSoonTitle, t.addComingSoonBody)
              }
            />
            {ui.advancedOpen ? (
              <OwnershipAdvancedFilters
                filters={advancedFilters}
                labels={t.advanced}
                locale={locale}
                style={style}
                showOwnerId={showOwnerId}
                onChange={patchUi}
                onReset={() =>
                  patchUi({
                    quickQuery: "",
                    plateNo: "",
                    licenseCity: "",
                    licenseEndDate: "",
                    profit: "",
                    ownerIdCsv: "",
                  })
                }
                onApply={() => patchUi({ advancedOpen: false })}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isPending ? (
            <View className="items-center py-10">
              <ActivityIndicator color={APP_COLORS.primary} />
            </View>
          ) : (
            <Text className="px-6 py-8 text-center text-slate-500" style={style}>
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
      />
    </SafeAreaView>
  );
}
