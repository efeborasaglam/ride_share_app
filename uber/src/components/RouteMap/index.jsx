import React from "react";

import MapView, { Marker } from "react-native-maps";
import { MapViewRoute } from "react-native-maps-routes";

const RouteMap = () => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_KEY;

  // Bursa -> Kadıköy, Istanbul
  const origin = {
    latitude: 40.195,
    longitude: 29.06,
  };

  const destination = {
    latitude: 40.9917,
    longitude: 29.0277,
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
      <MapViewRoute
        strokeColor={"blue"}
        strokeWidth={5}
        origin={origin}
        destination={destination}
        apiKey={apiKey}
      />
      <Marker coordinate={origin} title={"origin"} />{" "}
      <Marker coordinate={destination} title={"destination"} />{" "}
    </MapView>
  );
};

export default RouteMap;
