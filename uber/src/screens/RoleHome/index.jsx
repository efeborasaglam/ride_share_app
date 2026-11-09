import React from "react";
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeMap from "../../components/HomeMap";
import MenuButton from "../../components/MenuButton";
import Logo from "../../components/Logo";
import { useProfile } from "../../context/ProfileContext";
import { useThemedStyles } from "../../theme";

export default function RoleHome() {
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const navigation = useNavigation();
  const isDriver = profile.role === "DRIVER";
  const verified = profile.verificationStatus === "APPROVED";
  const ready = verified && !!profile.profileVisible;

  const goVerified = (screen, params) => {
    if (!verified) {
      Alert.alert(
        "Verification required",
        `Please verify your identity before you ${isDriver ? "offer" : "request"} rides.`,
        [
          { text: "Later", style: "cancel" },
          {
            text: "Verify now",
            onPress: () => navigation.navigate("Verification"),
          },
        ],
      );
      return;
    }
    if (isDriver && !profile.payoutsReady) {
      Alert.alert(
        "Set up payouts",
        "To offer rides you need a payout account.",
        [
          { text: "Later", style: "cancel" },
          { text: "Set up", onPress: () => navigation.navigate("Payouts") },
        ],
      );
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
            {isDriver ? "Driver mode" : "Passenger mode"}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {profile.displayName}
            {isDriver && profile.carSeats
              ? ` · Seats: ${profile.carSeats}`
              : ""}
            {verified ? " · Verified ✓" : ""}
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
              ? "Turn on photo and age sharing to use rides ›"
              : `Verify your identity to ${isDriver ? "offer" : "request"} rides ›`}
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
              <Text style={styles.primaryText}>Offer a ride</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("DriverRequests")}
            >
              <Text style={styles.linkText}>Requests</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("MyTrips")}
            >
              <Text style={styles.linkText}>My trips</Text>
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
              <Text style={styles.primaryText}>Find a ride</Text>
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => navigation.navigate("MyRequests")}
            >
              <Text style={styles.linkText}>My requests</Text>
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
