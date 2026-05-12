import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // data ကိုချက်ချင်း stale ဖြစ်စေ
      gcTime: 0, // v5 (cacheTime in v4)
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <HeroUINativeProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="dark" />
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
