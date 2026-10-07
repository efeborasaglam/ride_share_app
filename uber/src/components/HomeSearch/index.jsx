import React from "react";
import { Text, View } from "react-native";
import { AntDesign, Entypo, MaterialIcons } from "@expo/vector-icons";
import styles from "./styles";

const HomeSearch = () => {
  return (
    <View>
      {/*  input box*/}
      <View style={styles.inputBox}>
        <Text style={styles.inputText}>Where to?</Text>
        <View style={styles.timeContainer}>
          <AntDesign name={"clock-circle"} size={16} color={"#535353"} />
          <Text>Now</Text>
          <MaterialIcons name={"keyboard-arrow-down"} size={16} />
        </View>
      </View>
      {/*  previs destination*/}

      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <AntDesign name={"clock-circle"} size={20} color={"#fff"} />
        </View>
        <Text style={styles.destinationText}>Spin Nightclub</Text>
      </View>

      {/*  home destinatin*/}
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: "#218cff" }]}>
          <Entypo name={"home"} size={20} color={"#fff"} />
        </View>
        <Text style={styles.destinationText}>Spin Nightclub</Text>
      </View>
    </View>
  );
};
export default HomeSearch;
