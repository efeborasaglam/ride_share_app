import React, { useEffect, useState, useRef } from "react";
import { Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { generateClient } from "aws-amplify/api";
import { listCars } from "../../graphql/operations";

const client = generateClient();

const FALLBACK_REGION = {
  latitude: 46.8,
  longitude: 8.2,
  latitudeDelta: 3,
  longitudeDelta: 3,
};

const HomeMap = () => {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [coords, setCoords] = useState(null);
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

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const last = await Location.getLastKnownPositionAsync();
        const pos =
          last ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (e) {
        console.log("LOCATION ERROR:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (coords && mapReady) {
      mapRef.current?.animateToRegion(
        { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 },
        600,
      );
    }
  }, [coords, mapReady]);

  return (
    <MapView
      ref={mapRef}
      style={{ height: "100%", width: "100%" }}
      showsUserLocation={true}
      showsMyLocationButton={true}
      onMapReady={() => setMapReady(true)}
      initialRegion={FALLBACK_REGION}
    >
      {/*{cars*/}
      {/*  .filter((car) => car.latitude != null && car.longitude != null)*/}
      {/*  .map((car) => (*/}
      {/*    <Marker*/}
      {/*      key={car.id}*/}
      {/*      coordinate={{ latitude: car.latitude, longitude: car.longitude }}*/}
      {/*      anchor={{ x: 0.5, y: 0.5 }}*/}
      {/*    >*/}
      {/*      <Image*/}
      {/*        source={getImage(car.type)}*/}
      {/*        style={{*/}
      {/*          width: 50,*/}
      {/*          height: 50,*/}
      {/*          resizeMode: "contain",*/}
      {/*          transform: [{ rotate: `${car.heading ?? 0}deg` }],*/}
      {/*        }}*/}
      {/*      />*/}
      {/*    </Marker>*/}
      {/*  ))}*/}
    </MapView>
  );
};

export default HomeMap;
