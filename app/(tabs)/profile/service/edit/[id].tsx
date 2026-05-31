import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {useTranslation} from "@/hooks/use-translation";
import {getApiErrorAlertCopy} from "@/lib/api-error-alert";
import {useLocaleStore} from "@/stores/client/locale-store";
import {useUpdateServiceType} from "@/stores/server/service-type/update-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import {zodResolver} from "@hookform/resolvers/zod";
import {useQueryClient} from "@tanstack/react-query";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import {Input, Select} from "heroui-native";
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

        active:z.string()
    });
}


type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function EditServiceTypeScreen() {

    const router = useRouter();
    const qc = useQueryClient();
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);
    const {updateServiceType: t} = useTranslation('serviceType')
    const tLookup = useTranslation('lookup')
    const errorCatalog = useTranslation("error");
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;
    const {mutate, isPending} = useUpdateServiceType();
    const params = useLocalSearchParams<{
        id?: string;
        version?: string;
        serviceType?: string;
        langEng?: string;
        langMy?: string;
        active?: string;
    }>();

    const itemId = String(params.id ?? "").trim();
    const version = Number(params.version ?? 0);
    const serviceType = String(params.serviceType ?? "").trim();

    const schema = useMemo(() => buildSchema(locale), [locale],);

    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            serviceType: serviceType,
            langEng: String(params.langEng ?? ""),
            langMy: String(params.langMy ?? ""),
            active: String(params.active ?? ""),
        },
    });

    const onSubmit = (values: FormValues) => {

        if (!itemId || !serviceType) {
            Alert.alert(t.errorTitle, t.errorBody);
            return;
        }
        mutate(
            {
                id: itemId,
                version,
                serviceType,
                langEng: values.langEng.trim(),
                langMy: values.langMy.trim(),
                active: values.active === "true"
            },
            {
                onSuccess: () => {
                    Alert.alert(t.successTitle, t.successBody);
                    router.replace("/(tabs)/profile/service");
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

    useFocusEffect(
        useCallback(() => {
            return () => {
                qc.invalidateQueries({queryKey: ["service-types"]});
            };
        }, [qc]),
    );

    const serviceFilterOptions = useMemo(() => {
        return [
            ...Object.entries(tLookup.serviceTypeStatus || {}).map(([key, localizedLabel]) => ({
                value: key,
                label: localizedLabel
            }))
        ];
    }, [tLookup.serviceTypeStatus])

    return (
        <SafeAreaView className="flex-1 " style={{backgroundColor: APP_COLORS.background}}>
            {/* back button && title */}
            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={onBack}
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={({pressed}) => ({
                        backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                    })}
                >
                    <Ionicons name="arrow-back" size={22} color="#475569"/>
                </Pressable>
                <Text
                    className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)}  font-bold  `}
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
                {/* form fields */}
                <View
                    className="mt-1 rounded-2xl p-4"
                    style={{
                        backgroundColor: APP_COLORS.card,
                        borderColor: APP_COLORS.border,
                        borderWidth: 1
                    }}>

                    <View className="gap-3">

                        {/* service code */}
                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.serviceType}
                                </Text>
                            </View>
                            <Input
                                value={serviceType}
                                editable={false}
                                className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                style={[{
                                    backgroundColor: APP_COLORS.border,
                                    borderColor: APP_COLORS.border,
                                    borderWidth: 1,
                                    color: APP_COLORS.textPrimary
                                }, style]}

                            />
                        </View>

                        {/* service English name */}
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
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.langEng?.message ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        }, style]}
                                    />
                                )}
                            />
                            {!!errors.langEng?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)}`}
                                      style={[style, {color: APP_COLORS.error}]}
                                >
                                    {String(errors.langEng.message)}
                                </Text>
                            )}
                        </View>

                        {/* service Myanmar name */}
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
                                        className={`text-sm font-medium ${getMyanmarLeadingClass('mm')}`}
                                        style={[{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.langMy?.message ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        }, style]}
                                    />
                                )}
                            />
                            {!!errors.langMy?.message && (
                                <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)}`}
                                      style={[style, {color: APP_COLORS.error}]}
                                >
                                    {String(errors.langMy.message)}
                                </Text>
                            )}
                        </View>

                        {/* service status */}
                        <View className="gap-1.5">
                            <View className="flex-row items-center gap-1">
                                <Text
                                    className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                    style={[{color: APP_COLORS.textSecondary}, style]}
                                >
                                    {t.labels.status}
                                </Text>
                            </View>
                            <Controller
                                control={control}
                                name="active"
                                render={({field: {value, onChange}}) => {

                                    const selectedOption = serviceFilterOptions.find(option => option.value === String(value ?? "") )
                                    const selectedLabel = selectedOption?.label;

                                    return (
                                        <Select
                                            value={{value: value, label: selectedLabel ? selectedLabel : ""}}
                                            onValueChange={(next) => {
                                                if (next && !Array.isArray(next)) {
                                                    onChange(next.value as FormValues["active"]);
                                                }
                                            }}
                                        >
                                            <Select.Trigger
                                                className={`rounded-xl h-14 py-0 ${getMyanmarLeadingClass(locale)}   px-2.5`}
                                                style={{
                                                    backgroundColor: APP_COLORS.inputBackground,
                                                    borderColor: APP_COLORS.border,
                                                    borderWidth: 1
                                                }}
                                            >
                                                <Select.Value
                                                    className={` py-0 text-[12px] font-medium ${getMyanmarLeadingClass(locale)}`}
                                                    style={[{color: APP_COLORS.textPrimary}]}
                                                    placeholder=""
                                                />
                                                <Select.TriggerIndicator/>
                                            </Select.Trigger>
                                            <Select.Portal>
                                                <Select.Overlay/>
                                                <Select.Content
                                                    className="rounded-2xl"
                                                    style={{
                                                        backgroundColor: APP_COLORS.card,
                                                        borderColor: APP_COLORS.border,
                                                        borderWidth: 1
                                                    }}
                                                    presentation="popover"
                                                    width="trigger"
                                                >
                                                    {serviceFilterOptions.map((option) => {

                                                        const itemLabel = option.label;
                                                        const isSelected = option.value === value;

                                                        return (
                                                            <Select.Item
                                                                key={option.value}
                                                                value={option.value}
                                                                label={itemLabel}
                                                                style={{
                                                                    backgroundColor: isSelected ? APP_COLORS.primarySoft : 'transparent',
                                                                    paddingVertical: 12,
                                                                    paddingHorizontal: 16,
                                                                }}
                                                            >
                                                                <Select.ItemLabel
                                                                    className={`text-xs ${getMyanmarLeadingClass(locale)}`}
                                                                    style={[style, {
                                                                        color: isSelected ? APP_COLORS.primary : APP_COLORS.textPrimary,
                                                                        fontWeight: isSelected ? "600" : "400"                                                                    }]}
                                                                />
                                                                <Select.ItemIndicator/>
                                                            </Select.Item>
                                                        );

                                                    })}

                                                </Select.Content>

                                            </Select.Portal>
                                        </Select>
                                    )
                                }
                                }
                            />
                        </View>

                    </View>

                </View>

                {/* cancel && save buttons */}
                <View className="mb-2 mt-5 flex-row gap-3">
                    <Pressable
                        onPress={onBack}
                        className={`flex-1 items-center py-0 justify-center rounded-xl bg-slate-200 ${getMyanmarLeadingClass(locale)}`}
                    >
                        <Text
                            className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                            style={style}
                        >
                            {t.cancel}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleSubmit(onSubmit)}
                        disabled={isPending}
                        className="flex-1 items-center justify-center rounded-xl py-2"
                        style={({pressed}) => ({
                            backgroundColor: pressed ? APP_COLORS.primaryPressed : APP_COLORS.primary,
                            opacity: isPending ? 0.7 : 1,
                            borderColor: APP_COLORS.border,
                            borderWidth: 1
                        })}
                    >
                        <Text className="text-base font-semibold text-white" style={style}>
                            {isPending ? t.submitting : t.submit}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
