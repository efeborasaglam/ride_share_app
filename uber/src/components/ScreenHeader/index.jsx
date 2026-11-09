import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../theme";
import MenuButton from "../MenuButton";

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  menu = true,
  action,
}) {
  const t = useTheme();
  return (
    <View
      style={{
        padding: 16,
        paddingTop: 56,
        backgroundColor: t.headerBg,
        borderBottomWidth: 3,
        borderBottomColor: t.primary,
      }}
    >
      {!!onBack && (
        <Pressable onPress={onBack}>
          <Text
            style={{
              color: t.primary,
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            ‹ Back
          </Text>
        </Pressable>
      )}
      <Text
        style={{
          color: t.headerText,
          fontSize: 22,
          fontWeight: "700",
          paddingRight: 56,
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {!!subtitle && (
        <Text style={{ color: t.muted, marginTop: 2 }} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      {menu ? (
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
      ) : (
        !!action && (
          <View style={{ position: "absolute", top: 56, right: 16 }}>
            {action}
          </View>
        )
      )}
    </View>
  );
}
