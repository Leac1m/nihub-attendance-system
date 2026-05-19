import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";

export default function AttendeeVerificationScreen() {
  const attendee = {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "0712 3456 789",
    matricNo: "123456789",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxhgayLwVcUIwLjMgbuUEu27B_9yIlEA5zfjiGHV6oUOO9BvJ9ObZNbpne-dc7RLGGLTSzLGKQikaoM2AaRE_QlmLFYIlnE07o-VZHH-nkiJw3GUXUXFAW7kunxh8VbFzJb-XFeM4GH3ZGTKc7IBseScjINwRfUbuCU8gkefjDO_NYQD_c-wXgEfewXIKbJ9LeN3XXtrzbjD-Hr2djQzxRzbomeqtzoKeuNvG6EQNj97zogS4Xp_Z4WYHMEXdlw7cpf8VtAsJwrCA",
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
          {/* Image */}
          <Image
            source={{ uri: attendee.image }}
            style={styles.profileImage}
            resizeMode="cover"
          />

          {/* Name */}
          <Text style={styles.name}>{attendee.name}</Text>

          {/* Details */}
          <View style={styles.infoContainer}>
            <InfoItem
              icon="mail"
              label="Email"
              value={attendee.email}
            />

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
              value={attendee.matricNo}
              bold
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.denyButton}
          >
            <Icon name="cancel" size={20} color="#BA1A1A" />

            <Text style={styles.denyButtonText}>Deny</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.acceptButton}
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
  icon: keyof typeof Icon.glyphMap;
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
        name={icon}
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

  acceptButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});