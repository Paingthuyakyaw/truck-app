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
import DateTimePicker, {
    type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {useRouter} from "expo-router";
import {Input, Select} from "heroui-native";
import React, {useMemo, useState} from "react";
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
import {toIsoDate , todayIsoLocal , parseDmyToDate } from '@/utils/dateUtil'



function isNotFutureDate(dmy: string): boolean {
    const iso = toIsoDate(dmy);
    if (!iso) return false;
    return iso <= todayIsoLocal();
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
            .min(1, locale === "mm" ? "စကားဝှက်လိုအပ်သည်" : "Password is required")
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
            .min(1, locale === "mm" ? "အီးမေးလ်လိုအပ်သည်" : "Email is required")
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
            .min(1, locale === "mm" ? "မွေးသက္ကရာဇ်လိုအပ်သည်" : "Birth date is required")
            .refine((value) => !!toIsoDate(value), {
                message:
                    locale === "mm"
                        ? "နေ့/လ/နှစ် ပုံစံ dd/mm/yyyy ထည့်ပါ"
                        : "Use dd/mm/yyyy",
            })
            .refine((value) => isNotFutureDate(value), {
                message:
                    locale === "mm"
                        ? "မွေးသက္ကရာဇ်သည် အနာဂတ်ရက်စွဲ မဖြစ်ရပါ"
                        : "Birth date cannot be in the future",
            }),
        fullIdNo: z
            .string()
            .max(50, locale === "mm" ? "မှတ်ပုံတင်နံပါတ်သည် စာလုံး ၅၀ ထက်မကျော်ရပါ" : "Full ID number cannot exceed 50 characters")
            .optional(),
        role: z
            .string()
            .min(1, locale === "mm" ? "ရာထူး ရွေးချယ်ရန် လိုအပ်သည်" : "Role is required")
            .refine((val) => val !== "-", {
                message: locale === "mm" ? "ရာထူး ရွေးချယ်ရန် လိုအပ်သည်" : "Please select a valid role",
            })
            .pipe(z.enum(["ADMIN", "OWNER", "WORKER", "VIEWER"])),

        parentOwnerId: z.string().optional(),
    })
        .superRefine((data, ctx) => {
            if (data.role === "VIEWER" && !String(data.parentOwnerId ?? "").trim()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        locale === "mm"
                            ? "ကြည့်ရှုသူ ရာထူးအတွက် ယာဉ်ပိုင်ရှင်ကို ရွေးချယ်ပေးပါ။"
                            : "VIEWER role requires to select Owner",
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
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;
    const [showPassword, setShowPassword] = useState(false);
    const [showDateOfBirthPicker, setShowDateOfBirthPicker] = useState(false);
    const {mutate, isPending} = useCreateUser();

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
            role: "" as CreateUserRole,
            parentOwnerId: "",
        },
    });

    const selectedRole = watch("role");
    const roleFilterOptions = useMemo(() => {
        return [
            {value: "", label: "-"},
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

    return (
        <SafeAreaView className="flex-1" style={{backgroundColor:APP_COLORS.background}}>

            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center rounded-full bg-[#eef2f6]"
                    style={({pressed})=> ({
                        backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary
                    })}
                >
                    <Ionicons name="arrow-back" size={22} color={APP_COLORS.card}/>
                </Pressable>
                <Text
                    className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)}  font-bold text-slate-900  `}
                    style={style}
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
                <View
                    className="rounded-2xl border border-[#c8dbf7] bg-[#ecf4ff] p-3"
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
                                className={`mt-0.5 text-xs ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                                style={style}
                            >
                                {t.infoBody}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="mt-4 rounded-2xl bg-white p-4"
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
                                    className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                                    style={style}
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
                                        className={`border py-0 h-11 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
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
                                    {t.labels.password}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="password"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder={t.placeholders.password}
                                        secureTextEntry={!showPassword}
                                        className={`border h-11 ${getMyanmarLeadingClass(locale)}  py-0 border-slate-200 bg-white`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
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
                                        className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
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
                                <Text className={`text-sm ${getMyanmarLeadingClass(locale)} font-medium text-slate-900`} style={style}>
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
                                        className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.phoneNumber?.message && (
                                <Text
                                    className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                                    style={style}
                                >
                                    {errors.phoneNumber.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                                    style={style}
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
                                        autoCapitalize="none"
                                        className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
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
                                            className="flex-row items-center h-11 justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                                        >
                                            <Text
                                                className={value ? "text-slate-900" : "text-slate-400"}
                                                style={style}
                                            >
                                                {value || t.placeholders.dateOfBirth}
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
                                                            {locale === "mm" ? "ရွေးချယ်မည်" : "Select"}
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
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                                    style={style}
                                >
                                    {t.labels.fullIdNo}
                                </Text>
                                <Text className="text-yellow-500">{locale === 'mm' ? '(မထည့်လည်းရ)' : '(Optional)'}</Text>
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
                                        className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                                        {...(Platform.OS === "android" && locale === "mm"
                                            ? {includeFontPadding: false}
                                            : {})}
                                    />
                                )}
                            />
                            {!!errors.fullIdNo?.message && (
                                <Text
                                    className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                                    style={style}
                                >
                                    {errors.fullIdNo.message}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                                    style={style}
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
                                                className={`rounded-xl h-11 py-0 ${getMyanmarLeadingClass(locale)}  border border-slate-200 bg-white px-2.5`}
                                            >
                                                <Select.Value
                                                    placeholder={t.placeholders.role}
                                                    className={` py-0 text-sm ${getMyanmarLeadingClass(locale)}`}
                                                />
                                                <Select.TriggerIndicator/>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Overlay/>
                                                <Select.Content
                                                    className="rounded-2xl border border-slate-200 bg-white"
                                                    presentation="popover"
                                                    width="trigger"
                                                >
                                                    {roleFilterOptions.map((role) => (
                                                        <Select.Item
                                                            key={role.value}
                                                            value={role.value}
                                                            label={role.label ? role.label : ""}
                                                        >
                                                            <Select.ItemLabel style={style}/>
                                                            <Select.ItemIndicator/>
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select>
                                    )
                                }
                                }
                            />
                            {!!errors.role?.message && (
                                <Text
                                    className={`text-xs ${getMyanmarLeadingClass(locale)}  text-red-500`}
                                    style={style}
                                >
                                    {errors.role.message}
                                </Text>
                            )}
                        </View>

                        {selectedRole === "VIEWER" ? (
                            <View className="gap-1.5">
                                <View className="flex-row items-center gap-1">
                                    <Text
                                        className={`text-sm ${getMyanmarLeadingClass(locale)}  font-medium text-slate-900`}
                                        style={style}
                                    >
                                        {t.labels.parentOwner}
                                    </Text>
                                </View>
                                <Controller
                                    control={control}
                                    name="parentOwnerId"
                                    render={({field: {onChange, value}}) => (
                                        <Input
                                            value={value ?? ""}
                                            onChangeText={onChange}
                                            placeholder={t.placeholders.parentOwner}
                                            autoCapitalize="none"
                                            className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                                            {...(Platform.OS === "android" && locale === "mm"
                                                ? {includeFontPadding: false}
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
                    style={({pressed})=>({
                        backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary,
                        opacity: isPending ? 0.7 : 1,
                    })}
                >
                    <Text className="text-base font-semibold" style={[style,{color:APP_COLORS.card}]}>
                        {isPending ? t.submitting : t.submit}
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
