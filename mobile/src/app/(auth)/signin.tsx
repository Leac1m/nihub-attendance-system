import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather as Icon } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);
  const [error, setError] = useState("");

  const { signIn, isLoading } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      setError("");
      await signIn(email, password);
      // Navigation will happen automatically via the updated _layout.tsx
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                <Icon name="grid" size={42} color="#FFFFFF" />
              </View>

              {/* Title */}
              <Text style={styles.title}>Track Attendance</Text>

              {/* Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Powered by NIHUB</Text>
              </View>
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
                {/* Email */}
                <View style={styles.inputWrapper}>
                  <Icon
                    name="mail"
                    size={20}
                    color="#A3A3A3"
                    style={styles.leftIcon}
                  />

                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setError("");
                    }}
                    placeholder="Email Address"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="email-address"
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

                <TouchableOpacity activeOpacity={0.7}>
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
    borderRadius: 48,
    backgroundColor: "#8B2CBA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,

    shadowColor: "#8B2CBA",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
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
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 24,
    flex: 1,

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
    flex: 1,
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