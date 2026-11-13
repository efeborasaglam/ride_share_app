import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  signUp,
  confirmSignUp,
  signIn,
  confirmSignIn,
  resendSignUpCode,
} from "aws-amplify/auth";
import Logo from "../../components/Logo";
import { useTheme, useThemedStyles } from "../../theme";

export default function AuthScreen() {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState("signIn"); // signIn | signUp | confirm | newPassword
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [loading, setLoading] = useState(false);

  const run = async (fn) => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      console.log("AUTH ERROR:", e.name, e.message);
      console.log("UNDERLYING:", e.underlyingError);
      setError(`${e.name}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () =>
    run(async () => {
      const res = await signIn({
        username: email.trim(),
        password,
        options: { authFlowType: "USER_PASSWORD_AUTH" },
      });
      const step = res.nextStep?.signInStep;
      if (step === "CONFIRM_SIGN_UP") {
        await resendSignUpCode({ username: email.trim() });
        setInfo(
          "Bitte bestätige zuerst deine E-Mail. Wir haben dir einen neuen Code geschickt.",
        );
        setMode("confirm");
      } else if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setInfo("Bitte lege ein neues Passwort fest.");
        setMode("newPassword");
      } else if (step && step !== "DONE") {
        setError(`Nicht unterstützter Anmeldeschritt: ${step}`);
      }
      // Bei Erfolg meldet der Hub-Listener in Root.jsx das Login.
    });

  const handleNewPassword = () =>
    run(async () => {
      const res = await confirmSignIn({ challengeResponse: newPassword });
      const step = res.nextStep?.signInStep;
      if (step && step !== "DONE") {
        setError(`Nicht unterstützter Anmeldeschritt: ${step}`);
      }
    });

  const handleSignUp = () =>
    run(async () => {
      await signUp({
        username: email.trim(),
        password,
        options: { userAttributes: { email: email.trim() } },
      });
      setInfo("Wir haben dir einen Code per E-Mail geschickt.");
      setMode("confirm");
    });

  const handleConfirm = () =>
    run(async () => {
      await confirmSignUp({
        username: email.trim(),
        confirmationCode: code.trim(),
      });
      setInfo("E-Mail bestätigt. Du kannst dich jetzt anmelden.");
      setCode("");
      setMode("signIn");
    });

  const handleResend = () =>
    run(async () => {
      await resendSignUpCode({ username: email.trim() });
      setInfo("Neuer Code gesendet.");
    });

  const TITLES = {
    signIn: "Anmelden",
    signUp: "Registrieren",
    confirm: "E-Mail bestätigen",
    newPassword: "Neues Passwort festlegen",
  };
  const BUTTONS = {
    signIn: "Anmelden",
    signUp: "Konto erstellen",
    confirm: "Bestätigen",
    newPassword: "Passwort speichern",
  };
  const HANDLERS = {
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirm: handleConfirm,
    newPassword: handleNewPassword,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={{ backgroundColor: t.bg }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <Logo size={140} style={{ alignSelf: "center", marginBottom: 24 }} />

        <Text style={styles.title}>{TITLES[mode]}</Text>

        <TextInput
          style={styles.input}
          placeholder="E-Mail"
          placeholderTextColor={t.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={mode === "signIn" || mode === "signUp"}
        />

        {(mode === "signIn" || mode === "signUp") && (
          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor={t.muted}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        )}

        {mode === "newPassword" && (
          <TextInput
            style={styles.input}
            placeholder="Neues Passwort"
            placeholderTextColor={t.muted}
            secureTextEntry
            autoCapitalize="none"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        )}

        {mode === "confirm" && (
          <TextInput
            style={styles.input}
            placeholder="Code aus der E-Mail"
            placeholderTextColor={t.muted}
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!info && <Text style={styles.info}>{info}</Text>}

        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={HANDLERS[mode]}
        >
          {loading ? (
            <ActivityIndicator color={t.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>{BUTTONS[mode]}</Text>
          )}
        </Pressable>

        {mode === "confirm" && (
          <Pressable onPress={handleResend}>
            <Text style={styles.link}>Code erneut senden</Text>
          </Pressable>
        )}
        {mode === "signIn" && (
          <Pressable onPress={() => setMode("signUp")}>
            <Text style={styles.link}>Noch kein Konto? Registrieren</Text>
          </Pressable>
        )}
        {mode !== "signIn" && (
          <Pressable onPress={() => setMode("signIn")}>
            <Text style={styles.link}>Zurück zur Anmeldung</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      paddingTop: 64,
      backgroundColor: t.bg,
    },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 24, color: t.text },
    input: {
      borderWidth: 1,
      borderColor: t.border,
      backgroundColor: t.surface,
      color: t.text,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
    },
    button: {
      backgroundColor: t.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 4,
    },
    buttonText: { color: t.onPrimary, fontSize: 16, fontWeight: "600" },
    link: {
      color: t.primary,
      textAlign: "center",
      marginTop: 16,
      fontWeight: "600",
    },
    error: { color: t.danger, marginBottom: 8 },
    info: { color: t.accent, marginBottom: 8 },
  });
