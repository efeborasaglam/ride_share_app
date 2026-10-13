import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import CustomDrawer from "./CustomDrawer";
import AuthScreen from "../screens/login/AuthScreen";
import OnboardingScreen from "../screens/Onboarding";
import RoleHome from "../screens/RoleHome";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import DriverNavigator from "./Driver";
import PassengerNavigator from "./Passenger";

const Drawer = createDrawerNavigator();

function HomeSwitch() {
  const { profile } = useProfile();
  return profile.role === "DRIVER" ? (
    <DriverNavigator />
  ) : (
    <PassengerNavigator />
  );
}

function SignedInApp() {
  const { profile, loading, error, reload, setupRole } = useProfile();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 16, marginBottom: 16 }}>{error}</Text>
        <Pressable onPress={reload}>
          <Text style={{ color: "#1a73e8", fontSize: 16 }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!profile || setupRole !== null) return <OnboardingScreen />;

  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Drawer.Screen name="Home" component={HomeSwitch} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  const [auth, setAuth] = useState("loading"); // loading | in | out

  useEffect(() => {
    getCurrentUser()
      .then(() => setAuth("in"))
      .catch(() => setAuth("out"));

    const stop = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") setAuth("in");
      if (payload.event === "signedOut") setAuth("out");
    });
    return stop;
  }, []);

  if (auth === "loading") {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (auth === "out") return <AuthScreen />;

  return (
    <ProfileProvider>
      <SignedInApp />
    </ProfileProvider>
  );
}
