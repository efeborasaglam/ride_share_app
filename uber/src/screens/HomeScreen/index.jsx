import React from "react";
import { View, Text, Dimensions } from "react-native";
import HomeMap from "../../components/HomeMap";
import CovideMessage from "../../components/CovidMessage";
import HomeSearch from "../../components/HomeSearch";

const HomeScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: Dimensions.get("window").height - 400 }}>
        <HomeMap />
      </View>
      {/*    Covid MEssage*/}
      <CovideMessage />
      {/*    Bottom Coomponent*/}
      <HomeSearch />
    </View>
  );
};
export default HomeScreen;
