import {APP_COLORS} from "@/constants/colors";
import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {useTranslation} from "@/hooks/use-translation";
import {getApiErrorAlertCopy} from "@/lib/api-error-alert";
import {useLocaleStore} from "@/stores/client/locale-store";
import {useTruckDetail} from "@/stores/server/truck/query";
import {useUpdateTruck} from "@/stores/server/truck/update-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import {zodResolver} from "@hookform/resolvers/zod";
import {useQueryClient} from "@tanstack/react-query";
import {useFocusEffect, useLocalSearchParams, useRouter} from "expo-router";
import {Button, Input, Select} from "heroui-native";
import React, {useCallback, useEffect, useMemo} from "react";
import {Controller, useForm} from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
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

const YEAR_RE = /^\d{4}$/;

function buildSchema(locale: "en" | "mm") {
    return z.object({
        plateNo: z
            .string()
            .min(1, locale === "mm" ? "ယာဉ်နံပါတ် လိုအပ်သည်" : "Plate number is required")
            .max(50, locale === "mm" ? "ယာဉ်နံပါတ်သည် စာလုံး 50 ထက်မကျော်ရပါ" : "Plate number cannot exceed 50 characters")
            .regex(
                /^[0-9A-Z]{2}-[0-9]{4}$/,
                locale === "mm"
                    ? "ယာဉ်နံပါတ် ဖော်မတ်မမှန်ပါ။ (ဥပမာ - 1A-1234)"
                    : "Invalid plate number format. (e.g., 1A-1234)"
            ),
        model: z
            .string()
            .min(1, locale === "mm" ? "တံဆိပ်အမျိုးအစား လိုအပ်သည်" : "Brand is required")
            .max(100, locale === "mm" ? "တံဆိပ်အမျိုးအစားသည် စာလုံး 100 ထက်မကျော်ရပါ" : "Brand cannot exceed 100 characters"),
        modelYear: z
            .string()
            .min(1, locale === "mm" ? "မော်ဒယ်ခုနှစ် လိုအပ်သည်" : "Model year is required")
            .refine((v) => YEAR_RE.test(v.trim()), {
                message: locale === "mm" ? "4 လုံးပါ နှစ်ကိုထည့်ပါ" : "Enter a valid 4-digit year"
            })
        ,
        feet: z
            .string()
            .min(1, locale === "mm" ? "ပေအရှည်သည် လိုအပ်သည်" : "Feet length is required")
            .max(100, locale === "mm" ? "အများဆုံး ပေ ၁၀၀ ထက်မကျော်ရပါ" : "Feet length cannot exceed 100")
            .refine((v) => Number(v.trim()) > 3 && Number(v.trim()) < 101, {
                message: locale === "mm" ? "4 ပေမှ 100 ပေအထိသာ" : "From 4-100 feet"
            })
        ,

        fuelType: z
            .string()
            .min(1, locale === "mm" ? "စက်သုံးဆီ ရွေးချယ်ပေးပါ" : "Fuel type is required")
            .max(50, locale === "mm" ? "စက်သုံးဆီအမျိုးအစားသည် စာလုံး 50 ထက်မကျော်ရပါ" : "Fuel type cannot exceed 50 characters")
            .refine((val) => ["DIESEL", "DIESEL_PREMIUM", "OCTANE_92", "OCTANE_95", "OCTANE_97", "CNG", "OTHER"].includes(val), {
                message: locale === "mm"
                    ? "စက်သုံးဆီ ရွေးချယ်ပေးပါ"
                    : "Fuel type is required"
            }),
        frontTire: z
            .string()
            .min(1, locale === "mm" ? "ရှေ့ဘီးတာယာဆိုဒ် လိုအပ်သည်" : "Front tire size is required")
            .max(100, locale === "mm" ? "ရှေ့ဘီးတာယာဆိုဒ်သည် စာလုံး 100 ထက်မကျော်ရပါ" : "Front tire size cannot exceed 100 characters"),
        backTire: z
            .string()
            .min(1, locale === "mm" ? "နောက်ဘီးတာယာဆိုဒ် လိုအပ်သည်" : "Back tire size is required")
            .max(100, locale === "mm" ? "နောက်ဘီးတာယာဆိုဒ်သည် စာလုံး 100 ထက်မကျော်ရပါ" : "Back tire size cannot exceed 100 characters"),
        chassisNo: z
            .string()
            .max(100, locale === "mm" ? "ကိုယ်ထည်နံပါတ်သည် စာလုံး 100 ထက်မကျော်ရပါ" : "Chassis number cannot exceed 100 characters")
            .optional()
            .or(z.literal("").or(z.null())),
        engineNo: z
            .string()
            .max(100, locale === "mm" ? "အင်ဂျင်နံပါတ်သည် စာလုံး 100 ထက်မကျော်ရပါ" : "Engine number cannot exceed 100 characters")
            .optional()
            .or(z.literal("").or(z.null()))
    })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;


export default function EditTruckScreen() {

    const {updateTruck: t} = useTranslation('truck');
    const {fuelTypes} = useTranslation('lookup')
    const errorCatalog = useTranslation("error");

    const router = useRouter();
    const qc = useQueryClient();
    const insets = useSafeAreaInsets();
    const locale = useLocaleStore((state) => state.locale);

    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const style = locale === "mm" ? mmTextStyle : undefined;

    const schema = useMemo(() => buildSchema(locale), [locale]);

    const {id} = useLocalSearchParams<{ id?: string }>();
    const truckId = String(id ?? "").trim();
    const {data, isPending: isLoading} = useTruckDetail(truckId);
    const {mutate, isPending} = useUpdateTruck();

    const {
        control,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            plateNo: "",
            model: "",
            modelYear: "",
            feet: "",
            fuelType: "",
            frontTire: "",
            backTire: "",
            chassisNo: "",
            engineNo: "",
        },
    });

    const fuelTypeFilterOptions = useMemo(() => {
        return [
            ...Object.entries(fuelTypes || {}).map(([key, localizedValue]) => ({
                value: key,
                label: localizedValue
            }))
        ];
    }, [fuelTypes])


    useEffect(() => {

        const detail = data?.data;
        if (!detail) return;

        reset({
            plateNo: String(detail.plateNo ?? "").trim(),
            model: String(detail.model ?? "").trim(),
            modelYear: String(detail.modelYear ?? "").trim(),
            feet: String(detail.feet ?? "").trim(),
            fuelType: String(detail.fuelType ?? ""),
            frontTire: String(detail.frontTire ?? "").trim(),
            backTire: String(detail.backTire ?? "").trim(),
            chassisNo: String(detail.chassisNo ?? "").trim(),
            engineNo: String(detail.engineNo ?? "").trim(),
        });
    }, [data, reset]);

    const onSubmit = (values: FormValues) => {
        const detail = data?.data;
        if (!truckId || !detail) return;
        mutate(
            {
                id: truckId,
                version: Number(detail.version ?? 0),
                model: values.model.trim(),
                modelYear: Number(values.modelYear.trim()),
                feet: Number(values.feet.trim()),
                fuelType: values.fuelType.trim(),
                frontTire: values.frontTire.trim(),
                backTire: values.backTire.trim(),
                chassisNo: values.chassisNo?.trim() || undefined,
                engineNo: values.engineNo?.trim() || undefined,
            },
            {
                onSuccess: () => {
                    Alert.alert(t.successTitle, t.successBody);
                    router.replace("/(tabs)/profile/truck");
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

    const renderField = (
        key: keyof Omit<FormValues, "fuelType">,
        options?: {
            required?: boolean;
            keyboardType?: "number-pad";
            multiline?: boolean;
            editable?: boolean;
            valueOverride?: string;
        },
    ) => {

        const isEditable = options?.editable ?? true;
        const hasError = !!errors[key]?.message;

        return (
            <View className="gap-1.5">
                <View className="flex-row items-center gap-1">
                    <Text
                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                        style={[{color: APP_COLORS.textSecondary}, style]}
                    >
                        {t.labels[key]}
                    </Text>
                </View>
                <Controller
                    control={control}
                    name={key}
                    render={({field: {onChange, value}}) => (
                        <Input
                            value={options?.valueOverride ?? String(value ?? "")}
                            onChangeText={onChange}
                            keyboardType={options?.keyboardType}
                            placeholder={t.placeholders[key]}
                            placeholderTextColor={APP_COLORS.textMuted}
                            autoCapitalize="none"
                            editable={isEditable}
                            textAlignVertical={options?.multiline ? "top" : "center"}
                            className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                            style={[{
                                backgroundColor: !isEditable ? APP_COLORS.border : APP_COLORS.inputBackground,
                                borderColor: hasError ? APP_COLORS.error : APP_COLORS.border,
                                borderWidth: 1,
                                color: APP_COLORS.textPrimary
                            }, style]}
                        />
                    )}
                />
                {(options?.editable ?? true) && !!errors[key]?.message && (
                    <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)}`}
                          style={[style, {color: APP_COLORS.error}]}
                    >
                        {String(errors[key]?.message)}
                    </Text>
                )}
            </View>
        )
    };

    const onBack = useCallback(() => {
        qc.invalidateQueries({queryKey: ["trucks"]});
        router.back();
    }, [qc, router]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                qc.invalidateQueries({queryKey: ["trucks"]});
            };
        }, [qc]),
    );

    return (
        <SafeAreaView className="flex-1 " style={{backgroundColor: APP_COLORS.background}}>
            <View className="flex-row items-center px-4 pb-3 pt-1">
                <Pressable
                    onPress={onBack}
                    className="h-11 w-11 items-center justify-center rounded-full"
                    style={({pressed}) => ({
                        backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
                    })}>
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

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={APP_COLORS.primary}/>
                </View>
            ) : (
                <ScrollView
                    className="px-4"
                    contentContainerStyle={{
                        paddingBottom: insets.bottom + 80,
                        flexGrow: 1,
                    }}
                >

                    <View className="mt-1 rounded-2xl p-4"
                          style={{
                              backgroundColor: APP_COLORS.card,
                              borderColor: APP_COLORS.border,
                              borderWidth: 1
                          }}>
                        <View className="gap-4">

                            {/* plate no field */}
                            {renderField("plateNo", {
                                required: true,
                                editable: false
                            })}

                            {/* model year ,feet length field */}
                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    {renderField("modelYear", {required: true, keyboardType: "number-pad",})}
                                </View>
                                <View className="flex-1">
                                    {renderField("feet", {required: true, keyboardType: "number-pad",})}
                                </View>
                            </View>

                            {/* F tire , B tire field */}
                            <View className="flex-row gap-3">
                                <View className="flex-1">
                                    {renderField("frontTire", {required: true})}
                                </View>
                                <View className="flex-1">
                                    {renderField("backTire", {required: true})}
                                </View>
                            </View>

                            {/* fuel type */}
                            <View className="gap-1.5">
                                <View className="flex-row items-center gap-1">
                                    <Text
                                        className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
                                        style={[{color: APP_COLORS.textSecondary}, style]}
                                    >
                                        {t.labels.fuelType}
                                    </Text>
                                </View>
                                <Controller
                                    control={control}
                                    name="fuelType"
                                    render={({field: {value, onChange}}) => {

                                        const selectedOption = fuelTypeFilterOptions.find((r) => r.value === value);
                                        const selectedLabel = selectedOption?.label;

                                        return (
                                            <Select
                                                value={{value, label: selectedLabel ? selectedLabel : ""}}
                                                onValueChange={(next) => {
                                                    if (next && !Array.isArray(next)) {
                                                        onChange(next.value as FormValues["fuelType"]);
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
                                                        placeholder={t.placeholders.fuelType}
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
                                                        {fuelTypeFilterOptions.map((fuelType) => {

                                                                const itemLabel = fuelType.label;
                                                                const isSelected = fuelType.value === value;

                                                                return (
                                                                    <Select.Item
                                                                        key={fuelType.value}
                                                                        value={fuelType.value}
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
                                                                                fontWeight: isSelected ? "600" : "400"
                                                                            }]}
                                                                        />
                                                                        <Select.ItemIndicator/>
                                                                    </Select.Item>
                                                                )
                                                            }
                                                        )}
                                                    </Select.Content>
                                                </Select.Portal>
                                            </Select>
                                        )
                                    }
                                    }
                                />
                                {!!errors.fuelType?.message && (
                                    <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                                          style={[{color: APP_COLORS.error}, style]}>
                                        {String(errors.fuelType.message)}
                                    </Text>
                                )}
                            </View>

                            {/* model   */}
                            {renderField("model", {
                                required: true
                            })}

                            {/* chassis no.  */}
                            {renderField("chassisNo")}

                            {/* engine no.  */}
                            {renderField("engineNo", {multiline: true})}

                        </View>
                    </View>

                    {/* Cancel && Submit button */}
                    <View className="mb-2 mt-5 flex-row gap-3">
                        <Button
                            onPress={onBack}
                            variant="outline"
                            className={`flex-1 items-center py-0 justify-center rounded-xl bg-slate-200 ${getMyanmarLeadingClass(locale)}`}
                        >
                            <Text
                                className={`text-sm font-semibold text-slate-700 ${getMyanmarLeadingClass(locale)} `}
                                // style={style}
                            >
                                {t.cancel}
                            </Text>
                        </Button>

                        <Button
                            onPress={handleSubmit(onSubmit)}
                            isDisabled={isPending}
                            className="flex-1 items-center justify-center rounded-xl py-0 bg-primary"
                            variant="outline"
                        >
                            <Text
                                className={`text-sm font-semibold text-white ${getMyanmarLeadingClass(locale)} `}
                                style={style}
                            >
                                {isPending ? t.submitting : t.submit}
                            </Text>
                        </Button>
                    </View>

                </ScrollView>
            )}
        </SafeAreaView>
    );
}
