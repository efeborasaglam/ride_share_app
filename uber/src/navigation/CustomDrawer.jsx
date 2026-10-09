import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";

export default function CustomDrawer(props) {
  return (
    <DrawerContentScrollView {...props}>
      <View
        style={{
          backgroundColor: "#212121",
          padding: 15,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#cacaca",
              width: 50,
              height: 50,
              borderRadius: 25,
              marginRight: 10,
            }}
          ></View>
          <View>
            <Text style={{ color: "white", fontSize: 24 }}>
              Efe Bora Saglam
            </Text>
            <Text style={{ color: "lightgrey", fontSize: 24 }}>5.00 *</Text>
          </View>
        </View>
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#919191",
            borderBottomWidth: 1,
            borderBottomColor: "#919191",
            paddingVertical: 5,
            marginVertical: 10,
          }}
        >
          <Pressable
            onPress={() => {
              console.warn("Messages");
            }}
          >
            <Text style={{ color: "#dddddd", paddingVertical: 5 }}>
              Messages
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            console.warn("Do more with your account");
          }}
        >
          <Text style={{ color: "#dddddd", paddingVertical: 5 }}>
            Do more with your account
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            console.warn("Make Money driving");
          }}
        >
          <Text style={{ color: "white", paddingVertical: 5 }}>
            Maker money driving
          </Text>
        </Pressable>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}
const styles = StyleSheet.create({});
