import React, { useCallback, useState } from "react";
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
import { listMyRequests, cancelRequest } from "../../graphql/operations";
import { formatDateTime, STATUS_COLORS, statusLabel } from "../../utils/format";
import MenuButton from "../../components/MenuButton";
import ProfileBadge from "../../components/ProfileBadge";

const client = generateClient();

export default function MyRequests() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

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

  const cancelIt = async (id) => {
    setBusyId(id);
    try {
      await client.graphql({ query: cancelRequest, variables: { id } });
      await load();
    } catch (e) {
      console.log("CANCEL REQUEST ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not cancel",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = (item) => {
    Alert.alert(
      "Cancel this request?",
      item.status === "ACCEPTED"
        ? "The driver already accepted you. Your seat will be freed."
        : "The driver will no longer see your request.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel request",
          style: "destructive",
          onPress: () => cancelIt(item.id),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate("PassengerHome")}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>My requests</Text>
        <MenuButton style={{ position: "absolute", top: 56, right: 16 }} />
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
        renderItem={({ item }) => {
          const open = item.status === "PENDING" || item.status === "ACCEPTED";
          return (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <ProfileBadge
                  userId={request.passengerId}
                  name={request.passengerName}
                  size={56}
                />
                <Text
                  style={[
                    styles.status,
                    { color: STATUS_COLORS[item.status] ?? "#555" },
                  ]}
                >
                  {statusLabel(item.status)}
                </Text>
              </View>
              <Text style={styles.route} numberOfLines={2}>
                {item.tripOriginName} → {item.tripDestName}
              </Text>
              <Text style={styles.meta}>
                {formatDateTime(item.departureAt)}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.status === "ACCEPTED"
                  ? `Be at your pickup point: ${item.pickupName}`
                  : `Your pickup: ${item.pickupName}`}
              </Text>
              {open && (
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
                    <Text style={styles.cancelText}>Cancel request</Text>
                  )}
                </Pressable>
              )}
              {item.status === "ACCEPTED" && (
                <Pressable
                  style={styles.chat}
                  onPress={() =>
                    navigation.navigate("Chat", {
                      requestId: item.id,
                      title: item.driverName ?? "Driver",
                      subtitle: `${item.tripOriginName} → ${item.tripDestName}`,
                    })
                  }
                >
                  <Text style={styles.chatText}>Message driver</Text>
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
  driver: { fontSize: 16, fontWeight: "700", flex: 1 },
  status: { fontWeight: "700" },
  route: { marginTop: 4, fontSize: 15 },
  meta: { color: "#555", marginTop: 4 },
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
  chat: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#000",
    alignItems: "center",
  },
  chatText: { fontWeight: "600", color: "#fff" },
});
