import { Pressable, StyleSheet, Text, View } from "react-native";
import React from "react";
import UberTypeRow from "../UberTypeRow";
import typesData from "../../../assets/data/types";
import MapView from "react-native-maps";

export default function UberTypes() {
  const confirm = () => {
    console.log("Confirmed");
  };

  return (
    <View>
      {typesData.map((type) => (
        <UberTypeRow type={type} />
      ))}
      <Pressable onPress={confirm} style={styles.pressable}>
        <Text style={styles.text}>Confirm Uber</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  pressable: {
    backgroundColor: "black",
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
