import React, { useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GooglePlacesAutocomplete from "./PlaceSearch";
import { useSavedPlaces } from "./savedPlaces";

export default function ManageSavedPlaces() {
  const { places, add, remove } = useSavedPlaces();
  const [label, setLabel] = useState("");
  const [picked, setPicked] = useState(null);
  const acRef = useRef(null);

  const save = async () => {
    if (!picked?.details?.geometry) {
      Alert.alert("Bitte zuerst einen Ort suchen und auswählen.");
      return;
    }
    await add({
      label: label.trim() || picked.data.description,
      address: picked.data.description,
      geometry: picked.details.geometry,
    });
    setLabel("");
    setPicked(null);
    acRef.current?.clear();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", padding: 15 }}>
      <Text style={styles.title}>Gespeicherte Orte</Text>

      <GooglePlacesAutocomplete
        ref={acRef}
        placeholder="Ort suchen…"
        fetchDetails
        enablePoweredByContainer={false}
        query={{ key: process.env.EXPO_PUBLIC_GOOGLE_KEY, language: "en" }}
        styles={{ container: { flex: 0 } }}
        onPress={(data, details) => setPicked({ data, details })}
      />

      <TextInput
        style={styles.input}
        placeholder="Name, z. B. Zuhause, Arbeit (optional)"
        value={label}
        onChangeText={setLabel}
      />
      <Pressable
        style={[styles.button, !picked && { opacity: 0.4 }]}
        onPress={save}
        disabled={!picked}
      >
        <Text style={styles.buttonText}>Ort speichern</Text>
      </Pressable>

      <FlatList
        style={{ marginTop: 20 }}
        data={places}
        keyExtractor={(p) => p.id}
        ListEmptyComponent={
          <Text style={{ color: "gray" }}>Noch keine Orte gespeichert.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "600" }}>{item.label}</Text>
              <Text style={{ color: "gray" }} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
            <Pressable onPress={() => remove(item.id)}>
              <Text style={{ color: "#d33" }}>Löschen</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  input: {
    padding: 10,
    backgroundColor: "#eee",
    marginTop: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "600" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
});
