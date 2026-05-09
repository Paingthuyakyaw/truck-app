import { useLogin } from "@/stores/server/login/mutation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, Input, Spinner } from "heroui-native";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import {useTranslation} from '@/hooks/use-translation';

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginScreen() {
  const t  = useTranslation('login');
  const { mutate, isPending } = useLogin();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "HHA09455733730",
      password: "Ashwetaw@ger123",
    },
  });

  const onSubmit = (values: FormValues) => {
    mutate(values, {
      onSuccess: ({ body, token }) => {
        if (
          body?.code === "MSG6001" &&
          token &&
          typeof body?.data?.fullName === "string" &&
          typeof body?.data?.role === "string"
        ) {
          return;
        }
      },
      onError: () => {
        setErrorMessage(
          "Login failed. Please check your network or credentials.",
        );
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Card className="gap-4">
          <Card.Header className="pb-0">
            <Card.Title>{t.title}</Card.Title>
            <Card.Description>
              {t.description}
            </Card.Description>
          </Card.Header>

          <Card.Body className="gap-3">
            <View className="gap-2">
              <Text className="text-sm text-slate-600">{t.username}</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter username"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.username?.message ? (
                <Text className="text-sm text-red-600">
                  {errors.username.message}
                </Text>
              ) : null}
            </View>

            <View className="gap-2">
              <Text className="text-sm text-slate-600">{t.password}</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    value={value}
                    onChangeText={onChange}
                    placeholder="Enter password"
                    secureTextEntry
                  />
                )}
              />
              {errors.password?.message ? (
                <Text className="text-sm text-red-600">
                  {errors.password.message}
                </Text>
              ) : null}
            </View>

            {errorMessage ? (
              <Text className="text-sm text-red-600">{errorMessage}</Text>
            ) : null}
          </Card.Body>

          <Card.Footer className="pt-0">
            <Button
              onPress={handleSubmit(onSubmit)}
              isDisabled={isPending}
              className="w-full"
            >
              {isPending ? <Spinner size="sm" color="default" /> : t.login}
            </Button>
          </Card.Footer>
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
