import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "savedPlaces:v1";

export async function loadSavedPlaces() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const persist = (list) => AsyncStorage.setItem(KEY, JSON.stringify(list));

export function useSavedPlaces() {
  const [places, setPlaces] = useState([]);

  const reload = useCallback(async () => {
    setPlaces(await loadSavedPlaces());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = async ({ label, address, geometry }) => {
    const current = await loadSavedPlaces();
    const next = [
      ...current,
      { id: String(Date.now()), label, address, geometry },
    ];
    await persist(next);
    setPlaces(next);
  };

  const remove = async (id) => {
    const next = (await loadSavedPlaces()).filter((p) => p.id !== id);
    await persist(next);
    setPlaces(next);
  };

  return { places, add, remove, reload };
}
