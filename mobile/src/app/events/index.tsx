import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";

const EVENTS = [
  {
    id: "1",
    title: "Computer Science",
    code: "CS101",
    description:
      "A course that covers the fundamentals of computer science, including programming, algorithms, and data structures.",
    duration: "2 weeks",
    accent: "#70008B",
    bg: "#F7E6FB",
  },
  {
    id: "2",
    title: "Data Science",
    code: "DS201",
    description:
      "Learn to extract insights from complex data sets using statistical analysis and machine learning techniques.",
    duration: "4 weeks",
    accent: "#0059BB",
    bg: "#E4EEFF",
  },
  {
    id: "3",
    title: "Cyber Security",
    code: "SEC101",
    description:
      "Protect systems and networks from digital attacks, focusing on threat analysis and secure architecture.",
    duration: "3 weeks",
    accent: "#BA1A1A",
    bg: "#FFE4E1",
  },
  {
    id: "4",
    title: "UI/UX Design",
    code: "UX301",
    description:
      "Master the principles of user interface design and craft compelling user experiences for modern applications.",
    duration: "4 weeks",
    accent: "#705D07",
    bg: "#FFF4CC",
  },
];

const EventCard = ({ item }: any) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card}>
      {/* Decorative background */}
      <View
        style={[
          styles.cardDecoration,
          {
            backgroundColor: item.bg,
          },
        ]}
      />

      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        <View
          style={[
            styles.badge,
            {
              backgroundColor: item.bg,
              borderColor: item.accent + "40",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: item.accent,
              },
            ]}
          >
            {item.code}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.footer}>
        <Icon name="schedule" size={18} color="#6B7280" />
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function EventsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Icon name="menu" size={26} color="#504251" />
        </TouchableOpacity>

        <Text style={styles.logo}>NIHUB</Text>

        <TouchableOpacity style={styles.profile}>
          <Icon name="person" size={20} color="#504251" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={EVENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Screen Title */}
            <Text style={styles.screenTitle}>Events</Text>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Icon
                name="search"
                size={22}
                color="#827282"
                style={styles.searchIcon}
              />

              <TextInput
                placeholder="Search events..."
                placeholderTextColor="#827282"
                style={styles.searchInput}
              />
            </View>
          </>
        }
        renderItem={({ item }) => <EventCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },

  iconButton: {
    padding: 6,
  },

  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#70008B",
    letterSpacing: -0.5,
  },

  profile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E1E3E4",
    borderWidth: 1,
    borderColor: "#D3C1D2",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  screenTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#191C1D",
    marginBottom: 18,
  },

  searchContainer: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D3C1D2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 28,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },

  searchIcon: {
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#191C1D",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E7E8E9",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },

  cardDecoration: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 120,
    height: 120,
    borderBottomLeftRadius: 120,
    opacity: 0.9,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  cardTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#191C1D",
    paddingRight: 12,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: "#504251",
    marginBottom: 18,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E7E8E9",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  duration: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
});