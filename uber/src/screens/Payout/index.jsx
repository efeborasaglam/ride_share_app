import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { generateClient } from "aws-amplify/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  startPayoutOnboarding,
  refreshPayoutStatus,
} from "../../graphql/operations";
import { useProfile } from "../../context/ProfileContext";
import MenuButton from "../../components/MenuButton";
import { fetchUserAttributes } from "aws-amplify/auth";

const client = generateClient();

export default function Payouts() {
  const navigation = useNavigation();
  const { profile, applyProfile } = useProfile();
  const ready = !!profile.payoutsReady;
  const verified = profile.verificationStatus === "APPROVED";
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(
    async (silent = false) => {
      setChecking(true);
      try {
        const res = await client.graphql({ query: refreshPayoutStatus });
        applyProfile((prev) => ({ ...prev, ...res.data.refreshPayoutStatus }));
      } catch (e) {
        console.log("REFRESH PAYOUT ERROR:", e.errors ?? e);
        if (!silent) {
          Alert.alert(
            "Could not check status",
            e.errors?.[0]?.message ?? "Please try again.",
          );
        }
      } finally {
        setChecking(false);
      }
    },
    [applyProfile],
  );

  const onStart = async () => {
    setBusy(true);
    try {
      const attrs = await fetchUserAttributes();
      const res = await client.graphql({
        query: startPayoutOnboarding,
        variables: { email: attrs.email },
      });
      await WebBrowser.openBrowserAsync(res.data.startPayoutOnboarding.url);
      await refresh(true);
    } catch (e) {
      console.log("START PAYOUT ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not start",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!ready) refresh(true);
    }, [ready, refresh]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Payouts</Text>
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text
            style={[styles.status, { color: ready ? "#2e7d32" : "#ef6c00" }]}
          >
            {ready ? "Payouts active" : "Payouts not set up"}
          </Text>
          <Text style={styles.text}>
            {ready
              ? "You can offer rides. Your earnings are paid out to your bank account."
              : "To offer rides you need a payout account. It is set up with our payment partner Stripe."}
          </Text>
        </View>

        <Text style={[styles.text, { marginTop: 16 }]}>
          You keep 80% of the price you set. 20% is the platform fee.
        </Text>

        {!ready && !verified && (
          <Text style={styles.warn}>
            Please verify your identity first (menu → Verification).
          </Text>
        )}

        {!ready && verified && (
          <Pressable
            style={[styles.button, busy && { opacity: 0.4 }]}
            disabled={busy}
            onPress={onStart}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Set up payouts</Text>
            )}
          </Pressable>
        )}

        {!ready && (
          <Pressable
            style={[styles.secondary, checking && { opacity: 0.4 }]}
            disabled={checking}
            onPress={() => refresh(false)}
          >
            {checking ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.secondaryText}>Check status</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 56, backgroundColor: "#000" },
  back: { color: "#fff", fontSize: 16, marginBottom: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  card: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  status: { fontSize: 20, fontWeight: "700" },
  text: { color: "#444", marginTop: 6, fontSize: 15 },
  warn: { color: "#c62828", marginTop: 16 },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  secondaryText: { fontWeight: "600" },
});
