import { StyleSheet, Text, View } from "react-native";
import React from "react";
import MapView from "react-native-maps";

export default function Map() {
  return (
    <View>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 40.593,
          longitude: 29.044,
          latitudeDelta: 1.8,
          longitudeDelta: 1.2,
        }}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  map: { width: "100%", height: 300 },
});
