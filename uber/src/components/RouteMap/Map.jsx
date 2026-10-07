import { StyleSheet, Text, View } from "react-native";
import React from "react";
import MapView from "react-native-maps";

export default function Map() {
  return (
    <View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 47.4245,
          longitude: 9.3767,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  map: { width: "100%", height: 300 },
});
