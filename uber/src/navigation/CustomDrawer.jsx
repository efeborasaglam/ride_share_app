import { Text, View, Pressable, Alert } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import React from "react";
import { signOut } from "aws-amplify/auth";
import { useProfile } from "../context/ProfileContext";
import { useTheme } from "../theme";
import Logo from "../components/Logo";

function Item({ label, onPress, color }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingVertical: 14, paddingHorizontal: 16 }}
    >
      <Text style={{ fontSize: 16, color: color ?? t.text }}>{label}</Text>
    </Pressable>
  );
}

export default function CustomDrawer(props) {
  const t = useTheme();
  const { profile, save, openSetup } = useProfile();
  const isDriver = profile?.role === "DRIVER";
  const verified =
    profile?.verificationStatus === "APPROVED" && !!profile?.profileVisible;

  const go = (screen, params) => {
    props.navigation.navigate("Home", params ? { screen, params } : { screen });
    props.navigation.closeDrawer();
  };
  const goVerified = (screen, params) =>
    verified ? go(screen, params) : go("Verification");

  const targetRole = isDriver ? "PASSENGER" : "DRIVER";

  const switchRole = async () => {
    if (targetRole === "DRIVER" && !profile.carSeats) {
      props.navigation.closeDrawer();
      openSetup("DRIVER"); // Fahrer müssen zuerst die Sitzplätze angeben
      return;
    }
    try {
      await save({
        displayName: profile.displayName,
        role: targetRole,
        carType: null,
        carSeats: profile.carSeats ?? null,
      });
      props.navigation.closeDrawer();
    } catch (e) {
      console.log("SWITCH ROLE ERROR:", e.errors ?? e);
      Alert.alert("Error", "Could not switch role. Please try again.");
    }
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ paddingTop: 0 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.headerBg,
          padding: 16,
          paddingTop: 56,
          borderBottomWidth: 3,
          borderBottomColor: t.primary,
        }}
      >
        <Logo size={64} />
        <View style={{ marginLeft: 14, flexShrink: 1 }}>
          <Text style={{ color: t.primary, fontSize: 18, fontWeight: "800" }}>
            RideShare
          </Text>
          <Text
            style={{
              color: t.headerText,
              fontSize: 16,
              fontWeight: "600",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {profile?.displayName}
          </Text>
          <Text style={{ color: t.muted, fontSize: 14, marginTop: 2 }}>
            {isDriver
              ? `Driver${profile?.carSeats ? ` · Seats: ${profile.carSeats}` : ""}`
              : "Passenger"}
          </Text>
        </View>
      </View>

      <View style={{ paddingTop: 8 }}>
        {isDriver ? (
          <>
            <Item label="Home" onPress={() => go("DriverHome")} />
            <Item
              label="Offer a ride"
              onPress={() =>
                goVerified("DestinationSearch", { next: "TripDetails" })
              }
            />
            <Item label="My trips" onPress={() => go("MyTrips")} />
            <Item label="Requests" onPress={() => go("DriverRequests")} />
            <Item label="Payouts" onPress={() => go("Payouts")} />
          </>
        ) : (
          <>
            <Item label="Home" onPress={() => go("PassengerHome")} />
            <Item
              label="Find a ride"
              onPress={() =>
                goVerified("DestinationSearch", { next: "MatchResults" })
              }
            />
            <Item label="My requests" onPress={() => go("MyRequests")} />
          </>
        )}

        <View
          style={{ height: 1, backgroundColor: t.border, marginVertical: 8 }}
        />

        <Item label="Verification" onPress={() => go("Verification")} />
        <Item
          label={`Switch to ${isDriver ? "passenger" : "driver"} mode`}
          onPress={switchRole}
        />
        {isDriver && (
          <Item
            label="Change car seats"
            onPress={() => {
              props.navigation.closeDrawer();
              openSetup("DRIVER");
            }}
          />
        )}
        <Item label="Log out" color={t.danger} onPress={() => signOut()} />
      </View>
    </DrawerContentScrollView>
  );
}
