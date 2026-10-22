import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { generateClient } from "aws-amplify/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  startVerification,
  refreshVerification,
} from "../../graphql/operations";
import { useProfile } from "../../context/ProfileContext";
import { formatDateTime } from "../../utils/format";
import MenuButton from "../../components/MenuButton";
import { setProfileVisibility } from "../../graphql/operations";
import ProfileBadge from "../../components/ProfileBadge";

const client = generateClient();

const PRIVACY_URL = "https://didit.me/terms/verification-privacy-notice";
const TERMS_URL = "https://didit.me/terms/identity-verification";

const INFO = {
  NONE: {
    title: "Not verified",
    text: "Verify your identity to offer or request rides.",
    color: "#757575",
  },
  PENDING: {
    title: "Verification in progress",
    text: "Finish the steps in the verification window, then check your status.",
    color: "#ef6c00",
  },
  IN_REVIEW: {
    title: "Being reviewed",
    text: "Your documents are being checked manually. Check again later.",
    color: "#ef6c00",
  },
  APPROVED: {
    title: "Verified",
    text: "Your identity is verified.",
    color: "#2e7d32",
  },
  DECLINED: {
    title: "Verification failed",
    text: "We could not verify your identity. You can try again with a valid document.",
    color: "#c62828",
  },
  EXPIRED: {
    title: "Verification expired",
    text: "Your verification session expired. Please start again.",
    color: "#c62828",
  },
};

export default function Verification() {
  const navigation = useNavigation();
  const { profile, applyProfile } = useProfile();
  const status = profile.verificationStatus || "NONE";
  const info = INFO[status] ?? INFO.NONE;

  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [savingVisible, setSavingVisible] = useState(false);

  const onToggleVisible = async (value) => {
    setSavingVisible(true);
    try {
      const res = await client.graphql({
        query: setProfileVisibility,
        variables: { visible: value },
      });
      applyProfile({ ...profile, ...res.data.setProfileVisibility });
    } catch (e) {
      console.log("VISIBILITY ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not save",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setSavingVisible(false);
    }
  };

  const refresh = useCallback(
    async (silent = false) => {
      setChecking(true);
      try {
        const res = await client.graphql({ query: refreshVerification });
        applyProfile(res.data.refreshVerification);
      } catch (e) {
        console.log("START VERIFICATION ERROR:", e.errors ?? e);
        const msg = e.errors?.[0]?.message ?? "Please try again.";
        if (msg.includes("already verified")) {
          await refresh(true); // sync the status from the server
        } else {
          Alert.alert("Could not start", msg);
        }
      } finally {
        setChecking(false);
      }
    },
    [applyProfile],
  );

  // When the screen opens during a running verification, check the result once
  useFocusEffect(
    useCallback(() => {
      if (status === "PENDING" || status === "IN_REVIEW") refresh(true);
    }, [status, refresh]),
  );

  const onStart = async () => {
    setBusy(true);
    try {
      const res = await client.graphql({ query: startVerification });
      applyProfile({ ...profile, verificationStatus: "PENDING" });
      await WebBrowser.openBrowserAsync(res.data.startVerification.url);
      await refresh(true);
    } catch (e) {
      console.log("START VERIFICATION ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not start",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const canStart = status !== "APPROVED" && status !== "IN_REVIEW";

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Identity verification</Text>
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={[styles.status, { color: info.color }]}>
            {info.title}
          </Text>
          <Text style={styles.text}>{info.text}</Text>
          {status === "APPROVED" && !!profile.verifiedAt && (
            <Text style={styles.meta}>
              Verified on {formatDateTime(profile.verifiedAt)}
            </Text>
          )}
        </View>
        {status === "APPROVED" && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.heading}>My verified profile</Text>
            <View style={{ marginTop: 12 }}>
              <ProfileBadge
                userId={profile.id}
                name={profile.displayName}
                size={72}
              />
            </View>
            <View style={styles.consentRow}>
              <Switch
                value={!!profile.profileVisible}
                onValueChange={onToggleVisible}
                disabled={savingVisible}
              />
              <Text style={styles.consentText}>
                Show my photo and age to other verified users when we match.
              </Text>
            </View>
            <Text style={styles.meta}>
              The photo is the selfie from your verification. Your date of birth
              and your ID document are never shown.
            </Text>
          </View>
        )}
        {canStart && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.heading}>How it works</Text>
            <Text style={styles.text}>
              You scan a valid ID card, passport or driver's licence, record a
              short selfie video and we compare your face with the document.
            </Text>
            <Text style={[styles.text, { marginTop: 8 }]}>
              The check is done by our verification provider Didit. Your
              documents and face data are processed by Didit. This app only
              stores the result (status and date).
            </Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.link}>Didit Verification Privacy Notice</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.link}>Didit End User Terms</Text>
            </Pressable>

            <View style={styles.consentRow}>
              <Switch value={consent} onValueChange={setConsent} />
              <Text style={styles.consentText}>
                I agree that my ID document and my face are processed to verify
                my identity.
              </Text>
            </View>

            <Pressable
              style={[styles.button, (!consent || busy) && { opacity: 0.4 }]}
              disabled={!consent || busy}
              onPress={onStart}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {status === "PENDING"
                    ? "Continue verification"
                    : "Start verification"}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {(status === "PENDING" || status === "IN_REVIEW") && (
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
      </ScrollView>
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
  meta: { color: "#777", marginTop: 6 },
  heading: { fontSize: 17, fontWeight: "700" },
  link: { color: "#1a73e8", marginTop: 8, fontSize: 15 },
  consentRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  consentText: { flex: 1, marginLeft: 12, fontSize: 14, color: "#333" },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  secondaryText: { fontWeight: "600" },
});
