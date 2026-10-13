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
import { listMyTrips } from "../../graphql/operations";
import { formatDateTime } from "../../utils/format";

const client = generateClient();

export default function MyTrips() {
  const navigation = useNavigation();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <Pressable onPress={() => navigation.navigate("DriverHome")}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>My trips</Text>
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.route} numberOfLines={2}>
              {item.originName} → {item.destName}
            </Text>
            <Text style={styles.meta}>{formatDateTime(item.departureAt)}</Text>
            <Text style={styles.meta}>
              {item.seats} seat{item.seats === 1 ? "" : "s"} · {item.carType} ·{" "}
              {item.status}
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
  route: { fontSize: 16, fontWeight: "700" },
  meta: { color: "#555", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#777", padding: 24 },
  error: { color: "#c62828", padding: 16 },
});
