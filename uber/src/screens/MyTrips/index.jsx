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
import { useTranslation } from "react-i18next";
import {
  listMyTrips,
  listRequestsForMyTrips,
  cancelTrip,
  refundPayment,
} from "../../graphql/operations";
import {
  formatDateTime,
  formatPrice,
  STATUS_COLORS,
  statusLabel,
} from "../../utils/format";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme, useThemedStyles } from "../../theme";

const client = generateClient();

export default function MyTrips() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);

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
      setError(t("mytrips.couldnotload"));
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

  const cancelIt = async (trip) => {
    setBusyId(trip.id);
    try {
      // Passagiere, die schon bezahlt haben (vor dem Stornieren merken)
      const paid = (byTrip[trip.id]?.accepted ?? []).filter(
        (r) => r.paymentStatus === "PAID",
      );
      await client.graphql({ query: cancelTrip, variables: { id: trip.id } });

      let failed = 0;
      for (const r of paid) {
        try {
          await client.graphql({
            query: refundPayment,
            variables: { requestId: r.id },
          });
        } catch (e) {
          console.log("REFUND ERROR:", e.errors ?? e);
          failed += 1;
        }
      }
      await load();
      if (failed > 0) {
        Alert.alert(
          t("mytrips.refundpending", { defaultValue: "Refunds pending" }),
          t("mytrips.refundpendingtext", {
            defaultValue:
              "Some refunds could not be completed yet. They will be retried automatically.",
          }),
        );
      }
    } catch (e) {
      console.log("CANCEL TRIP ERROR:", e.errors ?? e);
      Alert.alert(
        t("mytrips.couldnotcancel"),
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = (trip) => {
    const paidCount = (byTrip[trip.id]?.accepted ?? []).filter(
      (r) => r.paymentStatus === "PAID",
    ).length;
    let message = t("mytrips.willbetoldthattripwascancelled");
    if (paidCount > 0) {
      message += t("mytrips.refundwarning", {
        defaultValue:
          "\n\nPassengers who already paid are refunded. The refunded amount is taken back from your earnings.",
      });
    }
    Alert.alert(t("mytrips.cancelask"), message, [
      { text: t("mytrips.keeptrip"), style: "cancel" },
      {
        text: t("mytrips.canceltrip"),
        style: "destructive",
        onPress: () => cancelIt(trip),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t("rolehome.mytrips")}
        onBack={() => navigation.navigate("DriverHome")}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={trips}
        keyExtractor={(x) => x.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          !loading && <Text style={styles.empty}>{t("mytrips.notrips")}</Text>
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
                    { color: STATUS_COLORS[item.status] ?? theme.muted },
                  ]}
                >
                  {statusLabel(item.status)}
                </Text>
              </View>
              <Text style={styles.meta}>
                {formatDateTime(item.departureAt)}
              </Text>
              <Text style={styles.meta}>
                {item.seatsLeft} of {item.seats} {t("mytrips.seatsleft")}{" "}
              </Text>
              <Text style={styles.meta}>
                {formatPrice(item.priceCents, item.currency)} per seat
              </Text>
              {item.status === "ACTIVE" && info.pending > 0 && (
                <Pressable
                  onPress={() => navigation.navigate("DriverRequests")}
                >
                  <Text style={styles.pending}>
                    {info.pending} request{info.pending === 1 ? "" : "s"}{" "}
                    {t("mytrips.waiting")} · {t("mytrips.review")}
                  </Text>
                </Pressable>
              )}
              {info.accepted.length > 0 && (
                <View style={styles.passengers}>
                  <Text style={styles.passengersTitle}>{t("passenger")}</Text>
                  {info.accepted.map((r) => (
                    <View key={r.id} style={styles.passengerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.passengerName}>
                          {r.passengerName ?? t("passenger")}
                          {r.paymentStatus === "PAID" ? "  ✓ paid" : ""}
                        </Text>
                        <Text style={styles.meta} numberOfLines={1}>
                          {t("mytrips.pickup")}: {r.pickupName}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.messageBtn}
                        onPress={() =>
                          navigation.navigate("Chat", {
                            requestId: r.id,
                            title: r.passengerName ?? t("passenger"),
                            subtitle: `${item.originName} → ${item.destName}`,
                          })
                        }
                      >
                        <Text style={styles.messageBtnText}>
                          {t("mytrips.message")}
                        </Text>
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
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Text style={styles.cancelText}>
                      {t("mytrips.canceltrip")}
                    </Text>
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

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    card: {
      margin: 12,
      marginBottom: 0,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
    },
    rowBetween: { flexDirection: "row", justifyContent: "space-between" },
    route: {
      fontSize: 16,
      fontWeight: "700",
      flex: 1,
      marginRight: 8,
      color: t.text,
    },
    status: { fontWeight: "700" },
    meta: { color: t.muted, marginTop: 4 },
    pending: { color: t.primary, fontWeight: "700", marginTop: 10 },
    passengers: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    passengersTitle: { fontWeight: "700", marginBottom: 6, color: t.text },
    passengerRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    passengerName: { fontSize: 15, fontWeight: "600", color: t.text },
    messageBtn: {
      backgroundColor: t.primary,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginLeft: 8,
    },
    messageBtnText: { color: t.onPrimary, fontWeight: "600" },
    cancel: {
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: t.chip,
      alignItems: "center",
    },
    cancelText: { fontWeight: "600", color: t.danger },
    empty: { textAlign: "center", marginTop: 40, color: t.muted, padding: 24 },
    error: { color: t.danger, padding: 16 },
  });
