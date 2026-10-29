import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import CustomDrawer from "./CustomDrawer";
import AuthScreen from "../screens/login/AuthScreen";
import OnboardingScreen from "../screens/Onboarding";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import DriverNavigator from "./Driver";
import PassengerNavigator from "./Passenger";
import { checkIsAdmin } from "../utils/admin";
import AdminPanel from "../screens/Admin";

const Drawer = createDrawerNavigator();

function HomeSwitch() {
  const { profile } = useProfile();
  return profile.role === "DRIVER" ? (
    <DriverNavigator />
  ) : (
    <PassengerNavigator />
  );
}

function AdminApp() {
  return (
    <View style={{ flex: 1 }}>
      <AdminPanel />
      <Pressable
        onPress={() => signOut()}
        style={{
          position: "absolute",
          top: 56,
          right: 16,
          backgroundColor: "#fff",
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 16,
        }}
      >
        <Text style={{ fontWeight: "600" }}>Sign out</Text>
      </Pressable>
    </View>
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
  const [isAdmin, setIsAdmin] = useState(null); // null = noch nicht geprüft

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

  useEffect(() => {
    setIsAdmin(null);
    if (auth === "in") {
      checkIsAdmin().then(setIsAdmin);
    }
  }, [auth]);

  if (auth === "loading" || (auth === "in" && isAdmin === null)) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (auth === "out") return <AuthScreen />;

  if (isAdmin) return <AdminApp />;

  return (
    <ProfileProvider>
      <SignedInApp />
    </ProfileProvider>
  );
}
