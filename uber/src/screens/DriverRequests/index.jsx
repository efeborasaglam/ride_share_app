import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { listRequestsForMyTrips } from "../../graphql/operations";
import { formatDateTime } from "../../utils/format";

const client = generateClient();

const STATUS_COLORS = {
  PENDING: "#ef6c00",
  ACCEPTED: "#2e7d32",
  DECLINED: "#c62828",
};
const ORDER = { PENDING: 0, ACCEPTED: 1, DECLINED: 2 };

export default function DriverRequests() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.graphql({ query: listRequestsForMyTrips });
      const list = [...(res.data.listRequestsForMyTrips ?? [])];
      list.sort(
        (a, b) =>
          (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) ||
          b.createdAt.localeCompare(a.createdAt),
      );
      setRequests(list);
    } catch (e) {
      console.log("LIST DRIVER REQUESTS ERROR:", e.errors ?? e);
      setError("Could not load requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pending = requests.filter((r) => r.status === "PENDING").length;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("DriverHome")}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.sub}>{pending} waiting for your answer</Text>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>
              No requests yet. Passengers going your way will show up here.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("RequestDetails", { request: item })
            }
          >
            <View style={styles.rowBetween}>
              <Text style={styles.name}>
                {item.passengerName ?? "Passenger"}
              </Text>
              <Text
                style={[
                  styles.status,
                  { color: STATUS_COLORS[item.status] ?? "#555" },
                ]}
              >
                {item.status}
              </Text>
            </View>
            <Text style={styles.route} numberOfLines={2}>
              {item.tripOriginName} → {item.tripDestName}
            </Text>
            <Text style={styles.meta}>{formatDateTime(item.departureAt)}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              Pickup: {item.pickupName}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 56, backgroundColor: "#000" },
  back: { color: "#fff", fontSize: 16, marginBottom: 8 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  sub: { color: "#bbb", marginTop: 2 },
  card: {
    margin: 12,
    marginBottom: 0,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 16, fontWeight: "700", flex: 1 },
  status: { fontWeight: "700" },
  route: { marginTop: 4, fontSize: 15 },
  meta: { color: "#555", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#777", padding: 24 },
  error: { color: "#c62828", padding: 16 },
});
