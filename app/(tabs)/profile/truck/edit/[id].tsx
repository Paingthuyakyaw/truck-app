import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useTruckDetail } from "@/stores/server/truck/query";
import { useUpdateTruck } from "@/stores/server/truck/update-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Input, Select } from "heroui-native";
import React, { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { z } from "zod";

const YEAR_RE = /^\d{4}$/;
const FUEL_TYPES = ["diesel", "petrol", "CNG"] as const;

function buildSchema(requiredField: string, modelYearInvalid: string) {
  return z.object({
    model: z.string().min(1, requiredField).max(100),
    modelYear: z
      .string()
      .min(1, requiredField)
      .refine((v) => YEAR_RE.test(v.trim()), modelYearInvalid),
    fuelType: z.enum(FUEL_TYPES, { message: requiredField }),
    frontTire: z.string().min(1, requiredField).max(100),
    backTire: z.string().min(1, requiredField).max(100),
    chassisNo: z.string().max(100).optional(),
    engineNo: z.string().max(100).optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function EditTruckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const labels = profileLocale[locale].editTruckScreen;
  const createLabels = profileLocale[locale].createTruckScreen;
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const schema = useMemo(
    () =>
      buildSchema(createLabels.requiredField, createLabels.modelYearInvalid),
    [createLabels.modelYearInvalid, createLabels.requiredField],
  );

  const { id } = useLocalSearchParams<{ id?: string }>();
  const truckId = String(id ?? "").trim();
  const { data, isPending: isLoading } = useTruckDetail(truckId);
  const { mutate, isPending } = useUpdateTruck();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      model: "",
      modelYear: "",
      fuelType: "diesel",
      frontTire: "",
      backTire: "",
      chassisNo: "",
      engineNo: "",
    },
  });

  useEffect(() => {
    const detail = data?.data;
    if (!detail) return;
    const fuelTypeRaw = String(detail.fuelType ?? "diesel").toLowerCase();
    const fuelType = FUEL_TYPES.includes(
      fuelTypeRaw as (typeof FUEL_TYPES)[number],
    )
      ? (fuelTypeRaw as FormValues["fuelType"])
      : "diesel";

    reset({
      model: String(detail.model ?? detail.make ?? "").trim(),
      modelYear: String(detail.modelYear ?? "").trim(),
      fuelType,
      frontTire: String(detail.frontTire ?? detail.frontTireSize ?? "").trim(),
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
        fuelType: values.fuelType.trim(),
        frontTire: values.frontTire.trim(),
        backTire: values.backTire.trim(),
        chassisNo: values.chassisNo?.trim() || undefined,
        engineNo: values.engineNo?.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(labels.successTitle, labels.successBody);
          router.replace("/(tabs)/profile/truck");
        },
        onError: () => {
          Alert.alert(labels.errorTitle, labels.errorBody);
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
  ) => (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1">
        <Text
          className={`text-sm font-medium text-slate-900 ${getMyanmarLeadingClass(locale)} `}
          style={style}
        >
          {createLabels.fieldLabels[key]}
        </Text>
        {options?.required ? <Text className="text-red-500">*</Text> : null}
      </View>
      <Controller
        control={control}
        name={key}
        render={({ field: { onChange, value } }) => (
          <Input
            value={options?.valueOverride ?? String(value ?? "")}
            onChangeText={onChange}
            keyboardType={options?.keyboardType}
            autoCapitalize="none"
            editable={options?.editable ?? true}
            // multiline={options?.multiline}
            // numberOfLines={options?.multiline ? 4 : 1}
            textAlignVertical={options?.multiline ? "top" : "center"}
            className={`border py-0 h-11 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
          />
        )}
      />
      {(options?.editable ?? true) && !!errors[key]?.message && (
        <Text className="text-xs text-red-500">
          {String(errors[key]?.message)}
        </Text>
      )}
    </View>
  );

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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={APP_COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          className="px-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            flexGrow: 1,
          }}
        >
          <View className="mt-1 rounded-3xl bg-white p-5">
            <View className="gap-4">
              {renderField("model", {
                required: true,
                editable: false,
                valueOverride:
                  `${data?.data?.modelYear ?? ""} ${data?.data?.model ?? ""}`.trim(),
              })}

              <View className="flex-row gap-3">
                <View className="flex-1">
                  {renderField("frontTire", { required: true })}
                </View>
                <View className="flex-1">
                  {renderField("backTire", { required: true })}
                </View>
              </View>

              <View className="gap-1.5">
                <View className="flex-row items-center gap-1">
                  <Text
                    className="text-sm font-medium text-slate-900"
                    style={style}
                  >
                    {createLabels.fieldLabels.fuelType}
                  </Text>
                  <Text className="text-red-500">*</Text>
                </View>
                <Controller
                  control={control}
                  name="fuelType"
                  render={({ field: { value, onChange } }) => (
                    <Select
                      value={{ value, label: value }}
                      onValueChange={(next) => {
                        if (next && !Array.isArray(next)) {
                          onChange(next.value as FormValues["fuelType"]);
                        }
                      }}
                    >
                      <Select.Trigger
                        className={`rounded-2xl ${getMyanmarLeadingClass(locale)} h-11 py-0 border border-slate-200 bg-[#f8fafc] px-3`}
                      >
                        <Select.Value
                          className={`py-0 ${getMyanmarLeadingClass(locale)}`}
                          placeholder={createLabels.fuelTypePlaceholder}
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
                          {FUEL_TYPES.map((fuelType) => (
                            <Select.Item
                              key={fuelType}
                              value={fuelType}
                              label={fuelType}
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
                {!!errors.fuelType?.message && (
                  <Text className="text-xs text-red-500">
                    {String(errors.fuelType.message)}
                  </Text>
                )}
              </View>

              {renderField("modelYear", {
                required: true,
                keyboardType: "number-pad",
              })}
              {renderField("chassisNo")}
              {renderField("engineNo", { multiline: true })}
            </View>
          </View>

          <View className="mb-2 mt-5 flex-row gap-3">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 items-center justify-center rounded-xl bg-slate-200 py-3.5"
            >
              <Text
                className="text-base font-semibold text-slate-700"
                style={style}
              >
                {labels.cancel}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              className="flex-1 items-center justify-center rounded-xl py-3.5"
              style={{
                backgroundColor: APP_COLORS.primary,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              <Text
                className="text-base font-semibold text-white"
                style={style}
              >
                {isPending ? labels.submitting : labels.submit}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
