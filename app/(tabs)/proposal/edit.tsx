import { ServiceDatePicker } from "@/components/service-date-picker";
import { APP_COLORS } from "@/constants/colors";
import {
  compactLineInputTextStyle,
  compactMultilineInputTextStyle,
} from "@/constants/compact-input";
import { getMyanmarLeadingClass } from "@/constants/myanmar-font";
import { useTranslation } from "@/hooks/use-translation";
import { getApiErrorAlertCopy } from "@/lib/api-error-alert";
import proposalLocale from "@/locale/proposal/proposal.json";
import { useLocaleStore, type AppLocale } from "@/stores/client/locale-store";
import { useProposalDetail } from "@/stores/server/proposal/query";
import type { ProposalDetail } from "@/stores/server/proposal/typed";
import { useUpdateProposal } from "@/stores/server/proposal/update-mutation";
import { useServiceTypesInfinite } from "@/stores/server/service-type/query";
import { buildServiceTypeSearchColumns } from "@/stores/server/service-type/search-columns";
import type { ServiceTypeItem } from "@/stores/server/service-type/typed";
import {
  parseServiceDateApiToDisplay,
  parseServiceDateDisplayToApi,
} from "@/utils/service-date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Input, Select } from "heroui-native";
import React, { useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
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
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

type FormValues = {
  proposalAmount: string;
  serviceType: string;
  serviceShop: string;
  serviceDate: string;
  description: string;
  remark: string;
};

function buildSchema(createLabels: (typeof proposalLocale)["en"]["create"]) {
  return z.object({
    proposalAmount: z
      .string()
      .min(1, createLabels.required)
      .refine((value) => /^\d{1,9}(\.\d{1,2})?$/.test(value.trim()), {
        message: createLabels.invalidAmount,
      }),
    serviceType: z.string().min(1, createLabels.required),
    serviceShop: z.string().min(1, createLabels.required).max(200),
    serviceDate: z
      .string()
      .min(1, createLabels.required)
      .refine((value) => parseServiceDateDisplayToApi(value) !== null, {
        message: createLabels.invalidDate,
      }),
    description: z.string().min(1, createLabels.required).max(1000),
    remark: z.string().min(1, createLabels.required).max(1000),
  });
}

function getOwnershipId(
  detail: ProposalDetail | undefined,
  fallback: string,
): string {
  return String(detail?.ownershipRefId ?? fallback).trim();
}

export default function EditProposalScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const errorCatalog = useTranslation("error");
  const createLabels = proposalLocale[locale].create;
  const detailLabels = proposalLocale[locale].detail;
  const t = proposalLocale[locale].edit;
  const params = useLocalSearchParams<{
    proposalNo?: string;
    ownershipId?: string;
  }>();
  const proposalNo = String(params.proposalNo ?? "").trim();
  const ownershipId = String(params.ownershipId ?? "").trim();
  const { data, isPending: isDetailPending } = useProposalDetail(
    proposalNo,
    ownershipId,
  );
  const detail = data?.data;
  const { mutate, isPending } = useUpdateProposal();

  const mmLeading = getMyanmarLeadingClass(locale);
  const schema = useMemo(() => buildSchema(createLabels), [createLabels]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      proposalAmount: "",
      serviceType: "",
      serviceShop: "",
      serviceDate: "",
      description: "",
      remark: "",
    },
  });

  useEffect(() => {
    if (!detail) return;
    reset({
      proposalAmount: String(detail.proposalAmount ?? ""),
      serviceType: detail.serviceType ?? "",
      serviceShop: detail.serviceShop ?? "",
      serviceDate: parseServiceDateApiToDisplay(detail.serviceDate ?? ""),
      description: detail.description ?? "",
      remark: "",
    });
  }, [detail, reset]);

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

  const onBack = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["proposal"] });
    router.back();
  }, [qc, router]);

  const onSubmit = (values: FormValues) => {
    if (!detail?.id) return;

    const serviceDate = parseServiceDateDisplayToApi(values.serviceDate);
    if (!serviceDate) return;

    mutate(
      {
        id: detail.id,
        version: detail.version,
        ownershipId: getOwnershipId(detail, ownershipId),
        proposalAmount: Number(values.proposalAmount),
        serviceType: values.serviceType,
        serviceShop: values.serviceShop.trim(),
        serviceDate,
        description: values.description.trim(),
        remark: values.remark.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert(t.successTitle, t.successBody, [
            { text: createLabels.done, onPress: () => router.back() },
          ]);
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

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <View className="flex-row items-center px-4 pb-3 pt-1">
        <Pressable
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-full bg-[#f1f5f9]"
        >
          <Ionicons name="arrow-back" size={22} color="#475569" />
        </Pressable>
        <Text
          className={`flex-1 px-3 text-center text-lg font-bold text-slate-900 ${mmLeading}`}
        >
          {t.title}
        </Text>
        <View className="h-11 w-11" />
      </View>

      {isDetailPending ? (
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
          keyboardShouldPersistTaps="handled"
        >
          <View className="mt-1 rounded-2xl bg-white p-4">
            <View className="mb-4 gap-1">
              <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                {t.proposalNo}
              </Text>
              <Text className={`text-xl font-bold text-primary ${mmLeading}`}>
                {detail?.proposalNo || "-"}
              </Text>
            </View>

            <View className="gap-4">
              <FormInput
                control={control}
                name="proposalAmount"
                label={createLabels.amount}
                placeholder={createLabels.amountPlaceholder}
                locale={locale}
                keyboardType="decimal-pad"
                required
                error={errors.proposalAmount?.message}
                mmLeading={mmLeading}
              />

              <Controller
                control={control}
                name="serviceType"
                render={({ field: { value, onChange } }) => (
                  <View className="gap-2">
                    <RequiredLabel
                      label={createLabels.serviceType}
                      mmLeading={mmLeading}
                    />
                    <Select
                      value={getSelectedServiceType(
                        value,
                        serviceTypes,
                        locale,
                      )}
                      onValueChange={(next) => {
                        if (next && !Array.isArray(next)) {
                          onChange(next.value);
                        }
                      }}
                    >
                      <Select.Trigger className=" py-0 h-11 ">
                        <Select.Value
                          placeholder={createLabels.serviceTypePlaceholder}
                          style={compactLineInputTextStyle(locale)}
                        />
                        <Select.TriggerIndicator />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Overlay />
                        <Select.Content
                          className="rounded-2xl text-xs border border-slate-200 bg-white"
                          presentation="popover"
                          width="trigger"
                        >
                          {serviceTypes.map((serviceType) => (
                            <Select.Item
                              className=" text-xs!"
                              key={String(serviceType.id)}
                              value={serviceType.serviceType}
                              label={getServiceTypeLabel(serviceType, locale)}
                            >
                              <Select.ItemLabel className={mmLeading} />
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select>
                    {!!errors.serviceType?.message && (
                      <Text className={`text-xs text-red-500 ${mmLeading}`}>
                        {String(errors.serviceType.message)}
                      </Text>
                    )}
                  </View>
                )}
              />

              <FormInput
                control={control}
                name="serviceShop"
                label={createLabels.serviceShop}
                placeholder={createLabels.serviceShopPlaceholder}
                locale={locale}
                required
                error={errors.serviceShop?.message}
                mmLeading={mmLeading}
              />

              <Controller
                control={control}
                name="serviceDate"
                render={({ field: { value, onChange } }) => (
                  <View className="gap-2">
                    <RequiredLabel
                      label={createLabels.serviceDate}
                      mmLeading={mmLeading}
                    />
                    <ServiceDatePicker
                      value={value}
                      onChange={onChange}
                      placeholder={createLabels.serviceDatePlaceholder}
                      doneLabel={createLabels.done}
                      locale={locale}
                    />
                    {!!errors.serviceDate?.message && (
                      <Text className={`text-xs text-red-500 ${mmLeading}`}>
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
                    <RequiredLabel
                      label={createLabels.description}
                      mmLeading={mmLeading}
                    />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      placeholder={createLabels.descriptionPlaceholder}
                      multiline
                      textAlignVertical="top"
                      className="min-h-[126px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                      style={compactMultilineInputTextStyle(locale)}
                    />
                    {!!errors.description?.message && (
                      <Text className={`text-xs text-red-500 ${mmLeading}`}>
                        {String(errors.description.message)}
                      </Text>
                    )}
                  </View>
                )}
              />

              <FormInput
                control={control}
                name="remark"
                label={detailLabels.remark}
                placeholder={detailLabels.remarkPlaceholder}
                locale={locale}
                required
                error={errors.remark?.message}
                mmLeading={mmLeading}
              />

              <View className="flex-row gap-3 pt-2">
                <Pressable
                  onPress={onBack}
                  disabled={isPending}
                  className="flex-1 items-center justify-center rounded-xl bg-slate-100 h-14 "
                >
                  <Text className={`font-semibold text-slate-700 ${mmLeading}`}>
                    {createLabels.cancel}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit(onSubmit)}
                  disabled={isPending}
                  className="flex-1 items-center justify-center rounded-xl h-14"
                  style={{
                    backgroundColor: APP_COLORS.primary,
                    opacity: isPending ? 0.7 : 1,
                  }}
                >
                  <Text className={`font-semibold text-white ${mmLeading}`}>
                    {isPending ? t.updating : t.update}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type RequiredLabelProps = {
  label: string;
  mmLeading: string;
};

function RequiredLabel({ label, mmLeading }: RequiredLabelProps) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className={`text-sm font-medium text-slate-900 ${mmLeading}`}>
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
  locale: AppLocale;
  keyboardType?: "decimal-pad";
  required?: boolean;
  error?: string;
  mmLeading: string;
};

function FormInput({
  control,
  name,
  label,
  placeholder,
  locale,
  keyboardType,
  required,
  error,
  mmLeading,
}: FormInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <View className="gap-2">
          {required ? (
            <RequiredLabel label={label} mmLeading={mmLeading} />
          ) : (
            <Text className={`text-sm font-medium text-slate-900 ${mmLeading}`}>
              {label}
            </Text>
          )}
          <Input
            value={String(value ?? "")}
            onChangeText={onChange}
            placeholder={placeholder}
            keyboardType={keyboardType}
            className={`border py-0 h-11 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
          />
          {!!error && (
            <Text className={`text-xs text-red-500 ${mmLeading}`}>
              {String(error)}
            </Text>
          )}
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
