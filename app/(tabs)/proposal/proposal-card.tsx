import { APP_COLORS } from "@/constants/colors";
import { getMyanmarLeadingClass } from "@/constants/myanmar-font";
import type { AppLocale } from "@/stores/client/locale-store";
import type { ProposalItem } from "@/stores/server/proposal/typed";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Card } from "heroui-native";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

type ProposalCardProps = {
  item: ProposalItem;
  locale: AppLocale;
  onPressDetail: (item: ProposalItem) => void;
  onPressEdit: (item: ProposalItem) => void;
};

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

export function ProposalCard({
  item,
  locale,
  onPressDetail,
  onPressEdit,
}: ProposalCardProps) {
  const mmLeading = getMyanmarLeadingClass(locale);
  const [expanded, setExpanded] = useState(false);
  const labels =
    locale === "mm"
      ? {
          amount: "အဆိုပြုငွေ",
          plateNo: "ယာဉ်နံပါတ်",
          serviceShop: "ဆိုင်",
          proposalDate: "အဆိုပြုရက်",
          serviceDate: "ဝန်ဆောင်မှုရက်",
          createdBy: "အဆိုပြုသူ",
          viewDetail: "Detail ကြည့်ရန်",
        }
      : {
          amount: "Amount",
          plateNo: "Plate No",
          serviceShop: "Service Shop",
          proposalDate: "Proposal Date",
          serviceDate: "Service Date",
          createdBy: "Created By",
          viewDetail: "View Detail",
        };

  const canEdit = (item.status || "").toUpperCase() === "INFORM";

  return (
    <Pressable onPress={() => setExpanded((prev) => !prev)}>
      <Card className="mb-3">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={14}
                color="#64748b"
              />
            </View>

            <View className="flex-1">
              <Text className={`text-sm font-bold text-primary ${mmLeading}`}>
                {item.proposalNo}
              </Text>
              <Text className={`mt-0.5 text-xs text-slate-500 ${mmLeading}`}>
                {formatDateTime(item.proposalDate)}
              </Text>
            </View>

            <View className="rounded-xl bg-[#edf2f7] px-2 py-1 ">
              <Text
                className={`text-xs font-semibold uppercase tracking-[0.4px] text-slate-600 ${mmLeading}`}
              >
                {item.serviceType || "SERVICE"}
              </Text>
            </View>
          </View>

          {expanded ? (
            <View className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                    {labels.amount}
                  </Text>
                  <Text
                    className={`text-xl font-semibold text-primary ${mmLeading}`}
                  >
                    {formatAmount(item.proposalAmount)}
                  </Text>
                </View>
                <View className="rounded-xl bg-[#edf2f7] px-3 py-1.5">
                  <Text
                    className={`text-[10px] font-semibold text-slate-600 ${mmLeading}`}
                  >
                    {labels.createdBy}: {item.createdBy || "-"}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                    {labels.plateNo}
                  </Text>
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {item.plateNo || "-"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                    {labels.serviceShop}
                  </Text>
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {item.serviceShop || "-"}
                  </Text>
                </View>
              </View>

              <View className="mt-2 flex-row gap-4">
                <View className="flex-1">
                  <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                    {labels.proposalDate}
                  </Text>
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {formatDateTime(item.proposalDate)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className={`text-xs text-slate-500 ${mmLeading}`}>
                    {labels.serviceDate}
                  </Text>
                  <Text
                    className={`text-sm font-semibold text-slate-700 ${mmLeading}`}
                  >
                    {formatDateTime(item.serviceDate)}
                  </Text>
                </View>
              </View>
              <View className="mt-3 flex-row items-center gap-2">
                <Button
                  onPress={() => onPressDetail(item)}
                  className=" flex-1 bg-primary rounded-md "
                  size="sm"
                  variant="outline"
                >
                  <Text
                    className={`text-xs font-semibold text-white ${mmLeading}`}
                  >
                    {labels.viewDetail}
                  </Text>
                </Button>

                {canEdit ? (
                  <Button
                    onPress={() => onPressEdit(item)}
                    size="sm"
                    variant="outline"
                    className=" w-10 p-0 items-center justify-center rounded-xl border border-slate-200 bg-white"
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={APP_COLORS.primary}
                    />
                  </Button>
                ) : null}
              </View>
            </View>
          ) : null}
        </Card.Body>
      </Card>
    </Pressable>
  );
}
