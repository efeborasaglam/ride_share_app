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
  setProfileVisibility,
} from "../../graphql/operations";
import { useProfile } from "../../context/ProfileContext";
import { formatDateTime } from "../../utils/format";
import ProfileBadge from "../../components/ProfileBadge";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme, useThemedStyles } from "../../theme";

const client = generateClient();

const PRIVACY_URL = "https://didit.me/terms/verification-privacy-notice";
const TERMS_URL = "https://didit.me/terms/identity-verification";

// colorKey verweist auf eine Farbe im Theme
const INFO = {
  NONE: {
    title: "Not verified",
    text: "Verify your identity to offer or request rides.",
    colorKey: "muted",
  },
  PENDING: {
    title: "Verification in progress",
    text: "Finish the steps in the verification window, then check your status.",
    colorKey: "primary",
  },
  IN_REVIEW: {
    title: "Being reviewed",
    text: "Your documents are being checked manually. Check again later.",
    colorKey: "primary",
  },
  APPROVED: {
    title: "Verified",
    text: "Your identity is verified.",
    colorKey: "accent",
  },
  DECLINED: {
    title: "Verification failed",
    text: "We could not verify your identity. You can try again with a valid document.",
    colorKey: "danger",
  },
  EXPIRED: {
    title: "Verification expired",
    text: "Your verification session expired. Please start again.",
    colorKey: "danger",
  },
};

export default function Verification() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
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
        applyProfile((prev) => ({ ...prev, ...res.data.refreshVerification }));
      } catch (e) {
        console.log("REFRESH VERIFICATION ERROR:", e.errors ?? e);
        const msg = e.errors?.[0]?.message ?? "Please try again.";
        if (!silent) Alert.alert("Could not check status", msg);
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
      const msg = e.errors?.[0]?.message ?? "Please try again.";
      if (msg.includes("already verified")) {
        await refresh(true); // sync the status from the server
      } else {
        Alert.alert("Could not start", msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const canStart = status !== "APPROVED" && status !== "IN_REVIEW";

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Identity verification"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={[styles.status, { color: t[info.colorKey] }]}>
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
                trackColor={{ true: t.primary, false: t.border }}
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
              <Switch
                value={consent}
                onValueChange={setConsent}
                trackColor={{ true: t.primary, false: t.border }}
              />
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
                <ActivityIndicator color={t.onPrimary} />
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
              <ActivityIndicator color={t.primary} />
            ) : (
              <Text style={styles.secondaryText}>Check status</Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    card: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
    },
    status: { fontSize: 20, fontWeight: "700" },
    text: { color: t.muted, marginTop: 6, fontSize: 15 },
    meta: { color: t.muted, marginTop: 6 },
    heading: { fontSize: 17, fontWeight: "700", color: t.text },
    link: { color: t.primary, marginTop: 8, fontSize: 15, fontWeight: "600" },
    consentRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
    consentText: { flex: 1, marginLeft: 12, fontSize: 14, color: t.text },
    button: {
      backgroundColor: t.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 16,
    },
    buttonText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
    secondary: {
      marginTop: 16,
      padding: 12,
      borderRadius: 10,
      backgroundColor: t.chip,
      alignItems: "center",
    },
    secondaryText: { fontWeight: "600", color: t.chipText },
  });
