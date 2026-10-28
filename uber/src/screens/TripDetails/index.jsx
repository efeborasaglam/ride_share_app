import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import polyline from "@mapbox/polyline";
import { generateClient } from "aws-amplify/api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createTrip } from "../../graphql/operations";
import { fetchRoute } from "../../utils/routes";
import { useProfile } from "../../context/ProfileContext";
import {
  formatDateTime,
  formatDuration,
  formatPrice,
  splitPrice,
} from "../../utils/format";

const client = generateClient();

const defaultDeparture = () => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d;
};

export default function TripDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { profile } = useProfile();
  const { originPlace, destinationPlace } = route.params;
  const mapRef = useRef(null);

  const origin = useMemo(
    () => ({
      latitude: originPlace.details.geometry.location.lat,
      longitude: originPlace.details.geometry.location.lng,
    }),
    [originPlace],
  );
  const destination = useMemo(
    () => ({
      latitude: destinationPlace.details.geometry.location.lat,
      longitude: destinationPlace.details.geometry.location.lng,
    }),
    [destinationPlace],
  );

  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [date, setDate] = useState(defaultDeparture());
  const [seats, setSeats] = useState(profile.carSeats ?? 3);
  const maxSeats = profile.carSeats ?? 8;
  const [publishing, setPublishing] = useState(false);
  const [priceText, setPriceText] = useState("5.00");
  const priceCents = Math.round(parseFloat(priceText.replace(",", ".")) * 100);
  const priceValid =
    Number.isFinite(priceCents) && priceCents >= 100 && priceCents <= 10000;
  const split = priceValid ? splitPrice(priceCents) : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetchRoute(origin, destination);
        if (cancelled) return;
        const coords = polyline
          .decode(r.encoded)
          .map(([latitude, longitude]) => ({ latitude, longitude }));
        setRouteInfo({ ...r, coords });
      } catch (e) {
        console.log("ROUTE ERROR:", e);
        if (!cancelled) setRouteError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [origin, destination]);

  useEffect(() => {
    if (routeInfo && mapReady) {
      mapRef.current?.fitToCoordinates(routeInfo.coords, {
        edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  }, [routeInfo, mapReady]);

  const openAndroidPicker = () => {
    DateTimePickerAndroid.open({
      value: date,
      mode: "date",
      minimumDate: new Date(),
      onChange: (event, picked) => {
        if (event.type !== "set" || !picked) return;
        DateTimePickerAndroid.open({
          value: picked,
          mode: "time",
          is24Hour: true,
          onChange: (ev, time) => {
            if (ev.type !== "set" || !time) return;
            const merged = new Date(picked);
            merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
            setDate(merged);
          },
        });
      },
    });
  };

  const onPublish = async () => {
    if (!routeInfo) return;
    if (date.getTime() < Date.now() + 5 * 60 * 1000) {
      Alert.alert("Departure time", "Please choose a time in the future.");
      return;
    }
    setPublishing(true);
    try {
      await client.graphql({
        query: createTrip,
        variables: {
          input: {
            driverName: profile.displayName,
            carType: profile.carType,
            originName: originPlace.data?.description ?? "Start",
            originLatitude: origin.latitude,
            originLongitude: origin.longitude,
            destName: destinationPlace.data?.description ?? "Destination",
            destLatitude: destination.latitude,
            destLongitude: destination.longitude,
            routePolyline: routeInfo.encoded,
            departureAt: date.toISOString(),
            seats,
            priceCents,
          },
        },
      });
      navigation.popToTop();
      navigation.navigate("MyTrips");
      console.log("PUBLISH priceCents:", priceCents, "valid:", priceValid);
    } catch (e) {
      console.log("CREATE TRIP ERROR:", e.errors ?? e);
      Alert.alert(
        "Error",
        e.errors?.[0]?.message ?? "Could not publish your trip.",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          onMapReady={() => setMapReady(true)}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 1.5,
            longitudeDelta: 1.5,
          }}
        >
          {routeInfo && (
            <Polyline
              coordinates={routeInfo.coords}
              strokeColor="blue"
              strokeWidth={5}
            />
          )}
          <Marker coordinate={origin} title="Start" />
          <Marker coordinate={destination} title="Destination" />
        </MapView>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.route} numberOfLines={2}>
          {originPlace.data?.description} → {destinationPlace.data?.description}
        </Text>

        {routeError ? (
          <Text style={styles.error}>Route error: {routeError}</Text>
        ) : routeInfo ? (
          <Text style={styles.meta}>
            {Math.round(routeInfo.distanceMeters / 1000)} km ·{" "}
            {formatDuration(routeInfo.durationSeconds)}
          </Text>
        ) : (
          <ActivityIndicator
            style={{ alignSelf: "flex-start", marginVertical: 6 }}
          />
        )}

        <View style={styles.row}>
          <Text style={styles.label}>Departure</Text>
          {Platform.OS === "ios" ? (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="compact"
              minimumDate={new Date()}
              onChange={(_, d) => d && setDate(d)}
            />
          ) : (
            <Pressable onPress={openAndroidPicker} style={styles.dateButton}>
              <Text>{formatDateTime(date)}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Seats</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setSeats((s) => Math.max(1, s - 1))}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.seats}>{seats}</Text>
            <Pressable
              style={styles.stepBtn}
              onPress={() => setSeats((s) => Math.min(8, s + 1))}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Price per seat (CHF)</Text>
          <TextInput
            style={styles.priceInput}
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="decimal-pad"
            maxLength={7}
          />
        </View>
        {split ? (
          <Text style={styles.meta}>
            You receive {formatPrice(split.driver)} · platform fee{" "}
            {formatPrice(split.fee)} (20%)
          </Text>
        ) : (
          <Text style={styles.error}>
            Enter a price between 1.00 and 100.00
          </Text>
        )}

        <Pressable
          style={[
            styles.button,
            (!routeInfo || publishing) && { opacity: 0.4 },
          ]}
          disabled={!routeInfo || publishing}
          onPress={onPublish}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Publish trip</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    position: "absolute",
    top: 56,
    left: 16,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  backText: { fontSize: 16, fontWeight: "600" },
  panel: { padding: 16, paddingBottom: 32, backgroundColor: "#fff" },
  route: { fontSize: 16, fontWeight: "700" },
  meta: { color: "#555", marginTop: 4, marginBottom: 8 },
  error: { color: "#c62828", marginVertical: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  label: { fontSize: 16 },
  dateButton: { backgroundColor: "#eee", padding: 10, borderRadius: 8 },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 20, fontWeight: "700" },
  seats: { fontSize: 18, fontWeight: "700", marginHorizontal: 16 },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  priceInput: {
    backgroundColor: "#eee",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 90,
    textAlign: "right",
    fontSize: 16,
  },
});
