import { StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import { useEffect } from "react";
import DestinationSearch from "./src/screens/DestinationSearch";
import HomeScreen from "./src/screens/HomeScreen";
import RootNavigator from "./src/navigation/Root";
import "react-native-get-random-values";
import { Amplify } from "aws-amplify";

// const { coords } = await Location.getCurrentPositionAsync({});

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-north-1_zdxZEIXAX",
      userPoolClientId: "5ktqbbsln84cntl0kum9qfg5cu",
    },
  },
  API: {
    GraphQL: {
      endpoint:
        "https://njubkvv2tfhbvegpelg7z3ebby.appsync-api.eu-north-1.amazonaws.com/graphql",
      region: "eu-north-1",
      defaultAuthMode: "userPool",
    },
  },
});

export default function App() {
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        console.log("You can use the location");
      } else {
        console.log("Location permission denied");
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <RootNavigator />;
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
