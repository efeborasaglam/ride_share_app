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
import { listMyRequests } from "../../graphql/operations";
import { formatDateTime } from "../../utils/format";

const client = generateClient();

const STATUS_COLORS = {
  PENDING: "#ef6c00",
  ACCEPTED: "#2e7d32",
  DECLINED: "#c62828",
};

export default function MyRequests() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.graphql({ query: listMyRequests });
      const list = [...(res.data.listMyRequests ?? [])];
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setRequests(list);
    } catch (e) {
      console.log("LIST REQUESTS ERROR:", e.errors ?? e);
      setError("Could not load your requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("PassengerHome")}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>My requests</Text>
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
              No requests yet. Tap "Find a ride" on the home screen.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.driver}>
                {item.driverName ?? "Driver"} · {item.carType}
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
              Your pickup: {item.pickupName}
            </Text>
          </View>
        )}
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
  driver: { fontSize: 16, fontWeight: "700", flex: 1 },
  status: { fontWeight: "700" },
  route: { marginTop: 4, fontSize: 15 },
  meta: { color: "#555", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#777", padding: 24 },
  error: { color: "#c62828", padding: 16 },
});
