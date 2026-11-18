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
import { useThemedStyles } from "../../theme";
import { useTranslation } from "react-i18next";

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
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
      setError(e.errors?.[0]?.message ?? t("onboarding.error.save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("onboarding.title")}</Text>

      <Text style={styles.label}>{t("onboarding.name.label")}</Text>
      <TextInput
        style={styles.input}
        placeholder={t("onboarding.name.placeholder")}
        value={name}
        onChangeText={setName}
        maxLength={40}
      />

      <Text style={styles.label}>{t("onboarding.role.label")}</Text>
      <Pressable
        style={[styles.card, role === "DRIVER" && styles.cardActive]}
        onPress={() => setRole("DRIVER")}
      >
        <Text style={styles.cardTitle}>
          {t("onboarding.role.driver.title")}
        </Text>
        <Text style={styles.cardText}>
          {t("onboarding.role.driver.description")}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.card, role === "PASSENGER" && styles.cardActive]}
        onPress={() => setRole("PASSENGER")}
      >
        <Text style={styles.cardTitle}>
          {t("onboarding.role.passenger.title")}
        </Text>
        <Text style={styles.cardText}>
          {t("onboarding.role.passenger.description")}
        </Text>
      </Pressable>

      {role === "DRIVER" && (
        <>
          <Text style={styles.label}>{t("onboarding.seats.label")}</Text>{" "}
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
          <Text style={styles.buttonText}>
            {t("onboarding.button.continue")}
          </Text>
        )}
      </Pressable>

      {!!profile && (
        <Pressable onPress={closeSetup}>
          <Text style={styles.cancel}>{t("onboarding.button.cancel")}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    container: {
      padding: 24,
      paddingTop: 72,
      backgroundColor: t.bg,
      flexGrow: 1,
    },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 24, color: t.text },
    label: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 20,
      marginBottom: 8,
      color: t.text,
    },
    input: {
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
      color: t.text,
      borderRadius: 10,
      padding: 12,
      fontSize: 16,
    },
    card: {
      borderWidth: 1.5,
      borderColor: t.border,
      backgroundColor: t.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    cardActive: { borderColor: t.primary, backgroundColor: t.chip },
    cardTitle: { fontSize: 17, fontWeight: "700", color: t.text },
    cardText: { color: t.muted, marginTop: 2 },
    seatRow: { flexDirection: "row", flexWrap: "wrap" },
    seatChip: {
      width: 52,
      height: 52,
      borderWidth: 1.5,
      borderColor: t.border,
      backgroundColor: t.surface,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      marginBottom: 10,
    },
    seatText: { fontSize: 18, fontWeight: "700", color: t.text },
    button: {
      backgroundColor: t.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 24,
    },
    buttonText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
    cancel: { textAlign: "center", marginTop: 16, color: t.primary },
    error: { color: t.danger, marginTop: 12 },
  });
