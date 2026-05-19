import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

function RootLayoutContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f6f8fc" },
        }}
      >
        {/* Auth Stack */}
        {!isAuthenticated && (
          <Stack.Screen
            name="(auth)/signin"
            options={{
              headerShown: false,
            }}
          />
        )}

        {/* App Stack */}
        {isAuthenticated && (
          <>
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
          </>
        )}
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}
