import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { generateClient } from "aws-amplify/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getMyTrip, respondToRequest } from "../../graphql/operations";
import { matchTrip } from "../../utils/matching";
import { formatDateTime } from "../../utils/format";
import { useTheme, useThemedStyles } from "../../theme";
import { useTranslation } from "react-i18next";

const getAnsweredText = (status) => {
  const statusKeys = {
    ACCEPTED: "requestDetails.status.accepted",
    DECLINED: "requestDetails.status.declined",
    CANCELLED: "requestDetails.status.cancelled",
    CANCELLED_BY_DRIVER: "requestDetails.status.cancelled_by_driver",
  };

  return statusKeys[status] ? t(statusKeys[status]) : status;
};

const client = generateClient();

export default function RequestDetails() {
  const { t } = useTranslation();

  const s = useTheme();
  const styles = useThemedStyles(makeStyles);
  const route = useRoute();
  const navigation = useNavigation();
  const { request } = route.params;
  const mapRef = useRef(null);

  const pickup = useMemo(
    () => ({
      latitude: request.pickupLatitude,
      longitude: request.pickupLongitude,
    }),
    [request],
  );
  const dropoff = useMemo(
    () => ({
      latitude: request.dropoffLatitude,
      longitude: request.dropoffLongitude,
    }),
    [request],
  );

  const [trip, setTrip] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await client.graphql({
          query: getMyTrip,
          variables: { id: request.tripId },
        });
        setTrip(res.data.getMyTrip);
      } catch (e) {
        console.log("GET TRIP ERROR:", e.errors ?? e);
      }
    })();
  }, [request.tripId]);

  const match = useMemo(
    () => (trip ? matchTrip(trip, pickup, dropoff, 1000) : null),
    [trip, pickup, dropoff],
  );

  useEffect(() => {
    if (!mapReady) return;
    const points = [pickup, dropoff, ...(match ? match.coords : [])];
    mapRef.current?.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [mapReady, match, pickup, dropoff]);

  const send = async (accept) => {
    setBusy(true);
    try {
      await client.graphql({
        query: respondToRequest,
        variables: { id: request.id, accept },
      });
      navigation.goBack();
    } catch (e) {
      console.log("RESPOND ERROR:", e.errors ?? e);
      Alert.alert(
        t("requestDetails.alert.update_title"),
        e.errors?.[0]?.message ?? t("requestDetails.fallback.try_again"),
      );
    } finally {
      setBusy(false);
    }
  };

  const respond = (accept) => {
    Alert.alert(
      accept
        ? t("requestDetails.alert.accept_title")
        : t("requestDetails.alert.decline_title"),

      accept
        ? t("requestDetails.alert.accept_message", {
            passenger:
              request.passengerName ?? t("requestDetails.fallback.passenger"),
          })
        : t("requestDetails.alert.decline_message"),

      [
        {
          text: t("requestDetails.button.cancel"),
          style: "cancel",
        },
        {
          text: accept
            ? t("requestDetails.button.accept")
            : t("requestDetails.button.decline"),
          style: accept ? "default" : "destructive",
          onPress: () => send(accept),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          onMapReady={() => setMapReady(true)}
          initialRegion={{
            latitude: pickup.latitude,
            longitude: pickup.longitude,
            latitudeDelta: 1.5,
            longitudeDelta: 1.5,
          }}
        >
          {match && (
            <Polyline
              coordinates={match.coords}
              strokeColor="blue"
              strokeWidth={4}
            />
          )}
          <Marker
            coordinate={pickup}
            title={t("requestDetails.marker.pickup")}
            pinColor="green"
          />{" "}
          <Marker
            coordinate={dropoff}
            title={t("requestDetails.marker.dropoff")}
          />{" "}
        </MapView>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t("requestDetails.button.back")}</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.name}>
          {request.passengerName ?? t("requestDetails.fallback.passenger")}
        </Text>

        <Text style={styles.meta}>
          {request.tripOriginName} → {request.tripDestName}
        </Text>

        <Text style={styles.meta}>{formatDateTime(request.departureAt)}</Text>

        <Text style={styles.line} numberOfLines={2}>
          {t("requestDetails.label.pickup", {
            location: request.pickupName,
          })}
        </Text>

        <Text style={styles.line} numberOfLines={2}>
          {t("requestDetails.label.dropoff", {
            location: request.dropoffName,
          })}
        </Text>

        {match && (
          <Text style={styles.line}>
            {t("requestDetails.label.pickup_distance", {
              distance: match.pickupOffKm.toFixed(1),
            })}{" "}
            ·{" "}
            {t("requestDetails.label.ride_distance", {
              distance: Math.round(match.rideKm),
            })}
          </Text>
        )}

        {request.status === "PENDING" ? (
          <View style={styles.buttons}>
            <Pressable
              style={[styles.decline, busy && { opacity: 0.4 }]}
              disabled={busy}
              onPress={() => respond(false)}
            >
              <Text style={styles.declineText}>
                {t("requestDetails.button.decline")}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.accept, busy && { opacity: 0.4 }]}
              disabled={busy}
              onPress={() => respond(true)}
            >
              {busy ? (
                <ActivityIndicator color={s.onPrimary} />
              ) : (
                <Text style={styles.acceptText}>
                  {t("requestDetails.button.accept")}
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.answered}>
              {getAnsweredText(request.status)}
            </Text>

            {request.status === "ACCEPTED" && (
              <Pressable
                style={styles.chatBtn}
                onPress={() =>
                  navigation.navigate("Chat", {
                    requestId: request.id,
                    title:
                      request.passengerName ??
                      t("requestDetails.fallback.passenger"),
                    subtitle: `${request.tripOriginName} → ${request.tripDestName}`,
                  })
                }
              >
                <Text style={styles.chatBtnText}>
                  {t("requestDetails.button.message_passenger")}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    back: {
      position: "absolute",
      top: 56,
      left: 16,
      backgroundColor: t.surface,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
    },
    backText: { fontSize: 16, fontWeight: "600", color: t.text },
    panel: { padding: 16, paddingBottom: 32, backgroundColor: t.surface },
    name: { fontSize: 20, fontWeight: "700", color: t.text },
    meta: { color: t.muted, marginTop: 4 },
    line: { marginTop: 8, fontSize: 15, color: t.text },
    buttons: { flexDirection: "row", marginTop: 16 },
    decline: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: t.chip,
      marginRight: 8,
    },
    declineText: { fontSize: 16, fontWeight: "600", color: t.chipText },
    accept: {
      flex: 1,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: t.primary,
      marginLeft: 8,
    },
    acceptText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
    answered: { marginTop: 16, fontSize: 16, fontWeight: "600", color: t.text },
    chatBtn: {
      marginTop: 12,
      padding: 14,
      borderRadius: 10,
      backgroundColor: t.primary,
      alignItems: "center",
    },
    chatBtnText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
  });
