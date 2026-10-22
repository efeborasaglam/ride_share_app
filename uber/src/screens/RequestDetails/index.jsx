import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { generateClient } from "aws-amplify/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getMyTrip, respondToRequest } from "../../graphql/operations";
import { matchTrip } from "../../utils/matching";
import { formatDateTime } from "../../utils/format";

const ANSWERED = {
  ACCEPTED: "You accepted this request.",
  DECLINED: "You declined this request.",
  CANCELLED: "The passenger cancelled this request.",
  CANCELLED_BY_DRIVER: "You cancelled this trip.",
};

const client = generateClient();

export default function RequestDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { request } = route.params;
  const mapRef = useRef(null);

  const pickup = useMemo(
    () => ({
      latitude: request.pickupLatitude,
      longitude: request.pickupLongitude,
    }),
    [request],
  );
  const dropoff = useMemo(
    () => ({
      latitude: request.dropoffLatitude,
      longitude: request.dropoffLongitude,
    }),
    [request],
  );

  const [trip, setTrip] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await client.graphql({
          query: getMyTrip,
          variables: { id: request.tripId },
        });
        setTrip(res.data.getMyTrip);
      } catch (e) {
        console.log("GET TRIP ERROR:", e.errors ?? e);
      }
    })();
  }, [request.tripId]);

  const match = useMemo(
    () => (trip ? matchTrip(trip, pickup, dropoff, 1000) : null),
    [trip, pickup, dropoff],
  );

  useEffect(() => {
    if (!mapReady) return;
    const points = [pickup, dropoff, ...(match ? match.coords : [])];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [mapReady, match, pickup, dropoff]);

  const send = async (accept) => {
    setBusy(true);
    try {
      await client.graphql({
        query: respondToRequest,
        variables: { id: request.id, accept },
      });
      navigation.goBack();
    } catch (e) {
      console.log("RESPOND ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not update",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const respond = (accept) => {
    Alert.alert(
      accept ? "Accept this passenger?" : "Decline this request?",
      accept
        ? `${request.passengerName ?? "The passenger"} will see that you accepted.`
        : "The passenger will see that the request was declined.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: accept ? "Accept" : "Decline",
          style: accept ? "default" : "destructive",
          onPress: () => send(accept),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1 }}>
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
          {match && (
            <Polyline
              coordinates={match.coords}
              strokeColor="blue"
              strokeWidth={4}
            />
          )}
          <Marker coordinate={pickup} title="Pickup" pinColor="green" />
          <Marker coordinate={dropoff} title="Drop-off" />
        </MapView>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.name}>{request.passengerName ?? "Passenger"}</Text>
        <Text style={styles.meta}>
          {request.tripOriginName} → {request.tripDestName}
        </Text>
        <Text style={styles.meta}>{formatDateTime(request.departureAt)}</Text>
        <Text style={styles.line} numberOfLines={2}>
          Pickup: {request.pickupName}
        </Text>
        <Text style={styles.line} numberOfLines={2}>
          Drop-off: {request.dropoffName}
        </Text>
        {match && (
          <Text style={styles.line}>
            Pickup is {match.pickupOffKm.toFixed(1)} km from your route · Ride
            about {Math.round(match.rideKm)} km
          </Text>
        )}

        {request.status === "PENDING" ? (
          <View style={styles.buttons}>
            <Pressable
              style={[styles.decline, busy && { opacity: 0.4 }]}
              disabled={busy}
              onPress={() => respond(false)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
            <Pressable
              style={[styles.accept, busy && { opacity: 0.4 }]}
              disabled={busy}
              onPress={() => respond(true)}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.acceptText}>Accept</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.answered}>
              {ANSWERED[request.status] ?? request.status}
            </Text>
            {request.status === "ACCEPTED" && (
              <Pressable
                style={styles.chatBtn}
                onPress={() =>
                  navigation.navigate("Chat", {
                    requestId: request.id,
                    title: request.passengerName ?? "Passenger",
                    subtitle: `${request.tripOriginName} → ${request.tripDestName}`,
                  })
                }
              >
                <Text style={styles.chatBtnText}>Message passenger</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
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
  panel: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 20, fontWeight: "700" },
  meta: { color: "#555", marginTop: 4 },
  line: { marginTop: 8, fontSize: 15 },
  buttons: { flexDirection: "row", marginTop: 16 },
  decline: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#eee",
    marginRight: 8,
  },
  declineText: { fontSize: 16, fontWeight: "600" },
  accept: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#000",
    marginLeft: 8,
  },
  acceptText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  answered: { marginTop: 16, fontSize: 16, fontWeight: "600" },
  chatBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#000",
    alignItems: "center",
  },
  chatBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
