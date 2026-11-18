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
import { fetchUserAttributes } from "aws-amplify/auth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  startPayoutOnboarding,
  refreshPayoutStatus,
} from "../../graphql/operations";
import { useProfile } from "../../context/ProfileContext";
import { useTheme, useThemedStyles } from "../../theme";
import ScreenHeader from "../../components/ScreenHeader";
import { useTranslation } from "react-i18next";

const client = generateClient();

export default function Payouts() {
  const { t } = useTranslation();

  const s = useTheme();
  const styles = useThemedStyles(makeStyles);
  const navigation = useNavigation();
  const { profile, applyProfile } = useProfile();
  const ready = !!profile.payoutsReady;
  const verified = profile.verificationStatus === "APPROVED";
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(
    async (silent = false) => {
      const { t } = useTranslation();

      setChecking(true);
      try {
        const res = await client.graphql({ query: refreshPayoutStatus });
        applyProfile((prev) => ({ ...prev, ...res.data.refreshPayoutStatus }));
      } catch (e) {
        console.log(`${t("payouts.refresherror")}:`, e.errors ?? e);
        if (!silent) {
          Alert.alert(
            t("payouts.couldnotcheckstatus"),
            e.errors?.[0]?.message ?? t("myrequests.tryagain"),
          );
        }
      } finally {
        setChecking(false);
      }
    },
    [applyProfile],
  );

  const onStart = async () => {
    const { t } = useTranslation();

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
      console.log(`${t("payouts.payouterror")}:`, e.errors ?? e);
      Alert.alert(
        t("payouts.couldnotstart"),
        e.errors?.[0]?.message ?? t("myrequests.tryagain"),
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
    <View style={styles.screen}>
      <ScreenHeader
        title={t("customdrawer.payout")}
        onBack={() => navigation.goBack()}
      />

      <View style={{ padding: 16 }}>
        <View style={styles.card}>
          <Text
            style={[styles.status, { color: ready ? s.accent : s.primary }]}
          >
            {ready ? t("payouts.active") : t("payouts.notsetup")}
          </Text>
          <Text style={styles.text}>
            {ready ? t("payouts.offerrides") : t("payouts.offerrides.descr")}
          </Text>
        </View>

        <Text style={[styles.text, { marginTop: 16 }]}>
          {t("payouts.keep")}
        </Text>

        {!ready && !verified && (
          <Text style={styles.warn}>{t("payouts.verify")}</Text>
        )}

        {!ready && verified && (
          <Pressable
            style={[styles.button, busy && { opacity: 0.4 }]}
            disabled={busy}
            onPress={onStart}
          >
            {busy ? (
              <ActivityIndicator color={s.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t("rolehome.setuppayout")}</Text>
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
              <ActivityIndicator color={s.primary} />
            ) : (
              <Text style={styles.secondaryText}>
                {t("payouts.checkstatus")}
              </Text>
            )}
          </Pressable>
        )}
      </View>
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
    warn: { color: t.danger, marginTop: 16 },
    button: {
      backgroundColor: t.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 16,
    },
    buttonText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
    secondary: {
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      backgroundColor: t.chip,
      alignItems: "center",
    },
    secondaryText: { fontWeight: "600", color: t.chipText },
  });
