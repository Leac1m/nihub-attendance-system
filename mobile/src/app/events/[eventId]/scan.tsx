import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getScanContext,
  Course,
  Registrant,
} from "@/services/authAPI";

const { width } = Dimensions.get("window");
const SCANNER_SIZE = width * 0.72;

export default function QRScannerScreen() {
  const scanAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { eventId } = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [course, setCourse] = useState<Course | null>(null);
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const loadScanContext = async () => {
      setIsLoading(true);
      setError(null);

      if (!eventId || Array.isArray(eventId)) {
        if (isMounted) {
          setError("Course not found");
          setIsLoading(false);
        }
        return;
      }

      const result = await getScanContext(eventId);
      if (!result.success || !result.data) {
        if (isMounted) {
          setError(result.error || "Failed to load scan context");
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setCourse(result.data.course);
        setRegistrants([result.data.attendee]);
        setIsLoading(false);
      }
    };

    loadScanContext();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const currentAttendee = useMemo(() => registrants[0] ?? null, [registrants]);

  useEffect(() => {
    setHasScanned(false);
  }, [eventId]);

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (hasScanned || type !== "qr") {
      return;
    }

    setHasScanned(true);

    router.push({
      pathname: "/events/[eventId]/scan-success",
      params: {
        eventId: eventId as string,
        attendeeId: data,
      },
    } as any);
  };

  const handleBack = () => {
    router.replace("/events");
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

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {course?.name || "Event Scanner"}
          </Text>

          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {course?.code || eventId}
          </Text>
        </View>

        {/* Spacer keeps title centred */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Scanner Area */}
      <View style={styles.scannerContainer}>
        {permission?.granted ? (
          <CameraView
            style={styles.cameraBackground}
            facing="back"
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
        ) : (
          <View style={styles.cameraBackground}>
            <View style={styles.permissionOverlay}>
              <Icon name="photo-camera" size={42} color="#FFFFFF" />
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionText}>
                Grant permission to scan attendee QR codes.
              </Text>
              {!permission ? null : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>Allow Camera</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            Position the QR code within the frame to scan your
            attendance.
          </Text>
        </View>
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

  headerTextBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#70008B",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: "#827282",
  },

  headerSpacer: {
    width: 42,
    height: 42,
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

  permissionOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: "rgba(17,24,39,0.72)",
  },

  permissionTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },

  permissionText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
  },

  permissionButton: {
    marginTop: 18,
    minWidth: 160,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#70008B",
    alignItems: "center",
    justifyContent: "center",
  },

  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  scannerWrapper: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginBottom: 42,
  },



  errorText: {
    marginBottom: 12,
    color: "#FFB4B4",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
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


});