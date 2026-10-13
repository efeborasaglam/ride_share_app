import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeMap from "../../components/HomeMap";
import { useProfile } from "../../context/ProfileContext";

export default function RoleHome() {
  const { profile } = useProfile();
  const navigation = useNavigation();
  const isDriver = profile.role === "DRIVER";

  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: "#000", padding: 16, paddingTop: 56 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          {isDriver ? "Driver mode" : "Passenger mode"}
        </Text>
        <Text style={{ color: "#bbb", marginTop: 2 }}>
          {profile.displayName}
          {isDriver ? ` · ${profile.carType}` : ""}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <HomeMap />
      </View>

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
                navigation.navigate("DestinationSearch", {
                  next: "TripDetails",
                })
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
                navigation.navigate("DestinationSearch", {
                  next: "MatchResults",
                })
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
