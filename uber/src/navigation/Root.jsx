import React, { useEffect, useState } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
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
import { formatDateTime } from "../utils/format";
import { useTheme } from "../theme";

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

function BannedScreen({ until, reason }) {
  const t = useTheme();
  const permanent = new Date(until).getFullYear() >= 9000;
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: t.bg,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          marginBottom: 12,
          color: t.text,
        }}
      >
        Account suspended
      </Text>
      <Text style={{ fontSize: 16, textAlign: "center", color: t.muted }}>
        {permanent
          ? "Your account has been suspended permanently."
          : `Your account is suspended until ${formatDateTime(until)}.`}
      </Text>
      {!!reason && (
        <Text style={{ marginTop: 8, color: t.muted, textAlign: "center" }}>
          {reason}
        </Text>
      )}
      <Pressable onPress={() => signOut()} style={{ marginTop: 24 }}>
        <Text style={{ color: t.primary, fontSize: 16, fontWeight: "600" }}>
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}

function SignedInApp() {
  const t = useTheme();
  const { profile, loading, error, reload, setupRole } = useProfile();

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: t.primary,
      background: t.bg,
      card: t.headerBg,
      text: t.text,
      border: t.border,
    },
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", backgroundColor: t.bg }}
      >
        <ActivityIndicator size="large" color={t.primary} />
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
          backgroundColor: t.bg,
        }}
      >
        <Text style={{ fontSize: 16, marginBottom: 16, color: t.text }}>
          {error}
        </Text>
        <Pressable onPress={reload}>
          <Text style={{ color: t.primary, fontSize: 16, fontWeight: "600" }}>
            Try again
          </Text>
        </Pressable>
        <Pressable onPress={() => signOut()} style={{ marginTop: 20 }}>
          <Text style={{ color: t.danger, fontSize: 16 }}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  if (profile?.bannedUntil && new Date(profile.bannedUntil) > new Date()) {
    return (
      <BannedScreen until={profile.bannedUntil} reason={profile.banReason} />
    );
  }

  if (!profile || setupRole !== null) return <OnboardingScreen />;

  return (
    <>
      <StatusBar style={t.mode === "dark" ? "light" : "dark"} />
      <NavigationContainer theme={navTheme}>
        <Drawer.Navigator
          drawerContent={(props) => <CustomDrawer {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Drawer.Screen name="Home" component={HomeSwitch} />
        </Drawer.Navigator>
      </NavigationContainer>
    </>
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
