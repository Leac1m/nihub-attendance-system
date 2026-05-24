import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isRestoring } = useAuth();

  useEffect(() => {
    // Only redirect after auth state has been restored
    if (isRestoring) {
        return;
    }

    // Redirect based on auth state
    if (isAuthenticated) {
      router.replace("/events");
    } else {
      router.replace("/(auth)/signin");
    }
  }, [isAuthenticated, isRestoring]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b2cba" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fdfdff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});