import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootLayoutContent() {
  const { isRestoring } = useAuth();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f6f8fc" },
        }}
      >
        {/* Splash/redirect screen */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* Auth Stack */}
        <Stack.Screen
          name="(auth)/signin"
          options={{
            headerShown: false,
          }}
        />

        {/* App Stack */}
        <Stack.Screen
          name="events/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="events/[eventId]/scan"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="events/[eventId]/scan-success"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      {isRestoring && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8fc",
  },
});
