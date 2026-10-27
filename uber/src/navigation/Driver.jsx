import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoleHome from "../screens/RoleHome";
import DestinationSearch from "../screens/DestinationSearch";
import TripDetails from "../screens/TripDetails";
import MyTrips from "../screens/MyTrips";
import DriverRequests from "../screens/DriverRequests";
import RequestDetails from "../screens/RequestDetails";
import Chat from "../screens/Chat";
import Verification from "../screens/Verification";
import Payouts from "../screens/Payout";

const Stack = createNativeStackNavigator();

export default function DriverNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="DriverHome"
    >
      <Stack.Screen name="DriverHome" component={RoleHome} />
      <Stack.Screen name="DestinationSearch" component={DestinationSearch} />
      <Stack.Screen name="TripDetails" component={TripDetails} />
      <Stack.Screen name="MyTrips" component={MyTrips} />
      <Stack.Screen name="DriverRequests" component={DriverRequests} />
      <Stack.Screen name="RequestDetails" component={RequestDetails} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="Verification" component={Verification} />
      <Stack.Screen name="Payouts" component={Payouts} />
    </Stack.Navigator>
  );
}
