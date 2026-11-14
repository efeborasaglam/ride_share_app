import { Text, View, Pressable, Alert } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import React from "react";
import { signOut } from "aws-amplify/auth";
import { useProfile } from "../context/ProfileContext";
import { useTheme } from "../theme";
import Logo from "../components/Logo";
import { useTranslation } from "react-i18next";

function Item({ label, onPress, color }) {
  const s = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ paddingVertical: 14, paddingHorizontal: 16 }}
    >
      <Text style={{ fontSize: 16, color: color ?? s.text }}>{label}</Text>
    </Pressable>
  );
}

export default function CustomDrawer(props) {
  const { t } = useTranslation();
  const s = useTheme();
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
      Alert.alert("Error", t("customdrawer.switcherror"));
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
          backgroundColor: s.headerBg,
          padding: 16,
          paddingTop: 56,
          borderBottomWidth: 3,
          borderBottomColor: s.primary,
        }}
      >
        <Logo size={64} />
        <View style={{ marginLeft: 14, flexShrink: 1 }}>
          <Text style={{ color: s.primary, fontSize: 18, fontWeight: "800" }}>
            RideShare
          </Text>
          <Text
            style={{
              color: s.headerText,
              fontSize: 16,
              fontWeight: "600",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {profile?.displayName}
          </Text>
          <Text style={{ color: s.muted, fontSize: 14, marginTop: 2 }}>
            {isDriver
              ? `${t("driver")}${profile?.carSeats ? ` · ${t("rolehome.seats")}: ${profile.carSeats}` : ""}`
              : t("passenger")}
          </Text>
        </View>
      </View>

      <View style={{ paddingTop: 8 }}>
        {isDriver ? (
          <>
            <Item
              label={t("customdrawer.home")}
              onPress={() => go("DriverHome")}
            />
            <Item
              label={t("rolehome.offerride")}
              onPress={() =>
                goVerified("DestinationSearch", { next: "TripDetails" })
              }
            />
            <Item label={t("rolehome.mytrips")} onPress={() => go("MyTrips")} />
            <Item
              label={t("rolehome.requests")}
              onPress={() => go("DriverRequests")}
            />
            <Item
              label={t("customdrawer.payout")}
              onPress={() => go("Payouts")}
            />
          </>
        ) : (
          <>
            <Item
              label={t("customdrawer.home")}
              onPress={() => go("PassengerHome")}
            />
            <Item
              label={t("rolehome.findaride")}
              onPress={() =>
                goVerified("DestinationSearch", { next: "MatchResults" })
              }
            />
            <Item
              label={t("rolehome.myrequests")}
              onPress={() => go("MyRequests")}
            />
          </>
        )}

        <View
          style={{ height: 1, backgroundColor: s.border, marginVertical: 8 }}
        />

        <Item
          label={t('customdrawer.verification"')}
          onPress={() => go("Verification")}
        />
        <Item
          label={`${t("customdrawer.switchto")} ${isDriver ? t("passenger") : t("driver")} ${t("customdrawer.mode")}`}
          onPress={switchRole}
        />
        {isDriver && (
          <Item
            label={t("customdrawer.changeseats")}
            onPress={() => {
              props.navigation.closeDrawer();
              openSetup("DRIVER");
            }}
          />
        )}
        <Item
          label={t("customdrawer.logout")}
          color={s.danger}
          onPress={() => signOut()}
        />
      </View>
    </DrawerContentScrollView>
  );
}
