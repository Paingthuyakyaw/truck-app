import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import type { AppLocale } from "@/stores/client/locale-store";
import type { OwnershipItem } from "@/stores/server/ownership/typed";
import { Card } from "heroui-native";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

type OwnershipCardLabels = {
  ownership: string;
  buyDate: string;
  licenseEndDate: string;
  totalLicenseValidityDays: string;
  licenseCity: string;
  estimatedSellAmt: string;
  daySuffix: string;
};

type OwnershipCardProps = {
  item: OwnershipItem;
  locale: AppLocale;
  labels: OwnershipCardLabels;
};

function valueText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const raw = value.includes("T") ? value.split("T")[0] : value.split(" ")[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!match) return value;
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
}

function formatDays(value: number | undefined, daySuffix: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value} ${daySuffix}`;
}

export function OwnershipCard({ item, locale, labels }: OwnershipCardProps) {
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const title = valueText(item.equipmentName);
  const plateNo = valueText(item.truckPlateNo);
  const ownershipDays = formatDays(item.totalOwnershipDays, labels.daySuffix);
  const estimatedSellAmt = valueText(item.estimatedSellAmt);

  return (
    <Card className="mb-3">
      <Card.Body className="px-4 py-4">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text
              className={`text-sm font-bold text-slate-900 ${getMyanmarLeadingClass(locale)}`}
            >
              {title}
            </Text>
            <Text className="mt-1 text-xs font-semibold text-blue-500">
              {plateNo}
            </Text>
          </View>

          <View className="items-end">
            <Text
              className={`text-xs!  text-slate-500 ${getMyanmarLeadingClass(locale)}`}
            >
              {labels.ownership}
            </Text>
            <Text
              className="mt-0.5 text-sm font-bold text-slate-900"
              style={style}
            >
              {ownershipDays}
            </Text>
          </View>
        </View>

        <View className="mt-4 border-t border-slate-100 pt-3">
          <View className="flex-row">
            <InfoCell
              label={labels.buyDate}
              value={formatDate(item.buyDate)}
              style={style}
            />
            <InfoCell
              label={labels.licenseEndDate}
              value={formatDate(item.licenseEndDate)}
              style={style}
            />
            <InfoCell
              label={labels.totalLicenseValidityDays}
              value={formatDays(
                item.totalLicenseValidityDays,
                labels.daySuffix,
              )}
              locale={locale}
              valueClassName="text-emerald-500"
              style={style}
            />
          </View>
        </View>

        <View className="mt-3 border-t border-slate-100 pt-3">
          <View className="flex-row">
            <InfoCell
              label={labels.licenseCity}
              value={valueText(item.licenseCity)}
              style={style}
            />
            <InfoCell
              label={labels.estimatedSellAmt}
              value={estimatedSellAmt}
              className="flex-[2]"
              style={style}
              locale={locale}
            />
          </View>
        </View>
      </Card.Body>
    </Card>
  );
}

type InfoCellProps = {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  style?: ReturnType<typeof myanmarUITextStyle>;
  locale?: AppLocale;
};

function InfoCell({
  label,
  value,
  locale,
  className = "flex-1",
  valueClassName = "text-slate-900",
  style,
}: InfoCellProps) {
  return (
    <View className={className}>
      <Text className="text-[10px] text-slate-500" style={style}>
        {label}
      </Text>
      <Text
        className={`mt-0.5 text-xs font-semibold ${locale && getMyanmarLeadingClass(locale)} ${valueClassName}`}
        style={style}
      >
        {value}
      </Text>
    </View>
  );
}
