import React, { useEffect, useRef, useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	StatusBar,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as authAPI from "@/services/authAPI";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyAccountScreen() {
	const router = useRouter();
	const { refreshAuthState } = useAuth();
	const params = useLocalSearchParams<{ username?: string | string[] }>();
	const initialUsername = Array.isArray(params.username) ? params.username[0] : params.username ?? "";

	const [username, setUsername] = useState(initialUsername);
	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [timer, setTimer] = useState(0);

	const inputRefs = useRef<(TextInput | null)[]>([]);

	useEffect(() => {
		let interval: number | undefined;

		if (timer > 0) {
			interval = setInterval(() => {
				setTimer((prev) => prev - 1);
			}, 1000);
		}

		return () => {
			if (interval !== undefined) clearInterval(interval);
		};
	}, [timer]);

	const handleChange = (text: string, index: number) => {
		if (!/^\d*$/.test(text)) return;

		const newOtp = [...otp];
		newOtp[index] = text;
		setOtp(newOtp);

		if (text && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}
	};

	const handleKeyPress = (key: string, index: number) => {
		if (key === "Backspace" && !otp[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const handlePasteCode = (value: string) => {
		const cleaned = value.replace(/\D/g, "").slice(0, 6);
		if (!cleaned) return;

		const split = cleaned.split("");
		const filled = [...otp];
		split.forEach((digit, i) => (filled[i] = digit));
		setOtp(filled);
		const nextIndex = Math.min(split.length, 5);
		inputRefs.current[nextIndex]?.focus();
	};

	const handleVerify = async () => {
		if (!username) {
			setError("Enter your username");
			return;
		}

		const pin = otp.join("");
		if (pin.length !== 6) {
			setError("Enter the 6-digit PIN");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const result = await authAPI.verifyStaffAccount({
				username,
				pin,
			});

			if (!result.success) {
				throw new Error(result.error || "Verification failed");
			}

			await refreshAuthState();
			router.replace("/events");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Verification failed");
		} finally {
			setLoading(false);
		}
	};

	const handleResend = async () => {
		if (timer > 0) return;
		setError("Ask the admin to share a new PIN if this one expires.");
	};

	return (
		<LinearGradient colors={["#F8EDFF", "#FDFDFF", "#FFFFFF"]} style={styles.gradient}>
			<SafeAreaView style={styles.container}>
				<StatusBar barStyle="dark-content" backgroundColor="#F8EDFF" />

				<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
						<View style={styles.headerRow}>
							<View style={styles.brandRow}>
								<MaterialIcons name="shield" size={28} color="#70008b" />
								<Text style={styles.brandText}>NIHUB</Text>
							</View>

							<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
								<MaterialIcons name="arrow-back" size={22} color="#504251" />
							</TouchableOpacity>
						</View>

						<View style={styles.card}>
							{error ? <Text style={styles.errorText}>{error}</Text> : null}

							<View style={styles.fieldWrap}>
								<Text style={styles.fieldLabel}>Username</Text>
								<View style={styles.usernameInputWrap}>
									<MaterialIcons name="badge" size={20} color="#827282" style={styles.usernameIcon} />
									<TextInput
										value={username}
										onChangeText={(value) => {
											setUsername(value);
											setError("");
										}}
										placeholder="staff username"
										placeholderTextColor="#827282"
										style={styles.usernameInput}
										autoCapitalize="none"
										editable={!loading}
									/>
								</View>
							</View>

							<View style={styles.heroCenter}>
								<View style={styles.heroIconWrap}>
									<MaterialIcons name="mark-email-read" size={32} color="#790096" />
								</View>

								<Text style={styles.title}>Check your email</Text>
								<Text style={styles.subtitle}>Enter the 6-digit code sent to your email to verify your account</Text>
							</View>

							<View style={styles.otpRow}>
								{otp.map((digit, index) => (
									<TextInput
										key={index}
										ref={(ref) => (inputRefs.current[index] = ref)}
										value={digit}
										onChangeText={(text) => {
											if (text.length > 1) handlePasteCode(text);
											else handleChange(text, index);
										}}
										onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
										keyboardType="number-pad"
										maxLength={1}
										style={styles.otpInput}
										textAlign="center"
										editable={!loading}
									/>
								))}
							</View>

							<TouchableOpacity style={[styles.verifyButton, loading && styles.disabledButton]} activeOpacity={0.9} onPress={handleVerify} disabled={loading}>
								{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify Account</Text>}
								{!loading && <MaterialIcons name="verified-user" size={18} color="#fff" />}
							</TouchableOpacity>

							<View style={styles.resendWrap}>
								<Text style={styles.resendPrompt}>Didn&apos;t receive a code?</Text>
								<TouchableOpacity disabled={timer > 0} onPress={handleResend}>
									<Text style={[styles.resendBtn, timer > 0 && styles.disabledText]}>
										{timer > 0 ? `Resend in ${timer}s` : "Contact admin"}
									</Text>
								</TouchableOpacity>
							</View>

							<View style={styles.footerRow}>
								<MaterialIcons name="lock" size={16} color="#827282" />
								<Text style={styles.footerText}>Secure encrypted verification</Text>
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</LinearGradient>
	);
}

const styles = StyleSheet.create({
	gradient: { flex: 1 },
	container: { flex: 1 },
	scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 32 },
	headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
	brandRow: { flexDirection: "row", alignItems: "center" },
	brandText: { fontSize: 24, fontWeight: "800", color: "#70008b", marginLeft: 8 },
	backButton: { padding: 8, borderRadius: 999 },
	card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
	heroCenter: { alignItems: "center", marginBottom: 20 },
	heroIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FBD6FF", justifyContent: "center", alignItems: "center", marginBottom: 12 },
	title: { fontSize: 22, fontWeight: "700", color: "#191c1d", marginBottom: 6 },
	subtitle: { color: "#504251", fontSize: 14, textAlign: "center" },
	otpRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 16, alignItems: "center" },
	otpInput: { flex: 1, flexBasis: 0, minWidth: 0, marginHorizontal: 4, height: 56, borderRadius: 12, borderWidth: 1, borderColor: "#d3c1d2", backgroundColor: "#f3f4f5", fontSize: 20, color: "#191c1d", paddingVertical: 0 },
	verifyButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", height: 52, borderRadius: 14, backgroundColor: "#8B2CBA", marginTop: 8, paddingHorizontal: 12 },
	disabledButton: { opacity: 0.7 },
	verifyText: { color: "#fff", fontWeight: "700", marginRight: 8 },
	errorText: { color: "#b42318", marginBottom: 12, fontSize: 14, fontWeight: "600" },
	fieldWrap: { marginBottom: 16 },
	fieldLabel: { color: "#191c1d", fontSize: 13, fontWeight: "700", marginBottom: 8 },
	usernameInputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#d3c1d2", borderRadius: 12, backgroundColor: "#f3f4f5", paddingHorizontal: 12 },
	usernameIcon: { marginRight: 8 },
	usernameInput: { flex: 1, height: 52, color: "#191c1d" },
	resendWrap: { marginTop: 12, alignItems: "center" },
	resendPrompt: { color: "#504251", marginBottom: 6 },
	resendBtn: { color: "#0059bb", fontWeight: "600" },
	disabledText: { opacity: 0.5 },
	footerRow: { marginTop: 16, borderTopWidth: 1, borderTopColor: "#e1e3e4", paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
	footerText: { color: "#827282", marginLeft: 8 },
});
