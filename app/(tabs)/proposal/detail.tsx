import { CompactTextInput } from "@/components/compact-text-input";
import { APP_COLORS } from "@/constants/colors";
import { getMyanmarLeadingClass } from "@/constants/myanmar-font";
import { useTranslation } from "@/hooks/use-translation";
import { getApiErrorAlertCopy } from "@/lib/api-error-alert";
import proposalLocale from "@/locale/proposal/proposal.json";
import { useLocaleStore } from "@/stores/client/locale-store";
import { useApproveProposal } from "@/stores/server/proposal/approve-mutation";
import { useProposalDetail } from "@/stores/server/proposal/query";
import { useTerminateProposal } from "@/stores/server/proposal/terminate-mutation";
import type { ProposalDetail } from "@/stores/server/proposal/typed";
import { normalizeServiceDateForApi } from "@/utils/service-date";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "heroui-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function formatDateTime(value: string): string {
  if (!value) return "-";
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return value;
  const dd = String(parsed.getDate()).padStart(2, "0");
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const yyyy = String(parsed.getFullYear());
  const hh = String(parsed.getHours()).padStart(2, "0");
  const min = String(parsed.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatAmount(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toLocaleString()} Ks`;
}

function getOwnershipId(
  detail: ProposalDetail | undefined,
  fallback: string,
): string {
  return String(detail?.ownershipRefId ?? fallback).trim();
}

export default function ProposalDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((state) => state.locale);
  const mmLeading = getMyanmarLeadingClass(locale);
  const errorCatalog = useTranslation("error");
  const t = proposalLocale[locale].detail;
  const createLabels = proposalLocale[locale].create;
  const params = useLocalSearchParams<{
    proposalNo?: string;
    ownershipId?: string;
  }>();
  const proposalNo = String(params.proposalNo ?? "").trim();
  const ownershipId = String(params.ownershipId ?? "").trim();
  const { data, isPending } = useProposalDetail(proposalNo, ownershipId);
  const detail = data?.data;
  const { mutate: approveProposal, isPending: isApproving } =
    useApproveProposal();
  const { mutate: terminateProposal, isPending: isTerminating } =
    useTerminateProposal();
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [approveRemark, setApproveRemark] = useState("");
  const [terminateRemark, setTerminateRemark] = useState("");

  const labels =
    locale === "mm"
      ? {
          title: "အဆိုပြုချက်အသေးစိတ်",
          serviceType: "ဝန်ဆောင်မှုအမျိုးအစား",
          amount: "အဆိုပြုငွေ",
          serviceShop: "ဝန်ဆောင်မှုဆိုင်",
          proposalDate: "အဆိုပြုရက်",
          serviceDate: "ဝန်ဆောင်မှုရက်",
          createdBy: "အဆိုပြုသူ",
          owner: "ပိုင်ရှင်",
          description: "ဖော်ပြချက်",
          status: "အခြေအနေ",
        }
      : {
          title: "Proposal Detail",
          serviceType: "Service Type",
          amount: "Amount",
          serviceShop: "Service Shop",
          proposalDate: "Proposal Date",
          serviceDate: "Service Date",
          createdBy: "Created By",
          owner: "Owner",
          description: "Description",
          status: "Status",
        };

  const showActions = (detail?.status || "").toUpperCase() === "INFORM";
  const isSubmitting = isApproving || isTerminating;

  const closeApproveModal = useCallback(() => {
    setApproveModalOpen(false);
    setApproveRemark("");
  }, []);

  const closeTerminateModal = useCallback(() => {
    setTerminateModalOpen(false);
    setTerminateRemark("");
  }, []);

  const handleApprove = useCallback(() => {
    if (!detail?.id) return;

    approveProposal(
      {
        id: detail.id,
        version: detail.version,
        ownershipId: getOwnershipId(detail, ownershipId),
        proposalAmount: detail.proposalAmount,
        serviceType: detail.serviceType,
        serviceDate: normalizeServiceDateForApi(detail.serviceDate),
        remark: approveRemark.trim() || undefined,
      },
      {
        onSuccess: () => {
          closeApproveModal();
          Alert.alert(t.approveSuccessTitle, t.approveSuccessBody, [
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
  }, [
    approveProposal,
    closeApproveModal,
    createLabels.done,
    detail,
    errorCatalog,
    ownershipId,
    approveRemark,
    router,
    t.approveSuccessBody,
    t.approveSuccessTitle,
    t.errorBody,
    t.errorTitle,
  ]);

  const handleTerminate = useCallback(() => {
    if (!detail?.id) return;

    const trimmedRemark = terminateRemark.trim();
    if (!trimmedRemark) {
      Alert.alert(t.errorTitle, createLabels.required);
      return;
    }

    terminateProposal(
      {
        id: detail.id,
        ownershipId: getOwnershipId(detail, ownershipId),
        remark: trimmedRemark,
      },
      {
        onSuccess: () => {
          closeTerminateModal();
          Alert.alert(t.terminateSuccessTitle, t.terminateSuccessBody, [
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
  }, [
    closeTerminateModal,
    createLabels.done,
    createLabels.required,
    detail,
    errorCatalog,
    ownershipId,
    router,
    t.errorBody,
    t.errorTitle,
    t.terminateSuccessBody,
    t.terminateSuccessTitle,
    terminateProposal,
    terminateRemark,
  ]);

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
          className={`flex-1 px-3 text-center text-lg font-bold text-slate-900 ${mmLeading}`}
        >
          {labels.title}
        </Text>
        <View className="h-11 w-11" />
      </View>

      {isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={APP_COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          className="px-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 24,
            flexGrow: 1,
          }}
        >
          <View className="mt-1 rounded-2xl bg-white p-4">
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className={`text-xl font-bold text-primary ${mmLeading}`}>
                  {detail?.proposalNo || "-"}
                </Text>
                <Text className={`mt-1 text-sm text-slate-500 ${mmLeading}`}>
                  {detail?.plateNo || "-"}
                </Text>
              </View>
              <View className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5">
                <Text
                  className={`text-xs font-semibold uppercase text-rose-700 ${mmLeading}`}
                >
                  {detail?.status || "-"}
                </Text>
              </View>
            </View>

            <View className="mt-4 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.serviceType}
                </Text>
                <Text
                  className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                >
                  {detail?.serviceType || "-"}
                </Text>
              </View>
              <View className="h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.amount}
                </Text>
                <Text
                  className={`text-2xl font-bold text-primary ${mmLeading}`}
                >
                  {formatAmount(Number(detail?.proposalAmount ?? 0))}
                </Text>
              </View>
              <View className="h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.serviceShop}
                </Text>
                <Text
                  className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                >
                  {detail?.serviceShop || "-"}
                </Text>
              </View>
              <View className="h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.proposalDate}
                </Text>
                <Text
                  className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                >
                  {formatDateTime(detail?.proposalDate || "")}
                </Text>
              </View>
              <View className="h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.serviceDate}
                </Text>
                <Text
                  className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                >
                  {formatDateTime(detail?.serviceDate || "")}
                </Text>
              </View>
              <View className="h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.createdBy}
                </Text>
                <View className="items-end">
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {detail?.createdUserFullName || detail?.createdBy || "-"}
                  </Text>
                  {detail?.createdUserPhone ? (
                    <Text
                      className={`mt-0.5 text-xs text-slate-400 ${mmLeading}`}
                    >
                      {detail.createdUserPhone}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="h-px bg-slate-200" />
              <View className="flex-row items-center justify-between">
                <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                  {labels.owner}
                </Text>
                <View className="items-end">
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {detail?.ownerFullName || "-"}
                  </Text>
                  {detail?.ownerPhone ? (
                    <Text
                      className={`mt-0.5 text-xs text-slate-400 ${mmLeading}`}
                    >
                      {detail.ownerPhone}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="h-px bg-slate-200" />
              <View>
                <Text className={`mb-1 text-xs text-slate-500 ${mmLeading}`}>
                  {labels.description}
                </Text>
                <Text
                  className={`rounded-xl border border-slate-200 bg-[#f8fafc] p-3 text-sm text-slate-700 ${mmLeading}`}
                >
                  {detail?.description || "-"}
                </Text>
              </View>
            </View>
          </View>

          {showActions ? (
            <View className="mb-2 mt-5 flex-row items-center w-full gap-3">
              <Button
                isDisabled={isSubmitting}
                onPress={() => setTerminateModalOpen(true)}
                variant="outline"
                className=" w-1/2 rounded-md "
              >
                <Text
                  className={`text-sm font-semibold text-red-600 ${mmLeading}`}
                >
                  {t.terminate}
                </Text>
              </Button>

              <Button
                isDisabled={isSubmitting}
                onPress={() => setApproveModalOpen(true)}
                className="  w-1/2 rounded-md bg-primary"
              >
                <Text
                  className={`text-sm font-semibold  text-white ${mmLeading}`}
                >
                  {t.accept}
                </Text>
              </Button>
            </View>
          ) : null}
        </ScrollView>
      )}

      <Modal
        visible={approveModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeApproveModal}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={closeApproveModal}
        >
          <Pressable
            className="w-full rounded-2xl bg-white p-5"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className={`text-lg font-bold text-slate-900 ${mmLeading}`}>
              {detail?.proposalNo || "-"}
            </Text>

            <Text className={`mb-2 mt-4 text-xs text-slate-500 ${mmLeading}`}>
              {t.remark}
            </Text>
            <CompactTextInput
              locale={locale}
              compactVariant="advanced"
              value={approveRemark}
              onChangeText={setApproveRemark}
              placeholder={t.remarkPlaceholder}
              multiline
              numberOfLines={4}
              className="min-h-[96px] border border-slate-200 bg-white px-3 py-2 text-sm"
            />

            <View className="mt-4 flex-row gap-2">
              <Button
                isDisabled={isSubmitting}
                onPress={closeApproveModal}
                className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-3"
              >
                <Text
                  className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                >
                  {createLabels.cancel}
                </Text>
              </Button>

              <Pressable
                disabled={isSubmitting}
                onPress={handleApprove}
                className="flex-1 items-center justify-center rounded-xl py-3"
                style={{ backgroundColor: APP_COLORS.primary }}
              >
                {isApproving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    className={`text-sm font-semibold text-white ${mmLeading}`}
                  >
                    {t.accept}
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={terminateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeTerminateModal}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40 px-6"
          onPress={closeTerminateModal}
        >
          <Pressable
            className="w-full overflow-hidden rounded-2xl bg-white"
            onPress={(event) => event.stopPropagation()}
          >
            <View
              className="border-b px-5 py-4"
              style={{
                borderColor: APP_COLORS.errorSoft,
                backgroundColor: APP_COLORS.errorSoft,
              }}
            >
              <Text className={`text-lg font-bold text-[#dc4c4c] ${mmLeading}`}>
                {detail?.proposalNo || "-"}
              </Text>
            </View>

            <View className="p-5">
              <Text className={`mb-2 text-xs text-slate-500 ${mmLeading}`}>
                {t.remark}
              </Text>
              <CompactTextInput
                locale={locale}
                compactVariant="advanced"
                value={terminateRemark}
                onChangeText={setTerminateRemark}
                placeholder={t.remarkPlaceholder}
                multiline
                numberOfLines={4}
                className="min-h-[96px] border bg-white px-3 py-2 text-sm"
                style={{ borderColor: APP_COLORS.errorSoft }}
              />

              <View className="mt-4 flex-row gap-2">
                <Pressable
                  disabled={isSubmitting}
                  onPress={closeTerminateModal}
                  className="flex-1 items-center justify-center rounded-xl bg-slate-100 py-3"
                >
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {createLabels.cancel}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={isSubmitting}
                  onPress={handleTerminate}
                  className="flex-1 items-center justify-center rounded-xl py-3"
                  style={{ backgroundColor: APP_COLORS.error }}
                >
                  {isTerminating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      className={`text-sm font-semibold text-white ${mmLeading}`}
                    >
                      {t.terminate}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
