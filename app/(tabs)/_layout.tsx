import { APP_COLORS } from "@/constants/colors";
import { useAuthStore } from "@/stores/auth-store";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs, usePathname } from "expo-router";
import React from "react";

export default function TabLayout() {
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const hideTabBar = pathname === "/proposal/create";

  if (!token) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: APP_COLORS.primary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: hideTabBar ? { display: "none" } : undefined,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="records/index"
        options={{
          title: "Record",
          tabBarLabel: "Record",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="proposal"
        options={{
          title: "Proposal",
          tabBarLabel: "Proposal",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
