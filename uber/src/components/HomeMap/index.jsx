import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { generateClient } from "aws-amplify/api";
import { listCars } from "../../graphql/operations";

const client = generateClient();

const getImage = (type) => {
  if (type === "UberX") return require("../../../assets/top-UberX.png");
  if (type === "Comfort") return require("../../../assets/top-Comfort.png");
  return require("../../../assets/top-UberXL.png");
};

const HomeMap = () => {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await client.graphql({ query: listCars });
        setCars(res.data.listCars ?? []);
      } catch (e) {
        console.log("LISTCARS ERROR:", e.errors ?? e);
      }
    })();
  }, []);

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
      {cars
        .filter((car) => car.latitude != null && car.longitude != null)
        .map((car) => (
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
                transform: [{ rotate: `${car.heading ?? 0}deg` }],
              }}
            />
          </Marker>
        ))}
    </MapView>
  );
};

export default HomeMap;
