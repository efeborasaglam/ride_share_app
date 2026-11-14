import React from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeMap from "../../components/HomeMap";
import MenuButton from "../../components/MenuButton";
import Logo from "../../components/Logo";
import { useProfile } from "../../context/ProfileContext";
import { useThemedStyles } from "../../theme";
import { useTranslation } from "react-i18next";

export default function RoleHome() {
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const navigation = useNavigation();
  const isDriver = profile.role === "DRIVER";
  const verified = profile.verificationStatus === "APPROVED";
  const ready = verified && !!profile.profileVisible;

  const goVerified = (screen, params) => {
    if (!verified) {
      Alert.alert(
        t("rolehome.verificationrequired"),
        `${t("Please verify your identity before you")} ${isDriver ? t("rolehome.offer") : t("rolehome.request")} ${t("rolehome.requestride")}.`,
        [
          { text: t("rolehome.later"), style: "cancel" },
          {
            text: t("rolehome.verifynow"),
            onPress: () => navigation.navigate("Verification"),
          },
        ],
      );
      return;
    }
    if (isDriver && !profile.payoutsReady) {
      Alert.alert(t("rolehome.setuppayout"), t("rolehome.offerridespayout"), [
        { text: t("rolehome.later"), style: "cancel" },
        {
          text: t("rolehome.setup"),
          onPress: () => navigation.navigate("Payouts"),
        },
      ]);
      return;
    }
    navigation.navigate(screen, params);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Logo size={44} />
        <View style={styles.headerTexts}>
          <Text style={styles.title}>
            {isDriver ? t("rolehome.drivermode") : "Passenger mode"}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {profile.displayName}
            {isDriver && profile.carSeats
              ? ` · ${t("rolehome.seats")}: ${profile.carSeats}`
              : ""}
            {verified ? ` · ${t("rolehome.verified")} ✓` : ""}
          </Text>
        </View>
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
      </View>

      {!ready && (
        <Pressable
          onPress={() => navigation.navigate("Verification")}
          style={styles.hint}
        >
          <Text style={styles.hintText}>
            {verified
              ? t("rolehome.activate")
              : `${t("rolehome.idenity1")} ${isDriver ? t("rolehome.offer") : t("rolehome.request")} ${t("rolehome.requestride")} ›`}
          </Text>
        </Pressable>
      )}

      <View style={{ flex: 1 }}>
        <HomeMap />
      </View>

      <View style={styles.actions}>
        {isDriver ? (
          <>
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                goVerified("DestinationSearch", { next: "TripDetails" })
              }
            >
              <Text style={styles.primaryText}>{t("rolehome.offerride")}</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("DriverRequests")}
            >
              <Text style={styles.linkText}>{t("rolehome.requests")}</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("MyTrips")}
            >
              <Text style={styles.linkText}>{t("rolehome.mytrips")}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={styles.primaryBtn}
              onPress={() =>
                goVerified("DestinationSearch", { next: "MatchResults" })
              }
            >
              <Text style={styles.primaryText}>{t("rolehome.findaride")}</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("MyRequests")}
            >
              <Text style={styles.linkText}>{t("rolehome.myrequests")}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.headerBg,
      padding: 16,
      paddingTop: 56,
      borderBottomWidth: 3,
      borderBottomColor: t.primary,
    },
    headerTexts: { marginLeft: 12, flex: 1, paddingRight: 44 },
    title: { color: t.headerText, fontSize: 20, fontWeight: "700" },
    sub: { color: t.muted, marginTop: 2 },
    hint: {
      backgroundColor: t.chip,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    hintText: { color: t.primary, fontWeight: "700" },
    actions: { padding: 16, paddingBottom: 32, backgroundColor: t.surface },
    primaryBtn: {
      backgroundColor: t.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
    },
    primaryText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
    linkBtn: { padding: 14, alignItems: "center" },
    linkText: { fontSize: 16, fontWeight: "600", color: t.text },
  });
