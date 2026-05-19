import React, { useEffect } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "/home/michael/projects/nihub-attendance-system/mobile/src/contexts/AuthContext";

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect based on auth state
    if (isAuthenticated) {
      router.replace("/events");
    } else {
      router.replace("/(auth)/signin");
    }
  }, [isAuthenticated]);

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