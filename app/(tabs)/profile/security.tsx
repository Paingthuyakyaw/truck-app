import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import profileLocale from "@/locale/profile/profile.json";
import {useLocaleStore} from "@/stores/client/locale-store";
import {useChangePassword} from "@/stores/server/user/password-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import {zodResolver} from "@hookform/resolvers/zod";
import {useRouter} from "expo-router";
import {Input} from "heroui-native";
import React, {useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import {z} from "zod";
import {getApiErrorAlertCopy} from "@/lib/api-error-alert";
import {useTranslation} from "@/hooks/use-translation";

const FALLBACK_CHANGE_PASSWORD_LABELS = {
    en: {
        title: "Change Password",
        infoTitle: "Password Security",
        infoBody: "Password must be at least 8 characters. Include upper and lower case letters, numbers, and symbols (@ # $ % ^ & + = !) for stronger security.",
        currentLabel: "Current password",
        currentPlaceholder: "Enter current password",
        newLabel: "New password",
        newPlaceholder: "Enter new password",
        confirmLabel: "Confirm new password",
        confirmPlaceholder: "Re-enter new password",
        submit: "Confirm",
        oldRequired: "Current password is required",
        newRequired: "New password is required",
        confirmRequired: "Please confirm your new password",
        mismatch: "New passwords do not match",
        newInvalid: "Use at least 8 characters with upper & lower case letters, a number, and a symbol (@ # $ % ^ & + = !).",
        successTitle: "Password updated",
        successBody: "Your password has been changed successfully.",
        ok: "OK",
        errorTitle: "Could not update password",
        errorGeneric: "Something went wrong. Please try again.",
    },
    mm: {
        title: "စကားဝှက်ပြောင်းရန်",
        infoTitle: "စကားဝှက်လုံခြုံရေး",
        infoBody: "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရမည်။ နံပါတ်၊ အကြီးအသေးလုံး နှင့် သင်္ကေတများ ပါဝင်ပါက ပိုမိုလုံခြုံပါသည်။",
        currentLabel: "လက်ရှိစကားဝှက်",
        currentPlaceholder: "လက်ရှိစကားဝှက်ထည့်ပါ",
        newLabel: "စကားဝှက်အသစ်",
        newPlaceholder: "စကားဝှက်အသစ်ထည့်ပါ",
        confirmLabel: "စကားဝှက်အသစ် အတည်ပြုရန်",
        confirmPlaceholder: "စကားဝှက်အသစ် ထပ်ထည့်ပါ",
        submit: "အတည်ပြုမည်",
        oldRequired: "လက်ရှိစကားဝှက် ထည့်ရန်လိုအပ်ပါသည်",
        newRequired: "စကားဝှက်အသစ် ထည့်ရန်လိုအပ်ပါသည်",
        confirmRequired: "စကားဝှက်အသစ် ထပ်အတည်ပြုပါ",
        mismatch: "စကားဝှက်အသစ် မတူညီပါ",
        newInvalid: "အင်္ဂလိပ်အကြီးအသေး၊ နံပါတ်၊ သင်္ကေတ (@ # $ % ^ & + = !) ပါဝင်သော စကားဝှက် အနည်းဆုံး ၈ လုံး သုံးပါ။",
        successTitle: "ပြင်ဆင်ပြီးပါပြီ",
        successBody: "စကားဝှက်ကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။",
        ok: "အိုကေ",
        errorTitle: "စကားဝှက် မပြောင်းနိုင်ပါ",
        errorGeneric: "တစ်ခုခု မှားယွင်းနေပါသည်။ ထပ်ကြိုးစားပါ။",
    },
} as const;

const NEW_PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[A-Za-z\d@#$%^&+=!]{8,}$/;

function buildSchema(labels: {
    oldRequired: string;
    newRequired: string;
    confirmRequired: string;
    mismatch: string;
    newInvalid: string;
}) {
    return z
        .object({
            oldPassword: z.string().min(1, labels.oldRequired),
            newPassword: z.string().min(1, labels.newRequired),
            confirmPassword: z.string().min(1, labels.confirmRequired),
        })
        .superRefine((data, ctx) => {
            if (data.newPassword !== data.confirmPassword) {
                ctx.addIssue({
                    code: "custom",
                    message: labels.mismatch,
                    path: ["confirmPassword"],
                });
            }

            if (!NEW_PASSWORD_REGEX.test(data.newPassword)) {
                ctx.addIssue({
                    code: "custom",
                    message: labels.newInvalid,
                    path: ["newPassword"],
                });
            }
        });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function ChangePasswordScreen() {

    const errorCatalog = useTranslation("error");
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);
    const profileCopy = profileLocale[locale] ?? profileLocale.en;
    const labels = profileCopy.changePasswordScreen ?? FALLBACK_CHANGE_PASSWORD_LABELS[locale];
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const textStyle = locale === "mm" ? mmTextStyle : undefined;
    const {mutate, isPending} = useChangePassword();

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const schema = useMemo(() => buildSchema(labels), [labels]);
    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = (values: FormValues) => {
        mutate(
            {oldPassword: values.oldPassword, newPassword: values.newPassword},
            {
                onSuccess: () => {
                    Alert.alert(labels.successTitle, labels.successBody, [
                        {text: labels.ok, onPress: () => router.back()},
                    ]);
                },
                onError: (error: unknown) => {

                    const {title, message} = getApiErrorAlertCopy(error, errorCatalog, {
                        title: labels.errorTitle,
                        message: labels.errorGeneric,
                    });
                    Alert.alert(title, message);

                },
            },
        );
    };

    const renderPasswordField = (
        name: keyof FormValues,
        label: string,
        placeholder: string,
        visible: boolean,
        onToggle: () => void,
    ) => (
        <View style={styles.field}>
            <Text
                className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                style={[{color: APP_COLORS.textSecondary}, textStyle]}
            >
                {label}
            </Text>
            <View>
                <Controller
                    control={control}
                    name={name}
                    render={({field: {onBlur, onChange, value}}) => (
                        <Input
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder={placeholder}
                            placeholderTextColor={APP_COLORS.textMuted}
                            secureTextEntry={!visible}
                            style={[{
                                backgroundColor: APP_COLORS.inputBackground,
                                borderColor: errors[name] ? APP_COLORS.error : APP_COLORS.border,
                                borderWidth: 1,
                                color: APP_COLORS.textPrimary
                            }, textStyle]}
                            className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                        />
                    )}
                />
                <Pressable
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={onToggle}
                    style={styles.eyeButton}
                >
                    <Ionicons
                        name={visible ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color="#64748b"
                    />
                </Pressable>
            </View>
            {errors[name]?.message ? (
                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                      style={[{color: APP_COLORS.error}, textStyle]}>
                    {errors[name]?.message}
                </Text>
            ) : null}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View className="flex-row items-center px-4 pb-3 pt-1">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-11 w-11 items-center justify-center rounded-full "
                        style={({pressed}) => ({
                            backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                        })}
                    >
                        <Ionicons name="arrow-back" size={22} color="#475569"/>
                    </Pressable>
                    <Text
                        className={`flex-1 px-3 text-center text-lg font-bold ${getMyanmarLeadingClass(locale)}`}
                        style={[textStyle, {color: APP_COLORS.textPrimary}]}
                    >
                        {labels.title}
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
                        className="rounded-2xl p-4"
                        style={{
                            backgroundColor: APP_COLORS.warningSoft,
                            borderColor: APP_COLORS.border,
                            borderWidth: 1
                        }}
                    >
                        <View className="flex-row items-start gap-2">
                            <Ionicons
                                name="shield-checkmark-outline"
                                size={18}
                                color="#325f99"
                            />
                            <View style={styles.flex}>
                                <Text
                                    className={`text-sm  font-medium ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                                    style={textStyle}
                                >
                                    {labels.infoTitle}
                                </Text>
                                <Text
                                    className={`mt-0.5 text-xs font-normal ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                                    style={textStyle}
                                >
                                    {labels.infoBody}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View
                        className="mt-4 rounded-2xl  p-4"
                        style={{
                            backgroundColor: APP_COLORS.card,
                            borderColor: APP_COLORS.border,
                            borderWidth: 1
                        }}
                    >
                        {renderPasswordField(
                            "oldPassword",
                            labels.currentLabel,
                            labels.currentPlaceholder,
                            showOld,
                            () => setShowOld((value) => !value),
                        )}
                        {renderPasswordField(
                            "newPassword",
                            labels.newLabel,
                            labels.newPlaceholder,
                            showNew,
                            () => setShowNew((value) => !value),
                        )}
                        {renderPasswordField(
                            "confirmPassword",
                            labels.confirmLabel,
                            labels.confirmPlaceholder,
                            showConfirm,
                            () => setShowConfirm((value) => !value),
                        )}
                    </View>

                    <Pressable
                        accessibilityRole="button"
                        disabled={isPending}
                        onPress={handleSubmit(onSubmit)}
                        className={`mb-2 mt-5 items-center justify-center rounded-xl py-3 ${getMyanmarLeadingClass(locale)}`}
                        style={({pressed}) => ({
                            backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary,
                            opacity: isPending ? 0.7 : 1,
                            borderColor: APP_COLORS.border,
                            borderWidth: 1
                        })}
                    >
                        {isPending ? (
                            <ActivityIndicator color="#fff"/>
                        ) : (
                            <Text className={`text-sm font-bold text-white ${getMyanmarLeadingClass(locale)}`}
                                  style={textStyle}>
                                {labels.submit}
                            </Text>
                        )}
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: APP_COLORS.background,
    },
    flex: {
        flex: 1,
    },
    field: {
        gap: 6,
    },
    eyeButton: {
        position: "absolute",
        bottom: 0,
        right: 12,
        top: 0,
        width: 32,
        padding: 4,
        alignItems: "center",
        justifyContent: "center",
    }
});
