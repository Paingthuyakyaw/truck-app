import {
  getMyanmarLeadingClass,
  myanmarUITextStyle,
} from "@/constants/myanmar-font";
import { Select } from "heroui-native";
import React, { useMemo } from "react";
import { Text, View } from "react-native";

type SelectOption = {
  value: string;
  labelEn: string;
  labelMm: string;
};

type CompactSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  locale: "en" | "mm";
  placeholder: string;
  options: readonly SelectOption[];
};

export function CompactSelect({
  label,
  value,
  onChange,
  locale,
  placeholder,
  options,
}: CompactSelectProps) {
  const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
  const style = locale === "mm" ? mmTextStyle : undefined;

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption
    ? locale === "mm"
      ? selectedOption.labelMm
      : selectedOption.labelEn
    : "";

  return (
    <View className="flex-1 gap-1">
      <Text className="text-[10px] text-slate-500" style={style}>
        {label}
      </Text>

      <Select
        value={
          selectedOption
            ? {
                value: selectedOption.value,
                label: selectedLabel,
              }
            : undefined
        }
        onValueChange={(next) => {
          if (next && !Array.isArray(next)) {
            onChange(next.value);
          }
        }}
        presentation="popover"
      >
        <Select.Trigger
          className="
         rounded-xl border h-11  py-0 border-slate-200 bg-white px-2.5"
        >
          <Select.Value
            className={`text-sm py-0  text-slate-900 ${getMyanmarLeadingClass(locale)} `}
            placeholder={placeholder}
            // style={style}
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
            {options.map((option) => {
              const itemLabel =
                locale === "mm" ? option.labelMm : option.labelEn;
              return (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={itemLabel}
                >
                  <Select.ItemLabel
                    className={`text-sm text-slate-900 ${getMyanmarLeadingClass(locale)}`}
                    style={style}
                  />
                  <Select.ItemIndicator />
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
