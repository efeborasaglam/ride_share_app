import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoleHome from "../screens/RoleHome";
import DestinationSearch from "../screens/DestinationSearch";
import TripDetails from "../screens/TripDetails";
import MyTrips from "../screens/MyTrips";
import DriverRequests from "../screens/DriverRequests";
import RequestDetails from "../screens/RequestDetails";

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
    </Stack.Navigator>
  );
}
