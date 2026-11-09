import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import {
  adminListUsers,
  adminListTrips,
  adminListRequests,
  adminListReports,
  adminResolveReport,
  adminUnbanUser,
} from "../../graphql/operations";
import { formatDateTime, formatPrice } from "../../utils/format";

const client = generateClient();
const TABS = ["Reports", "Users", "Trips", "Requests"];

const isBanned = (u) =>
  !!u.bannedUntil && new Date(u.bannedUntil).getTime() > Date.now();
const banLabel = (u) =>
  new Date(u.bannedUntil).getFullYear() >= 9000
    ? "banned permanently"
    : `banned until ${formatDateTime(u.bannedUntil)}`;

export default function AdminPanel() {
  const [tab, setTab] = useState("Reports");
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const jobs = [
      { key: "users", query: adminListUsers, field: "adminListUsers" },
      { key: "trips", query: adminListTrips, field: "adminListTrips" },
      { key: "requests", query: adminListRequests, field: "adminListRequests" },
      { key: "reports", query: adminListReports, field: "adminListReports" },
    ];

    const results = await Promise.allSettled(
      jobs.map(async (j) => client.graphql({ query: j.query })),
    );

    const data = {};
    const problems = [];
    results.forEach((res, i) => {
      const job = jobs[i];
      if (res.status === "fulfilled") {
        data[job.key] = res.value.data?.[job.field] ?? [];
      } else {
        const e = res.reason;
        console.log(`ADMIN ${job.key} ERROR:`, e?.errors ?? e);
        problems.push(
          `${job.key}: ${e?.errors?.[0]?.message ?? e?.message ?? "failed"}`,
        );
      }
    });

    setUsers(data.users ?? []);
    setRequests(data.requests ?? []);

    const tl = [...(data.trips ?? [])];
    tl.sort((a, b) => (b.departureAt ?? "").localeCompare(a.departureAt ?? ""));
    setTrips(tl);

    const rl = [...(data.reports ?? [])];
    rl.sort((a, b) => {
      if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
    setReports(rl);

    if (problems.length) setError(problems.join("\n"));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = (report, action, days, label) => {
    Alert.alert(
      "Confirm",
      `${label} for ${report.reportedName ?? report.reportedId}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: action === "DISMISS" ? "default" : "destructive",
          onPress: async () => {
            try {
              await client.graphql({
                query: adminResolveReport,
                variables: { reportId: report.id, action, days },
              });
              await load();
            } catch (e) {
              console.log("RESOLVE ERROR:", e.errors ?? e);
              Alert.alert("Error", e.errors?.[0]?.message ?? "Failed.");
            }
          },
        },
      ],
    );
  };

  const unban = (user) => {
    Alert.alert("Unban user?", user.displayName ?? user.id, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unban",
        onPress: async () => {
          try {
            await client.graphql({
              query: adminUnbanUser,
              variables: { userId: user.id },
            });
            await load();
          } catch (e) {
            console.log("UNBAN ERROR:", e.errors ?? e);
            Alert.alert("Error", e.errors?.[0]?.message ?? "Failed.");
          }
        },
      },
    ]);
  };

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
      openReports: reports.filter((r) => r.status === "OPEN").length,
    }),
    [users, reports],
  );

  const renderReport = ({ item }) => {
    const open = item.status === "OPEN";
    return (
      <View style={[styles.card, open && styles.cardOpen]}>
        <Text style={styles.title}>
          {item.reporterName ?? item.reporterId} reported{" "}
          {item.reportedName ?? item.reportedId}
        </Text>
        <Text style={styles.meta}>
          {formatDateTime(item.createdAt)} · {item.status}
          {item.resolution ? ` · ${item.resolution}` : ""}
        </Text>
        {!!item.tripOriginName && (
          <Text style={styles.meta} numberOfLines={1}>
            Trip: {item.tripOriginName} → {item.tripDestName}
          </Text>
        )}
        <Text style={styles.reportText}>{item.text}</Text>
        {open && (
          <View style={styles.actions}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => resolve(item, "DISMISS", null, "Dismiss report")}
            >
              <Text style={styles.actionText}>Dismiss</Text>
            </Pressable>
            {[1, 7, 30].map((d) => (
              <Pressable
                key={d}
                style={[styles.actionBtn, styles.actionDanger]}
                onPress={() =>
                  resolve(
                    item,
                    "BAN_DAYS",
                    d,
                    `Ban for ${d} day${d > 1 ? "s" : ""}`,
                  )
                }
              >
                <Text style={styles.actionDangerText}>{d} d</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.actionBtn, styles.actionDanger]}
              onPress={() =>
                resolve(item, "BAN_PERMANENT", null, "Ban permanently")
              }
            >
              <Text style={styles.actionDangerText}>Permanent</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

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
      {isBanned(item) && (
        <View style={styles.banRow}>
          <Text style={styles.banText}>{banLabel(item)}</Text>
          <Pressable style={styles.actionBtn} onPress={() => unban(item)}>
            <Text style={styles.actionText}>Unban</Text>
          </Pressable>
        </View>
      )}
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

  const data =
    tab === "Reports"
      ? reports
      : tab === "Users"
        ? users
        : tab === "Trips"
          ? trips
          : requests;
  const render =
    tab === "Reports"
      ? renderReport
      : tab === "Users"
        ? renderUser
        : tab === "Trips"
          ? renderTrip
          : renderRequest;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin</Text>
        <Text style={styles.headerSub}>
          {users.length} users ({counts.drivers} drivers, {counts.passengers}{" "}
          passengers) · {trips.length} trips · {counts.openReports} open reports
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
              {t === "Reports" && counts.openReports > 0
                ? ` (${counts.openReports})`
                : ""}
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
  tabs: { flexDirection: "row", flexWrap: "wrap", padding: 12 },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#eee",
    marginRight: 8,
    marginBottom: 6,
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
  cardOpen: { borderColor: "#c62828", borderWidth: 1.5 },
  title: { fontSize: 16, fontWeight: "700" },
  sub: { fontWeight: "700", marginTop: 8 },
  meta: { color: "#555", marginTop: 4 },
  reportText: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#eee",
    marginRight: 8,
    marginBottom: 8,
  },
  actionText: { fontWeight: "600" },
  actionDanger: { backgroundColor: "#c62828" },
  actionDangerText: { fontWeight: "600", color: "#fff" },
  banRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  banText: { color: "#c62828", fontWeight: "700", flex: 1 },
  empty: { textAlign: "center", marginTop: 40, color: "#777" },
  error: { color: "#c62828", padding: 16 },
});
