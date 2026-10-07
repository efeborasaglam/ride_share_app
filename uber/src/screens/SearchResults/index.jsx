import { StyleSheet, Text, View, Dimensions } from "react-native";
import React from "react";
import HomeMap from "../../components/HomeMap";
import UberTypes from "../../components/UberTypes";
import RouteMap from "../../components/RouteMap";

export default function SearchResults() {
  return (
    <View style={{ display: "flex", justifyContent: "space-between" }}>
      <View style={{ height: Dimensions.get("window").height - 400 }}>
        <RouteMap />
      </View>
      <View style={{ height: 400 }}>
        <UberTypes />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({});
