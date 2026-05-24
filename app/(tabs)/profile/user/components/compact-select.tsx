import {
    getMyanmarLeadingClass,
    myanmarUITextStyle,
} from "@/constants/myanmar-font";
import {Select} from "heroui-native";
import React, {useMemo} from "react";
import {Text, View} from "react-native";
import {APP_COLORS} from "@/constants/colors";

type SelectOption = {
    value: string;
    label: string;
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

    const selectedOption = useMemo(() => {
        return options.find((opt) => opt.value === value);
    }, [options, value]);

    const selectedLabel = useMemo(() => {
        if (!selectedOption) return "";
        return  selectedOption.label
    }, [selectedOption]);

    return (
        <View className="flex-1 gap-1">
            <Text
                    className={`text-xs font-semibold ${getMyanmarLeadingClass(locale)}`}
                    style={[style, {color: APP_COLORS.textMuted}]}>
                {label}
            </Text>

            <Select
                value={
                    selectedOption
                        ? { value: selectedOption.value, label: selectedLabel }
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
                    className="rounded-xl border h-11  py-0  px-2.5"
                    style={{
                        backgroundColor: APP_COLORS.inputBackground,
                        borderColor:APP_COLORS.border,
                        borderWidth:1
                    }}
                >
                    <Select.Value
                        className={`text-[10px] font-normal py-0  ${getMyanmarLeadingClass(locale)} `}
                        placeholder={placeholder}
                        style={[{ color: APP_COLORS.textPrimary }, style]}
                    />
                    <Select.TriggerIndicator/>
                </Select.Trigger>

                <Select.Portal>
                    <Select.Overlay/>
                    <Select.Content
                        className="rounded-2xl border"
                        style={{
                            backgroundColor:APP_COLORS.card,
                            borderColor:APP_COLORS.border,
                            borderWidth:1
                        }}
                        presentation="popover"
                        width="trigger"
                    >
                        {options.map((option) => {
                            const itemLabel = option.label;
                            const isSelected = option.value === value;
                            return (
                                <Select.Item
                                    key={option.value}
                                    value={option.value}
                                    label={itemLabel}
                                    style={{
                                        backgroundColor: isSelected ? APP_COLORS.primarySoft : 'transparent',
                                        paddingVertical:12,
                                        paddingHorizontal:16,
                                    }}
                                >
                                    <Select.ItemLabel
                                        className={`text-xs ${getMyanmarLeadingClass(locale)}`}
                                        style={[style,{
                                            color: isSelected ? APP_COLORS.primary : APP_COLORS.textPrimary,
                                            fontWeight: isSelected ? "600" : "400"
                                        }]}
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
