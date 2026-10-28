import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeMap from "../../components/HomeMap";
import MenuButton from "../../components/MenuButton";
import { useProfile } from "../../context/ProfileContext";

export default function RoleHome() {
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
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ backgroundColor: "#000", padding: 16, paddingTop: 56 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          {isDriver ? "Driver mode" : "Passenger mode"}
        </Text>
        <Text style={{ color: "#bbb", marginTop: 2 }}>
          {profile.displayName}
          {isDriver ? ` · Seats: ${profile.carSeats}` : ""}
          {verified ? " · Verified ✓" : ""}
        </Text>
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
      </View>

      {/* Verification hint */}
      {!ready && (
        <Pressable
          onPress={() => navigation.navigate("Verification")}
          style={{
            backgroundColor: "#fff3e0",
            paddingVertical: 10,
            paddingHorizontal: 16,
          }}
        >
          <Text style={{ color: "#e65100", fontWeight: "600" }}>
            {verified
              ? "Turn on photo and age sharing to use rides ›"
              : `Verify your identity to ${isDriver ? "offer" : "request"} rides ›`}{" "}
          </Text>
        </Pressable>
      )}

      {/* Map */}
      <View style={{ flex: 1 }}>
        <HomeMap />
      </View>

      {/* Actions */}
      <View style={{ padding: 16, paddingBottom: 32, backgroundColor: "#fff" }}>
        {isDriver ? (
          <>
            <Pressable
              style={{
                backgroundColor: "#000",
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() =>
                goVerified("DestinationSearch", { next: "TripDetails" })
              }
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Offer a ride
              </Text>
            </Pressable>
            <Pressable
              style={{ padding: 14, alignItems: "center" }}
              onPress={() => navigation.navigate("DriverRequests")}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>Requests</Text>
            </Pressable>
            <Pressable
              style={{ padding: 14, alignItems: "center" }}
              onPress={() => navigation.navigate("MyTrips")}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>My trips</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={{
                backgroundColor: "#000",
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={() =>
                goVerified("DestinationSearch", { next: "MatchResults" })
              }
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Find a ride
              </Text>
            </Pressable>
            <Pressable
              style={{ padding: 14, alignItems: "center" }}
              onPress={() => navigation.navigate("MyRequests")}
            >
              <Text style={{ fontSize: 16, fontWeight: "600" }}>
                My requests
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
