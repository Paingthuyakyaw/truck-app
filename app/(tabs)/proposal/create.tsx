import { myanmarUITextStyle } from "@/constants/myanmar-font";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import proposalLocale from "@/locale/proposal/proposal.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useCreateProposal } from "@/stores/server/proposal/create-mutation";
import { buildServiceTypeSearchColumns } from "@/stores/server/service-type/search-columns";
import { useServiceTypesInfinite } from "@/stores/server/service-type/query";
import type { ServiceTypeItem } from "@/stores/server/service-type/typed";
import { buildTruckSearchColumns } from "@/stores/server/truck/search-columns";
import { useTrucksInfinite } from "@/stores/server/truck/query";
import type { TruckItem } from "@/stores/server/truck/typed";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { Input, Select } from "heroui-native";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

type FormValues = {
  truckId: string;
  proposalAmount: string;
  serviceType: string;
  serviceShop: string;
  serviceDate: string;
  description: string;
};

function buildSchema(t: (typeof proposalLocale)["en"]["create"]) {
  return z.object({
    truckId: z.string().min(1, t.required),
    proposalAmount: z
      .string()
      .min(1, t.required)
      .refine((value) => /^\d{1,9}(\.\d{1,2})?$/.test(value.trim()), {
        message: t.invalidAmount,
      }),
    serviceType: z.string().min(1, t.required),
    serviceShop: z.string().min(1, t.required).max(100),
    serviceDate: z
      .string()
      .min(1, t.required)
      .refine((value) => parseServiceDate(value) !== null, {
        message: t.invalidDate,
      }),
    description: z.string().max(1000).optional().default(""),
  });
}

function parseServiceDate(value: string): string | null {
  const raw = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return null;

  const [, dd, mm, yyyy, hh, min] = match;
  const date = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
  );

  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd) ||
    date.getHours() !== Number(hh) ||
    date.getMinutes() !== Number(min)
  ) {
    return null;
  }

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
}

function parseServiceDateToDate(value: string): Date | null {
  const raw = value.trim();
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(raw);
  if (!match) return null;

  const [, dd, mm, yyyy, hh, min] = match;
  const date = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
  );

  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd) ||
    date.getHours() !== Number(hh) ||
    date.getMinutes() !== Number(min)
  ) {
    return null;
  }

  return date;
}

function toServiceDateDisplay(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function getTruckSubtitle(item: TruckItem): string {
  const year = String(item.modelYear ?? "").trim();
  const model = String(item.model ?? "").trim();
  return [year, model].filter(Boolean).join(" ") || "-";
}

export default function CreateProposalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const t = proposalLocale[locale].create;
  const { mutate, isPending } = useCreateProposal();
  const [truckQuery, setTruckQuery] = useState("");
  const [truckPickerOpen, setTruckPickerOpen] = useState(false);
  const [showServiceDatePicker, setShowServiceDatePicker] = useState(false);
  const debouncedTruckQuery = useDebouncedValue(truckQuery, 400);

  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const schema = useMemo(() => buildSchema(t), [t]);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      truckId: "",
      proposalAmount: "",
      serviceType: "",
      serviceShop: "",
      serviceDate: "",
      description: "",
    },
  });

  const truckColumns = useMemo(
    () =>
      buildTruckSearchColumns({
        quickQuery: debouncedTruckQuery,
        plateNo: "",
        model: "",
        modelYear: "",
        engineNo: "",
        chassisNo: "",
      }),
    [debouncedTruckQuery],
  );
  const { data: truckData } = useTrucksInfinite(truckColumns);
  const trucks = useMemo(
    () => truckData?.pages.flatMap((page) => page.data.data) ?? [],
    [truckData],
  );

  const serviceColumns = useMemo(
    () =>
      buildServiceTypeSearchColumns({
        quickQuery: "",
        active: true,
        langEng: "",
        langMy: "",
      }),
    [],
  );
  const { data: serviceTypeData } = useServiceTypesInfinite(serviceColumns);
  const serviceTypes = useMemo(
    () => serviceTypeData?.pages.flatMap((page) => page.data.data) ?? [],
    [serviceTypeData],
  );

  const onSubmit = (values: FormValues) => {
    const serviceDate = parseServiceDate(values.serviceDate);
    if (!serviceDate) return;

    mutate(
      {
        truckId: values.truckId,
        proposalAmount: Number(values.proposalAmount),
        serviceType: values.serviceType,
        serviceShop: values.serviceShop.trim(),
        serviceDate,
        description: values.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(t.successTitle, t.successBody);
          router.back();
        },
        onError: (err: unknown) => {
          const data = isAxiosError(err) ? err.response?.data : undefined;
          const message =
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof (data as { message?: unknown }).message === "string"
              ? (data as { message: string }).message
              : t.errorBody;
          Alert.alert(t.errorTitle, message);
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <View className="flex-row items-center px-4 pb-3 pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#f1f5f9]"
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>
        <Text
          className="flex-1 px-3 text-center text-[24px] font-bold text-slate-900"
          style={style}
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
        keyboardShouldPersistTaps="handled"
      >
        <View className="mt-1 rounded-2xl bg-white p-4">
          <View className="gap-4">
            <Controller
              control={control}
              name="truckId"
              render={() => (
                <View className="gap-2">
                  <RequiredLabel label={t.truck} style={style} />
                  <Input
                    value={truckQuery}
                    onChangeText={(next) => {
                      setTruckQuery(next);
                      setTruckPickerOpen(true);
                      setValue("truckId", "");
                    }}
                    onFocus={() => setTruckPickerOpen(true)}
                    placeholder={t.truckPlaceholder}
                    className={`border bg-white ${truckPickerOpen ? "border-blue-500" : "border-slate-200"}`}
                  />
                  {!!errors.truckId?.message && (
                    <Text className="text-xs text-red-500">
                      {String(errors.truckId.message)}
                    </Text>
                  )}
                  {truckPickerOpen ? (
                    <View className="rounded-2xl border border-slate-200 bg-white p-3">
                      <Input
                        value={truckQuery}
                        onChangeText={(next) => {
                          setTruckQuery(next);
                          setValue("truckId", "");
                        }}
                        placeholder={t.truckSearch}
                        className="mb-2 border border-slate-100 bg-slate-50"
                      />
                      {trucks.slice(0, 5).map((truck) => (
                        <Pressable
                          key={truck.id}
                          onPress={() => {
                            setValue("truckId", truck.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setTruckQuery(truck.plateNo);
                            setTruckPickerOpen(false);
                          }}
                          className="py-2"
                        >
                          <Text className="text-sm font-semibold text-slate-900">
                            {truck.plateNo}
                          </Text>
                          <Text className="mt-0.5 text-xs text-slate-500">
                            {getTruckSubtitle(truck)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              )}
            />

            <FormInput
              control={control}
              name="proposalAmount"
              label={t.amount}
              placeholder={t.amountPlaceholder}
              keyboardType="decimal-pad"
              required
              error={errors.proposalAmount?.message}
              style={style}
            />

            <Controller
              control={control}
              name="serviceType"
              render={({ field: { value, onChange } }) => (
                <View className="gap-2">
                  <RequiredLabel label={t.serviceType} style={style} />
                  <Select
                    value={getSelectedServiceType(value, serviceTypes, locale)}
                    onValueChange={(next) => {
                      if (next && !Array.isArray(next)) {
                        onChange(next.value);
                      }
                    }}
                  >
                    <Select.Trigger className="rounded-xl border border-slate-200 bg-white px-2.5">
                      <Select.Value placeholder={t.serviceTypePlaceholder} style={style} />
                      <Select.TriggerIndicator />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Overlay />
                      <Select.Content
                        className="rounded-2xl border border-slate-200 bg-white"
                        presentation="popover"
                        width="trigger"
                      >
                        {serviceTypes.map((serviceType) => (
                          <Select.Item
                            key={String(serviceType.id)}
                            value={serviceType.serviceType}
                            label={getServiceTypeLabel(serviceType, locale)}
                          >
                            <Select.ItemLabel style={style} />
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                  {!!errors.serviceType?.message && (
                    <Text className="text-xs text-red-500">
                      {String(errors.serviceType.message)}
                    </Text>
                  )}
                </View>
              )}
            />

            <FormInput
              control={control}
              name="serviceShop"
              label={t.serviceShop}
              placeholder={t.serviceShopPlaceholder}
              required
              error={errors.serviceShop?.message}
              style={style}
            />

            <Controller
              control={control}
              name="serviceDate"
              render={({ field: { value, onChange } }) => (
                <View className="gap-2">
                  <RequiredLabel label={t.serviceDate} style={style} />
                  <Pressable
                    onPress={() => setShowServiceDatePicker(true)}
                    className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3"
                  >
                    <Text
                      className={value ? "text-slate-900" : "text-slate-400"}
                      style={style}
                    >
                      {value || t.serviceDatePlaceholder}
                    </Text>
                    <Ionicons name="calendar-outline" size={18} color="#e2e8f0" />
                  </Pressable>

                  {showServiceDatePicker ? (
                    <View className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                      <DateTimePicker
                        value={parseServiceDateToDate(value) ?? new Date()}
                        mode="datetime"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        maximumDate={new Date()}
                        style={{ width: "100%" }}
                        onChange={(
                          event: DateTimePickerEvent,
                          selectedDate?: Date,
                        ) => {
                          if (Platform.OS !== "ios") {
                            setShowServiceDatePicker(false);
                          }
                          if (event.type === "set" && selectedDate) {
                            onChange(toServiceDateDisplay(selectedDate));
                          }
                        }}
                      />
                      {Platform.OS === "ios" ? (
                        <Pressable
                          onPress={() => setShowServiceDatePicker(false)}
                          className="mt-2 self-end rounded-lg bg-slate-100 px-3 py-1.5"
                        >
                          <Text
                            className="text-xs font-semibold text-slate-700"
                            style={style}
                          >
                            {t.done}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ) : null}

                  {!!errors.serviceDate?.message && (
                    <Text className="text-xs text-red-500">
                      {String(errors.serviceDate.message)}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange } }) => (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-900" style={style}>
                    {t.description}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={t.descriptionPlaceholder}
                    multiline
                    textAlignVertical="top"
                    className="min-h-[126px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  />
                </View>
              )}
            />

            <View className="flex-row gap-3 pt-2">
              <Pressable
                onPress={() => router.back()}
                disabled={isPending}
                className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-4"
              >
                <Text className="font-semibold text-slate-700" style={style}>
                  {t.cancel}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isPending}
                className="flex-1 items-center justify-center rounded-xl py-4"
                style={{
                  backgroundColor: "#3b82f6",
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                <Text className="font-semibold text-white" style={style}>
                  {isPending ? t.submitting : t.submit}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type RequiredLabelProps = {
  label: string;
  style: ReturnType<typeof myanmarUITextStyle> | undefined;
};

function RequiredLabel({ label, style }: RequiredLabelProps) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-sm font-medium text-slate-900" style={style}>
        {label}
      </Text>
      <Text className="text-red-500">*</Text>
    </View>
  );
}

type FormInputProps = {
  control: ReturnType<typeof useForm<FormValues>>["control"];
  name: keyof FormValues;
  label: string;
  placeholder: string;
  keyboardType?: "decimal-pad";
  required?: boolean;
  error?: string;
  style: ReturnType<typeof myanmarUITextStyle> | undefined;
};

function FormInput({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  required,
  error,
  style,
}: FormInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View className="gap-2">
          {required ? (
            <RequiredLabel label={label} style={style} />
          ) : (
            <Text className="text-sm font-medium text-slate-900" style={style}>
              {label}
            </Text>
          )}
          <Input
            value={String(value ?? "")}
            onChangeText={onChange}
            placeholder={placeholder}
            keyboardType={keyboardType}
            className="border border-slate-200 bg-white"
          />
          {!!error && <Text className="text-xs text-red-500">{String(error)}</Text>}
        </View>
      )}
    />
  );
}

function getServiceTypeLabel(item: ServiceTypeItem, locale: "en" | "mm") {
  return locale === "mm" ? item.langMy || item.langEng : item.langEng;
}

function getSelectedServiceType(
  value: string,
  options: ServiceTypeItem[],
  locale: "en" | "mm",
) {
  const option = options.find((item) => item.serviceType === value);
  if (!option) return undefined;
  return {
    value: option.serviceType,
    label: getServiceTypeLabel(option, locale),
  };
}
