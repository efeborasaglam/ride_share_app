import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import GooglePlacesAutocomplete from "./PlaceSearch";
import PlaceRow from "./PlaceRow";
import { useNavigation } from "@react-navigation/native";

const homePlace = {
  description: "Home",
  geometry: { location: { lat: 41.0587, lng: 29.0058 } },
};

const workPlace = {
  description: "Fenerbahçe Stadyumu, Istanbul",
  geometry: { location: { lat: 40.9831, lng: 29.0356 } },
};
const DestinationSearch = () => {
  const navigation = useNavigation();

  const [originPlace, setOriginPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);

  useEffect(() => {
    if (originPlace && destinationPlace) {
      console.warn("Redirect to results");
      navigation.navigate("SearchResults", {
        originPlace: originPlace,
        destinationPlace: destinationPlace,
      });
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
          suppressDefaultStyles
          currentLocation={true}
          currentLocationLabel={"Current location"}
          styles={{
            textInput: styles.textInput,
            container: { ...styles.autocompleteContainer, top: 15 },
            listView: styles.listView,
            separator: styles.separator,
          }}
          fetchDetails
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_KEY,
            language: "en",
          }}
          renderRow={(data) => <PlaceRow data={data} />}
          renderDescription={(data) => data.description || data.vicinity}
          predefinedPlaces={[homePlace, workPlace]}
        />
        <GooglePlacesAutocomplete
          placeholder="Where to?"
          onPress={(data, details = null) => {
            setDestinationPlace({ data, details });
            console.log(data, details);
          }}
          suppressDefaultStyles
          styles={{
            textInput: styles.textInput,
            container: styles.autocompleteContainer,
            listView: styles.listView,
            separator: styles.separator,
          }}
          fetchDetails
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_KEY,
            language: "en",
          }}
          renderRow={(data) => <PlaceRow data={data} />}
        />
        {/*circle from*/}
        <View style={styles.circle}></View>
        {/*line*/}
        <View style={styles.line}></View>
        {/*rectangle to*/}
        <View style={styles.square}></View>
      </View>
    </SafeAreaView>
  );
};
export default DestinationSearch;

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginTop: 20,
    height: "100%",
  },
  textInput: {
    padding: 10,
    backgroundColor: "#eee",
    marginVertical: 5,
    marginLeft: 20,
  },
  separator: {
    backgroundColor: "#efefef",
    height: 1,
  },
  listView: {
    position: "absolute",
    top: 100,
  },
  autocompleteContainer: {
    position: "absolute",
    top: 65,
    left: 10,
    right: 10,
  },
  circle: {
    width: 5,
    height: 5,
    backgroundColor: "black",
    position: "absolute",
    top: 36.5,
    left: 15,
    borderRadius: 5,
  },
  line: {
    width: 1,
    height: 42,
    backgroundColor: "#c4c4c4",
    position: "absolute",
    top: 43.5,
    left: 16.5,
  },
  square: {
    width: 5,
    height: 5,
    backgroundColor: "black",
    position: "absolute",
    top: 87,
    left: 15,
  },
});
