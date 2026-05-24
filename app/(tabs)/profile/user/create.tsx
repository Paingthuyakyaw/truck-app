import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {useLocaleStore} from "@/stores/client/locale-store";
import {
    type CreateUserRole,
    useCreateUser,
} from "@/stores/server/user/create-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import {zodResolver} from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import DateTimePicker, {
    type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {useFocusEffect, useRouter} from "expo-router";
import {Input, Select} from "heroui-native";
import React, {useCallback, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
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
import {z} from "zod";
import {useTranslation} from "@/hooks/use-translation";
import {getApiErrorAlertCopy} from "@/lib/api-error-alert";
import { useOwnerLookupOptions } from "@/stores/server/ownership/owner-lookup-query";
import {Feather} from "@expo/vector-icons";


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
            .max(100, locale === "mm" ? "အကောင့်အမည်သည် စာလုံး ၁၀၀ ထက်မကျော်ရပါ" : "Username cannot exceed 100 characters")
            // Rules: Starts with capital letters ([A-Z]+), followed by 09, followed by exactly 9 digits (\d{9})
            .regex(
                /^[A-Z]+09\d{9}$/,
                locale === "mm"
                    ? "အကောင့်အမည်သည် စာလုံးများဖြင့်စပြီး ၀၉ နှင့် ဂဏန်း ၉ လုံး ဆက်တိုက်ဖြစ်ရမည် (ဥပမာ- ABC09111222333)"
                    : "Username must start with letters, followed by 09 and exactly 9 digits (e.g., ABC09111222333)",
            ),
        password: z
            .string()
            .min(
                8,
                locale === "mm" ? "စကားဝှက် အနည်းဆုံး ၈ လုံး" : "Min 8 characters",
            ),
        fullName: z
            .string()
            .min(1, locale === "mm" ? "အမည်လိုအပ်သည်" : "Full name is required")
            .max(100, locale === "mm" ? "အမည်သည် စာလုံး ၁၀၀ ထက်မကျော်ရပါ" : "Full name cannot exceed 100 characters"),
        email: z
            .string()
            .max(100, locale === "mm" ? "အီးမေးလ်သည် စာလုံး ၁၀၀ ထက်မကျော်ရပါ" : "Email cannot exceed 100 characters")
            .email(locale === "mm" ? "အီးမေးလ်မှန်ကန်ရမည်" : "Invalid email"),
        phoneNumber: z
            .string()
            .min(1, locale === "mm" ? "ဖုန်းနံပါတ်လိုအပ်သည်" : "Phone number is required")
            .regex(
                /^09\d{9}$/,
                locale === "mm"
                    ? "၀၉ ဖြင့်စပြီး ဂဏန်း ၉ လုံး ဖြစ်ရမည် (ဥပမာ- 09111222333)"
                    : "Phone number must start with 09 followed by exactly 9 digits (e.g., 09111222333)"
            ),
        dateOfBirth: z
            .string()
            .min(1, locale === "mm" ? "မွေးသက္ကရာဇ်လိုအပ်သည်" : "Date is required")
            .refine((value) => !!toIsoDate(value), {
                message:
                    locale === "mm"
                        ? "နေ့/လ/နှစ် ပုံစံ dd/mm/yyyy ထည့်ပါ"
                        : "Use dd/mm/yyyy",
            }),
        fullIdNo: z
            .string()
            .max(50, locale === "mm" ? "မှတ်ပုံတင်နံပါတ်သည် စာလုံး ၅၀ ထက်မကျော်ရပါ" : "Full ID number cannot exceed 50 characters")
            .optional(),
        role: z.enum(["ADMIN", "OWNER", "WORKER", "VIEWER"]),
        parentOwnerId: z.string().optional(),
    })
        .superRefine((data, ctx) => {
            if (data.role === "VIEWER" && !String(data.parentOwnerId ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        locale === "mm"
                            ? " ကြည့်ရှုသူ ရာထူးအတွက် ယာဉ်ပိုင်ရှင်ကို ရွေးချယ်ပေးပါ"
                            : "Owner  is required to choose for VIEWER",
                    path: ["parentOwnerId"],
                });
            }
        });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function TeamCreateUserScreen() {
    const {createUser: t} = useTranslation("user")
    const tLookup = useTranslation("lookup")
    const errorCatalog = useTranslation("error")
    const router = useRouter();
    const qc = useQueryClient();
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;
    const [showPassword, setShowPassword] = useState(false);
    const [showDateOfBirthPicker, setShowDateOfBirthPicker] = useState(false);
    const {mutate, isPending} = useCreateUser();
    const { data: ownerOptions = [] } = useOwnerLookupOptions("");

    const schema = useMemo(() => buildSchema(locale), [locale]);
    const {
        control,
        handleSubmit,
        watch,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            username: "",
            password: "",
            fullName: "",
            phoneNumber: "",
            email: "",
            dateOfBirth: "",
            fullIdNo: "",
            role: "WORKER" as CreateUserRole,
            parentOwnerId: "",
        },
    });

    const selectedRole = watch("role");
    const roleFilterOptions = useMemo(() => {
        return [
            ...Object.entries(tLookup.roles || {}).map(([key, localizedValue]) => ({
                value: key,
                label: localizedValue
            }))
        ];
    }, [tLookup.roles])

    const onSubmit = (values: FormValues) => {
        const dateOfBirthIso = toIsoDate(values.dateOfBirth);
        if (!dateOfBirthIso) {
            Alert.alert(t.errorTitle, t.dateInvalid);
            return;
        }

        mutate(
            {
                username: values.username.trim(),
                password: values.password,
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                phoneNumber: values.phoneNumber.trim(),
                dateOfBirth: dateOfBirthIso,
                fullIdNo: values.fullIdNo?.trim() || undefined,
                joinDate: todayIsoLocal(),
                role: values.role,
                parentOwnerId:
                    values.role === "VIEWER"
                        ? values.parentOwnerId?.trim()
                        : undefined,
            },
            {
                onSuccess: () => {
                    Alert.alert(t.successTitle, t.successBody);
                    router.back();
                },
                onError: (err: unknown) => {
                    const {title, message} = getApiErrorAlertCopy(err, errorCatalog, {
                        title: t.errorTitle,
                        message: t.errorBody,
                    });
                    Alert.alert(title, message);
                },
            },
        );
    };

    const onBack = useCallback(() => {
        qc.invalidateQueries({ queryKey: ["users"] });
        router.back();
    }, [qc, router]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                qc.invalidateQueries({ queryKey: ["users"] });
            };
        }, [qc]),
    );

    return (
        <SafeAreaView style={{backgroundColor:APP_COLORS.background , flex:1}}>
            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={onBack}
                    className="h-11 w-11 items-center justify-center rounded-full "
                    style={({pressed})=> ({
                        backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                    })}
                >
                    <Ionicons name="arrow-back" size={22} color="#475569"/>
                </Pressable>
                <Text
                    className={`flex-1 px-3 text-center text-lg font-bold ${getMyanmarLeadingClass(locale)}`}
                    style={[style,{color:APP_COLORS.textPrimary}]}
                >
                    {t.title}
                </Text>
                <View className="h-11 w-11"/>
            </View>

            <ScrollView
                className="px-4"
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 80,
                    flexGrow: 1,
                }}
            >
                <View className="rounded-2xl border border-[#c8dbf7] bg-[#ecf4ff] p-3"
                      style={{
                          backgroundColor:APP_COLORS.warningSoft,
                          borderColor:APP_COLORS.border,
                          borderWidth:1
                      }}
                >

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
                                {t.infoTitle}
                            </Text>
                            <Text
                                className={`mt-0.5 text-xs font-normal ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                                style={style}
                            >
                                {t.infoBody}
                            </Text>
                        </View>
                    </View>

                </View>

                <View
                    className="mt-4 rounded-2xl  p-4"
                    style={{
                        backgroundColor:APP_COLORS.card,
                        borderColor:APP_COLORS.border,
                        borderWidth:1
                    }}
                >
                    <View className="gap-3">

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.username}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="username"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        maxLength={100}
                                        placeholder={t.placeholders.username}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.username ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        },style]}
                                        className={`${getMyanmarLeadingClass(locale)}`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.username?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                    {errors.username.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.password}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="password"
                                render={({field: {onChange, value}}) => (

                                    <View style={{position: "relative", justifyContent: "center"}}>

                                        <Input
                                            value={value}
                                            onChangeText={onChange}
                                            placeholder={t.placeholders.password}
                                            secureTextEntry={!showPassword}
                                            placeholderTextColor={APP_COLORS.textMuted}
                                            autoCapitalize="none"
                                            style={[{
                                                backgroundColor: APP_COLORS.inputBackground,
                                                borderColor: errors.password ? APP_COLORS.error : APP_COLORS.border,
                                                borderWidth: 1,
                                                color: APP_COLORS.textPrimary
                                            },style]}
                                            className={`${getMyanmarLeadingClass(locale)}`}
                                            {...(Platform.OS === "android" && locale === "mm"
                                                ? {includeFontPadding: false}
                                                : {})}
                                        />
                                        <Pressable
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={({pressed}) => ({
                                                position: 'absolute',
                                                right: 12,
                                                width: 32,
                                                padding: 4,
                                                opacity: pressed ? 0.75 : 1
                                            })}
                                        >
                                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={22}
                                                     color={APP_COLORS.textMuted}/>
                                        </Pressable>

                                    </View>

                                )}
                            />
                            {!!errors.password?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                {errors.password.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.fullName}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="fullName"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        maxLength={100}
                                        placeholder={t.placeholders.fullName}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.fullName ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        },style]}
                                        className={`${getMyanmarLeadingClass(locale)}`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.fullName?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                {errors.fullName.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                       style={[{color: APP_COLORS.textSecondary}, style]}>
                                    {t.labels.phoneNumber}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="phoneNumber"
                                render={({ field: { value, onChange } }) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        maxLength={50}
                                        keyboardType="numeric"
                                        placeholder={t.placeholders.phoneNumber}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.phoneNumber ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        },style]}
                                        className={`${getMyanmarLeadingClass(locale)}`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.phoneNumber?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                {errors.phoneNumber.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.email}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="email"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        maxLength={100}
                                        placeholder={t.placeholders.email}
                                        keyboardType="email-address"
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.email ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        },style]}
                                        className={`${getMyanmarLeadingClass(locale)}`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.email?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                {errors.email.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.dateOfBirth}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="dateOfBirth"
                                render={({field: {onChange, value}}) => (
                                    <View>
                                        <Pressable
                                            onPress={() => setShowDateOfBirthPicker(true)}
                                            className={`flex-row items-center h-14 justify-between rounded-xl  px-3 py-3`}
                                            style={{
                                                backgroundColor: APP_COLORS.inputBackground,
                                                borderColor: errors.email ? APP_COLORS.error : APP_COLORS.border,
                                                borderWidth: 1
                                            }}
                                        >
                                            <Text
                                                className={`${getMyanmarLeadingClass(locale)}`}
                                                style={[style,{ color: value ? APP_COLORS.textPrimary : APP_COLORS.textMuted}]}
                                            >
                                                {value || t.placeholders.dateOfBirth}
                                            </Text>
                                            <Ionicons
                                                name="calendar-outline"
                                                size={22}
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
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                {errors.dateOfBirth.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.fullIdNo}
                                </Text>
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)}`} style={{color:APP_COLORS.warning}}>{locale === 'mm' ? '(မထည့်လည်းရ)' : '(Optional)'}</Text>
                            </View>
                            <Controller
                                control={control}
                                name="fullIdNo"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        maxLength={50}
                                        placeholder={t.placeholders.fullIdNo}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        },style]}
                                        className={`${getMyanmarLeadingClass(locale)}`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.fullIdNo?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                {errors.fullIdNo.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.role}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="role"
                                render={({field: {value, onChange}}) => {

                                    const selectedOption = roleFilterOptions.find((r) => r.value === value);
                                    const selectedLabel = selectedOption?.label;

                                    return (
                                        <Select
                                                value={{value: value, label: selectedLabel ? selectedLabel : ""}}
                                            onValueChange={(next) => {
                                                if (next && !Array.isArray(next)) {
                                                    onChange(next.value as CreateUserRole);
                                                }
                                            }}
                                        >
                                            <Select.Trigger
                                                className={`rounded-xl h-14 py-0 ${getMyanmarLeadingClass(locale)}   px-2.5`}
                                                style={{
                                                    backgroundColor: APP_COLORS.inputBackground,
                                                    borderColor:APP_COLORS.border,
                                                    borderWidth:1
                                                }}
                                            >
                                                <Select.Value
                                                    placeholder={t.placeholders.role}
                                                    className={` py-0 text-[11px] ${getMyanmarLeadingClass(locale)}`}
                                                    style={[{ color: APP_COLORS.textPrimary }]}
                                                />
                                                <Select.TriggerIndicator/>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Overlay/>
                                                <Select.Content
                                                    className="rounded-2xl"
                                                    style={{
                                                        backgroundColor:APP_COLORS.card,
                                                        borderColor:APP_COLORS.border,
                                                        borderWidth:1
                                                    }}
                                                    presentation="popover"
                                                    width="trigger"
                                                >
                                                    {roleFilterOptions.map((role) => {

                                                        const itemLabel = role.label;
                                                        const isSelected = role.value === value;

                                                        return (
                                                        <Select.Item
                                                            key={role.value}
                                                            value={role.value}
                                                            label={itemLabel}
                                                            style={{
                                                                backgroundColor: isSelected ? APP_COLORS.primarySoft : 'transparent',
                                                                paddingVertical:12,
                                                                paddingHorizontal:16,
                                                            }}
                                                        >
                                                            <Select.ItemLabel className={`text-xs ${getMyanmarLeadingClass(locale)}`}
                                                                              style={[style,{
                                                                                  color: isSelected ? APP_COLORS.primary : APP_COLORS.textPrimary,
                                                                                  fontWeight: isSelected ? "600" : "400"
                                                                              }]}/>
                                                            <Select.ItemIndicator/>
                                                        </Select.Item>
                                                    )}
                                                    )}
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select>
                                    )
                                }
                                }
                            />
                            {!!errors.role?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
                                    {errors.role.message}
                                </Text>
                            )}
                        </View>

                        {selectedRole === "VIEWER" ? (
                            <View className="gap-1.5">
                                <View className="flex-row items-center gap-1">
                                    <Text
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                        style={[{color: APP_COLORS.textSecondary}, style]}
                                    >
                                        {t.labels.parentOwner}
                                    </Text>
                                </View>
                                <Controller
                                    control={control}
                                    name="parentOwnerId"
                                    render={({field: {onChange, value}}) => {
                                        const selectedOwner = ownerOptions.find(
                                            (option) => option.value === String(value ?? ""),
                                        );
                                        return (
                                            <View>
                                                <Select
                                                    value={
                                                        selectedOwner
                                                            ? { value: selectedOwner.value, label: selectedOwner.label }
                                                            : undefined
                                                    }
                                                    onValueChange={(next) => {
                                                        if (next && !Array.isArray(next)) {
                                                            onChange(next.value);
                                                        }
                                                    }}
                                                >
                                                    <Select.Trigger
                                                        className={`rounded-xl h-14 py-0 ${getMyanmarLeadingClass(locale)}   px-2.5`}
                                                        style={{
                                                            backgroundColor: APP_COLORS.inputBackground,
                                                            borderColor:APP_COLORS.border,
                                                            borderWidth:1
                                                        }}
                                                    >
                                                        <Select.Value
                                                            placeholder={t.placeholders.parentOwner}
                                                            className={` py-0 text-[11px] ${getMyanmarLeadingClass(locale)}`}
                                                            style={[{ color: APP_COLORS.textPrimary }]}
                                                        />
                                                        <Select.TriggerIndicator/>
                                                    </Select.Trigger>
                                                    <Select.Portal>
                                                        <Select.Overlay/>
                                                        <Select.Content
                                                            className="rounded-2xl"
                                                            style={{
                                                                backgroundColor:APP_COLORS.card,
                                                                borderColor:APP_COLORS.border,
                                                                borderWidth:1
                                                            }}
                                                            presentation="popover"
                                                            width="trigger"
                                                        >
                                                            {ownerOptions.map((owner) => {
                                                                const itemLabel = owner.label;
                                                                const isSelected = owner.value === value;
                                                                return (
                                                                <Select.Item
                                                                    key={owner.value}
                                                                    value={owner.value}
                                                                    label={itemLabel}
                                                                    style={{
                                                                        backgroundColor: isSelected ? APP_COLORS.primarySoft : 'transparent',
                                                                        paddingVertical:12,
                                                                        paddingHorizontal:16,
                                                                    }}
                                                                >
                                                                    <Select.ItemLabel className={`text-xs ${getMyanmarLeadingClass(locale)}`}
                                                                                      style={[style,{
                                                                                          color: isSelected ? APP_COLORS.primary : APP_COLORS.textPrimary,
                                                                                          fontWeight: isSelected ? "600" : "400"
                                                                                      }]}/>
                                                                    <Select.ItemIndicator/>
                                                                </Select.Item>
                                                            )})}
                                                        </Select.Content>
                                                    </Select.Portal>
                                                </Select>
                                            </View>
                                        );
                                    }}
                                />
                                {!!errors.parentOwnerId?.message && (
                                    <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `} style={[{color: APP_COLORS.error}, style]}>
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
                    style={({pressed})=>({
                        backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary,
                        opacity: isPending ? 0.7 : 1,
                        borderColor:APP_COLORS.border,
                        borderWidth:1
                    })}
                >
                    <Text className={`text-base font-semibold text-white ${getMyanmarLeadingClass(locale)}`} style={style}>
                        {isPending ? t.submitting : t.submit}
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
