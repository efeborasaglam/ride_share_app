import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import GooglePlacesAutocomplete from "./PlaceSearch";
import PlaceRow from "./PlaceRow";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Pressable, Text } from "react-native";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useSavedPlaces } from "./savedPlaces";

const DestinationSearch = () => {
  const { places, reload } = useSavedPlaces();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const [originPlace, setOriginPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  const next = route.params?.next ?? "SearchResults";

  useEffect(() => {
    if (originPlace && destinationPlace) {
      navigation.navigate(next, { originPlace, destinationPlace });
    }
  }, [originPlace, destinationPlace]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const predefinedPlaces = places.map((p) => ({
    description: p.label,
    geometry: p.geometry,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <GooglePlacesAutocomplete
          placeholder={t("destinationsearch.where")}
          onPress={(data, details = null) => {
            setOriginPlace({ data, details });
            console.log(data, details);
          }}
          suppressDefaultStyles
          currentLocation={true}
          currentLocationLabel={t("destinationsearch.current")}
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
          predefinedPlaces={predefinedPlaces}
        />
        <GooglePlacesAutocomplete
          placeholder={t("destinationsearch.whereto")}
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
      <Pressable
        style={{ position: "absolute", bottom: 20, alignSelf: "center" }}
        onPress={() => navigation.navigate("ManagePlaces")}
      >
        <Text style={{ color: "#1faadb" }}>
          {t("destinationsearch.managePlaces", "Orte verwalten")}
        </Text>
      </Pressable>
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
