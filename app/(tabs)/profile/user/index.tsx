import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompactSelect } from "./components/compact-select";
import { TeamSearchToolbar } from "./components/team-search-toolbar";
import { TeamUserCard } from "./components/team-user-card";
import {useTranslation} from "@/hooks/use-translation";
import { useThrottledCallback } from '@/hooks/use-throttled-callback';
import {UserTeamItem} from "@/stores/server/user/typed";

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

  const tUser = useTranslation('user')
  const tLookup = useTranslation('lookup');
  const tCommon = useTranslation('common');

  const router = useRouter();
  const locale = useLocaleStore((state) => state.locale);

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

  const activeOptions =  useMemo(()=>{
    return [
      {value: "",label: tCommon.anyLabel},
        ...Object.entries(tLookup.accountStatus || {}).map(([key, localizedLabel]) => ({
          value:key,
          label:localizedLabel
        }))
    ]
  },[tLookup.accountStatus,tCommon.anyLabel])

  const lockOptions =  useMemo(()=>{
    return [
      {value: "",label: tCommon.anyLabel},
      ...Object.entries(tLookup.accountControl || {}).map(([key, localizedLabel]) => ({
        value:key,
        label:localizedLabel
      }))
    ]
  },[tLookup.accountControl,tCommon.anyLabel])


  /** Advanced role filter: empty string = any (no API constraint). */

  const  roleFilterOptions = useMemo(() => {
    return [
      { value: "", label: tCommon.anyLabel },
      ...Object.entries(tLookup.roles || {}).map(([key, localizedLabel]) => ({
        value: key,
        label: localizedLabel
      }))
    ];
  },[tLookup.roles,tCommon.anyLabel])


  const advancedInputClass = `text-[11px] font-normal ${getMyanmarLeadingClass(locale)} py-0 h-11`;

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
  } = useUsersInfinite(filters);

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data.data) ?? [],
    [data],
  );

  // Wrap the navigation handler action loop inside the throttle engine
  const handleCardPress = useThrottledCallback((item: UserTeamItem) => {
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
  }, 600);

  const handleAddPress = useThrottledCallback(()=>{
    router.push("/(tabs)/profile/user/create")
  },600)



  return (
    <SafeAreaView className="flex-1 " style={{backgroundColor:APP_COLORS.background}}>

      <View className="flex-row items-center px-4 pb-2 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full "
          style={({pressed})=> ({
              backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
          })}
        >
          <Ionicons name="arrow-back" size={22} color={APP_COLORS.textPrimary} />
        </Pressable>

        <Text
          className="flex-1 px-3 text-center text-lg font-bold "
          style={[style,{color:APP_COLORS.textPrimary}]}
        >
          {tUser.master.title}
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
            onPress={() =>handleCardPress(item)}
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
              placeholder={tUser.master.searchPlaceholder}
              advancedOpen={ui.advancedOpen}
              onChangeQuickQuery={(quickQuery) => patchUi({ quickQuery })}
              onClearQuickQuery={() => patchUi({ quickQuery: "" })}
              onToggleAdvanced={onToggleAdvanced}
              onPressAdd={() => handleAddPress()}
            />

            {ui.advancedOpen ? (
              <Card className="mb-4 p-5 "
                    style={{
                        backgroundColor:APP_COLORS.card,
                        borderColor:APP_COLORS.border,
                        borderWidth:1
              }}
              >
                <Card.Body className="gap-3 ">
                  <Text
                    className={`text-sm font-medium  ${getMyanmarLeadingClass(locale)}`}
                    style={[style,{color:APP_COLORS.textPrimary}]}
                  >
                    {tUser.search.advancedTitle}
                  </Text>

                  <View className="flex-row gap-2">
                    <View className="flex-1 gap-1">
                      <Text
                        className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                        style={[style,{color:APP_COLORS.textMuted}]}
                      >
                        {tUser.search.fullName}
                      </Text>
                      <Input
                        value={ui.fullName}
                        onChangeText={(fullName) => patchUi({ fullName })}
                        placeholder={tUser.search.placeholders.fullName}
                        placeholderTextColor={APP_COLORS.textMuted}
                        className={advancedInputClass}
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
                        {tUser.search.phoneNumber}
                      </Text>
                      <Input
                        value={ui.phoneNumber}
                        onChangeText={(phoneNumber) => patchUi({ phoneNumber })}
                        placeholder={tUser.search.placeholders.phoneNumber}
                        placeholderTextColor={APP_COLORS.textMuted}
                        keyboardType="phone-pad"
                        className={advancedInputClass}
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
                      <CompactSelect
                        label={tUser.search.role}
                        value={ui.role}
                        onChange={(role) => patchUi({ role })}
                        locale={locale}
                        placeholder={tUser.search.placeholders.role}
                        options={roleFilterOptions}
                      />
                    </View>
                    <View className="flex-1 gap-1">
                      <Text
                          className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                          style={[style,{color:APP_COLORS.textMuted}]}
                      >
                        {tUser.search.email}
                      </Text>
                      <Input
                        value={ui.email}
                        onChangeText={(email) => patchUi({ email })}
                        placeholder={tUser.search.placeholders.email}
                        placeholderTextColor={APP_COLORS.textMuted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        className={advancedInputClass}
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
                    <CompactSelect
                      label={tUser.search.isActive}
                      value={ui.isActive}
                      onChange={(value) =>
                        patchUi({ isActive: value as SelectBoolValue })
                      }
                      locale={locale}
                      placeholder={tCommon.anyLabel}
                      options={activeOptions}
                    />

                    <CompactSelect
                      label={tUser.search.isNotLocked}
                      value={ui.isNotLocked}
                      onChange={(value) =>
                        patchUi({ isNotLocked: value as SelectBoolValue })
                      }
                      locale={locale}
                      placeholder={tCommon.anyLabel}
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
                      className="flex-1 py-3 items-center justify-center rounded-xl "
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
                        {tUser.search.reset}
                      </Text>
                    </Pressable>

                    <Pressable
                      className=" flex-1 py-3 items-center justify-center rounded-xl"
                      style={ ({pressed})=>({
                          backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary
                      })}
                      onPress={onApplyAdvanced}
                    >
                      <Text
                        className="text-xs font-semibold text-white"
                        style={style}
                      >
                        {tUser.search.search}
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
              {tUser.master.empty}
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
