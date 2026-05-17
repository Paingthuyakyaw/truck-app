import { APP_COLORS } from "@/constants/colors";
import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import profileLocale from "@/locale/profile/profile.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useChangePassword } from "@/stores/server/user/password-mutation";
import Ionicons from "@expo/vector-icons/Ionicons";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import { Input } from "heroui-native";
import React, { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { z } from "zod";

const FALLBACK_CHANGE_PASSWORD_LABELS = {
  en: {
    title: "Change Password",
    infoTitle: "Password Security",
    infoBody:
      "Password must be at least 8 characters. Include upper and lower case letters, numbers, and symbols (@ # $ % ^ & + = !) for stronger security.",
    currentLabel: "Current password",
    currentPlaceholder: "Enter current password",
    newLabel: "New password",
    newPlaceholder: "Enter new password",
    confirmLabel: "Confirm new password",
    confirmPlaceholder: "Re-enter new password",
    submit: "Confirm",
    oldRequired: "Current password is required",
    newRequired: "New password is required",
    confirmRequired: "Please confirm your new password",
    mismatch: "New passwords do not match",
    newInvalid:
      "Use at least 8 characters with upper & lower case letters, a number, and a symbol (@ # $ % ^ & + = !).",
    successTitle: "Password updated",
    successBody: "Your password has been changed successfully.",
    ok: "OK",
    errorTitle: "Could not update password",
    errorGeneric: "Something went wrong. Please try again.",
  },
  mm: {
    title: "စကားဝှက်ပြောင်းရန်",
    infoTitle: "စကားဝှက်လုံခြုံရေး",
    infoBody:
      "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ရှိရမည်။ နံပါတ်၊ အကြီးအသေးလုံး နှင့် သင်္ကေတများ ပါဝင်ပါက ပိုမိုလုံခြုံပါသည်။",
    currentLabel: "လက်ရှိစကားဝှက်",
    currentPlaceholder: "လက်ရှိစကားဝှက်ထည့်ပါ",
    newLabel: "စကားဝှက်အသစ်",
    newPlaceholder: "စကားဝှက်အသစ်ထည့်ပါ",
    confirmLabel: "စကားဝှက်အသစ် အတည်ပြုရန်",
    confirmPlaceholder: "စကားဝှက်အသစ် ထပ်ထည့်ပါ",
    submit: "အတည်ပြုမည်",
    oldRequired: "လက်ရှိစကားဝှက် ထည့်ရန်လိုအပ်ပါသည်",
    newRequired: "စကားဝှက်အသစ် ထည့်ရန်လိုအပ်ပါသည်",
    confirmRequired: "စကားဝှက်အသစ် ထပ်အတည်ပြုပါ",
    mismatch: "စကားဝှက်အသစ် မတူညီပါ",
    newInvalid:
      "အင်္ဂလိပ်အကြီးအသေး၊ နံပါတ်၊ သင်္ကေတ (@ # $ % ^ & + = !) ပါဝင်သော စကားဝှက် အနည်းဆုံး ၈ လုံး သုံးပါ။",
    successTitle: "ပြင်ဆင်ပြီးပါပြီ",
    successBody: "စကားဝှက်ကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။",
    ok: "အိုကေ",
    errorTitle: "စကားဝှက် မပြောင်းနိုင်ပါ",
    errorGeneric: "တစ်ခုခု မှားယွင်းနေပါသည်။ ထပ်ကြိုးစားပါ။",
  },
} as const;

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const profileCopy = profileLocale[locale] ?? profileLocale.en;
  const labels =
    profileCopy.changePasswordScreen ?? FALLBACK_CHANGE_PASSWORD_LABELS[locale];
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const textStyle = locale === "mm" ? mmTextStyle : undefined;
  const { mutate, isPending } = useChangePassword();

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = useMemo(() => buildSchema(labels), [labels]);
  const {
    control,
    handleSubmit,
    formState: { errors },
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
      { oldPassword: values.oldPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          Alert.alert(labels.successTitle, labels.successBody, [
            { text: labels.ok, onPress: () => router.back() },
          ]);
        },
        onError: (error: unknown) => {
          const data = isAxiosError(error) ? error.response?.data : undefined;
          const message =
            data &&
            typeof data === "object" &&
            "message" in data &&
            typeof (data as { message?: unknown }).message === "string"
              ? (data as { message: string }).message
              : labels.errorGeneric;

          Alert.alert(labels.errorTitle, message);
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
      <Text style={[styles.label, textStyle]}>{label}</Text>
      <View>
        <Controller
          control={control}
          name={name}
          render={({ field: { onBlur, onChange, value } }) => (
            <Input
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              secureTextEntry={!visible}
              className={`border h-11 ${getMyanmarLeadingClass(locale)}  py-0 border-slate-200 bg-white`}
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
            size={21}
            color="#64748b"
          />
        </Pressable>
      </View>
      {errors[name]?.message ? (
        <Text style={[styles.error, textStyle]}>{errors[name]?.message}</Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#475569" />
          </Pressable>
          <Text
            className={`flex-1 px-3 text-center text-lg ${getMyanmarLeadingClass(locale)}  font-bold text-slate-900  `}
          >
            {labels.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#325f99"
              />
              <View style={styles.flex}>
                <Text style={[styles.infoTitle, textStyle]}>
                  {labels.infoTitle}
                </Text>
                <Text style={[styles.infoBody, textStyle]}>
                  {labels.infoBody}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            {renderPasswordField(
              "oldPassword",
              labels.currentLabel,
              labels.currentPlaceholder,
              showOld,
              () => setShowOld((value) => !value),
            )}
            {renderPasswordField(
              "newPassword",
              labels.newLabel,
              labels.newPlaceholder,
              showNew,
              () => setShowNew((value) => !value),
            )}
            {renderPasswordField(
              "confirmPassword",
              labels.confirmLabel,
              labels.confirmPlaceholder,
              showConfirm,
              () => setShowConfirm((value) => !value),
            )}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isPending}
            onPress={handleSubmit(onSubmit)}
            style={[
              styles.submitButton,
              {
                backgroundColor: APP_COLORS.primary,
                opacity: isPending ? 0.75 : 1,
              },
            ]}
          >
            {isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.submitText, textStyle]}>
                {labels.submit}
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
    backgroundColor: "#f3f7fb",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#eef2f6",
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  title: {
    flex: 1,
    paddingHorizontal: 12,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 30,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: "#c8dbf7",
    backgroundColor: "#ecf4ff",
    borderRadius: 16,
    padding: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoTitle: {
    color: "#325f99",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  infoBody: {
    marginTop: 2,
    color: "#325f99",
    fontSize: 12,
    lineHeight: 18,
  },
  formCard: {
    marginTop: 16,
    gap: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingLeft: 12,
    paddingRight: 44,
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 20,
  },
  eyeButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    top: 0,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#ef4444",
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 20,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  submitText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
});
