import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import { getCurrentUser } from "aws-amplify/auth";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { listMessages, sendMessage } from "../../graphql/operations";
import { formatTime } from "../../utils/format";

const client = generateClient();

export default function Chat() {
  const route = useRoute();
  const navigation = useNavigation();
  const { requestId, title, subtitle } = route.params;

  const [myId, setMyId] = useState(null);
  const [messages, setMessages] = useState([]); // newest first
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((u) => setMyId(u.userId))
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        try {
          const res = await client.graphql({
            query: listMessages,
            variables: { requestId },
          });
          if (active) {
            setMessages(res.data.listMessages ?? []);
            setError("");
          }
        } catch (e) {
          console.log("LIST MESSAGES ERROR:", e.errors ?? e);
          if (active) setError("Could not load messages.");
        } finally {
          if (active) setLoading(false);
        }
      };

      load();
      const timer = setInterval(load, 3000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [requestId]),
  );

  const onSend = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const res = await client.graphql({
        query: sendMessage,
        variables: { requestId, text: value },
      });
      setText("");
      setMessages((prev) => [res.data.sendMessage, ...prev]);
    } catch (e) {
      console.log("SEND MESSAGE ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not send",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12 }}
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <Text style={[styles.empty, { transform: [{ scaleY: -1 }] }]}>
              Say hello and agree on the pickup details.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={mine ? styles.mineText : styles.theirsText}>
                  {item.text}
                </Text>
                <Text style={mine ? styles.mineTime : styles.theirsTime}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <Pressable
          style={[styles.send, (!text.trim() || sending) && { opacity: 0.4 }]}
          disabled={!text.trim() || sending}
          onPress={onSend}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingTop: 56, backgroundColor: "#000" },
  back: { color: "#fff", fontSize: 16, marginBottom: 8 },
  title: { color: "#fff", fontSize: 20, fontWeight: "700" },
  subtitle: { color: "#bbb", marginTop: 2 },
  error: { color: "#c62828", padding: 12 },
  empty: { textAlign: "center", color: "#777", padding: 24 },
  bubble: {
    maxWidth: "80%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 4,
  },
  mine: { alignSelf: "flex-end", backgroundColor: "#000" },
  theirs: { alignSelf: "flex-start", backgroundColor: "#eee" },
  mineText: { color: "#fff", fontSize: 16 },
  theirsText: { color: "#000", fontSize: 16 },
  mineTime: {
    color: "#bbb",
    fontSize: 11,
    marginTop: 2,
    alignSelf: "flex-end",
  },
  theirsTime: {
    color: "#777",
    fontSize: 11,
    marginTop: 2,
    alignSelf: "flex-end",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  send: {
    marginLeft: 8,
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  sendText: { color: "#fff", fontWeight: "600" },
});
