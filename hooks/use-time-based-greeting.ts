import { getTimeBasedGreeting } from "@/utils/greeting";
import { useMemo } from "react";
import { useTranslation } from "./use-translation";

export function useTimeBasedGreeting() {
  const tCommon = useTranslation("common");

  return useMemo(
    () => getTimeBasedGreeting(tCommon.greetings),
    [tCommon.greetings],
  );
}
