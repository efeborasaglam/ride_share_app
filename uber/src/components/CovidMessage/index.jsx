import React from "react";
import { Text, View } from "react-native";
import styles from "../../styles";

const CovideMessage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel only if neccarsary</Text>
      <Text style={styles.text}>
        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy
        eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam
      </Text>
      <Text style={styles.learnMore}>Learn More</Text>
    </View>
  );
};
export default CovideMessage;
