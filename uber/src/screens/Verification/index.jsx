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
import { useTranslation } from "react-i18next";

const client = generateClient();

const PRIVACY_URL = "https://didit.me/terms/verification-privacy-notice";
const TERMS_URL = "https://didit.me/terms/identity-verification";

export default function Verification() {
  const { t } = useTranslation();

  const INFO = {
    NONE: {
      title: t("verification.title.none"),
      text: t("verification.text.none"),
      colorKey: "muted",
    },
    PENDING: {
      title: t("verification.title.pending"),
      text: t("verification.text.pending"),
      colorKey: "primary",
    },
    IN_REVIEW: {
      title: t("verification.title.in_review"),
      text: t("verification.text.in_review"),
      colorKey: "primary",
    },
    APPROVED: {
      title: t("verification.title.approved"),
      text: t("verification.text.approved"),
      colorKey: "accent",
    },
    DECLINED: {
      title: t("verification.title.declined"),
      text: t("verification.text.declined"),
      colorKey: "danger",
    },
    EXPIRED: {
      title: t("verification.title.expired"),
      text: t("verification.text.expired"),
      colorKey: "danger",
    },
  };

  const s = useTheme();
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
        t("verification.alert.could_not_save"),
        e.errors?.[0]?.message ?? t("verification.alert.try_again"),
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
        if (!silent)
          Alert.alert(
            t("verification.alert.could_not_save"),
            e.errors?.[0]?.message ?? t("verification.alert.try_again"),
          );
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
        Alert.alert(t("verification.alert.could_not_start"), msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const canStart = status !== "APPROVED" && status !== "IN_REVIEW";

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t("verification.screen.title")}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={[styles.status, { color: s[info.colorKey] }]}>
            {info.title}
          </Text>
          <Text style={styles.text}>{info.text}</Text>
          {status === "APPROVED" && !!profile.verifiedAt && (
            <Text style={styles.meta}>
              {t("verification.profile.verified_on")}{" "}
              {formatDateTime(profile.verifiedAt)}
            </Text>
          )}
        </View>

        {status === "APPROVED" && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.heading}>
              {t("verification.profile.heading")}
            </Text>
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
                trackColor={{ true: s.primary, false: s.border }}
              />
              <Text style={styles.consentText}>
                {t("verification.profile.visibility")}
              </Text>
            </View>
            <Text style={styles.meta}>{t("verification.profile.privacy")}</Text>
          </View>
        )}

        {canStart && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.heading}>
              {t("verification.how_it_works.heading")}
            </Text>{" "}
            <Text style={styles.text}>
              {t("verification.how_it_works.description")}
            </Text>
            <Text style={[styles.text, { marginTop: 8 }]}>
              {t("verification.how_it_works.provider")}
            </Text>
            <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={styles.link}>{t("verification.links.privacy")}</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={styles.link}>{t("verification.links.terms")}</Text>
            </Pressable>
            <View style={styles.consentRow}>
              <Switch
                value={consent}
                onValueChange={setConsent}
                trackColor={{ true: s.primary, false: s.border }}
              />
              <Text style={styles.consentText}>
                {t("verification.consent")}
              </Text>
            </View>
            <Pressable
              style={[styles.button, (!consent || busy) && { opacity: 0.4 }]}
              disabled={!consent || busy}
              onPress={onStart}
            >
              {busy ? (
                <ActivityIndicator color={s.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>
                  {status === "PENDING"
                    ? t("verification.button.continue")
                    : t("verification.button.start")}
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
              <ActivityIndicator color={s.primary} />
            ) : (
              <Text style={styles.secondaryText}>
                {t("verification.button.check_status")}
              </Text>
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
