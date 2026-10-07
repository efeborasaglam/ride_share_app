import { StyleSheet, Text, View, Image } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";

export default function UberTypeRow(props) {
  const { type } = props;

  const getImage = () => {
    if (type.type === "UberX") {
      return require("../../../assets/UberX.jpeg");
    }
    if (type.type === "Comfort") {
      return require("../../../assets/Comfort.jpeg");
    }
    return require("../../../assets/UberXL.jpeg");
  };

  return (
    <View style={styles.container}>
      {/*Image*/}
      <Image style={styles.image} source={getImage()} />
      <View style={styles.middleContainer}>
        <Text style={styles.type}>
          {type.type}
          <Ionicons name={"person"} size={16} /> 3
        </Text>
        <Text style={styles.time}>8:03PM Drop Off</Text>
      </View>
      <View style={styles.rightContainer}>
        <Ionicons name={"pricetag"} size={18} color={"#42d742"} />
        <Text style={styles.price}>est. {type.price}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  image: {
    height: 70,
    width: 80,
    resizeMode: "contain",
  },
  middleContainer: {
    flex: 1,
    marginHorizontal: 10,
    justifyContent: "space-between",
  },
  time: {
    color: "#5d5d5d",
  },
  type: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 5,
  },
  rightContainer: {
    width: 100,
    alignItems: "flex-end",
    flexDirection: "row",
  },
  price: {
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 5,
  },
});
