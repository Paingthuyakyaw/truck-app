export type GreetingPeriod = "morning" | "afternoon" | "evening" | "night";

export type GreetingLabels = Record<GreetingPeriod, string>;

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getTimeBasedGreeting(
  labels: GreetingLabels,
  date = new Date(),
): string {
  return labels[getGreetingPeriod(date)];
}
