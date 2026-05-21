import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getRegistrant, Registrant } from "@/services/authAPI";

export default function AttendeeVerificationScreen() {
  const router = useRouter();
  const { eventId, attendeeId } = useLocalSearchParams();
  const [attendee, setAttendee] = useState<Registrant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAttendee = async () => {
      if (!eventId || !attendeeId || Array.isArray(eventId) || Array.isArray(attendeeId)) {
        setError("Missing attendee reference");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await getRegistrant(eventId, attendeeId);
      if (!result.success || !result.data?.registrant) {
        if (isMounted) {
          setError(result.error || "Failed to load attendee details");
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setAttendee(result.data.registrant);
        setIsLoading(false);
      }
    };

    loadAttendee();

    return () => {
      isMounted = false;
    };
  }, [attendeeId, eventId]);

  const handleAccept = () => {
    // Navigate back to events list
    router.push("/events");
  };

  const handleDeny = () => {
    // Go back to scanner
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <Icon name="qr-code-scanner" size={28} color="#F7BCFF" />
          </View>

          <Text style={styles.title}>Scan Successful</Text>

          <Text style={styles.subtitle}>
            Review attendee details below.
          </Text>
        </View>

        {/* Attendee Card */}
        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#70008B" />
              <Text style={styles.loadingText}>Loading attendee details</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingState}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : attendee ? (
            <>
              {/* Image */}
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {attendee.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>

              {/* ID */}
              <Text style={styles.attendeeId}>ID: {attendee.id}</Text>

              {/* Name */}
              <Text style={styles.name}>{attendee.name}</Text>

              {/* Details */}
              <View style={styles.infoContainer}>
                <InfoItem icon="mail" label="Email" value={attendee.email} />

                <View style={styles.divider} />

                <InfoItem
                  icon="phone-iphone"
                  label="Phone No"
                  value={attendee.phone}
                />

                <View style={styles.divider} />

                <InfoItem
                  icon="badge"
                  label="Matric No"
                  value={attendee.matriculation_number}
                  bold
                />
              </View>
            </>
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.denyButton}
            onPress={handleDeny}
          >
            <Icon name="cancel" size={20} color="#BA1A1A" />

            <Text style={styles.denyButtonText}>Deny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.acceptButton,
              (isLoading || !!error || !attendee) && styles.acceptButtonDisabled,
            ]}
            onPress={handleAccept}
            disabled={isLoading || !!error || !attendee}
          >
            <Icon name="check-circle" size={20} color="#FFFFFF" />

            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type InfoItemProps = {
  icon: string;
  label: string;
  value: string;
  bold?: boolean;
};

function InfoItem({
  icon,
  label,
  value,
  bold = false,
}: InfoItemProps) {
  return (
    <View style={styles.infoRow}>
      <Icon
        name={icon as any}
        size={22}
        color="#827282"
        style={styles.infoIcon}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>

        <Text
          style={[
            styles.infoValue,
            bold && { fontWeight: "700" },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#8E24AA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#191C1D",
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    color: "#504251",
    textAlign: "center",
    lineHeight: 22,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,

    marginBottom: 28,
  },

  loadingState: {
    minHeight: 260,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#504251",
  },

  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#BA1A1A",
    textAlign: "center",
  },

  avatarFallback: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 24,
    backgroundColor: "#F2E6F7",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarFallbackText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#70008B",
  },

  attendeeId: {
    fontSize: 12,
    fontWeight: "800",
    color: "#827282",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 8,
  },

  profileImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 24,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#191C1D",
    marginBottom: 24,
  },

  infoContainer: {
    width: "100%",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },

  infoIcon: {
    marginRight: 14,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#827282",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    color: "#191C1D",
    lineHeight: 24,
  },

  divider: {
    height: 1,
    backgroundColor: "#E7E8E9",
    marginVertical: 14,
  },

  actions: {
    flexDirection: "row",
    gap: 14,
  },

  denyButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#BA1A1A",
    backgroundColor: "#FFFFFF",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  denyButtonText: {
    marginLeft: 8,
    color: "#BA1A1A",
    fontSize: 15,
    fontWeight: "700",
  },

  acceptButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#70008B",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#70008B",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  acceptButtonDisabled: {
    opacity: 0.45,
  },

  acceptButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});