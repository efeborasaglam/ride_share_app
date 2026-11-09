import { useMemo } from "react";
import { useProfile } from "../context/ProfileContext";

export const brand = {
  orange: "#F97127",
  green: "#0D9F60",
  blue: "#115C84",
  teal: "#025B5F",
};

const light = {
  mode: "light",
  bg: "#FFF7F1",
  surface: "#FFFFFF",
  border: "#F3DCCB",
  text: "#0A2A3D",
  muted: "#5A6F7E",
  primary: brand.orange,
  onPrimary: "#FFFFFF",
  accent: brand.green,
  chip: "#FDE6D6",
  chipText: "#0A2A3D",
  danger: "#C62828",
  headerBg: "#FFFFFF",
  headerText: "#0A2A3D",
};

const dark = {
  mode: "dark",
  bg: "#0A2A3D",
  surface: "#103A52",
  border: "#1D5170",
  text: "#F2F7FA",
  muted: "#9DB7C7",
  primary: brand.orange,
  onPrimary: "#FFFFFF",
  accent: "#1FBF77",
  chip: "#17496A",
  chipText: "#F2F7FA",
  danger: "#FF7B7B",
  headerBg: "#071C2A",
  headerText: "#FFFFFF",
};

export function useTheme() {
  const ctx = useProfile(); // null ausserhalb des ProfileProvider (z. B. Login)
  return ctx?.profile?.role === "DRIVER" ? dark : light;
}

export function useThemedStyles(make) {
  const t = useTheme();
  return useMemo(() => make(t), [t]);
}
