import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");
const SCANNER_SIZE = width * 0.72;

export default function QRScannerScreen() {
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { eventId } = useLocalSearchParams();

  useEffect(() => {
    const startAnimation = () => {
      scanAnimation.setValue(0);

      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: SCANNER_SIZE - 20,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, []);

  const handleScanSuccess = () => {
    // Navigate to success screen
    router.push({
      pathname: "/events/[eventId]/scan-success",
      params: { eventId: eventId as string },
    } as any);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2E3132" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icon name="arrow-back" size={24} color="#504251" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Computer Science</Text>

        <View style={styles.avatar}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8zmGgA1iNQIIOCsyAYEM-NhQ0jNN_9YS7nTZuRmA5w-wc7_MeJO-fTC0tacn7LV1wbDaIshO2erlAuutAiCM_Nlr_k0W44viubdRy2IZBds2CB9luhoNQgZejPGR79mEgQcHp7CDLp1uvhoAMnqH2UHBidOhbPiLni1DFTjIooCOsfPXjbJHKa-O4OUZ2vK9zw6MxFQ_FXD2OiG9OUXuxANbAuNEfRmJJ0BYWgefJjpOEbzF95jL3nXw4ft9iTMNN4l9SCZTcl_s",
            }}
            style={styles.avatarImage}
          />
        </View>
      </View>

      {/* Scanner Area */}
      <View style={styles.scannerContainer}>
        {/* Fake Camera Background */}
        <View style={styles.cameraBackground} />

        {/* Scanner Box */}
        <View style={styles.scannerWrapper}>
          {/* Corners */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Center Icon */}
          <Icon
            name="qr-code-scanner"
            size={52}
            color="rgba(255,255,255,0.18)"
          />

          {/* Scan Line */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [{ translateY: scanAnimation }],
              },
            ]}
          />
        </View>

        {/* Flash Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.flashButton}
        >
          <Icon name="flashlight-on" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Position the QR code within the frame to scan your
            attendance.
          </Text>
        </View>

        {/* Simulate Scan Button (for demo) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.simulateScanButton}
          onPress={handleScanSuccess}
        >
          <Icon name="check" size={20} color="#FFFFFF" />
          <Text style={styles.simulateScanText}>Simulate Scan</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const CORNER_SIZE = 34;
const BORDER_WIDTH = 5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2E3132",
  },

  header: {
    height: 72,
    backgroundColor: "#F8F9FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#70008B",
    marginHorizontal: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D3C1D2",
    backgroundColor: "#E1E3E4",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
  },

  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111827",
  },

  scannerWrapper: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 42,
  },

  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#8E24AA",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
    borderTopLeftRadius: 18,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
    borderTopRightRadius: 18,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderLeftWidth: BORDER_WIDTH,
    borderBottomLeftRadius: 18,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: BORDER_WIDTH,
    borderRightWidth: BORDER_WIDTH,
    borderBottomRightRadius: 18,
  },

  scanLine: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#8E24AA",

    shadowColor: "#8E24AA",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },

  flashButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,

    marginBottom: 36,
  },

  instructionsContainer: {
    paddingHorizontal: 24,
  },

  instructions: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 26,
    color: "rgba(255,255,255,0.9)",
  },

  simulateScanButton: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#70008B",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,

    shadowColor: "#70008B",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },

  simulateScanText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});