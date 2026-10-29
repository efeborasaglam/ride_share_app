import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import {
  adminListUsers,
  adminListTrips,
  adminListRequests,
} from "../../graphql/operations";
import { formatDateTime, formatPrice } from "../../utils/format";

const client = generateClient();
const TABS = ["Users", "Trips", "Requests"];

export default function AdminPanel() {
  const [tab, setTab] = useState("Users");
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [u, t, r] = await Promise.all([
        client.graphql({ query: adminListUsers }),
        client.graphql({ query: adminListTrips }),
        client.graphql({ query: adminListRequests }),
      ]);
      setUsers(u.data.adminListUsers ?? []);
      const tl = [...(t.data.adminListTrips ?? [])];
      tl.sort((a, b) =>
        (b.departureAt ?? "").localeCompare(a.departureAt ?? ""),
      );
      setTrips(tl);
      setRequests(r.data.adminListRequests ?? []);
    } catch (e) {
      console.log("ADMIN LOAD ERROR:", e.errors ?? e);
      setError(e.errors?.[0]?.message ?? "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const passengersByTrip = useMemo(() => {
    const map = {};
    for (const r of requests) {
      if (r.status !== "ACCEPTED") continue;
      (map[r.tripId] ??= []).push(r);
    }
    return map;
  }, [requests]);

  const counts = useMemo(
    () => ({
      drivers: users.filter((u) => u.role === "DRIVER").length,
      passengers: users.filter((u) => u.role === "PASSENGER").length,
    }),
    [users],
  );

  useEffect(() => {
    load();
  }, [load]);

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.displayName ?? "(no name)"}</Text>
      <Text style={styles.meta}>
        {item.role}
        {item.role === "DRIVER" && item.carSeats
          ? ` · ${item.carSeats} seats`
          : ""}
      </Text>
      <Text style={styles.meta}>
        Verification: {item.verificationStatus ?? "none"}
        {item.role === "DRIVER"
          ? ` · Payouts: ${item.payoutsReady ? "ready" : "not set up"}`
          : ""}
      </Text>
    </View>
  );

  const renderTrip = ({ item }) => {
    const pax = passengersByTrip[item.id] ?? [];
    return (
      <View style={styles.card}>
        <Text style={styles.title} numberOfLines={2}>
          {item.originName} → {item.destName}
        </Text>
        <Text style={styles.meta}>
          {formatDateTime(item.departureAt)} · {item.status}
        </Text>
        <Text style={styles.meta}>
          Driver: {item.driverName ?? item.driverId}
        </Text>
        <Text style={styles.meta}>
          {item.seatsLeft ?? item.seats} of {item.seats} seats left ·{" "}
          {formatPrice(item.priceCents, item.currency)} per seat
        </Text>
        <Text style={styles.sub}>Passengers ({pax.length})</Text>
        {pax.length === 0 ? (
          <Text style={styles.meta}>None yet</Text>
        ) : (
          pax.map((p) => (
            <Text key={p.id} style={styles.meta}>
              • {p.passengerName ?? p.passengerId} ·{" "}
              {p.paymentStatus === "PAID" ? "paid" : "not paid"}
            </Text>
          ))
        )}
      </View>
    );
  };

  const renderRequest = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.passengerName ?? item.passengerId}</Text>
      <Text style={styles.meta}>
        {item.status} · {item.paymentStatus === "PAID" ? "paid" : "not paid"}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        Pickup: {item.pickupName}
      </Text>
    </View>
  );

  const data = tab === "Users" ? users : tab === "Trips" ? trips : requests;
  const render =
    tab === "Users" ? renderUser : tab === "Trips" ? renderTrip : renderRequest;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin</Text>
        <Text style={styles.headerSub}>
          {users.length} users ({counts.drivers} drivers, {counts.passengers}{" "}
          passengers) · {trips.length} trips
        </Text>
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && { color: "#fff" }]}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={data}
        keyExtractor={(x) => x.id}
        renderItem={render}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>Nothing here yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 56, backgroundColor: "#000" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700" },
  headerSub: { color: "#ccc", marginTop: 4 },
  tabs: { flexDirection: "row", padding: 12 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  tabActive: { backgroundColor: "#000" },
  tabText: { fontWeight: "600" },
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontWeight: "700", marginTop: 8 },
  meta: { color: "#555", marginTop: 4 },
  empty: { textAlign: "center", marginTop: 40, color: "#777" },
  error: { color: "#c62828", padding: 16 },
});
