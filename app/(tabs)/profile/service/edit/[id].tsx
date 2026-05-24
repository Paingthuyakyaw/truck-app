import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import { useTranslation } from "@/hooks/use-translation";
import { getApiErrorAlertCopy } from "@/lib/api-error-alert";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useUpdateServiceType } from "@/stores/server/service-type/update-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Input, Select } from "heroui-native";
import React, { useCallback, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { z } from "zod";

function buildSchema(requiredField: string, maxLength: string) {
  return z.object({
    langEng: z.string().min(1, requiredField).max(100, maxLength),
    langMy: z.string().min(1, requiredField).max(100, maxLength),
    active: z.enum(["true", "false"]),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function EditServiceTypeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const labels = profileLocale[locale].editServiceTypeScreen;
  const createLabels = profileLocale[locale].createServiceTypeScreen;
  const errorCatalog = useTranslation("error");
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;
  const { mutate, isPending } = useUpdateServiceType();
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

  const schema = useMemo(
    () => buildSchema(createLabels.requiredField, createLabels.maxLength),
    [createLabels.maxLength, createLabels.requiredField],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      langEng: String(params.langEng ?? ""),
      langMy: String(params.langMy ?? ""),
      active: String(params.active ?? "true") === "true" ? "true" : "false",
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!itemId || !serviceType) {
      Alert.alert(labels.errorTitle, labels.invalidItem);
      return;
    }
    mutate(
      {
        id: itemId,
        version,
        serviceType,
        langEng: values.langEng.trim(),
        langMy: values.langMy.trim(),
        active: values.active === "true",
      },
      {
        onSuccess: () => {
          Alert.alert(labels.successTitle, labels.successBody);
          router.replace("/(tabs)/profile/service");
        },
        onError: (err: unknown) => {
          const { title, message } = getApiErrorAlertCopy(err, errorCatalog, {
            title: labels.errorTitle,
            message: labels.errorBody,
          });
          Alert.alert(title, message);
        },
      },
    );
  };

  const onBack = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["service-types"] });
    router.back();
  }, [qc, router]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        qc.invalidateQueries({ queryKey: ["service-types"] });
      };
    }, [qc]),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f3f7fb]">
      <View className="flex-row items-center px-4 pb-3 pt-1">
        <Pressable
          onPress={onBack}
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

      <ScrollView
        className="px-4"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
          flexGrow: 1,
        }}
      >
        <View className="mt-1 rounded-2xl bg-white p-4">
          <View className="gap-3">
            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {createLabels.fieldLabels.serviceType}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Input
                value={serviceType}
                editable={false}
                className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
              />
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {createLabels.fieldLabels.langEng}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="langEng"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                  />
                )}
              />
              {!!errors.langEng?.message && (
                <Text className="text-xs text-red-500">
                  {String(errors.langEng.message)}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {createLabels.fieldLabels.langMy}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="langMy"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                  />
                )}
              />
              {!!errors.langMy?.message && (
                <Text className="text-xs text-red-500">
                  {String(errors.langMy.message)}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {labels.activeLabel}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="active"
                render={({ field: { value, onChange } }) => (
                  <Select
                    value={{
                      value,
                      label:
                        value === "true"
                          ? labels.status.active
                          : labels.status.inactive,
                    }}
                    onValueChange={(next) => {
                      if (next && !Array.isArray(next)) {
                        onChange(next.value as FormValues["active"]);
                      }
                    }}
                  >
                    <Select.Trigger
                      className={`rounded-xl h-11 py-0 ${getMyanmarLeadingClass(locale)}  border border-slate-200 bg-white px-2.5`}
                    >
                      <Select.Value
                        placeholder="Select"
                        className={` py-0 text-sm ${getMyanmarLeadingClass(locale)}`}
                        style={style}
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
                        <Select.Item value="true" label={labels.status.active}>
                          <Select.ItemLabel style={style} />
                          <Select.ItemIndicator />
                        </Select.Item>
                        <Select.Item
                          value="false"
                          label={labels.status.inactive}
                        >
                          <Select.ItemLabel style={style} />
                          <Select.ItemIndicator />
                        </Select.Item>
                      </Select.Content>
                    </Select.Portal>
                  </Select>
                )}
              />
            </View>
          </View>
        </View>

        <View className="mb-2 mt-5 flex-row gap-3">
          <Pressable
            onPress={onBack}
            className="flex-1 items-center justify-center rounded-xl bg-slate-200 py-3.5"
          >
            <Text
              className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
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
            <Text className="text-base font-semibold text-white" style={style}>
              {isPending ? labels.submitting : labels.submit}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
