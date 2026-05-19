import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialIcons as Icon } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

export default function CreateEventScreen() {
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.8} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#70008B" />
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

          {/* Course Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Course Name</Text>

            <View style={styles.inputContainer}>
              <Icon
                name="school"
                size={22}
                color="#827282"
                style={styles.leftIcon}
              />

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

            <View style={styles.inputContainer}>
              <Icon
                name="sell"
                size={22}
                color="#827282"
                style={styles.leftIcon}
              />

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
              textAlignVertical="top"
              style={styles.textArea}
            />
          </View>

          {/* Duration */}
          <View style={styles.field}>
            <Text style={styles.label}>Duration</Text>

            <View style={styles.pickerContainer}>
              <Icon
                name="schedule"
                size={22}
                color="#827282"
                style={styles.leftIcon}
              />

              <Picker
                selectedValue={duration}
                onValueChange={(value) => setDuration(value)}
                style={styles.picker}
                dropdownIconColor="#827282"
              >
                <Picker.Item label="Select duration" value="" />
                <Picker.Item label="30 Minutes" value="30m" />
                <Picker.Item label="1 Hour" value="1h" />
                <Picker.Item label="2 Hours" value="2h" />
                <Picker.Item label="Half Day" value="half_day" />
                <Picker.Item label="Full Day" value="full_day" />
              </Picker>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity activeOpacity={0.9} style={styles.button}>
            <Icon name="add-circle" size={22} color="#FFFFFF" />

            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>
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
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#FFFFFF",
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
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#504251",
    marginBottom: 28,
  },

  field: {
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#191C1D",
    marginBottom: 8,
  },

  inputContainer: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  leftIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#191C1D",
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
  },

  pickerContainer: {
    height: 58,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    overflow: "hidden",
  },

  picker: {
    flex: 1,
    color: "#191C1D",
  },

  button: {
    marginTop: 16,
    height: 58,
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
    marginLeft: 8,
  },
});