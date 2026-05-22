import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";

export default function CreateEventScreen() {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [durationUnit, setDurationUnit] = useState("days");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.8} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create New Event</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.subtitle}>
            Enter the details for the new course or event to add it to the
            schedule.
          </Text>

          <View style={styles.form}>
            {/* Course Name */}
            <View style={styles.field}>
              <Text style={styles.label}>Course Name</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={courseName}
                  onChangeText={setCourseName}
                  placeholder="e.g. Advanced UI Design"
                  placeholderTextColor="#A09AA1"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Course Code */}
            <View style={styles.field}>
              <Text style={styles.label}>Course Code</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  value={courseCode}
                  onChangeText={setCourseCode}
                  placeholder="e.g. DES-401"
                  placeholderTextColor="#A09AA1"
                  style={styles.input}
                />
              </View>
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
                <TextInput
                  value={durationValue}
                  onChangeText={setDurationValue}
                  placeholder="0"
                  placeholderTextColor="#A09AA1"
                  keyboardType="numeric"
                  style={[styles.input, styles.durationValueInput]}
                />

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
            </View>

            {/* Submit Button */}
            <TouchableOpacity activeOpacity={0.9} style={styles.button}>
              <Text style={styles.buttonText}>Create Event</Text>
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
  },

  backButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: "#70008B",
    fontWeight: "700",
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

  input: {
    fontSize: 16,
    color: "#191C1D",
    paddingHorizontal: 16,
    paddingVertical: 16,
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

  durationValueInput: {
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

  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});