import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import {
  type CreateUserRole,
  useCreateUser,
} from "@/stores/server/user/create-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Input, Select } from "heroui-native";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

function buildSchema(locale: "en" | "mm") {
  return z.object({
    username: z
      .string()
      .min(1, locale === "mm" ? "အကောင့်လိုအပ်သည်" : "Username is required")
      .regex(
        /^09\d{7,13}$/,
        locale === "mm"
          ? "09 ဖြင့်စပြီး ဖုန်းနံပါတ်မှန်ကန်ရမည်"
          : "Must be a valid phone style username",
      ),
    password: z
      .string()
      .min(
        8,
        locale === "mm" ? "စကားဝှက် အနည်းဆုံး ၈ လုံး" : "Min 8 characters",
      ),
    fullName: z
      .string()
      .min(1, locale === "mm" ? "အမည်လိုအပ်သည်" : "Full name is required"),
    email: z
      .string()
      .email(locale === "mm" ? "အီးမေးလ်မှန်ကန်ရမည်" : "Invalid email"),
    dateOfBirth: z
      .string()
      .min(1, locale === "mm" ? "မွေးသက္ကရာဇ်လိုအပ်သည်" : "Date is required")
      .refine((value) => !!toIsoDate(value), {
        message:
          locale === "mm"
            ? "နေ့/လ/နှစ် ပုံစံ dd/mm/yyyy ထည့်ပါ"
            : "Use dd/mm/yyyy",
      }),
    role: z.enum(["ADMIN", "OWNER", "WORKER", "VIEWER"]),
    parentOwnerId: z.string().optional(),
  })
    .superRefine((data, ctx) => {
      if (data.role === "VIEWER" && !String(data.parentOwnerId ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            locale === "mm"
              ? "VIEWER အတွက် Parent Owner ID လိုအပ်သည်"
              : "Parent Owner ID is required for VIEWER",
          path: ["parentOwnerId"],
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function TeamCreateUserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const t = profileLocale[locale];
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [showDateOfBirthPicker, setShowDateOfBirthPicker] = useState(false);
  const { mutate, isPending } = useCreateUser();

  const schema = useMemo(() => buildSchema(locale), [locale]);
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      dateOfBirth: "",
      role: "OWNER",
      parentOwnerId: "",
    },
  });

  const selectedRole = watch("role");

  const labels = t.createUserScreen;
  const fieldLabels =
    locale === "mm"
      ? {
          username: "အသုံးပြုသူအကောင့်",
          password: "စကားဝှက်",
          fullName: "အမည်အပြည့်အစုံ",
          email: "အီးမေးလ်လိပ်စာ",
          dateOfBirth: "မွေးနေ့သက္ကရာဇ်",
          role: "အခန်းကဏ္ဍ",
          parentOwnerId: "မိဘ Owner ID",
        }
      : {
          username: "Username",
          password: "Password",
          fullName: "Full Name",
          email: "Email",
          dateOfBirth: "Date of Birth",
          role: "Role",
          parentOwnerId: "Parent Owner ID",
        };

  const onSubmit = (values: FormValues) => {
    const dateOfBirthIso = toIsoDate(values.dateOfBirth);
    if (!dateOfBirthIso) {
      Alert.alert(labels.errorTitle, labels.dateInvalid);
      return;
    }

    mutate(
      {
        username: values.username.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phoneNumber: values.username.trim(),
        dateOfBirth: dateOfBirthIso,
        joinDate: todayIsoLocal(),
        role: values.role,
        parentOwnerId:
          values.role === "VIEWER"
            ? values.parentOwnerId?.trim()
            : undefined,
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
          className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)}  font-bold text-slate-900  `}
          style={style}
        >
          {labels.title}
        </Text>
        <View className="h-11 w-11" />
      </View>

      <ScrollView
        className="px-4"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          flexGrow: 1,
        }}
      >
        <View className="rounded-2xl border border-[#c8dbf7] bg-[#ecf4ff] p-3">
          <View className="flex-row items-start gap-2">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#325f99"
            />
            <View className="flex-1">
              <Text
                className={`text-sm  font-semibold ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                style={style}
              >
                {labels.infoTitle}
              </Text>
              <Text
                className={`mt-0.5 text-xs ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                style={style}
              >
                {labels.infoBody}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <View className="gap-3">
            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                  style={style}
                >
                  {fieldLabels.username}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={labels.usernamePlaceholder}
                    className={`border py-0 h-11 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                    {...(Platform.OS === "android" && locale === "mm"
                      ? { includeFontPadding: false }
                      : {})}
                  />
                )}
              />
              {!!errors.username?.message && (
                <Text className="text-xs text-red-500" style={style}>
                  {errors.username.message}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                  style={style}
                >
                  {fieldLabels.password}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={labels.passwordPlaceholder}
                    secureTextEntry={!showPassword}
                    className={`border h-11 ${getMyanmarLeadingClass(locale)}  py-0 border-slate-200 bg-white`}
                    {...(Platform.OS === "android" && locale === "mm"
                      ? { includeFontPadding: false }
                      : {})}
                  />
                )}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                className="self-end rounded-md bg-slate-100 px-2.5 py-1"
              >
                <Text
                  className={`text-xs ${getMyanmarLeadingClass(locale)}  text-slate-600`}
                  // style={style}
                >
                  {showPassword
                    ? locale === "mm"
                      ? "ဖျောက်ရန်"
                      : "Hide"
                    : locale === "mm"
                      ? "ပြရန်"
                      : "Show"}
                </Text>
              </Pressable>
              {!!errors.password?.message && (
                <Text className="text-xs text-red-500" style={style}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {fieldLabels.fullName}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={labels.fullNamePlaceholder}
                    className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                    {...(Platform.OS === "android" && locale === "mm"
                      ? { includeFontPadding: false }
                      : {})}
                  />
                )}
              />
              {!!errors.fullName?.message && (
                <Text
                  className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                  style={style}
                >
                  {errors.fullName.message}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                  style={style}
                >
                  {fieldLabels.email}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder={labels.emailPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                    {...(Platform.OS === "android" && locale === "mm"
                      ? { includeFontPadding: false }
                      : {})}
                  />
                )}
              />
              {!!errors.email?.message && (
                <Text
                  className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                  style={style}
                >
                  {errors.email.message}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm ${getMyanmarLeadingClass(locale)} font-semibold  text-slate-900`}
                  style={style}
                >
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
                      onPress={() => setShowDateOfBirthPicker(true)}
                      className="flex-row items-center h-11 justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                    >
                      <Text
                        className={value ? "text-slate-900" : "text-slate-400"}
                        style={style}
                      >
                        {value || labels.datePlaceholder}
                      </Text>
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#64748b"
                      />
                    </Pressable>

                    {showDateOfBirthPicker ? (
                      <View className="mt-2 rounded-xl border border-slate-200 bg-white p-2">
                        <DateTimePicker
                          value={parseDmyToDate(value) ?? new Date()}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
                          maximumDate={new Date()}
                          onChange={(
                            event: DateTimePickerEvent,
                            selectedDate?: Date,
                          ) => {
                            if (Platform.OS !== "ios") {
                              setShowDateOfBirthPicker(false);
                            }
                            if (event.type === "set" && selectedDate) {
                              onChange(toDmyDate(selectedDate));
                            }
                          }}
                        />
                        {Platform.OS === "ios" ? (
                          <Pressable
                            onPress={() => setShowDateOfBirthPicker(false)}
                            className="mt-2 self-end rounded-lg bg-slate-100 px-3 py-1.5"
                          >
                            <Text
                              className={`text-xs ${getMyanmarLeadingClass(locale)}  font-semibold text-slate-700`}
                              style={style}
                            >
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
                <Text
                  className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                  style={style}
                >
                  {errors.dateOfBirth.message}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                  style={style}
                >
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
                          ? `${value} - ${ROLE_OPTIONS.find((r) => r.value === value)?.labelMm ?? value}`
                          : value,
                    }}
                    onValueChange={(next) => {
                      if (next && !Array.isArray(next)) {
                        onChange(next.value as CreateUserRole);
                      }
                    }}
                  >
                    <Select.Trigger
                      className={`rounded-xl h-11 py-0 ${getMyanmarLeadingClass(locale)}  border border-slate-200 bg-white px-2.5`}
                    >
                      <Select.Value
                        placeholder={labels.rolePlaceholder}
                        className={` py-0 text-sm ${getMyanmarLeadingClass(locale)}`}
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
                        {ROLE_OPTIONS.map((role) => (
                          <Select.Item
                            key={role.value}
                            value={role.value}
                            label={
                              locale === "mm" ? role.labelMm : role.labelEn
                            }
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
                  <Text
                    className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                    style={style}
                  >
                    {fieldLabels.parentOwnerId}
                  </Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <Controller
                  control={control}
                  name="parentOwnerId"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      value={value ?? ""}
                      onChangeText={onChange}
                      placeholder={labels.parentOwnerPlaceholder}
                      autoCapitalize="none"
                      className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                      {...(Platform.OS === "android" && locale === "mm"
                        ? { includeFontPadding: false }
                        : {})}
                    />
                  )}
                />
                {!!errors.parentOwnerId?.message && (
                  <Text
                    className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                    style={style}
                  >
                    {errors.parentOwnerId.message}
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
          className={`mb-2 mt-5 items-center justify-center rounded-xl py-3 ${getMyanmarLeadingClass(locale)}`}
          style={{
            backgroundColor: APP_COLORS.primary,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          <Text className="text-base font-semibold text-white" style={style}>
            {isPending ? labels.submitting : labels.submit}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
