import { Stack } from "expo-router";
import React from "react";

export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="truck/index" />
      <Stack.Screen name="service/index" />
      <Stack.Screen name="service/create" />
      <Stack.Screen name="service/edit/[id]" />
      <Stack.Screen name="truck/create" />
      <Stack.Screen name="truck/edit/[id]" />
      <Stack.Screen name="user/index" />
      <Stack.Screen name="user/create" />
      <Stack.Screen name="security" />
      <Stack.Screen name="language" />
    </Stack>
  );
}
