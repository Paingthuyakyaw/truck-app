import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
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

    const t = useTranslation('changePassword')
    const errorCatalog = useTranslation("error");
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);

    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const textStyle = locale === "mm" ? mmTextStyle : undefined;
    const {mutate, isPending} = useChangePassword();

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const schema = useMemo(() => buildSchema(t), [t]);
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
                    Alert.alert(t.successTitle, t.successBody, [
                        {text: t.ok, onPress: () => router.back()},
                    ]);
                },
                onError: (error: unknown) => {

                    const {title, message} = getApiErrorAlertCopy(error, errorCatalog, {
                        title: t.errorTitle,
                        message: t.errorGeneric,
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
                                    {t.infoTitle}
                                </Text>
                                <Text
                                    className={`mt-0.5 text-xs font-normal ${getMyanmarLeadingClass(locale)}  text-[#325f99]`}
                                    style={textStyle}
                                >
                                    {t.infoBody}
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
                            t.currentLabel,
                            t.currentPlaceholder,
                            showOld,
                            () => setShowOld((value) => !value),
                        )}
                        {renderPasswordField(
                            "newPassword",
                            t.newLabel,
                            t.newPlaceholder,
                            showNew,
                            () => setShowNew((value) => !value),
                        )}
                        {renderPasswordField(
                            "confirmPassword",
                            t.confirmLabel,
                            t.confirmPlaceholder,
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
                                {t.submit}
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
