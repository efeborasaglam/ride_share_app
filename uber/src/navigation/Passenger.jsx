import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RoleHome from "../screens/RoleHome";
import DestinationSearch from "../screens/DestinationSearch";
import MatchResults from "../screens/MatchResults";
import MyRequests from "../screens/MyRequest";

const Stack = createNativeStackNavigator();

export default function PassengerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="PassengerHome"
    >
      <Stack.Screen name="PassengerHome" component={RoleHome} />
      <Stack.Screen name="DestinationSearch" component={DestinationSearch} />
      <Stack.Screen name="MatchResults" component={MatchResults} />
      <Stack.Screen name="MyRequests" component={MyRequests} />
    </Stack.Navigator>
  );
}
