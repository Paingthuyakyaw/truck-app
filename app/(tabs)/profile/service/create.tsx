import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import { useTranslation } from "@/hooks/use-translation";
import { getApiErrorAlertCopy } from "@/lib/api-error-alert";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useCreateServiceType } from "@/stores/server/service-type/create-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Input } from "heroui-native";
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
    serviceType: z.string().min(1, requiredField).max(50, maxLength),
    langEng: z.string().min(1, requiredField).max(100, maxLength),
    langMy: z.string().min(1, requiredField).max(100, maxLength),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function CreateServiceTypeScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const labels = profileLocale[locale].createServiceTypeScreen;
  const errorCatalog = useTranslation("error");
  const { mutate, isPending } = useCreateServiceType();
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const schema = useMemo(
    () => buildSchema(labels.requiredField, labels.maxLength),
    [labels.maxLength, labels.requiredField],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
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
          Alert.alert(labels.successTitle, labels.successBody);
          router.back();
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
            <Text
              className="text-[18px] font-bold text-slate-900"
              style={style}
            >
              {labels.basicInfoTitle}
            </Text>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {labels.fieldLabels.serviceType}
                </Text>
                <Text className="text-red-500">*</Text>
              </View>
              <Controller
                control={control}
                name="serviceType"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={(text) =>
                      onChange(text.replace(/\s+/g, "_").toUpperCase())
                    }
                    autoCapitalize="characters"
                    className={`border h-11 py-0 ${getMyanmarLeadingClass(locale)}  border-slate-200 bg-white`}
                    placeholder={labels.placeholders.serviceType}
                  />
                )}
              />
              {!!errors.serviceType?.message && (
                <Text className="text-xs text-red-500">
                  {String(errors.serviceType.message)}
                </Text>
              )}
            </View>

            <View className="gap-1.5">
              <View className="flex-row items-center gap-1">
                <Text
                  className={`text-sm font-medium ${getMyanmarLeadingClass(locale)}  text-slate-900`}
                  style={style}
                >
                  {labels.fieldLabels.langEng}
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
                    placeholder={labels.placeholders.langEng}
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
                  {labels.fieldLabels.langMy}
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
                    placeholder={labels.placeholders.langMy}
                  />
                )}
              />
              {!!errors.langMy?.message && (
                <Text className="text-xs text-red-500">
                  {String(errors.langMy.message)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
          className="mb-2 mt-5 items-center justify-center rounded-xl py-3.5"
          style={{
            backgroundColor: APP_COLORS.primary,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          <Text className="text-base font-semibold text-white" style={style}>
            {isPending ? labels.submitting : labels.submit}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
