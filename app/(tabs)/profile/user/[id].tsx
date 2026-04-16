import { APP_COLORS } from "@/constants/colors";
import { myanmarUITextStyle } from "@/constants/myanmar-font";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import type { CreateUserRole } from "@/stores/server/user/create-mutation";
import {
  useUpdateUserActiveStatus,
  useUpdateUserLockStatus,
} from "@/stores/server/user/status-mutation";
import { useUpdateUser } from "@/stores/server/user/update-mutation";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Input, Select, Switch } from "heroui-native";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const ROLE_OPTIONS: {
  value: CreateUserRole;
  labelEn: string;
  labelMm: string;
}[] = [
  { value: "ADMIN", labelEn: "ADMIN", labelMm: "စီမံ" },
  { value: "OWNER", labelEn: "OWNER", labelMm: "ပိုင်ရှင်" },
  { value: "WORKER", labelEn: "WORKER", labelMm: "ဝန်ထမ်း" },
  { value: "VIEWER", labelEn: "VIEWER", labelMm: "ကြည့်ရှုသူ" },
];

function toIsoDate(dmy: string): string | null {
  const value = dmy.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd)
  ) {
    return null;
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function isoToDmy(isoDate: string): string {
  const raw = isoDate.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isNotFutureDate(dmy: string): boolean {
  const iso = toIsoDate(dmy);
  if (!iso) return false;
  return iso <= todayIsoLocal();
}

function isRole(value: string): value is CreateUserRole {
  return ["ADMIN", "OWNER", "WORKER", "VIEWER"].includes(value);
}

function parseDmyToDate(dmy: string): Date | null {
  const iso = toIsoDate(dmy);
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDmyDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function getAppVersionNumber(): number {
  const version = String(Constants.expoConfig?.version ?? "").trim();
  if (!version) return 0;

  const numericOnly = version.replace(/[^\d]/g, "");
  const parsed = Number(numericOnly);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function buildSchema(locale: "en" | "mm") {
  return z.object({
    version: z.coerce
      .number()
      .int()
      .min(0, locale === "mm" ? "Version မမှန်ကန်ပါ" : "Version must be >= 0"),
    fullName: z
      .string()
      .min(1, locale === "mm" ? "အမည်လိုအပ်သည်" : "Full name is required"),
    email: z
      .string()
      .email(locale === "mm" ? "အီးမေးလ်မှန်ကန်ရမည်" : "Invalid email"),
    role: z.enum(["ADMIN", "OWNER", "WORKER", "VIEWER"]),
    joinDate: z
      .string()
      .min(1, locale === "mm" ? "စတင်နေ့စွဲလိုအပ်သည်" : "Join date is required")
      .refine((value) => !!toIsoDate(value), {
        message:
          locale === "mm" ? "နေ့/လ/နှစ် ပုံစံ dd/mm/yyyy ထည့်ပါ" : "Use dd/mm/yyyy",
      })
      .refine((value) => isNotFutureDate(value), {
        message:
          locale === "mm"
            ? "စတင်နေ့စွဲသည် အနာဂတ်နေ့ မဖြစ်ရပါ"
            : "Join date cannot be in the future",
      }),
    phoneNumber: z
      .string()
      .regex(
        /^09\d{9}$/,
        locale === "mm"
          ? "09 ဖြင့်စပြီး ဂဏန်း ၉ လုံး ဆက်ရမည်"
          : "Must start with 09 and contain 11 digits",
      ),
    dateOfBirth: z
      .string()
      .min(1, locale === "mm" ? "မွေးသက္ကရာဇ်လိုအပ်သည်" : "Date is required")
      .refine((value) => !!toIsoDate(value), {
        message:
          locale === "mm" ? "နေ့/လ/နှစ် ပုံစံ dd/mm/yyyy ထည့်ပါ" : "Use dd/mm/yyyy",
      })
      .refine((value) => isNotFutureDate(value), {
        message:
          locale === "mm"
            ? "မွေးနေ့သက္ကရာဇ်သည် အနာဂတ်နေ့ မဖြစ်ရပါ"
            : "Date of birth cannot be in the future",
      }),
    fullIdNo: z.string().max(50).optional(),
    parentOwnerId: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function TeamEditUserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    active?: string;
    notLocked?: string;
  }>();
  const locale = useLocaleStore((state) => state.locale);
  const t = profileLocale[locale];
  const labels = t.editUserScreen;
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const { mutate, isPending } = useUpdateUser();
  const { mutate: mutateActiveStatus, isPending: isActiveUpdating } =
    useUpdateUserActiveStatus();
  const { mutate: mutateLockStatus, isPending: isLockUpdating } = useUpdateUserLockStatus();
  const appVersion = useMemo(() => getAppVersionNumber(), []);
  const [activeDateField, setActiveDateField] = useState<"joinDate" | "dateOfBirth" | null>(
    null,
  );
  const [isActiveEnabled, setIsActiveEnabled] = useState(
    String(params.active ?? "true").toLowerCase() === "true",
  );
  const [isUnlockedEnabled, setIsUnlockedEnabled] = useState(
    String(params.notLocked ?? "true").toLowerCase() === "true",
  );

  const roleFromParams = isRole(String(params.role ?? "")) ? params.role : "OWNER";
  const schema = useMemo(() => buildSchema(locale), [locale]);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      version: appVersion,
      fullName: String(params.fullName ?? ""),
      email: String(params.email ?? ""),
      role: roleFromParams,
      phoneNumber: String(params.phoneNumber ?? ""),
      joinDate: isoToDmy(todayIsoLocal()),
      dateOfBirth: "",
      fullIdNo: "",
      parentOwnerId: "",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = (values: FormValues) => {
    const id = String(params.id ?? "").trim();
    if (!id) {
      Alert.alert(labels.errorTitle, labels.invalidUserId);
      return;
    }

    const dateOfBirthIso = toIsoDate(values.dateOfBirth);
    const joinDateIso = toIsoDate(values.joinDate);
    if (!dateOfBirthIso || !joinDateIso) {
      Alert.alert(labels.errorTitle, labels.dateInvalid);
      return;
    }

    mutate(
      {
        id,
        version: appVersion,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        role: values.role,
        joinDate: joinDateIso,
        phoneNumber: values.phoneNumber.trim(),
        dateOfBirth: dateOfBirthIso,
        fullIdNo: values.fullIdNo?.trim(),
        parentOwnerId: values.role === "VIEWER" ? values.parentOwnerId?.trim() : undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(labels.successTitle, labels.successBody);
          router.back();
        },
        onError: () => {
          Alert.alert(labels.errorTitle, labels.errorBody);
        },
      },
    );
  };

  const onToggleActive = (nextStatus: boolean) => {
    const id = String(params.id ?? "").trim();
    if (!id) {
      Alert.alert(labels.errorTitle, labels.invalidUserId);
      return;
    }
    mutateActiveStatus(
      { id, status: nextStatus },
      {
        onSuccess: () => setIsActiveEnabled(nextStatus),
        onError: () => Alert.alert(labels.errorTitle, labels.errorBody),
      },
    );
  };

  const onToggleLocked = (nextStatus: boolean) => {
    const id = String(params.id ?? "").trim();
    if (!id) {
      Alert.alert(labels.errorTitle, labels.invalidUserId);
      return;
    }
    mutateLockStatus(
      { id, status: nextStatus },
      {
        onSuccess: () => setIsUnlockedEnabled(nextStatus),
        onError: () => Alert.alert(labels.errorTitle, labels.errorBody),
      },
    );
  };

  const fieldLabels =
    locale === "mm"
      ? {
          version: "ဗားရှင်း",
          fullName: "အမည်အပြည့်အစုံ",
          email: "အီးမေးလ်လိပ်စာ",
          role: "အခန်းကဏ္ဍ",
          joinDate: "စတင်သည့်နေ့",
          phoneNumber: "ဖုန်းနံပါတ်",
          dateOfBirth: "မွေးနေ့သက္ကရာဇ်",
          fullIdNo: "မှတ်ပုံတင်အမှတ်",
          parentOwnerId: "မိဘ Owner ID",
        }
      : {
          version: "Version",
          fullName: "Full Name",
          email: "Email",
          role: "Role",
          joinDate: "Join Date",
          phoneNumber: "Phone Number",
          dateOfBirth: "Date of Birth",
          fullIdNo: "ID Number",
          parentOwnerId: "Parent Owner ID",
        };

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <View className="flex-row items-center px-4 pb-3 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#eef2f6]"
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>
        <Text
          className="flex-1 px-3 text-center text-[24px] font-bold text-slate-900"
          style={style}
        >
          {labels.title}
        </Text>
        <View className="h-11 w-11" />
      </View>

      <ScrollView
        className="px-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, flexGrow: 1 }}
      >
        <View className="mt-1 rounded-2xl bg-white p-4">
          <View className="gap-3">
            {(
              [
                { key: "fullName", required: true },
                { key: "email", required: true, keyboardType: "email-address" },
                { key: "phoneNumber", required: true, keyboardType: "phone-pad" },
                { key: "fullIdNo", required: false },
              ] as const
            ).map((field) => (
              <View className="gap-1.5" key={field.key}>
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-medium text-slate-900" style={style}>
                    {fieldLabels[field.key]}
                  </Text>
                  {field.required ? <Text className="text-red-500">*</Text> : null}
                </View>
                <Controller
                  control={control}
                  name={field.key}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      keyboardType={field.keyboardType}
                      autoCapitalize={field.key === "email" ? "none" : "sentences"}
                      className="border border-slate-200 bg-white"
                    />
                  )}
                />
                {!!errors[field.key]?.message && (
                  <Text className="text-xs text-red-500">
                    {String(errors[field.key]?.message)}
                  </Text>
                )}
              </View>
            ))}

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-slate-900" style={style}>
                  {fieldLabels.joinDate}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="joinDate"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Pressable
                      onPress={() => setActiveDateField("joinDate")}
                      className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <Text
                        className={value ? "text-slate-900" : "text-slate-400"}
                        style={style}
                      >
                        {value || labels.datePlaceholder}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#64748b" />
                    </Pressable>

                    {activeDateField === "joinDate" ? (
                      <View className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
                        <DateTimePicker
                          value={parseDmyToDate(String(value ?? "")) ?? new Date()}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          maximumDate={new Date()}
                          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                            if (Platform.OS !== "ios") {
                              setActiveDateField(null);
                            }
                            if (event.type === "set" && selectedDate) {
                              onChange(toDmyDate(selectedDate));
                            }
                          }}
                        />
                        {Platform.OS === "ios" ? (
                          <Pressable
                            onPress={() => setActiveDateField(null)}
                            className="mt-2 self-end rounded-lg bg-slate-100 px-3 py-1.5"
                          >
                            <Text className="text-xs font-semibold text-slate-700" style={style}>
                              {locale === "mm" ? "ပြီးပါပြီ" : "Done"}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                )}
              />
              {!!errors.joinDate?.message && (
                <Text className="text-xs text-red-500">{String(errors.joinDate.message)}</Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-slate-900" style={style}>
                  {fieldLabels.dateOfBirth}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field: { onChange, value } }) => (
                  <View>
                    <Pressable
                      onPress={() => setActiveDateField("dateOfBirth")}
                      className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <Text
                        className={value ? "text-slate-900" : "text-slate-400"}
                        style={style}
                      >
                        {value || labels.datePlaceholder}
                      </Text>
                      <Ionicons name="calendar-outline" size={18} color="#64748b" />
                    </Pressable>

                    {activeDateField === "dateOfBirth" ? (
                      <View className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
                        <DateTimePicker
                          value={parseDmyToDate(String(value ?? "")) ?? new Date()}
                          mode="date"
                          display={Platform.OS === "ios" ? "spinner" : "default"}
                          maximumDate={new Date()}
                          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                            if (Platform.OS !== "ios") {
                              setActiveDateField(null);
                            }
                            if (event.type === "set" && selectedDate) {
                              onChange(toDmyDate(selectedDate));
                            }
                          }}
                        />
                        {Platform.OS === "ios" ? (
                          <Pressable
                            onPress={() => setActiveDateField(null)}
                            className="mt-2 self-end rounded-lg bg-slate-100 px-3 py-1.5"
                          >
                            <Text className="text-xs font-semibold text-slate-700" style={style}>
                              {locale === "mm" ? "ပြီးပါပြီ" : "Done"}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                )}
              />
              {!!errors.dateOfBirth?.message && (
                <Text className="text-xs text-red-500">
                  {String(errors.dateOfBirth.message)}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-slate-900" style={style}>
                  {fieldLabels.role}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="role"
                render={({ field: { value, onChange } }) => (
                  <Select
                    value={{
                      value,
                      label:
                        locale === "mm"
                          ? `${value} - ${(ROLE_OPTIONS.find((r) => r.value === value)?.labelMm ?? value)}`
                          : value,
                    }}
                    onValueChange={(next) => {
                      if (next && !Array.isArray(next)) {
                        onChange(next.value as CreateUserRole);
                      }
                    }}
                  >
                    <Select.Trigger className="rounded-xl border border-slate-200 bg-white px-2.5">
                      <Select.Value placeholder={labels.rolePlaceholder} style={style} />
                      <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Overlay />
                      <Select.Content
                        className="rounded-2xl border border-slate-200 bg-white"
                        presentation="popover"
                        width="trigger"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <Select.Item
                            key={role.value}
                            value={role.value}
                            label={locale === "mm" ? role.labelMm : role.labelEn}
                          >
                            <Select.ItemLabel style={style} />
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                )}
              />
            </View>

            {selectedRole === "VIEWER" ? (
              <View className="gap-1.5">
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-medium text-slate-900" style={style}>
                    {fieldLabels.parentOwnerId}
                  </Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <Controller
                  control={control}
                  name="parentOwnerId"
                  rules={{
                    validate: (value) =>
                      !!String(value ?? "").trim() ||
                      (locale === "mm"
                        ? "VIEWER အတွက် Parent Owner ID လိုအပ်သည်"
                        : "Parent Owner ID is required for VIEWER"),
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={String(value ?? "")}
                      onChangeText={onChange}
                      className="border border-slate-200 bg-white"
                    />
                  )}
                />
                {!!errors.parentOwnerId?.message && (
                  <Text className="text-xs text-red-500">
                    {String(errors.parentOwnerId.message)}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
          className="mb-2 mt-5 items-center justify-center rounded-xl py-3.5"
          style={{
            backgroundColor: APP_COLORS.primary,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          <Text className="text-base font-semibold text-white" style={style}>
            {isPending ? labels.submitting : labels.submit}
          </Text>
        </Pressable>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <Text className="mb-3 text-sm font-semibold text-slate-900" style={style}>
            {labels.statusTitle}
          </Text>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-2">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: isActiveEnabled ? "#22c55e" : "#94a3b8" }}
              />
              <Text className="text-sm text-slate-700" style={style}>
                {labels.statusActive}
              </Text>
            </View>
            <Switch
              isSelected={isActiveEnabled}
              onSelectedChange={onToggleActive}
              isDisabled={isActiveUpdating}
            />
          </View>

          <View className="my-2 h-px bg-slate-200" />

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={isUnlockedEnabled ? "lock-open-outline" : "lock-closed-outline"}
                size={15}
                color={isUnlockedEnabled ? "#10b981" : "#ef4444"}
              />
              <Text className="text-sm text-slate-700" style={style}>
                {labels.statusLock}
              </Text>
            </View>
            <Switch
              isSelected={isUnlockedEnabled}
              onSelectedChange={onToggleLocked}
              isDisabled={isLockUpdating}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
