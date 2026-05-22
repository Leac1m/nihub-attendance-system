import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Course, getCourses, downloadCourseAttendanceSpreadsheet } from "@/services/authAPI";

type EventUi = {
  id: string;
  title: string;
  code: string;
  description: string;
  duration: string;
  accent: string;
  bg: string;
};

const EVENT_STYLES = [
  { accent: "#70008B", bg: "#F7E6FB" },
  { accent: "#0059BB", bg: "#E4EEFF" },
  { accent: "#BA1A1A", bg: "#FFE4E1" },
  { accent: "#705D07", bg: "#FFF4CC" },
];

function mapCourseToEvent(course: Course, index: number): EventUi {
  const fallbackStyle = EVENT_STYLES[index % EVENT_STYLES.length];
  return {
    id: course.code,
    title: course.name,
    code: course.code,
    description: course.description,
    duration: course.duration,
    accent: fallbackStyle.accent,
    bg: fallbackStyle.bg,
  };
}

const EventCard = ({ item, onPress, onDownload }: {
  item: EventUi;
  onPress: () => void;
  onDownload: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
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
        <View style={styles.footerMeta}>
          <Icon name="schedule" size={18} color="#6B7280" />
          <Text style={styles.duration}>{item.duration}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.downloadButton}
          onPress={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          accessibilityRole="button"
          accessibilityLabel="Download attendee spreadsheet"
        >
          <Icon name="file-download" size={20} color="#70008B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventUi[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getCourses();
    if (!result.success || !result.data?.courses) {
      setError(result.error || "Failed to load events");
      setEvents([]);
      setIsLoading(false);
      return;
    }

    const mapped = result.data.courses.map(mapCourseToEvent);
    setEvents(mapped);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleEventPress = (eventId: string) => {
    router.push(`/events/${eventId}/scan`);
  };

  const handleDownloadAttendanceSheet = useCallback(async (courseCode: string) => {
    const result = await downloadCourseAttendanceSpreadsheet(courseCode);
    if (!result.success) {
      Alert.alert(
        "Download failed",
        result.error ?? "Could not download the attendance sheet. Please try again.",
      );
    }
  }, []);

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return events;
    }

    return events.filter((event) => {
      return (
        event.title.toLowerCase().includes(query) ||
        event.code.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    });
  }, [events, searchTerm]);

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
        data={filteredEvents}
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
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search events..."
                placeholderTextColor="#827282"
                style={styles.searchInput}
              />

              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#827282"
                  style={styles.searchLoader}
                />
              ) : null}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>
        }
        renderItem={({ item }) => (
          <EventCard
            item={item}
            onPress={() => handleEventPress(item.id)}
            onDownload={() => handleDownloadAttendanceSheet(item.id)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={styles.emptyText}>
              {searchTerm ? "No events match your search" : "No events found"}
            </Text>
          ) : null
        }
        onRefresh={loadCourses}
        refreshing={isLoading}
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

  searchLoader: {
    marginLeft: 8,
  },

  errorText: {
    marginBottom: 12,
    color: "#BA1A1A",
    fontSize: 14,
    fontWeight: "600",
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
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
    justifyContent: "space-between",
  },

  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
  },

  duration: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});