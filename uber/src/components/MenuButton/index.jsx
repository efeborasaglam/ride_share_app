import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";

export default function MenuButton({ dark = false, style }) {
  const navigation = useNavigation();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={12}
      style={style}
    >
      <Ionicons name="menu" size={28} color={dark ? "#000" : "#fff"} />
    </Pressable>
  );
}
