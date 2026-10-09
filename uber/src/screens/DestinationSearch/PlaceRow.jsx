import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Entypo } from "@expo/vector-icons";

export default function PlaceRow({ data }) {
  console.log("yaroooo" + data);
  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        {data.description === "Home" ? (
          <Entypo name={"home"} size={20} color={"white"} />
        ) : (
          <Entypo name={"location-pin"} size={20} color={"white"} />
        )}
      </View>
      <Text style={styles.locationText}>
        {data.description || data.vicinity}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  iconContainer: {
    backgroundColor: "#a2a2a2",
    padding: 5,
    borderRadius: 50,
    marginRight: 15,
  },
  locationText: {},
});
