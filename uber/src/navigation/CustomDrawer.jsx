import { Text, View, Pressable, Alert } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import React from "react";
import { signOut } from "aws-amplify/auth";
import { useProfile } from "../context/ProfileContext";

export default function CustomDrawer(props) {
  const { profile, save, openSetup } = useProfile();
  const isDriver = profile?.role === "DRIVER";
  const targetRole = isDriver ? "PASSENGER" : "DRIVER";

  const switchRole = async () => {
    if (targetRole === "DRIVER" && !profile.carType) {
      openSetup("DRIVER"); // driver needs a car first
      return;
    }
    try {
      await save({
        displayName: profile.displayName,
        role: targetRole,
        carType: profile.carType ?? null,
      });
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

      <DrawerItemList {...props} />

      <Pressable onPress={switchRole} style={{ padding: 16 }}>
        <Text style={{ fontSize: 16 }}>
          Switch to {isDriver ? "passenger" : "driver"} mode
        </Text>
      </Pressable>

      {isDriver && (
        <Pressable onPress={() => openSetup("DRIVER")} style={{ padding: 16 }}>
          <Text style={{ fontSize: 16 }}>Change car</Text>
        </Pressable>
      )}

      <Pressable onPress={() => signOut()} style={{ padding: 16 }}>
        <Text style={{ color: "#c62828", fontSize: 16 }}>Log out</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}
