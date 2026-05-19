import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {useTranslation} from "@/hooks/use-translation";
import {getApiErrorAlertCopy} from "@/lib/api-error-alert";
import profileLocale from "@/locale/profile/profile.json";
import {useLocaleStore} from "@/stores/client/locale-store";
import type {CreateUserRole} from "@/stores/server/user/create-mutation";
import {
    useUpdateUserActiveStatus,
    useUpdateUserLockStatus,
} from "@/stores/server/user/status-mutation";
import {useUpdateUser} from "@/stores/server/user/update-mutation";
import DateTimePicker, {
    type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import {zodResolver} from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import {useLocalSearchParams, useRouter} from "expo-router";
import {Input, Select, Switch} from "heroui-native";
import React, {useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Alert, Platform, Pressable, ScrollView, Text, View} from "react-native";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {z} from "zod";


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
            .min(1, locale === "mm" ? "အမည်လိုအပ်သည်" : "Full name is required")
            .max(100, locale === "mm" ? "အမည်သည် စာလုံး ၁၀၀ ထက်မကျော်ရပါ" : "Full name cannot exceed 100 characters"),
        email: z
            .string()
            .min(1, locale === "mm" ? "အီးမေးလ်လိုအပ်သည်" : "Email is required")
            .max(100, locale === "mm" ? "အီးမေးလ်သည် စာလုံး ၁၀၀ ထက်မကျော်ရပါ" : "Email cannot exceed 100 characters")
            .email(locale === "mm" ? "အီးမေးလ်မှန်ကန်ရမည်" : "Invalid email"),
        role: z
            .string()
            .min(1, locale === "mm" ? "ရာထူး ရွေးချယ်ရန် လိုအပ်သည်" : "Role is required")
            .refine((val) => val !== "-", {
                message: locale === "mm" ? "ရာထူး ရွေးချယ်ရန် လိုအပ်သည်" : "Please select a valid role",
            })
            .pipe(z.enum(["ADMIN", "OWNER", "WORKER", "VIEWER"])),
        joinDate: z
            .string()
            .min(1, locale === "mm" ? "စတင်ဝင်ရောက်သည့်ရက်စွဲလိုအပ်သည်" : "Join date is required")
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
                    locale === "mm" ? "နေ့/လ/နှစ် ပုံစံ dd/mm/yyyy ထည့်ပါ" : "Use dd/mm/yyyy",
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
        parentOwnerId: z.string().optional(),
    })
        .superRefine((data,ctx) => {
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
        })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function TeamEditUserScreen() {

    const {updateUser: t} = useTranslation('user')
    const tLookup = useTranslation('lookup')

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
    const t2 = profileLocale[locale];
    const labels = t2.editUserScreen;
    const errorCatalog = useTranslation("error");
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;
    const {mutate, isPending} = useUpdateUser();
    const {mutate: mutateActiveStatus, isPending: isActiveUpdating} =
        useUpdateUserActiveStatus();
    const {mutate: mutateLockStatus, isPending: isLockUpdating} = useUpdateUserLockStatus();
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

    const roleFromParams = isRole(String(params.role ?? "")) ? params.role : "-";
    const schema = useMemo(() => buildSchema(locale), [locale]);
    const {
        control,
        handleSubmit,
        watch,
        formState: {errors},
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
    const roleFilterOptions = useMemo(() => {
        return [
            {value: "", label: "-"},
            ...Object.entries(tLookup.roles || {}).map(([key, localizedValue]) => ({
                value: key,
                label: localizedValue
            }))
        ];
    }, [tLookup.roles])


    const inputClassName = `border h-11 py-0 ${getMyanmarLeadingClass(locale)} border-slate-200 bg-white`;
    const androidMmInputProps =
        Platform.OS === "android" && locale === "mm"
            ? {includeFontPadding: false as const}
            : {};

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
                onError: (err: unknown) => {
                    const {title, message} = getApiErrorAlertCopy(err, errorCatalog, {
                        title: labels.errorTitle,
                        message: labels.errorBody,
                    });
                    Alert.alert(title, message);
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
        const message = nextStatus
            ? labels.statusActiveEnableMsg
            : labels.statusActiveDisableMsg;
        Alert.alert(labels.statusConfirmTitle, message, [
            {text: labels.confirmCancel, style: "cancel"},
            {
                text: labels.confirmOk,
                onPress: () => {
                    mutateActiveStatus(
                        {id, status: nextStatus},
                        {
                            onSuccess: () => setIsActiveEnabled(nextStatus),
                            onError: () => Alert.alert(labels.errorTitle, labels.errorBody),
                        },
                    );
                },
            },
        ]);
    };

    const onToggleLocked = (nextStatus: boolean) => {
        const id = String(params.id ?? "").trim();
        if (!id) {
            Alert.alert(labels.errorTitle, labels.invalidUserId);
            return;
        }
        const message = nextStatus
            ? labels.statusLockEnableMsg
            : labels.statusLockDisableMsg;
        Alert.alert(labels.statusConfirmTitle, message, [
            {text: labels.confirmCancel, style: "cancel"},
            {
                text: labels.confirmOk,
                onPress: () => {
                    mutateLockStatus(
                        {id, status: nextStatus},
                        {
                            onSuccess: () => setIsUnlockedEnabled(nextStatus),
                            onError: () => Alert.alert(labels.errorTitle, labels.errorBody),
                        },
                    );
                },
            },
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f3f7fb]">
            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center rounded-full bg-[#eef2f6]"
                >
                    <Ionicons name="arrow-back" size={22} color="#475569"/>
                </Pressable>
                <Text
                    className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)} font-bold text-slate-900`}
                    style={style}
                >
                    {t.title}
                </Text>
                <View className="h-11 w-11"/>
            </View>

            <ScrollView
                className="px-4"
                contentContainerStyle={{paddingBottom: insets.bottom + 80, flexGrow: 1}}
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
                                className={`text-sm font-semibold ${getMyanmarLeadingClass(locale)} text-[#325f99]`}
                                style={style}
                            >
                                {t.infoTitle}
                            </Text>
                            <Text
                                className={`mt-0.5 text-xs ${getMyanmarLeadingClass(locale)} text-[#325f99]`}
                                style={style}
                            >
                                {t.infoBody}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="mt-4 rounded-2xl bg-white p-4">
                    <View className="gap-3">
                        {(
                            [
                                {key: "fullName", required: true},
                                {key: "email", required: true, keyboardType: "email-address"},
                                {key: "phoneNumber", required: true, keyboardType: "numeric"},
                                {key: "fullIdNo", required: false},
                            ] as const
                        ).map((field) => (
                            <View className="gap-1.5" key={field.key}>
                                <View className="flex-row items-center gap-1">
                                    <Text
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)} text-slate-900`}
                                        style={style}
                                    >
                                        {t.labels[field.key]}
                                    </Text>
                                    {!field.required ? <Text
                                        className="text-yellow-500">{locale === 'mm' ? '(မထည့်လည်းရ)' : '(Optional)'}</Text> : null}
                                </View>
                                <Controller
                                    control={control}
                                    name={field.key}
                                    render={({field: {onChange, value}}) => (
                                        <Input
                                            value={String(value ?? "")}
                                            onChangeText={onChange}
                                            keyboardType={field.keyboardType}
                                            autoCapitalize={field.key === "email" ? "none" : "sentences"}
                                            className={inputClassName}
                                            placeholder={t.placeholders[field.key]}
                                            {...androidMmInputProps}
                                        />
                                    )}
                                />
                                {!!errors[field.key]?.message && (
                                    <Text
                                        className={`text-xs text-red-500 ${getMyanmarLeadingClass(locale)}`}
                                        style={style}
                                    >
                                        {String(errors[field.key]?.message)}
                                    </Text>
                                )}
                            </View>
                        ))}

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)} text-slate-900`}
                                    style={style}
                                >
                                    {t.labels.joinDate}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="joinDate"
                                render={({field: {onChange, value}}) => (
                                    <View>
                                        <Pressable
                                            onPress={() => setActiveDateField("joinDate")}
                                            className="flex-row items-center h-11 justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                                        >
                                            <Text
                                                className={value ? "text-slate-900" : "text-slate-400"}
                                                style={style}
                                            >
                                                {value || t.placeholders.joinDate}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={18} color="#64748b"/>
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
                                                        <Text
                                                            className={`text-xs font-semibold text-slate-700 ${getMyanmarLeadingClass(locale)}`}
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
                            {!!errors.joinDate?.message && (
                                <Text
                                    className={`text-xs text-red-500 ${getMyanmarLeadingClass(locale)}`}
                                    style={style}
                                >
                                    {String(errors.joinDate.message)}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)} text-slate-900`}
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
                                            onPress={() => setActiveDateField("dateOfBirth")}
                                            className="flex-row items-center h-11 justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                                        >
                                            <Text
                                                className={value ? "text-slate-900" : "text-slate-400"}
                                                style={style}
                                            >
                                                {value || t.placeholders.dateOfBirth}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={18} color="#64748b"/>
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
                                                        <Text
                                                            className={`text-xs font-semibold text-slate-700 ${getMyanmarLeadingClass(locale)}`}
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
                                    className={`text-xs text-red-500 ${getMyanmarLeadingClass(locale)}`}
                                    style={style}
                                >
                                    {String(errors.dateOfBirth.message)}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)} text-slate-900`}
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
                                            value={{value : value ,label: selectedLabel ? selectedLabel : ""}}
                                            onValueChange={(next) => {
                                                if (next && !Array.isArray(next)) {
                                                    onChange(next.value as CreateUserRole);
                                                }
                                            }}
                                        >
                                            <Select.Trigger
                                                className={`rounded-xl h-11 py-0 ${getMyanmarLeadingClass(locale)} border border-slate-200 bg-white px-2.5`}
                                            >
                                                <Select.Value
                                                    placeholder={labels.rolePlaceholder}
                                                    className={`py-0 text-sm ${getMyanmarLeadingClass(locale)}`}
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
                                                            label={ role.label ? role.label : ""}
                                                        >
                                                            <Select.ItemLabel style={style}/>
                                                            <Select.ItemIndicator/>
                                                        </Select.Item>
                                                    ))}
                                                </Select.Content>
                                            </Select.Portal>
                                        </Select>
                                    )
                                }}
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
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)} text-slate-900`}
                                        style={style}
                                    >
                                        {t.labels.parentOwner}
                                    </Text>
                                    <Text className="text-red-500">*</Text>
                                </View>
                                <Controller
                                    control={control}
                                    name="parentOwnerId"
                                    render={({field: {onChange, value}}) => (
                                        <Input
                                            value={String(value ?? "")}
                                            onChangeText={onChange}
                                            autoCapitalize="none"
                                            placeholder={labels.parentOwnerPlaceholder}
                                            className={inputClassName}
                                            {...androidMmInputProps}
                                        />
                                    )}
                                />
                                {!!errors.parentOwnerId?.message && (
                                    <Text
                                        className={`text-xs text-red-500 ${getMyanmarLeadingClass(locale)}`}
                                        style={style}
                                    >
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
                    className={`mb-2 mt-5 items-center justify-center rounded-xl py-3 ${getMyanmarLeadingClass(locale)}`}
                    style={{
                        backgroundColor: APP_COLORS.primary,
                        opacity: isPending ? 0.7 : 1,
                    }}
                >
                    <Text className="text-base font-semibold text-white" style={style}>
                        {isPending ? t.submitting : t.submit}
                    </Text>
                </Pressable>

                <View className="mt-4 rounded-2xl bg-white p-4">
                    <Text
                        className={`mb-3 text-sm font-semibold text-slate-900 ${getMyanmarLeadingClass(locale)}`}
                        style={style}
                    >
                        {t.statusTitle}
                    </Text>

                    <View className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center gap-2">
                            <View
                                className="h-2.5 w-2.5 rounded-full"
                                style={{backgroundColor: isActiveEnabled ? "#22c55e" : "#94a3b8"}}
                            />
                            <Text className="text-sm text-slate-700" style={style}>
                                {isActiveEnabled ? t.active : t.inactive}
                            </Text>
                        </View>
                        <Switch
                            animation={{
                                backgroundColor: {
                                    value: isActiveEnabled ? ['#E2E8F0', APP_COLORS.primary] : ['#E2E8F0', '#E2E8F0']
                                },
                            }}
                            isSelected={isActiveEnabled}
                            onSelectedChange={onToggleActive}
                            isDisabled={isActiveUpdating}
                        />
                    </View>

                    <View className="my-2 h-px bg-slate-200"/>

                    <View className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center gap-2">
                            <Ionicons
                                name={isUnlockedEnabled ? "lock-open-outline" : "lock-closed-outline"}
                                size={15}
                                color={isUnlockedEnabled ? "#10b981" : "#ef4444"}
                            />
                            <Text className="text-sm text-slate-700" style={style}>
                                {isUnlockedEnabled ? t.unlock : t.lock}
                            </Text>
                        </View>
                        <Switch
                            animation={{
                                backgroundColor: {
                                    value: isUnlockedEnabled ? ['#EAF1F8', APP_COLORS.primary] : ['#EAF1F8', '#EAF1F8']
                                },
                            }}
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
