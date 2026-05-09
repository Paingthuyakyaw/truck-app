import { myanmarUITextStyle } from "@/constants/myanmar-font";
import type { AppLocale } from "@/stores/client/locale-store";
import type { ProposalItem } from "@/stores/server/proposal/typed";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Card } from "heroui-native";
import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

type ProposalCardProps = {
  item: ProposalItem;
  locale: AppLocale;
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

export function ProposalCard({ item, locale }: ProposalCardProps) {
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  return (
    <Pressable>
      <Card className="mb-3">
        <Card.Body className="flex-row items-center gap-3 px-4 py-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Ionicons name="chevron-down" size={18} color="#64748b" />
          </View>

          <View className="flex-1">
            <Text className="text-[18px] font-bold text-[#32435d]">
              {item.proposalNo}
            </Text>
            <Text className="mt-0.5 text-sm text-slate-500" style={style}>
              {formatDateTime(item.proposalDate)}
            </Text>
          </View>

          <View className="rounded-xl bg-[#edf2f7] px-3 py-2">
            <Text className="text-xs font-semibold uppercase tracking-[0.4px] text-slate-600">
              {item.serviceType || "SERVICE"}
            </Text>
          </View>
        </Card.Body>
      </Card>
    </Pressable>
  );
}
