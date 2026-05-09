import { APP_COLORS } from "@/constants/colors";
import { myanmarUITextStyle } from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import proposalLocale from "@/locale/proposal/proposal.json";
import { useAuthStore } from "@/stores/auth-store";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useProposalsInfinite } from "@/stores/server/proposal/query";
import type {
  ProposalAdvancedFilters,
  ProposalTabStatus,
} from "@/stores/server/proposal/search-columns";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProposalAdvancedFilters as ProposalAdvancedFiltersCard } from "./proposal-advanced-filters";
import { ProposalCard } from "./proposal-card";
import { ProposalHeader } from "./proposal-header";
import { ProposalSearchToolbar } from "./proposal-search-toolbar";
import { ProposalTabs } from "./proposal-tabs";

const TAB_ORDER: ProposalTabStatus[] = ["INFORM", "APPROVED", "TERMINATED"];

type ProposalListUiState = ProposalAdvancedFilters & {
  quickQuery: string;
  advancedOpen: boolean;
};

const initialProposalListUi: ProposalListUiState = {
  quickQuery: "",
  advancedOpen: false,
  proposalNo: "",
  ownerId: "",
  plateNo: "",
  proposalDateFrom: "",
  proposalDateTo: "",
  serviceTypeCsv: "",
  serviceDateFrom: "",
  serviceDateTo: "",
  createdByCsv: "",
};

export default function ProposalScreen() {
  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);
  const role = useAuthStore((state) => state.role);
  const fullName = useAuthStore((state) => state.fullName);

  const [status, setStatus] = useState<ProposalTabStatus>("INFORM");
  const [ui, setUi] = useState<ProposalListUiState>(initialProposalListUi);
  const patchUi = useCallback((next: Partial<ProposalListUiState>) => {
    setUi((prev) => ({ ...prev, ...next }));
  }, []);
  const debouncedQuickQuery = useDebouncedValue(ui.quickQuery, 500);

  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const t = proposalLocale[locale].list;
  const upperRole = (role || "").toUpperCase();
  const showOwnerId = upperRole === "ADMIN";
  const showCreatedBy = upperRole === "ADMIN" || upperRole === "OWNER";

  const filters = useMemo(
    () => ({
      quickQuery: debouncedQuickQuery,
      proposalNo: ui.proposalNo,
      ownerId: ui.ownerId,
      plateNo: ui.plateNo,
      proposalDateFrom: ui.proposalDateFrom,
      proposalDateTo: ui.proposalDateTo,
      serviceTypeCsv: ui.serviceTypeCsv,
      serviceDateFrom: ui.serviceDateFrom,
      serviceDateTo: ui.serviceDateTo,
      createdByCsv: ui.createdByCsv,
    }),
    [debouncedQuickQuery, ui],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isRefetching,
    refetch,
  } = useProposalsInfinite(status, filters, role, true);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data.data) ?? [],
    [data],
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const advancedFilters: ProposalAdvancedFilters = useMemo(
    () => ({
      proposalNo: ui.proposalNo,
      ownerId: ui.ownerId,
      plateNo: ui.plateNo,
      proposalDateFrom: ui.proposalDateFrom,
      proposalDateTo: ui.proposalDateTo,
      serviceTypeCsv: ui.serviceTypeCsv,
      serviceDateFrom: ui.serviceDateFrom,
      serviceDateTo: ui.serviceDateTo,
      createdByCsv: ui.createdByCsv,
    }),
    [ui],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <FlatList
        data={items}
        className="px-4"
        keyExtractor={(item) => `${item.proposalNo}-${item.proposalDate}`}
        renderItem={({ item }) => <ProposalCard item={item} locale={locale} />}
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        ListHeaderComponent={
          <View className="pb-3 pt-1">
            <ProposalHeader
              title={t.title}
              welcomeLabel={t.welcome}
              fullName={fullName || "-"}
              style={style}
            />
            <ProposalTabs
              value={status}
              onChange={setStatus}
              tabs={TAB_ORDER}
              locale={locale}
              style={style}
            />
            <ProposalSearchToolbar
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
              onPressAdd={() => router.push("/(tabs)/proposal/create")}
            />
            {ui.advancedOpen ? (
              <ProposalAdvancedFiltersCard
                filters={advancedFilters}
                locale={locale}
                style={style}
                showOwnerId={showOwnerId}
                showCreatedBy={showCreatedBy}
                onChange={patchUi}
                onReset={() =>
                  patchUi({
                    quickQuery: "",
                    proposalNo: "",
                    ownerId: "",
                    plateNo: "",
                    proposalDateFrom: "",
                    proposalDateTo: "",
                    serviceTypeCsv: "",
                    serviceDateFrom: "",
                    serviceDateTo: "",
                    createdByCsv: "",
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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={onRefresh}
            tintColor={APP_COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
