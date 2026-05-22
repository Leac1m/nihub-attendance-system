// app/(auth)/register.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    }, 1500);
  };

  return (
    <LinearGradient
      colors={["#f8f9fa", "#f3f4f5", "#ffffff"]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1, width: "100%" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida/ADBb0ujHs_wddmB7azrTjBxAS0NRxDp0Qqf9xzykW-rW2GUcQURz0KQeNT4TmCwejtjuNkWeJMk2myD-GA1I5-lUGrl07KHMfyG1-BtVi9Kh-gf8wXm-shS78wzz6zM3FYycg31ePPMQTUZXx3VCb6AYQTZchFNP8YcZoS8yX7hFhoJgUs97bIPLAfX8YauuxIPOAezSPmY7U3n4ZOFK0JiVObtBs1fCfgNds8J6M0H21uKyUHPetam363C4rGk",
                }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.title}>NIHUB Staff</Text>
            <Text style={styles.subtitle}>
              Create your admin account
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Email */}
            <InputField
              label="Email"
              icon="mail-outline"
              placeholder="name@nihub.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={!loading}
            />

            {/* Username */}
            <InputField
              label="Username"
              icon="badge"
              placeholder="staff_id_01"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />

            {/* Password */}
            <InputField
              label="Password"
              icon="lock-outline"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              icon="verified-user"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />

            {/* Button */}
            <TouchableOpacity
              style={[
                styles.button,
                success && styles.successButton,
              ]}
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}> Validating...</Text>
                </>
              ) : success ? (
                <>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}>
                    {" "}
                    Welcome aboard
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonText}>Register</Text>

                  <MaterialIcons
                    name="how-to-reg"
                    size={20}
                    color="#fff"
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Bottom Link */}
            <TouchableOpacity style={styles.bottomLink}>
              <Text style={styles.bottomLinkText}>
                Already have your code? Enter it here
              </Text>

              <MaterialIcons
                name="chevron-right"
                size={18}
                color="#0059bb"
              />
            </TouchableOpacity>
          </View>

          {/* Decorative Dots */}
          <View style={styles.dots}>
            <View
              style={[styles.dot, { backgroundColor: "#70008b" }]}
            />
            <View
              style={[styles.dot, { backgroundColor: "#0059bb" }]}
            />
            <View
              style={[styles.dot, { backgroundColor: "#705d07" }]}
            />
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

type InputFieldProps = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  editable?: boolean;
};

function InputField({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  editable = true,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
        ]}
      >
        <MaterialIcons
          name={icon}
          size={22}
          color={focused ? "#70008b" : "#827282"}
          style={styles.inputIcon}
        />

        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#827282"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  logoWrapper: {
    width: 64,
    height: 64,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#70008b",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 16,
    color: "#504251",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#edeeef",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 5,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#191c1d",
    marginLeft: 4,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#f3f4f5",
    borderWidth: 1,
    borderColor: "#d3c1d2",

    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },

  inputFocused: {
    borderColor: "#70008b",
    transform: [{ scale: 1.01 }],
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#191c1d",
  },

  button: {
    marginTop: 8,
    backgroundColor: "#8e24aa",

    height: 56,
    borderRadius: 14,

    justifyContent: "center",
    alignItems: "center",

    flexDirection: "row",
    gap: 8,
  },

  successButton: {
    backgroundColor: "#0070ea",
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  bottomLink: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomLinkText: {
    color: "#0059bb",
    fontSize: 14,
    fontWeight: "600",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 32,
    opacity: 0.3,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
});