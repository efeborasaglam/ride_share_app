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
import ReportModal from "../../components/ReportModal";
import ScreenHeader from "../../components/ScreenHeader";
import { useTheme, useThemedStyles } from "../../theme";
import { useTranslation } from "react-i18next";

const client = generateClient();

export default function Chat() {
  const { t } = useTranslation();
  const s = useTheme();
  const styles = useThemedStyles(makeStyles);
  const route = useRoute();
  const navigation = useNavigation();
  const { requestId, title, subtitle } = route.params;
  const [reportOpen, setReportOpen] = useState(false);

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
          if (active) setError(t("chat.error.load"));
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
        t("chat.alert.could_not_send"),
        e.errors?.[0]?.message ?? t("chat.alert.try_again"),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        onBack={() => navigation.goBack()}
        menu={false}
        action={
          <Pressable onPress={() => setReportOpen(true)} hitSlop={10}>
            <Text style={styles.report}>{t("chat.report")}</Text>{" "}
          </Pressable>
        }
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={s.primary} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 12 }}
          data={messages}
          inverted
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <Text style={[styles.empty, { transform: [{ scaleY: -1 }] }]}>
              {t("chat.empty")}
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
          placeholder={t("chat.input.placeholder")}
          placeholderTextColor={s.muted}
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
            <ActivityIndicator color={s.onPrimary} />
          ) : (
            <Text style={styles.sendText}>{t("chat.button.send")}</Text>
          )}
        </Pressable>
      </View>

      <ReportModal
        visible={reportOpen}
        requestId={requestId}
        onClose={() => setReportOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    report: { color: t.danger, fontWeight: "700", fontSize: 15 },
    error: { color: t.danger, padding: 12 },
    empty: { textAlign: "center", color: t.muted, padding: 24 },
    bubble: {
      maxWidth: "80%",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      marginVertical: 4,
    },
    mine: { alignSelf: "flex-end", backgroundColor: t.primary },
    theirs: { alignSelf: "flex-start", backgroundColor: t.chip },
    mineText: { color: t.onPrimary, fontSize: 16 },
    theirsText: { color: t.chipText, fontSize: 16 },
    mineTime: {
      color: "#FFE7D6",
      fontSize: 11,
      marginTop: 2,
      alignSelf: "flex-end",
    },
    theirsTime: {
      color: t.muted,
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
      borderTopColor: t.border,
      backgroundColor: t.surface,
    },
    input: {
      flex: 1,
      maxHeight: 110,
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.bg,
      color: t.text,
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 16,
    },
    send: {
      marginLeft: 8,
      backgroundColor: t.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 18,
    },
    sendText: { color: t.onPrimary, fontWeight: "600" },
  });
