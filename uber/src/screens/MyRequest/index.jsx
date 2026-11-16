import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useStripe } from "@stripe/stripe-react-native";
import {
  listMyRequests,
  cancelRequest,
  createPayment,
  confirmPayment,
  refundPayment,
} from "../../graphql/operations";
import { formatDateTime, STATUS_COLORS, statusLabel } from "../../utils/format";
import ProfileBadge from "../../components/ProfileBadge";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme, useThemedStyles } from "../../theme";
import { useTranslation } from "react-i18next";

const client = generateClient();

async function fetchList() {
  const res = await client.graphql({ query: listMyRequests });
  const list = [...(res.data.listMyRequests ?? [])];
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list;
}

const isCancelled = (r) =>
  r.status === "CANCELLED" || r.status === "CANCELLED_BY_DRIVER";

export default function MyRequests() {
  const { t } = useTranslation();

  const s = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation();
  const [payingId, setPayingId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const attempted = useRef(new Set()); // Rückerstattungen, die schon versucht wurden

  // Offene Rückerstattungen (z. B. Fahrer hat storniert) automatisch nachholen
  const retryRefunds = useCallback(async (list) => {
    let changed = false;
    for (const r of list) {
      if (
        isCancelled(r) &&
        r.paymentStatus === "PAID" &&
        !attempted.current.has(r.id)
      ) {
        attempted.current.add(r.id);
        try {
          await client.graphql({
            query: refundPayment,
            variables: { requestId: r.id },
          });
          changed = true;
        } catch (e) {
          console.log("AUTO REFUND ERROR:", e.errors ?? e);
        }
      }
    }
    return changed;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let list = await fetchList();
      setRequests(list);
      if (await retryRefunds(list)) {
        list = await fetchList();
        setRequests(list);
      }
    } catch (e) {
      console.log("LIST REQUESTS ERROR:", e.errors ?? e);
      setError(t("myrequests.errornotload"));
    } finally {
      setLoading(false);
    }
  }, [retryRefunds]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pay = async (item) => {
    setPayingId(item.id);
    try {
      const res = await client.graphql({
        query: createPayment,
        variables: { requestId: item.id },
      });
      const { clientSecret } = res.data.createPayment;

      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "RideShare",
      });
      if (init.error) throw new Error(init.error.message);

      const result = await presentPaymentSheet();
      if (result.error) {
        if (result.error.code !== "Canceled") {
          Alert.alert(t("myrequests.paymentfailed"), result.error.message);
        }
        return;
      }

      await client.graphql({
        query: confirmPayment,
        variables: { requestId: item.id },
      });
      await load();
      Alert.alert(t("mytrips.paidbig"), t("myrequests.paymentsuccess"));
    } catch (e) {
      console.log("PAY ERROR:", e.errors ?? e);
      Alert.alert(
        t("myrequests.couldnotpaid"),
        e.errors?.[0]?.message ?? e.message ?? t("myrequests.tryagain"),
      );
    } finally {
      setPayingId(null);
    }
  };

  const cancelIt = async (item) => {
    setBusyId(item.id);
    try {
      await client.graphql({
        query: cancelRequest,
        variables: { id: item.id },
      });
      if (item.paymentStatus === "PAID") {
        attempted.current.add(item.id);
        try {
          await client.graphql({
            query: refundPayment,
            variables: { requestId: item.id },
          });
          Alert.alert(t("myrequests.refunded"), t("myrequests.refunded.descr"));
        } catch (e) {
          console.log("REFUND ERROR:", e.errors ?? e);
          Alert.alert(
            t("myrequests.refundnot"),
            e.errors?.[0]?.message ?? t("myrequests.refundnot.descr"),
          );
        }
      }
      await load();
    } catch (e) {
      console.log("CANCEL REQUEST ERROR:", e.errors ?? e);
      Alert.alert(
        t("mytrips.couldnotcancel"),
        e.errors?.[0]?.message ?? t("myrequests.tryagain"),
      );
    } finally {
      setBusyId(null);
    }
  };

  const onCancel = (item) => {
    let message = t("myrequest.nolongersee");
    if (item.status === "ACCEPTED") {
      message = t("myrequest.thedriveralready");
    }
    if (item.paymentStatus === "PAID") {
      message += `\n\n ${t("myrequests.yougetback")}`;
    }
    Alert.alert(t("myrequests.askcancel"), message, [
      { text: t("myrequests.keep"), style: "cancel" },
      {
        text: t("myrequests.cancel"),
        style: "destructive",
        onPress: () => cancelIt(item),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t("rolehome.myrequests")}
        onBack={() => navigation.navigate("PassengerHome")}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={s.primary}
          />
        }
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>{t("myrequests.requestsyet")}</Text>
          )
        }
        renderItem={({ item }) => {
          const open = item.status === "PENDING" || item.status === "ACCEPTED";
          return (
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <ProfileBadge
                  userId={item.driverId}
                  name={item.driverName}
                  size={56}
                />
                <Text
                  style={[
                    styles.status,
                    { color: STATUS_COLORS[item.status] ?? s.muted },
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
                  ? `${t("myrequests.beatpickuppoint")}: ${item.pickupName}`
                  : `${t("myrequests.yourpickup")}: ${item.pickupName}`}
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
                    <ActivityIndicator color={s.primary} />
                  ) : (
                    <Text style={styles.cancelText}>
                      {t("myrequests.cancel")}
                    </Text>
                  )}
                </Pressable>
              )}
              {item.status === "ACCEPTED" && (
                <Pressable
                  style={styles.chat}
                  onPress={() =>
                    navigation.navigate("Chat", {
                      requestId: item.id,
                      title: item.driverName ?? t("driver"),
                      subtitle: `${item.tripOriginName} → ${item.tripDestName}`,
                    })
                  }
                >
                  <Text style={styles.chatText}>
                    {t("myrequests.messagedriver")}
                  </Text>
                </Pressable>
              )}
              {item.status === "ACCEPTED" && item.paymentStatus !== "PAID" && (
                <Pressable
                  style={[styles.pay, payingId === item.id && { opacity: 0.4 }]}
                  disabled={payingId === item.id}
                  onPress={() => pay(item)}
                >
                  {payingId === item.id ? (
                    <ActivityIndicator color={s.onPrimary} />
                  ) : (
                    <Text style={styles.chatText}>
                      {t("myrequests.paynow")}
                    </Text>
                  )}
                </Pressable>
              )}
              {item.status === "ACCEPTED" && item.paymentStatus === "PAID" && (
                <Text style={[styles.meta, styles.good]}>
                  {t("mytrips.paidnormal")} ✓
                </Text>
              )}
              {isCancelled(item) && item.paymentStatus === "PAID" && (
                <Text style={styles.meta}>
                  {t("myrequests.refundinprogress")}
                </Text>
              )}
              {item.paymentStatus === "REFUNDED" && (
                <Text style={[styles.meta, styles.good]}>
                  {t("myrequests.refunded")} ✓ ({t("myrequests.notrefunded")})
                </Text>
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
    status: { fontWeight: "700" },
    route: { marginTop: 4, fontSize: 15, color: t.text },
    meta: { color: t.muted, marginTop: 4 },
    good: { color: t.accent, fontWeight: "700" },
    cancel: {
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      backgroundColor: t.chip,
      alignItems: "center",
    },
    cancelText: { fontWeight: "600", color: t.danger },
    chat: {
      marginTop: 8,
      padding: 10,
      borderRadius: 8,
      backgroundColor: t.primary,
      alignItems: "center",
    },
    chatText: { fontWeight: "600", color: t.onPrimary },
    pay: {
      marginTop: 8,
      padding: 10,
      borderRadius: 8,
      backgroundColor: t.accent,
      alignItems: "center",
    },
    empty: { textAlign: "center", marginTop: 40, color: t.muted, padding: 24 },
    error: { color: t.danger, padding: 16 },
  });
