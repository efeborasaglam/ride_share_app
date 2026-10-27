import { Text, View, Pressable, Alert } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import React from "react";
import { signOut } from "aws-amplify/auth";
import { useProfile } from "../context/ProfileContext";

function Item({ label, onPress, color = "#000" }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingVertical: 14, paddingHorizontal: 16 }}
    >
      <Text style={{ fontSize: 16, color }}>{label}</Text>
    </Pressable>
  );
}

export default function CustomDrawer(props) {
  const { profile, save, openSetup } = useProfile();
  const isDriver = profile?.role === "DRIVER";
  const verified =
    profile?.verificationStatus === "APPROVED" && !!profile?.profileVisible;
  const goVerified = (screen, params) =>
    verified ? go(screen, params) : go("Verification");
  const targetRole = isDriver ? "PASSENGER" : "DRIVER";

  const go = (screen, params) => {
    props.navigation.navigate("Home", params ? { screen, params } : { screen });
    props.navigation.closeDrawer();
  };

  const switchRole = async () => {
    if (targetRole === "DRIVER" && !profile.carType) {
      props.navigation.closeDrawer();
      openSetup("DRIVER"); // driver needs a car first
      return;
    }
    try {
      await save({
        displayName: profile.displayName,
        role: targetRole,
        carType: profile.carType ?? null,
      });
      props.navigation.closeDrawer();
    } catch (e) {
      console.log("SWITCH ROLE ERROR:", e.errors ?? e);
      Alert.alert("Error", "Could not switch role. Please try again.");
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ backgroundColor: "#212121", padding: 15 }}>
        <Text style={{ color: "white", fontSize: 22 }}>
          {profile?.displayName}
        </Text>
        <Text style={{ color: "lightgrey", fontSize: 16, marginTop: 4 }}>
          {isDriver ? `Driver · ${profile?.carType}` : "Passenger"}
        </Text>
      </View>

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

      <View style={{ height: 1, backgroundColor: "#ddd", marginVertical: 8 }} />
      <Item label="Verification" onPress={() => go("Verification")} />
      <Item
        label={`Switch to ${isDriver ? "passenger" : "driver"} mode`}
        onPress={switchRole}
      />
      {isDriver && (
        <Item
          label="Change car"
          onPress={() => {
            props.navigation.closeDrawer();
            openSetup("DRIVER");
          }}
        />
      )}
      <Item label="Log out" color="#c62828" onPress={() => signOut()} />
    </DrawerContentScrollView>
  );
}
