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
import { formatDateTime, STATUS_COLORS, statusLabel } from "../../utils/format";
import ScreenHeader from "../../components/ScreenHeader";
import ProfileBadge from "../../components/ProfileBadge";
import { useTheme, useThemedStyles } from "../../theme";
import { useTranslation } from "react-i18next";

const client = generateClient();

const ORDER = {
  PENDING: 0,
  ACCEPTED: 1,
  DECLINED: 2,
  CANCELLED: 3,
  CANCELLED_BY_DRIVER: 4,
};

export default function DriverRequests() {
  const { t } = useTranslation();

  const s = useTheme();
  const styles = useThemedStyles(makeStyles);
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
      console.log(t("driverrequest.drivererror"), e.errors ?? e);
      setError(t("driverrequest.couldnotload"));
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
    <View style={styles.screen}>
      <ScreenHeader
        title={t("rolehome.requests")}
        subtitle={`${pending} ${t("driverrequest.waiting")}`}
        onBack={() => navigation.navigate("DriverHome")}
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
            <Text style={styles.empty}>{t("driverrequest.norequest")}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              navigation.navigate("RequestDetails", { request: item })
            }
          >
            <View style={[styles.rowBetween, { alignItems: "center" }]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <ProfileBadge
                  userId={item.passengerId}
                  name={item.passengerName}
                  size={48}
                />
              </View>
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
            <Text style={styles.meta}>{formatDateTime(item.departureAt)}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {t("mytrips.pickup")}: {item.pickupName}
            </Text>
          </Pressable>
        )}
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
    empty: { textAlign: "center", marginTop: 40, color: t.muted, padding: 24 },
    error: { color: t.danger, padding: 16 },
  });
