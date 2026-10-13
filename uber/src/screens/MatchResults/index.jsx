import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { generateClient } from "aws-amplify/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { listActiveTrips, createRideRequest } from "../../graphql/operations";
import { matchTrip } from "../../utils/matching";
import { formatDateTime } from "../../utils/format";
import { useProfile } from "../../context/ProfileContext";

const client = generateClient();
const RADIUS_OPTIONS = [5, 10, 20];

export default function MatchResults() {
  const route = useRoute();
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { originPlace, destinationPlace } = route.params;
  const mapRef = useRef(null);

  const pickup = useMemo(
    () => ({
      latitude: originPlace.details.geometry.location.lat,
      longitude: originPlace.details.geometry.location.lng,
    }),
    [
      originPlace.details.geometry.location.lat,
      originPlace.details.geometry.location.lng,
    ],
  );
  const dropoff = useMemo(
    () => ({
      latitude: destinationPlace.details.geometry.location.lat,
      longitude: destinationPlace.details.geometry.location.lng,
    }),
    [
      destinationPlace.details.geometry.location.lat,
      destinationPlace.details.geometry.location.lng,
    ],
  );

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [radius, setRadius] = useState(5);
  const [selectedId, setSelectedId] = useState(null);
  const [requestingId, setRequestingId] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.graphql({ query: listActiveTrips });
      setTrips(res.data.listActiveTrips ?? []);
    } catch (e) {
      console.log("LIST ACTIVE TRIPS ERROR:", e.errors ?? e);
      setError("Could not load trips.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const matches = useMemo(() => {
    const list = [];
    for (const trip of trips) {
      const match = matchTrip(trip, pickup, dropoff, radius);
      if (match) list.push({ trip, match });
    }
    list.sort(
      (x, y) =>
        x.match.pickupOffKm +
        x.match.dropoffOffKm -
        (y.match.pickupOffKm + y.match.dropoffOffKm),
    );
    return list;
  }, [trips, pickup, dropoff, radius]);

  const selected = matches.find((m) => m.trip.id === selectedId);

  useEffect(() => {
    if (!mapReady) return;
    const points = [
      pickup,
      dropoff,
      ...(selected ? selected.match.coords : []),
    ];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [mapReady, selectedId, pickup, dropoff]);

  const sendRequest = async (trip) => {
    setRequestingId(trip.id);
    try {
      const res = await client.graphql({
        query: createRideRequest,
        variables: {
          input: {
            tripId: trip.id,
            passengerName: profile.displayName,
            pickupName: originPlace.data?.description ?? "Pickup",
            pickupLatitude: pickup.latitude,
            pickupLongitude: pickup.longitude,
            dropoffName: destinationPlace.data?.description ?? "Drop-off",
            dropoffLatitude: dropoff.latitude,
            dropoffLongitude: dropoff.longitude,
          },
        },
      });
      if (!res.data.createRideRequest) {
        throw new Error("Server hat keinen Request erstellt.");
      }
      navigation.popToTop();
      navigation.navigate("MyRequests");
    } catch (e) {
      console.log("REQUEST ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not send request",
        e.errors?.[0]?.message ?? e.message ?? "Please try again.",
      );
    } finally {
      setRequestingId(null);
    }
  };

  const onRequest = (trip) => {
    console.log("onRequest tap", trip.id);
    Alert.alert(
      "Request this ride?",
      `${trip.driverName ?? "The driver"} will see your pickup location and can accept or decline.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send request", onPress: () => sendRequest(trip) },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ height: 260 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          onMapReady={() => setMapReady(true)}
          initialRegion={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            latitudeDelta: 1.5,
            longitudeDelta: 1.5,
          }}
        >
          {matches.map(({ trip, match }) => (
            <Polyline
              key={trip.id}
              coordinates={match.coords}
              strokeColor={trip.id === selectedId ? "blue" : "#9e9e9e"}
              strokeWidth={trip.id === selectedId ? 5 : 3}
            />
          ))}
          <Marker coordinate={pickup} title="Pickup" pinColor="green" />
          <Marker coordinate={dropoff} title="Drop-off" />
        </MapView>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Search radius</Text>
        {RADIUS_OPTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setRadius(r)}
            style={[styles.chip, radius === r && styles.chipActive]}
          >
            <Text style={[styles.chipText, radius === r && { color: "#fff" }]}>
              {r} km
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : error ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.trip.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No drivers on your route yet. Try a larger radius or check back
              later.
            </Text>
          }
          renderItem={({ item: { trip, match } }) => (
            <Pressable
              onPress={() => setSelectedId(trip.id)}
              style={[styles.card, trip.id === selectedId && styles.cardActive]}
            >
              <Text style={styles.driver}>
                {trip.driverName ?? "Driver"} · {trip.carType}
              </Text>
              <Text style={styles.route} numberOfLines={2}>
                {trip.originName} → {trip.destName}
              </Text>
              <Text style={styles.meta}>
                {formatDateTime(trip.departureAt)} · {trip.seats} seat
                {trip.seats === 1 ? "" : "s"}
              </Text>
              <Text style={styles.meta}>
                Pickup {match.pickupOffKm.toFixed(1)} km from route · Ride about{" "}
                {Math.round(match.rideKm)} km
              </Text>
              <Pressable
                style={[
                  styles.button,
                  requestingId === trip.id && { opacity: 0.4 },
                ]}
                disabled={requestingId === trip.id}
                onPressIn={() => console.log("pressIn")}
                onPress={() => {
                  console.log("press");
                  onRequest(trip);
                }}
              >
                {requestingId === trip.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Request ride</Text>
                )}
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: "absolute",
    top: 56,
    left: 16,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  backText: { fontSize: 16, fontWeight: "600" },
  radiusRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  radiusLabel: { fontSize: 15, marginRight: 12 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#000" },
  chipText: { fontWeight: "600" },
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd",
  },
  cardActive: { borderColor: "#000" },
  driver: { fontSize: 16, fontWeight: "700" },
  route: { marginTop: 4, fontSize: 15 },
  meta: { color: "#555", marginTop: 4 },
  button: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 32, color: "#777", padding: 24 },
  error: { color: "#c62828", marginBottom: 12 },
  link: { color: "#1a73e8", fontSize: 16 },
});
