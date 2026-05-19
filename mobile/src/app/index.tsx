import { useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type InputState = {
  email: string;
  password: string;
};

const INITIAL_STATE: InputState = {
  email: "",
  password: "",
};

const ADMIN_EMAIL = "admin@email.com";
const ADMIN_PASSWORD = "admin123";

export default function Index() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [form, setForm] = useState<InputState>(INITIAL_STATE);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [errorMessage, setErrorMessage] = useState("");
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar style="dark" />
        <ActivityIndicator color="#8b2cba" />
      </SafeAreaView>
    );
  }

  const updateField = (key: keyof InputState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = () => {
    const email = form.email.trim();
    if (!email || !form.password) {
      setErrorMessage("Enter your email and password.");
      return;
    }

    if (email !== ADMIN_EMAIL || form.password !== ADMIN_PASSWORD) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    setErrorMessage("");
    router.replace("/events");
  };

  const emailBorderColor = isFocused.email ? "#8b2cba" : "#e5e7eb";
  const passwordBorderColor = isFocused.password ? "#8b2cba" : "#e5e7eb";

  return (
    <LinearGradient colors={["#f8edff", "#fdfdff", "#ffffff"]} style={styles.screen}>
      <StatusBar style="dark" />
      <View pointerEvents="none" style={styles.glowOne} />
      <View pointerEvents="none" style={styles.glowTwo} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="qrcode-scan" size={46} color="#ffffff" />
              </View>
              <Text style={styles.title}>Track Attendance</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Powered by NIHUB</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.welcomeBlock}>
                <Text style={styles.welcomeTitle}>Welcome back</Text>
                <Text style={styles.welcomeSubtitle}>Please sign in to your account</Text>
              </View>

              <View style={styles.form}>
                <View>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputShell, { borderColor: emailBorderColor }]}>
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={20}
                      color="#9ca3af"
                      style={styles.leadingIcon}
                    />
                    <TextInput
                      ref={emailInputRef}
                      value={form.email}
                      onChangeText={(value) => updateField("email", value)}
                      placeholder="Email Address"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      onFocus={() => setIsFocused((current) => ({ ...current, email: true }))}
                      onBlur={() => setIsFocused((current) => ({ ...current, email: false }))}
                      onSubmitEditing={() => passwordInputRef.current?.focus()}
                      blurOnSubmit={false}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputShell, { borderColor: passwordBorderColor }]}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color="#9ca3af"
                      style={styles.leadingIcon}
                    />
                    <TextInput
                      ref={passwordInputRef}
                      value={form.password}
                      onChangeText={(value) => updateField("password", value)}
                      placeholder="Password"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      autoComplete="current-password"
                      textContentType="password"
                      secureTextEntry={!showPassword}
                      returnKeyType="done"
                      onFocus={() => setIsFocused((current) => ({ ...current, password: true }))}
                      onBlur={() => setIsFocused((current) => ({ ...current, password: false }))}
                      onSubmitEditing={handleSubmit}
                      style={[styles.input, styles.passwordInput]}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      hitSlop={10}
                      onPress={() => setShowPassword((current) => !current)}
                      style={styles.trailingButton}
                    >
                      <MaterialCommunityIcons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#9ca3af"
                      />
                    </Pressable>
                  </View>
                </View>

                {errorMessage ? <Text style={styles.message}>{errorMessage}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={handleSubmit}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
                >
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                </Pressable>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                <Pressable accessibilityRole="link" onPress={() => setErrorMessage("Registration flow comes next.")}>
                  <Text style={styles.footerLink}>Register</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fdfdff",
  },
  glowOne: {
    position: "absolute",
    top: -40,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 180,
    backgroundColor: "rgba(139, 44, 186, 0.12)",
  },
  glowTwo: {
    position: "absolute",
    right: -70,
    top: 90,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: "rgba(163, 67, 210, 0.1)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    paddingTop: 26,
    paddingBottom: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    backgroundColor: "#8b2cba",
    shadowColor: "#8b2cba",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.2,
    color: "#111827",
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#8b2cba",
    opacity: 0.92,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  card: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 30,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    shadowColor: "#111827",
    shadowOpacity: 0.08,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  welcomeBlock: {
    marginBottom: 22,
  },
  welcomeTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    color: "#111827",
    marginBottom: 3,
  },
  welcomeSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 21,
    color: "#737373",
  },
  form: {
    gap: 14,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginBottom: 8,
    color: "#374151",
  },
  inputShell: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 8,
  },
  trailingButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 18,
    color: "#7c3aed",
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 4,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#8b2cba",
    shadowColor: "#8b2cba",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: "#6a1992",
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#ffffff",
  },
  footer: {
    marginTop: 22,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#737373",
  },
  footerLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#007aff",
  },
});