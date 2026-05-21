import {useTranslation} from "@/hooks/use-translation";
import {useLogin} from "@/stores/server/login/mutation";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button, Card, Input, Spinner} from "heroui-native";
import React, {useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {KeyboardAvoidingView, Platform, Pressable, Text, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {z} from "zod";
import {getMyanmarLeadingClass, myanmarUITextStyle} from "@/constants/myanmar-font";
import {useLocaleStore} from "@/stores/client/locale-store";
import {APP_COLORS} from "@/constants/colors";
import {Feather} from "@expo/vector-icons";

const formSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginScreen() {
    const t = useTranslation("login");
    const {mutate, isPending} = useLogin();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const {
        control,
        handleSubmit,
        formState: {errors},
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "HHA09455733730",
            password: "Ashwetaw@ger123",
        },
    });

    const onSubmit = (values: FormValues) => {
        mutate(values, {
            onSuccess: ({body, token}) => {
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

    const locale = useLocaleStore((state) => state.locale);
    const mmTextStyle = useMemo(() => myanmarUITextStyle(), []);
    const textStyle = locale === "mm" ? mmTextStyle : undefined;
    const [showPassword, setShowPassword] = useState(false);

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: APP_COLORS.background}}>
            <KeyboardAvoidingView
                style={{flex: 1, justifyContent: "center", paddingHorizontal: 20}}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <Card className="gap-4"
                      style={{
                          backgroundColor: APP_COLORS.card,
                          borderColor: APP_COLORS.border,
                          borderWidth: 1,
                          borderRadius: 12
                      }}
                >
                    <Card.Header className="pb-0">
                        <Card.Title
                            className={`${getMyanmarLeadingClass(locale)} `}
                            style={[{color: APP_COLORS.textPrimary}, textStyle]}>
                            {t.title}
                        </Card.Title>
                        <Card.Description
                            className={`text-sm ${getMyanmarLeadingClass(locale)}`}
                            style={[{color: APP_COLORS.textSecondary}, textStyle]}>
                            {t.description}
                        </Card.Description>
                    </Card.Header>

                    <Card.Body className="gap-3">
                        <View className="gap-2">
                            <Text className={`text-sm ${getMyanmarLeadingClass(locale)}`}
                                  style={[{color: APP_COLORS.textSecondary}, textStyle]}>
                                {t.username}
                            </Text>
                            <Controller
                                control={control}
                                name="username"
                                render={({field: {onChange, value}}) => (
                                    <Input
                                        value={value}
                                        onChangeText={onChange}
                                        className={`${getMyanmarLeadingClass(locale)}`}
                                        placeholder="Enter username"
                                        placeholderTextColor={APP_COLORS.textMuted}
                                        autoCapitalize="none"
                                        style={{
                                            backgroundColor: APP_COLORS.inputBackground,
                                            borderColor: errors.username ? APP_COLORS.error : APP_COLORS.border,
                                            borderWidth: 1,
                                            color: APP_COLORS.textPrimary
                                        }}
                                    />
                                )}
                            />
                            {!!errors.username?.message ? (
                                <Text
                                    className={`text-xs ${getMyanmarLeadingClass(locale)} `}
                                    style={[{color: APP_COLORS.error}, textStyle]}
                                >
                                    {errors.username.message}
                                </Text>
                            ) : null}
                        </View>

                        <View className="gap-2">

                            <Text className={`text-sm ${getMyanmarLeadingClass(locale)}`}
                                  style={[{color: APP_COLORS.textSecondary}, textStyle]}>
                                {t.password}
                            </Text>

                            <Controller
                                control={control}
                                name="password"
                                render={({field: {onChange, value}}) => (
                                    <View style={{position: "relative", justifyContent: "center"}}>

                                        <Input
                                            value={value}
                                            className={`${getMyanmarLeadingClass(locale)}`}
                                            onChangeText={onChange}
                                            placeholder="Enter password"
                                            placeholderTextColor={APP_COLORS.textMuted}
                                            secureTextEntry={!showPassword}
                                            style={{
                                                backgroundColor: APP_COLORS.inputBackground,
                                                borderColor: errors.password ? APP_COLORS.error : APP_COLORS.border,
                                                borderWidth: 1,
                                                color: APP_COLORS.textPrimary,
                                                paddingRight: 45
                                            }}

                                        />
                                        <Pressable
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={({pressed}) => ({
                                                position: 'absolute',
                                                right: 12,
                                                width: 32,
                                                padding: 4,
                                                opacity: pressed ? 0.75 : 1
                                            })}
                                        >
                                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18}
                                                     color={APP_COLORS.textMuted}/>
                                        </Pressable>


                                    </View>

                                )}
                            />
                            {!!errors.password?.message ? (
                                <Text className={`text-xs ${getMyanmarLeadingClass(locale)}`}
                                      style={[{color: APP_COLORS.error}, textStyle]}>
                                    {errors.password.message}
                                </Text>
                            ) : null}
                        </View>

                        {errorMessage ? (
                            <Text className={`text-xs ${getMyanmarLeadingClass(locale)}`}
                                  style={[{color: APP_COLORS.error}, textStyle]}>
                                {errorMessage}
                            </Text>
                        ) : null}
                    </Card.Body>

                    <Card.Footer className="pt-0">
                        <Button
                            onPress={handleSubmit(onSubmit)}
                            isDisabled={isPending}
                            className={`w-full ${getMyanmarLeadingClass(locale)}`}
                            style={{
                                backgroundColor: APP_COLORS.primary,
                                opacity: isPending ? 0.7 : 1
                            }}
                        >
                            {isPending ? (
                                <Spinner size="sm" color="white"/>
                            ) : (
                                <Text className={`text-sm ${getMyanmarLeadingClass(locale)} font-bold`}
                                      style={[{color: "#FFFFFF"}]}>{t.login}</Text>
                            )}
                        </Button>
                    </Card.Footer>
                </Card>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
