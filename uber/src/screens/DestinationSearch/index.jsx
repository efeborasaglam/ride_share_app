import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import GooglePlacesAutocomplete from "./PlaceSearch";

const DestinationSearch = () => {
  const [originPlace, setOriginPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);

  useEffect(() => {
    if (originPlace && destinationPlace) {
      console.warn("Redirect to results");
    }
  }, [originPlace, destinationPlace]);

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <GooglePlacesAutocomplete
          placeholder="Where From?"
          onPress={(data, details = null) => {
            setOriginPlace({ data, details });
            console.log(data, details);
          }}
          fetchDetails
          styles={{ textInput: styles.textInput }}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_KEY,
            language: "en",
          }}
        />
        <GooglePlacesAutocomplete
          placeholder="Where to?"
          onPress={(data, details = null) => {
            setDestinationPlace({ data, details });
            console.log(data, details);
          }}
          fetchDetails
          styles={{ textInput: styles.textInput }}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_KEY,
            language: "en",
          }}
        />
      </View>
    </SafeAreaView>
  );
};
export default DestinationSearch;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 15,
    height: "100%",
  },
  textInput: {
    padding: 10,
    backgroundColor: "#eee",
    marginVertical: 5,
  },
});
