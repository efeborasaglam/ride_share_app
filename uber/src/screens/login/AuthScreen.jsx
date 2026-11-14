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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

export default function AuthScreen() {
  const { t } = useTranslation();
  const s = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState("signIn"); // signIn | signUp | confirm | newPassword
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
        setInfo(t("auth.pleaseemail"));
        setMode("confirm");
      } else if (step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setInfo(t("auth.shitpassword"));
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
      setInfo(t("auth.codeemail"));
      setMode("confirm");
    });

  const handleConfirm = () =>
    run(async () => {
      await confirmSignUp({
        username: email.trim(),
        confirmationCode: code.trim(),
      });
      setInfo(t("auth.alright"));
      setCode("");
      setMode("signIn");
    });

  const handleResend = () =>
    run(async () => {
      await resendSignUpCode({ username: email.trim() });
      setInfo(t("auth.newcode"));
    });

  const TITLES = {
    signIn: t("auth.login"),
    signUp: t("auth.register"),
    confirm: t("auth.emailsayok"),
    newPassword: t("auth.newpassword"),
  };
  const BUTTONS = {
    signIn: t("auth.login"),
    signUp: t("auth.createaccount"),
    confirm: t("auth.confirm"),
    newPassword: t("auth.savepassword"),
  };
  const HANDLERS = {
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirm: handleConfirm,
    newPassword: handleNewPassword,
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: s.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        style={{ backgroundColor: s.bg }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        <Logo size={140} style={{ alignSelf: "center", marginBottom: 24 }} />

        <Text style={styles.title}>{TITLES[mode]}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("auth.email")}
          placeholderTextColor={s.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={mode === "signIn" || mode === "signUp"}
        />

        {(mode === "signIn" || mode === "signUp") && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputInner}
              placeholder={t("auth.password")}
              placeholderTextColor={s.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              style={styles.eye}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={s.muted}
              />
            </Pressable>
          </View>
        )}

        {mode === "newPassword" && (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputInner}
              placeholder={t('auth.newpassword"')}
              placeholderTextColor={s.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={10}
              style={styles.eye}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color={s.muted}
              />
            </Pressable>
          </View>
        )}

        {mode === "confirm" && (
          <TextInput
            style={styles.input}
            placeholder={t("auth.code")}
            placeholderTextColor={s.muted}
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
            <ActivityIndicator color={s.onPrimary} />
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
            <Text style={styles.link}>{t("auth.noaccount")}</Text>
          </Pressable>
        )}
        {mode !== "signIn" && (
          <Pressable onPress={() => setMode("signIn")}>
            <Text style={styles.link}>{t("auth.goback")}</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (s) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      justifyContent: "center",
      padding: 24,
      paddingTop: 64,
      backgroundColor: s.bg,
    },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 24, color: s.text },
    input: {
      borderWidth: 1,
      borderColor: s.border,
      backgroundColor: s.surface,
      color: s.text,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
    },
    button: {
      backgroundColor: s.primary,
      padding: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 4,
    },
    buttonText: { color: s.onPrimary, fontSize: 16, fontWeight: "600" },
    link: {
      color: s.primary,
      textAlign: "center",
      marginTop: 16,
      fontWeight: "600",
    },
    error: { color: s.danger, marginBottom: 8 },
    info: { color: s.accent, marginBottom: 8 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: s.border,
      backgroundColor: s.surface,
      borderRadius: 10,
      marginBottom: 12,
    },
    inputInner: {
      flex: 1,
      color: s.text,
      padding: 12,
      fontSize: 16,
    },
    eye: { paddingHorizontal: 12 },
  });
