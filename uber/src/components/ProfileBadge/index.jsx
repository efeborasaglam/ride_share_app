import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { generateClient } from "aws-amplify/api";
import { getPublicProfile } from "../../graphql/operations";

const client = generateClient();

export default function ProfileBadge({ userId, name, size = 44 }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let active = true;
    if (!userId) return undefined;
    (async () => {
      try {
        const res = await client.graphql({
          query: getPublicProfile,
          variables: { userId },
        });
        if (active) setInfo(res.data.getPublicProfile);
      } catch (e) {
        console.log("PUBLIC PROFILE ERROR:", e.errors ?? e);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const shownName = info?.displayName ?? name ?? "User";
  const round = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={styles.row}>
      {info?.photoUrl ? (
        <Image
          source={{ uri: info.photoUrl }}
          style={[round, { backgroundColor: "#ddd" }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[round, styles.placeholder]}>
          <Text style={styles.initial}>
            {shownName.trim().charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ marginLeft: 10, flexShrink: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {shownName}
          {info?.verified ? " ✓" : ""}
        </Text>
        {info?.age != null && (
          <Text style={styles.meta}>{info.age} years old</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  placeholder: {
    backgroundColor: "#bdbdbd",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { color: "#fff", fontSize: 18, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { color: "#555", marginTop: 2 },
});
