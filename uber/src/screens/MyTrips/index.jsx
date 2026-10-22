import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  listMyTrips,
  listRequestsForMyTrips,
  cancelTrip,
} from "../../graphql/operations";
import { formatDateTime, STATUS_COLORS, statusLabel } from "../../utils/format";
import MenuButton from "../../components/MenuButton";

const client = generateClient();

export default function MyTrips() {
  const navigation = useNavigation();
  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.graphql({ query: listMyTrips });
      const list = [...(res.data.listMyTrips ?? [])];
      list.sort((a, b) => a.departureAt.localeCompare(b.departureAt));
      setTrips(list);
    } catch (e) {
      console.log("LIST TRIPS ERROR:", e.errors ?? e);
      setError("Could not load your trips.");
    }
    try {
      const res = await client.graphql({ query: listRequestsForMyTrips });
      setRequests(res.data.listRequestsForMyTrips ?? []);
    } catch (e) {
      console.log("LIST DRIVER REQUESTS ERROR:", e.errors ?? e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Group requests by trip: accepted passengers and number of pending requests
  const byTrip = useMemo(() => {
    const map = {};
    for (const r of requests) {
      if (!map[r.tripId]) map[r.tripId] = { accepted: [], pending: 0 };
      if (r.status === "ACCEPTED") map[r.tripId].accepted.push(r);
      if (r.status === "PENDING") map[r.tripId].pending += 1;
    }
    return map;
  }, [requests]);

  const cancelIt = async (id) => {
    setBusyId(id);
    try {
      await client.graphql({ query: cancelTrip, variables: { id } });
      await load();
    } catch (e) {
      console.log("CANCEL TRIP ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not cancel",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = (trip) => {
    Alert.alert(
      "Cancel this trip?",
      "Passengers with open or accepted requests will be told that the trip was cancelled.",
      [
        { text: "Keep trip", style: "cancel" },
        {
          text: "Cancel trip",
          style: "destructive",
          onPress: () => cancelIt(trip.id),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("DriverHome")}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>My trips</Text>
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>
              No trips yet. Tap "Offer a ride" on the home screen.
            </Text>
          )
        }
        renderItem={({ item }) => {
          const info = byTrip[item.id] ?? { accepted: [], pending: 0 };
          return (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.route} numberOfLines={2}>
                  {item.originName} → {item.destName}
                </Text>
                <Text
                  style={[
                    styles.status,
                    { color: STATUS_COLORS[item.status] ?? "#555" },
                  ]}
                >
                  {statusLabel(item.status)}
                </Text>
              </View>
              <Text style={styles.meta}>
                {formatDateTime(item.departureAt)}
              </Text>
              <Text style={styles.meta}>
                {item.carType} · {item.seatsLeft} of {item.seats} seats left
              </Text>

              {item.status === "ACTIVE" && info.pending > 0 && (
                <Pressable
                  onPress={() => navigation.navigate("DriverRequests")}
                >
                  <Text style={styles.pending}>
                    {info.pending} request{info.pending === 1 ? "" : "s"}{" "}
                    waiting · Review
                  </Text>
                </Pressable>
              )}

              {info.accepted.length > 0 && (
                <View style={styles.passengers}>
                  <Text style={styles.passengersTitle}>Passengers</Text>
                  {info.accepted.map((r) => (
                    <View key={r.id} style={styles.passengerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.passengerName}>
                          {r.passengerName ?? "Passenger"}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                          Pickup: {r.pickupName}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.messageBtn}
                        onPress={() =>
                          navigation.navigate("Chat", {
                            requestId: r.id,
                            title: r.passengerName ?? "Passenger",
                            subtitle: `${item.originName} → ${item.destName}`,
                          })
                        }
                      >
                        <Text style={styles.messageBtnText}>Message</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {item.status === "ACTIVE" && (
                <Pressable
                  style={[
                    styles.cancel,
                    busyId === item.id && { opacity: 0.4 },
                  ]}
                  disabled={busyId === item.id}
                  onPress={() => onCancel(item)}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.cancelText}>Cancel trip</Text>
                  )}
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 56, backgroundColor: "#000" },
  back: { color: "#fff", fontSize: 16, marginBottom: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  card: {
    margin: 12,
    marginBottom: 0,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  route: { fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  status: { fontWeight: "700" },
  meta: { color: "#555", marginTop: 4 },
  pending: { color: "#ef6c00", fontWeight: "700", marginTop: 10 },
  passengers: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  passengersTitle: { fontWeight: "700", marginBottom: 6 },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  passengerName: { fontSize: 15, fontWeight: "600" },
  messageBtn: {
    backgroundColor: "#000",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginLeft: 8,
  },
  messageBtnText: { color: "#fff", fontWeight: "600" },
  cancel: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#eee",
    alignItems: "center",
  },
  cancelText: { fontWeight: "600", color: "#c62828" },
  empty: { textAlign: "center", marginTop: 40, color: "#777", padding: 24 },
  error: { color: "#c62828", padding: 16 },
});
