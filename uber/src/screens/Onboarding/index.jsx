import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useProfile } from "../../context/ProfileContext";

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function OnboardingScreen() {
  const { profile, setupRole, save, closeSetup } = useProfile();
  const [name, setName] = useState(profile?.displayName ?? "");
  const [role, setRole] = useState(setupRole ?? profile?.role ?? null);
  const [carType, setCarType] = useState(profile?.carType ?? null);
  const [carSeats, setCarSeats] = useState(profile?.carSeats ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSave =
    name.trim().length > 0 &&
    !!role &&
    (role === "PASSENGER" || !!carSeats) &&
    !saving;

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      await save({
        displayName: name.trim(),
        role,
        carType: null,
        carSeats: role === "DRIVER" ? carSeats : null,
      });
      closeSetup();
    } catch (e) {
      console.log("SAVE PROFILE ERROR:", e.errors ?? e);
      setError(e.errors?.[0]?.message ?? "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Efe"
        value={name}
        onChangeText={setName}
        maxLength={40}
      />

      <Text style={styles.label}>How do you want to use the app?</Text>
      <Pressable
        style={[styles.card, role === "DRIVER" && styles.cardActive]}
        onPress={() => setRole("DRIVER")}
      >
        <Text style={styles.cardTitle}>I'm driving</Text>
        <Text style={styles.cardText}>Offer a ride on your route</Text>
      </Pressable>
      <Pressable
        style={[styles.card, role === "PASSENGER" && styles.cardActive]}
        onPress={() => setRole("PASSENGER")}
      >
        <Text style={styles.cardTitle}>I need a ride</Text>
        <Text style={styles.cardText}>Find drivers going your way</Text>
      </Pressable>

      {role === "DRIVER" && (
        <>
          <Text style={styles.label}>Seats for passengers in your car</Text>
          <View style={styles.seatRow}>
            {SEAT_OPTIONS.map((n) => (
              <Pressable
                key={n}
                style={[styles.seatChip, carSeats === n && styles.cardActive]}
                onPress={() => setCarSeats(n)}
              >
                <Text style={styles.seatText}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, !canSave && { opacity: 0.4 }]}
        disabled={!canSave}
        onPress={onSave}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>

      {!!profile && (
        <Pressable onPress={closeSetup}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 72,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  card: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardActive: { borderColor: "#000", backgroundColor: "#f2f2f2" },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardText: { color: "#666", marginTop: 2 },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancel: { textAlign: "center", marginTop: 16, color: "#1a73e8" },
  error: { color: "#c62828", marginTop: 12 },
  seatRow: { flexDirection: "row", flexWrap: "wrap" },
  seatChip: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginBottom: 10,
  },
  seatText: { fontSize: 18, fontWeight: "700" },
});
