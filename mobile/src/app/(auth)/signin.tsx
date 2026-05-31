import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOverrideUrl,
  setOverrideUrl,
  resolveBaseUrl,
} from "@/config/api";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");

  // Triple-tap URL override state
  const [showUrlPanel, setShowUrlPanel] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasOverride = getOverrideUrl() !== null;

  const { signIn, isLoading } = useAuth();

  const handleSignIn = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    try {
      setError("");
      await signIn(username, password);
      router.replace("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  };

  // --- Triple-tap logic ---
  const handleBadgeTap = () => {
    tapCountRef.current += 1;

    // Reset debounce timer on every tap
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setUrlInput(resolveBaseUrl());
      setShowUrlPanel(true);
    }
  };

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    await setOverrideUrl(trimmed);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowUrlPanel(false);
  };

  const handleResetUrl = async () => {
    await setOverrideUrl(null);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowUrlPanel(false);
  };

  const handleCancelUrl = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowUrlPanel(false);
  };

  return (
    <LinearGradient
      colors={["#F8EDFF", "#FDFDFF", "#FFFFFF"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8EDFF" />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image
                  source={require("@/assets/images/new-logo.jpg")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>Track Attendance</Text>

              {/* Badge — triple-tap to reveal URL override */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleBadgeTap}
                style={styles.badge}
              >
                <Text style={styles.badgeText}>Powered by NIHUB</Text>
                {hasOverride && (
                  <View style={styles.overrideDot} />
                )}
              </TouchableOpacity>

              {/* URL Override Panel */}
              {showUrlPanel && (
                <View style={styles.urlPanel}>
                  <View style={styles.urlPanelHeader}>
                    <Icon name="settings" size={14} color="#8B2CBA" />
                    <Text style={styles.urlPanelTitle}>Developer: API Base URL</Text>
                  </View>

                  <TextInput
                    value={urlInput}
                    onChangeText={setUrlInput}
                    placeholder="http://192.168.x.x:8000"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    style={styles.urlInput}
                  />

                  <View style={styles.urlPanelActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleResetUrl}
                      style={[styles.urlActionBtn, styles.urlResetBtn]}
                    >
                      <Text style={styles.urlResetText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleCancelUrl}
                      style={[styles.urlActionBtn, styles.urlCancelBtn]}
                    >
                      <Text style={styles.urlCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleSaveUrl}
                      style={[styles.urlActionBtn, styles.urlSaveBtn]}
                    >
                      <Text style={styles.urlSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              {/* Welcome */}
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>Welcome back</Text>

                <Text style={styles.welcomeSubtitle}>
                  Please sign in to your account
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Username */}
                <View style={styles.inputWrapper}>
                  <Icon
                    name="user"
                    size={20}
                    color="#A3A3A3"
                    style={styles.leftIcon}
                  />

                  <TextInput
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setError("");
                    }}
                    placeholder="Username"
                    placeholderTextColor="#A3A3A3"
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.input}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputWrapper}>
                  <Icon
                    name="lock"
                    size={20}
                    color="#A3A3A3"
                    style={styles.leftIcon}
                  />

                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setError("");
                    }}
                    placeholder="Password"
                    placeholderTextColor="#A3A3A3"
                    secureTextEntry={secureText}
                    editable={!isLoading}
                    style={[styles.input, { paddingRight: 52 }]}
                  />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.eyeButton}
                    onPress={() => setSecureText(!secureText)}
                    disabled={isLoading}
                  >
                    <Icon
                      name={secureText ? "eye" : "eye-off"}
                      size={20}
                      color="#A3A3A3"
                    />
                  </TouchableOpacity>
                </View>

                {/* Error Message */}
                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}

                {/* Sign In Button */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={[
                    styles.signInButton,
                    isLoading && styles.signInButtonDisabled,
                  ]}
                  onPress={handleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signInText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don&apos;t have an account?
                </Text>

                <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/(auth)/register") }>
                  <Text style={styles.registerText}> Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },

  header: {
    alignItems: "center",
    marginBottom: 36,
  },

  logoContainer: {
    width: 96,
    height: 96,
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.8,
    marginBottom: 14,
  },

  badge: {
    backgroundColor: "#8B2CBA",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  overrideDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFD60A",
  },

  // URL Override Panel
  urlPanel: {
    marginTop: 12,
    width: "100%",
    backgroundColor: "#1E1035",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },

  urlPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  urlPanelTitle: {
    color: "#C084FC",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  urlInput: {
    backgroundColor: "#2D1A4E",
    borderWidth: 1,
    borderColor: "#6D28D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  urlPanelActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },

  urlActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  urlResetBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
  },

  urlResetText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },

  urlCancelBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6B7280",
  },

  urlCancelText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },

  urlSaveBtn: {
    backgroundColor: "#7C3AED",
  },

  urlSaveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 6,
  },

  welcomeContainer: {
    marginBottom: 32,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },

  welcomeSubtitle: {
    fontSize: 15,
    color: "#737373",
    lineHeight: 22,
  },

  form: {
    gap: 0,
  },

  inputWrapper: {
    height: 60,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  leftIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  eyeButton: {
    position: "absolute",
    right: 16,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    color: "#BA1A1A",
    fontSize: 13,
    marginBottom: 12,
    fontWeight: "600",
  },

  signInButton: {
    height: 58,
    borderRadius: 20,
    backgroundColor: "#8B2CBA",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,

    shadowColor: "#8B2CBA",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },

  signInButtonDisabled: {
    opacity: 0.7,
  },

  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },

  footerText: {
    fontSize: 12,
    color: "#737373",
  },

  registerText: {
    fontSize: 15,
    color: "#007AFF",
    fontWeight: "600",
  },
});