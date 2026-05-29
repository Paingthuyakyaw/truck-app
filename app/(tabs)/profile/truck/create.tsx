import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import { useTranslation } from "@/hooks/use-translation";
import { getApiErrorAlertCopy } from "@/lib/api-error-alert";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useCreateTruck } from "@/stores/server/truck/create-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Button, Input, Select } from "heroui-native";
import React, { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";
import {APP_COLORS} from "@/constants/colors";

const YEAR_RE = /^\d{4}$/;

function buildSchema(locale: "en" | "mm"){
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
            .refine((v)=> YEAR_RE.test(v.trim()) ,{
                message: locale === "mm" ? "4 လုံးပါ နှစ်ကိုထည့်ပါ" : "Enter a valid 4-digit year"
            })
        ,
        feet: z
            .string()
            .min(1,locale === "mm" ? "ပေအရှည်သည် လိုအပ်သည်" : "Feet length is required")
            .max(100, locale === "mm" ? "အများဆုံး ပေ ၁၀၀ ထက်မကျော်ရပါ" : "Feet length cannot exceed 100")
            .refine((v)=> Number(v.trim()) > 3 &&  Number(v.trim()) < 101  ,{
                message : locale === "mm" ? "4 ပေမှ 100 ပေအထိသာ" : "From 4-100 feet"
            })
        ,

        fuelType: z
            .string()
            .min(1, locale === "mm" ? "စက်သုံးဆီ ရွေးချယ်ပေးပါ" : "Fuel type is required")
            .max(50, locale === "mm" ? "စက်သုံးဆီအမျိုးအစားသည် စာလုံး 50 ထက်မကျော်ရပါ" : "Fuel type cannot exceed 50 characters")
            .refine((val) => ["DIESEL","DIESEL_PREMIUM", "OCTANE_92","OCTANE_95","OCTANE_97", "CNG","OTHER" ].includes(val), {
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


export default function CreateTruckScreen() {

  const {createTruck:t} = useTranslation('truck');
  const {fuelTypes} = useTranslation('lookup')
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const errorCatalog = useTranslation("error");
  const { mutate, isPending } = useCreateTruck();

  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;


  const schema = useMemo(() => buildSchema(locale), [locale]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plateNo: "",
      model: "",
      modelYear: "",
      feet:  "",
      fuelType: "diesel",
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

  const onSubmit = (values: FormValues) => {
    mutate(
      {
        plateNo: values.plateNo.trim(),
        model: values.model.trim(),
        modelYear: Number(values.modelYear),
        feet: Number(values.feet),
        fuelType: values.fuelType.trim(),
        frontTire: values.frontTire.trim(),
        backTire: values.backTire.trim(),
        chassisNo: values.chassisNo?.trim() || undefined,
        engineNo: values.engineNo?.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(t.successTitle, t.successBody);
          router.back();
        },
        onError: (err: unknown) => {
          const { title, message } = getApiErrorAlertCopy(err, errorCatalog, {
            title: t.errorTitle,
            message: t.errorBody,
          });
          Alert.alert(title, message);
        },
      },
    );
  };

  const onBack = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["trucks"] });
    router.back();
  }, [qc, router]);

  const renderTextInput = (
    key: keyof Omit<FormValues, "fuelType">,
    options?: { required?: boolean; keyboardType?: "number-pad" },
  ) => (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1">
        <Text
          className={`text-sm font-medium  ${getMyanmarLeadingClass(locale)} `}
          style={[{color: APP_COLORS.textSecondary}, style]}
        >
          {t.labels[key]}
        </Text>
        {options?.required ? null : (
            <Text
                className={`text-[11px] font-medium ${getMyanmarLeadingClass(locale)}`}
                style={{color: APP_COLORS.warning}}>{locale === 'mm' ? '(မထည့်လည်းရ)' : '(Optional)'}
            </Text>
        )}
      </View>
      <Controller
        control={control}
        name={key}
        render={({ field: { onChange, value } }) => (
          <Input
            value={String(value ?? "")}
            onChangeText={onChange}
            keyboardType={options?.keyboardType}
            placeholder={t.placeholders[key]}
            placeholderTextColor={APP_COLORS.textMuted}
            autoCapitalize="none"
            style={[{
              backgroundColor: APP_COLORS.inputBackground,
              borderColor: errors[key] ? APP_COLORS.error : APP_COLORS.border,
              borderWidth: 1,
              color: APP_COLORS.textPrimary
            }, style]}
            className={`py-0 h-12 text-sm font-medium ${getMyanmarLeadingClass(locale)}`}
          />
        )}
      />
      {!!errors[key]?.message && (
          <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                style={[{color: APP_COLORS.error}, style]}>
          {String(errors[key]?.message)}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{backgroundColor:APP_COLORS.background}}>
      <View className="flex-row items-center px-4 pb-3 pt-1">
        <Pressable
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={({pressed}) => ({
            backgroundColor: pressed ? APP_COLORS.primary : APP_COLORS.background
          })}
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>
        <Text
          className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)}  font-bold `}
          style={[style, {color: APP_COLORS.textPrimary}]}
        >
          {t.title}
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

        <View className="mt-1 gap-4">

          {/* 1st card */}
          <View className="rounded-2xl p-4"
                style={{
                  backgroundColor: APP_COLORS.card,
                  borderColor: APP_COLORS.border,
                  borderWidth: 1
                }}>

            <View className="gap-3">

              <Text
                className={`text-sm font-bold  ${getMyanmarLeadingClass(locale)}`}
                style={[style,{color:APP_COLORS.textPrimary}]}
              >
                {t.basicInfoTitle}
              </Text>

              {/* plate number section */}
              {renderTextInput("plateNo", { required: true })}

              {/* feet length && model year section */}
              <View className="flex-row gap-2">
                  <View className="flex-1">
                      {renderTextInput("feet", {
                          required: true,
                          keyboardType: "number-pad",
                      })}
                  </View>
                <View className="flex-1">
                  {renderTextInput("modelYear", {
                    required: true,
                    keyboardType: "number-pad",
                  })}
                </View>
              </View>
              {/* model/brand section */}
              {renderTextInput("model", { required: true })}

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
                  render={({ field: { value, onChange } }) =>
                  {
                  const selectedOption = fuelTypeFilterOptions.find((r) => r.value === value);
                  const selectedLabel = selectedOption?.label;

                  return (
                    <Select
                      value={{ value:value, label: selectedLabel ? selectedLabel : "" }}
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
                          placeholder={t.placeholders.fuelType}
                          className={` py-0 text-[12px] font-medium ${getMyanmarLeadingClass(locale)}`}
                          style={[{color: APP_COLORS.textPrimary}]}
                        />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
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
                              <Select.ItemIndicator />
                            </Select.Item>
                          )}

                          )}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                  )}
                }
                />
                {!!errors.fuelType?.message && (
                    <Text className={`text-xs font-normal ${getMyanmarLeadingClass(locale)} `}
                          style={[{color: APP_COLORS.error}, style]}>
                    {String(errors.fuelType.message)}
                  </Text>
                )}
              </View>

            </View>

          </View>

          {/* 2nd card */}
          <View className="rounded-2xl p-4"
                style={{
                  backgroundColor: APP_COLORS.card,
                  borderColor: APP_COLORS.border,
                  borderWidth: 1
                }}>
            <View className="gap-3">
              <Text
                  className={`text-sm font-bold  ${getMyanmarLeadingClass(locale)}`}
                  style={[style,{color:APP_COLORS.textPrimary}]}
              >
                {t.tireAndExtraTitle}
              </Text>

              {/* fTire and bTire section */}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  {renderTextInput("frontTire", { required: true })}
                </View>
                <View className="flex-1">
                  {renderTextInput("backTire", { required: true })}
                </View>
              </View>

              {/* chassisNo section */}
              {renderTextInput("chassisNo")}

              {/* engineNo section */}
              {renderTextInput("engineNo")}

            </View>
          </View>

        </View>

        <Button
          onPress={handleSubmit(onSubmit)}
          isDisabled={isPending}
          className={`mb-2 mt-5 items-center justify-center rounded-xl ${getMyanmarLeadingClass(locale)} bg-primary `}
          variant="outline"
        >
          <Text className={`text-sm font-bold text-white ${getMyanmarLeadingClass(locale)}`} style={style}>
            {isPending ? t.submitting : t.submit}
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
