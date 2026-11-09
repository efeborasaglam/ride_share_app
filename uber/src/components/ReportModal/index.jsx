import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { generateClient } from "aws-amplify/api";
import { createReport } from "../../graphql/operations";

const client = generateClient();

export default function ReportModal({ visible, requestId, onClose }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await client.graphql({
        query: createReport,
        variables: { requestId, text: text.trim() },
      });
      setText("");
      onClose();
      Alert.alert("Report sent", "Thank you. Our team will review it.");
    } catch (e) {
      console.log("REPORT ERROR:", e.errors ?? e);
      Alert.alert(
        "Could not send report",
        e.errors?.[0]?.message ?? "Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const canSend = text.trim().length >= 5 && !sending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>Report this user</Text>
          <Text style={styles.hint}>
            Describe what happened. Our team will review your report.
          </Text>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="What happened?"
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Pressable
            style={[styles.send, !canSend && { opacity: 0.4 }]}
            disabled={!canSend}
            onPress={send}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send report</Text>
            )}
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: { fontSize: 20, fontWeight: "700" },
  hint: { color: "#555", marginTop: 6, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    height: 130,
    fontSize: 16,
  },
  send: {
    backgroundColor: "#c62828",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 14,
  },
  sendText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancel: {
    textAlign: "center",
    marginTop: 14,
    color: "#1a73e8",
    fontSize: 16,
  },
});
