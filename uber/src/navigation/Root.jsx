import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import HomeNavigator from "./Home";
import { Text, View } from "react-native";
import CustomDrawer from "./CustomDrawer";

const Drawer = createDrawerNavigator();

const Nigger = ({ name }) => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ fontSize: 30 }}>{name}</Text>
  </View>
);

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Drawer.Screen name="Home" component={HomeNavigator} />

        <Drawer.Screen name="Yaro">
          {() => <Nigger name="Yaro" />}
        </Drawer.Screen>

        <Drawer.Screen name="SOTB">
          {() => <Nigger name="SOTB" />}
        </Drawer.Screen>
        <Drawer.Screen name="Nigger">
          {() => <Nigger name="Nigger" />}
        </Drawer.Screen>

        <Drawer.Screen name="Quz">{() => <Nigger name="Quz" />}</Drawer.Screen>
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
