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
      showsUserLocation={true}
      initialRegion={{
        latitude: 41.01513,
        longitude: 28.98953,
        latitudeDelta: 0.18,
        longitudeDelta: 0.12,
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
            style={{
              width: 50,
              height: 50,
              resizeMode: "contain",
              transform: [
                {
                  rotate: `${car.heading}deg`,
                },
              ],
            }}
          />
        </Marker>
      ))}
    </MapView>
  );
};

export default HomeMap;
