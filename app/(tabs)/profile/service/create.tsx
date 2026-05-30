import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {useTranslation} from "@/hooks/use-translation";
import {getApiErrorAlertCopy} from "@/lib/api-error-alert";
import {useLocaleStore} from "@/stores/client/locale-store";
import {useCreateServiceType} from "@/stores/server/service-type/create-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import {zodResolver} from "@hookform/resolvers/zod";
import {useQueryClient} from "@tanstack/react-query";
import {useRouter} from "expo-router";
import {Input} from "heroui-native";
import React, {useCallback, useMemo} from "react";
import {Controller, useForm} from "react-hook-form";
import {Alert, Pressable, ScrollView, Text, View} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import {z} from "zod";

function buildSchema(locale: "en" | "mm") {
    return z.object({

        serviceType: z.string()
            .min(1, {
                message: locale === "mm" ? "ကုဒ်ထည့်ရန် လိုအပ်သည်" : "Code is required"
            })
            .max(50, {
                message: locale === "mm" ? "အများဆုံး ၅၀ လုံးသာ ခွင့်ပြုသည်" : "Max 50 characters allowed"
            }),

        langEng: z.string()
            .min(1, {
                message: locale === "mm" ? "အင်္ဂလိပ်အမည် ထည့်ရန် လိုအပ်သည်" : "English name is required"
            })
            .max(100, {
                message: locale === "mm" ? "အများဆုံး ၁၀၀ လုံးသာ ခွင့်ပြုသည်" : "Max 100 characters allowed"
            }),

        langMy: z.string()
            .min(1, {
                message: locale === "mm" ? "မြန်မာအမည် ထည့်ရန် လိုအပ်သည်" : "Myanmar name is required"
            })
            .max(100, {
                message: locale === "mm" ? "အများဆုံး ၁၀၀ လုံးသာ ခွင့်ပြုသည်" : "Max 100 characters allowed"
            }),
    });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function CreateServiceTypeScreen() {
    const router = useRouter();
    const qc = useQueryClient();
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);
    const {createServiceType: t} = useTranslation('serviceType')
    const errorCatalog = useTranslation("error");
    const {mutate, isPending} = useCreateServiceType();
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;

    const schema = useMemo(() => buildSchema(locale), [locale]);

    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            serviceType: "",
            langEng: "",
            langMy: "",
        },
    });

    const onSubmit = (values: FormValues) => {
        mutate(
            {
                serviceType: values.serviceType.trim().toUpperCase(),
                langEng: values.langEng.trim(),
                langMy: values.langMy.trim(),
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
        qc.invalidateQueries({queryKey: ["service-types"]});
        router.back();
    }, [qc, router]);

    return (
        <SafeAreaView style={{backgroundColor: APP_COLORS.background, flex: 1}}>
            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={onBack}
                    className="h-11 w-11 items-center justify-center rounded-full "
                    style={({pressed}) => ({
                        backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                    })}>
                    <Ionicons name="arrow-back" size={22} color="#475569"/>
                </Pressable>
                <Text
                    className={`flex-1 px-3 text-center text-lg font-bold ${getMyanmarLeadingClass(locale)}`}
                    style={[style, {color: APP_COLORS.textPrimary}]}
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
                    className="mt-4 rounded-2xl  p-4"
                    style={{
                        backgroundColor: APP_COLORS.card,
                        borderColor: APP_COLORS.border,
                        borderWidth: 1
                    }}
                >
                    <View className="gap-3">

                        {/* service type code */}
                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.serviceType}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="serviceType"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={(text) =>
                                            onChange(text.replace(/\s+/g, "_").toUpperCase())
                                        }
                                        autoCapitalize="characters"
                                        placeholder={t.placeholders.serviceType}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.serviceType ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        }, style]}
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    />
                                )}
                            />
                            {!!errors.serviceType?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                                      style={[{color: APP_COLORS.error}, style]}>
                                    {String(errors.serviceType.message)}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.english}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="langEng"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder={t.placeholders.english}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.langEng ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        }, style]}
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}

                                    />
                                )}
                            />
                            {!!errors.langEng?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                                      style={[{color: APP_COLORS.error}, style]}>
                                    {String(errors.langEng.message)}
                                </Text>
                            )}
                        </View>

                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.myanmar}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="langMy"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder={t.placeholders.myanmar}
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.langMy ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        }, style]}
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}

                                    />
                                )}
                            />
                            {!!errors.langMy?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                                      style={[{color: APP_COLORS.error}, style]}>
                                    {String(errors.langMy.message)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={isPending}
                    className={`mb-2 mt-5 items-center justify-center rounded-xl py-3 ${getMyanmarLeadingClass(locale)}`}
                    style={({pressed}) => ({
                        backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary,
                        opacity: isPending ? 0.7 : 1,
                        borderColor: APP_COLORS.border,
                        borderWidth: 1
                    })}
                >
                    <Text
                        className={`text-sm font-bold text-white ${getMyanmarLeadingClass(locale)}`}
                        style={style}>
                        {isPending ? t.submitting : t.submit}
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}
