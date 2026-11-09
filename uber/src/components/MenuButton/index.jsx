import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme";

export default function MenuButton({ style }) {
  const navigation = useNavigation();
  const t = useTheme();
  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      hitSlop={12}
      style={style}
    >
      <Ionicons name="menu" size={28} color={t.headerText} />
    </Pressable>
  );
}
