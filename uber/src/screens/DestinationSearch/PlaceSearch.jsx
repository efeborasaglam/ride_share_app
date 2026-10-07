import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const DETAILS_URL = "https://places.googleapis.com/v1/places/";

export function GooglePlacesAutocomplete({
  placeholder,
  onPress,
  fetchDetails = false,
  styles: custom = {},
  query = {},
  textInputProps = {},
  minLength = 2,
  debounce = 300,
}) {
  const apiKey = query.key ?? process.env.EXPO_PUBLIC_GOOGLE_KEY;
  const [text, setText] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (selected || text.trim().length < minLength) {
      setPredictions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(AUTOCOMPLETE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
          },
          body: JSON.stringify({
            input: text,
            ...(query.language ? { languageCode: query.language } : {}),
          }),
        });
        const json = await res.json();
        setPredictions(
          (json.suggestions ?? [])
            .filter((s) => s.placePrediction)
            .map((s) => s.placePrediction),
        );
      } catch (e) {
        console.log("autocomplete error", e);
      }
    }, debounce);
    return () => clearTimeout(timer);
  }, [text, selected]);

  const handlePress = async (p) => {
    setSelected(true);
    setText(p.text.text);
    setPredictions([]);

    // Format wie bei der alten Bibliothek
    const data = {
      description: p.text.text,
      place_id: p.placeId,
      structured_formatting: {
        main_text: p.structuredFormat?.mainText?.text ?? p.text.text,
        secondary_text: p.structuredFormat?.secondaryText?.text ?? "",
      },
      types: p.types,
    };

    let details = null;
    if (fetchDetails) {
      try {
        const res = await fetch(DETAILS_URL + p.placeId, {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
          },
        });
        const d = await res.json();
        details = {
          place_id: p.placeId,
          name: d.displayName?.text,
          formatted_address: d.formattedAddress,
          geometry: {
            location: { lat: d.location?.latitude, lng: d.location?.longitude },
          },
        };
      } catch (e) {
        console.log("details error", e);
      }
    }
    onPress?.(data, details);
  };

  return (
    <View style={custom.container}>
      <View style={custom.textInputContainer}>
        <TextInput
          style={[base.textInput, custom.textInput]}
          placeholder={placeholder}
          value={text}
          onChangeText={(t) => {
            setSelected(false);
            setText(t);
          }}
          {...textInputProps}
        />
      </View>
      <View style={custom.listView}>
        {predictions.map((p, i) => (
          <View key={p.placeId}>
            {i > 0 && <View style={[base.separator, custom.separator]} />}
            <Pressable
              style={[base.row, custom.row]}
              onPress={() => handlePress(p)}
            >
              <Text style={custom.description}>{p.text.text}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

export default GooglePlacesAutocomplete;

const base = StyleSheet.create({
  textInput: {
    height: 44,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: "white",
  },
  row: {
    padding: 13,
    minHeight: 44,
    backgroundColor: "white",
    justifyContent: "center",
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#c8c7cc" },
});
