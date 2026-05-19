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
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  return (
    <LinearGradient colors={['#f8edff', '#fdfdff', '#ffffff']} style={styles.screen}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="check-circle-outline" size={34} color="#ffffff" />
            </View>
            <Text style={styles.title}>Signed in successfully</Text>
            <Text style={styles.subtitle}>
              You are now inside the attendance workspace. Replace this page with the real next screen when you have the design.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Session</Text>
            <Text style={styles.cardValue}>admin@email.com</Text>
            <Text style={styles.cardMeta}>Authenticated with the local demo account.</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/")}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>Log out</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#fdfdff',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  hero: {
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 24,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#111827',
    shadowOpacity: 0.08,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b2cba',
    shadowColor: '#8b2cba',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    lineHeight: 32,
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#737373',
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  cardValue: {
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#111827',
  },
  cardMeta: {
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#4b5563',
  },
  primaryButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#8b2cba',
  },
  primaryButtonPressed: {
    backgroundColor: '#6a1992',
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
  },
});