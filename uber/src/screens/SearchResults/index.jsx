import React, { useState } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { generateClient } from "aws-amplify/api";
import { useRoute, useNavigation } from "@react-navigation/native";
import RouteMap from "../../components/RouteMap";
import UberTypes from "../../components/UberTypes";
import { createOrder } from "../../graphql/operations";

const client = generateClient();

const SearchResults = () => {
  const typeState = useState(null);
  const route = useRoute();
  const navigation = useNavigation();
  const { originPlace, destinationPlace } = route.params;

  const onSubmit = async () => {
    const [type] = typeState;
    if (!type) return;

    try {
      const res = await client.graphql({
        query: createOrder,
        variables: {
          input: {
            type,
            originLatitude: originPlace.details.geometry.location.lat,
            originLongitude: originPlace.details.geometry.location.lng,
            destLatitude: destinationPlace.details.geometry.location.lat,
            destLongitude: destinationPlace.details.geometry.location.lng,
            carId: "1",
          },
        },
      });
      console.log("ORDER:", res.data.createOrder);
      navigation.navigate("OrderPage", { id: res.data.createOrder.id });
    } catch (e) {
      console.log("ORDER ERROR:", e.errors ?? e);
    }
  };

  return (
    <View style={{ display: "flex", justifyContent: "space-between" }}>
      <View style={{ height: Dimensions.get("window").height - 400 }}>
        <RouteMap origin={originPlace} destination={destinationPlace} />
      </View>
      <View style={{ height: 400 }}>
        <UberTypes typeState={typeState} onSubmit={onSubmit} />
      </View>
    </View>
  );
};

export default SearchResults;

const styles = StyleSheet.create({});
