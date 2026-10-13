import React from "react";

import MapView, { Marker } from "react-native-maps";
import { MapViewRoute } from "react-native-maps-routes";

const RouteMap = ({ origin, destination }) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_KEY;

  // Bursa -> Kadıköy, Istanbul
  const originLoc = {
    latitude: origin.details.geometry.location.lat,
    longitude: origin.details.geometry.location.lng,
  };

  const destinationLoc = {
    latitude: destination.details.geometry.location.lat,
    longitude: destination.details.geometry.location.lng,
  };

  return (
    <MapView
      style={{ height: "100%", width: "100%" }}
      showsUserLocation={true}
      initialRegion={{
        latitude: 40.593,
        longitude: 29.044,
        latitudeDelta: 1.8,
        longitudeDelta: 1.2,
      }}
    >
      <MapViewRoute
        strokeColor={"blue"}
        strokeWidth={5}
        origin={originLoc}
        destination={destinationLoc}
        apiKey={apiKey}
      />
      <Marker coordinate={originLoc} title={"origin"} />
      <Marker coordinate={destinationLoc} title={"destination"} />
    </MapView>
  );
};

export default RouteMap;
