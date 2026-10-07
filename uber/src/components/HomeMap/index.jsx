import React from "react";
import { Image, FlatList } from "react-native";
import MapView, { Marker } from "react-native-maps";

import cars from "../../../assets/data/cars";

const HomeMap = () => {
  const getImage = (type) => {
    if (type === "UberX") {
      return require("../../../assets/top-UberX.png");
    }
    if (type === "Comfort") {
      return require("../../../assets/top-Comfort.png");
    }
    return require("../../../assets/top-UberXL.png");
  };

  return (
    <MapView
      style={{ height: "100%", width: "100%" }}
      initialRegion={{
        latitude: 40.593,
        longitude: 29.044,
        latitudeDelta: 1.8,
        longitudeDelta: 1.2,
      }}
    >
      {cars.map((car, index) => (
        <Marker
          key={car.id}
          coordinate={{ latitude: car.latitude, longitude: car.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Image
            source={getImage(car.type)}
            style={{ width: 50, height: 50, resizeMode: "contain" }}
          />
        </Marker>
      ))}
    </MapView>
  );
};

export default HomeMap;
