import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { createCourse } from "@/services/authAPI";

export default function CreateEventScreen() {
  const router = useRouter();

  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("days");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleBack = useCallback(() => {
    router.replace("/events");
  }, [router]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!courseName.trim()) errors.courseName = "Program name is required.";
    if (!courseCode.trim()) errors.courseCode = "Program code is required.";
    if (!durationValue.trim() || isNaN(Number(durationValue)) || Number(durationValue) <= 0) {
      errors.durationValue = "Enter a valid duration number.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    const duration = `${durationValue.trim()} ${durationUnit}`;

    const result = await createCourse({
      code: courseCode.trim().toUpperCase(),
      name: courseName.trim(),
      description: description.trim(),
      duration,
    });

    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert(
        "Could not create event",
        result.error ?? "An unexpected error occurred. Please try again.",
      );
      return;
    }

    Alert.alert(
      "Event created",
      `"${courseName.trim()}" has been added to the schedule.`,
      [{ text: "OK", onPress: () => router.replace("/events") }],
    );
  }, [courseName, courseCode, description, durationValue, durationUnit, router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-back" size={24} color="#70008B" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create New Event</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Enter the details for the new program or event to add it to the
            schedule.
          </Text>

          <View style={styles.form}>
            {/* Course Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Program Name</Text>

              <View style={[styles.inputWrapper, fieldErrors.courseName ? styles.inputError : null]}>
                <TextInput
                  value={courseName}
                  onChangeText={(v) => {
                    setCourseName(v);
                    if (fieldErrors.courseName) setFieldErrors((e) => ({ ...e, courseName: "" }));
                  }}
                  placeholder="e.g. Advanced UI Design"
                  placeholderTextColor="#A09AA1"
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
              {fieldErrors.courseName ? (
                <Text style={styles.errorText}>{fieldErrors.courseName}</Text>
              ) : null}
            </View>

            {/* Course Code */}
            <View style={styles.field}>
              <Text style={styles.label}>Program Code</Text>

              <View style={[styles.inputWrapper, fieldErrors.courseCode ? styles.inputError : null]}>
                <TextInput
                  value={courseCode}
                  onChangeText={(v) => {
                    setCourseCode(v.toUpperCase());
                    if (fieldErrors.courseCode) setFieldErrors((e) => ({ ...e, courseCode: "" }));
                  }}
                  placeholder="e.g. DES-401"
                  placeholderTextColor="#A09AA1"
                  style={styles.input}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              </View>
              {fieldErrors.courseCode ? (
                <Text style={styles.errorText}>{fieldErrors.courseCode}</Text>
              ) : null}
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Brief overview of the event..."
                placeholderTextColor="#A09AA1"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>

            {/* Duration */}
            <View style={styles.field}>
              <Text style={styles.label}>Duration</Text>

              <View style={styles.durationRow}>
                <View style={[
                  styles.inputWrapper,
                  styles.durationValueWrapper,
                  fieldErrors.durationValue ? styles.inputError : null,
                ]}>
                  <TextInput
                    value={durationValue}
                    onChangeText={(v) => {
                      setDurationValue(v);
                      if (fieldErrors.durationValue) setFieldErrors((e) => ({ ...e, durationValue: "" }));
                    }}
                    placeholder="0"
                    placeholderTextColor="#A09AA1"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                <View style={styles.durationUnitSelect}>
                  <Picker
                    selectedValue={durationUnit}
                    onValueChange={(value) => setDurationUnit(value)}
                    style={styles.durationPicker}
                    dropdownIconColor="#827282"
                  >
                    <Picker.Item label="Days" value="days" />
                    <Picker.Item label="Weeks" value="weeks" />
                    <Picker.Item label="Months" value="months" />
                  </Picker>
                </View>
              </View>
              {fieldErrors.durationValue ? (
                <Text style={styles.errorText}>{fieldErrors.durationValue}</Text>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Create event"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              ) : null}
              <Text style={styles.buttonText}>
                {isSubmitting ? "Creating…" : "Create Event"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  header: {
    height: 72,
    paddingHorizontal: 20,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    marginRight: 12,
    padding: 4,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#70008B",
    letterSpacing: -0.4,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 5,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#504251",
    marginBottom: 24,
  },

  form: {
    gap: 16,
  },

  field: {
    gap: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191C1D",
    marginBottom: 8,
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  inputError: {
    borderColor: "#BA1A1A",
  },

  input: {
    fontSize: 16,
    color: "#191C1D",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  errorText: {
    fontSize: 12,
    color: "#BA1A1A",
    fontWeight: "600",
    marginTop: 4,
  },

  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 16,
    fontSize: 16,
    color: "#191C1D",
    lineHeight: 24,
    paddingVertical: 16,
  },

  durationRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  durationValueWrapper: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  durationUnitSelect: {
    width: 104,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    paddingHorizontal: 4,
  },

  durationPicker: {
    width: "100%",
    height: 52,
    fontSize: 16,
    color: "#191C1D",
  },

  button: {
    marginTop: 8,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#70008B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#70008B",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});