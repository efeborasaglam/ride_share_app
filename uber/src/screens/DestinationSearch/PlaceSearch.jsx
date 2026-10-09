import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import * as Location from "expo-location";

const PLACES_ORIGIN = "https://places.googleapis.com";
const MAPS_ORIGIN = "https://maps.googleapis.com";
const DEFAULT_FIELDS =
  "id,displayName,formattedAddress,location,viewport,addressComponents,types";

// alte Feldnamen (GooglePlacesDetailsQuery.fields) -> neue API
const LEGACY_FIELD_MAP = {
  place_id: ["id"],
  name: ["displayName"],
  formatted_address: ["formattedAddress"],
  vicinity: ["shortFormattedAddress"],
  geometry: ["location", "viewport"],
  "geometry/location": ["location"],
  "geometry/viewport": ["viewport"],
  address_components: ["addressComponents"],
  types: ["types"],
  rating: ["rating"],
  user_ratings_total: ["userRatingCount"],
  website: ["websiteUri"],
  url: ["googleMapsUri"],
  formatted_phone_number: ["nationalPhoneNumber"],
  international_phone_number: ["internationalPhoneNumber"],
  price_level: ["priceLevel"],
  utc_offset: ["utcOffsetMinutes"],
  opening_hours: ["regularOpeningHours"],
  photos: ["photos"],
};

const legacyFieldsToMask = (f) => {
  const mapped = String(f)
    .split(",")
    .map((s) => s.trim())
    .flatMap((s) => LEGACY_FIELD_MAP[s] ?? []);
  return mapped.length ? [...new Set(mapped)].join(",") : DEFAULT_FIELDS;
};

// alte Typ-Namen (query.types) -> neue API
const mapTypes = (types) => {
  const list = Array.isArray(types) ? types : String(types).split("|");
  const out = list.flatMap((t) => {
    if (t === "geocode" || t === "establishment") return [];
    if (t === "address")
      return ["street_address", "route", "premise", "subpremise"];
    return [t];
  });
  return [...new Set(out)].slice(0, 5);
};

const newToken = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });

const toSubstrings = (matches = []) =>
  matches.map((m) => ({
    offset: m.startOffset ?? 0,
    length: (m.endOffset ?? 0) - (m.startOffset ?? 0),
  }));

// Neue API -> Format der alten Bibliothek (data)
const toLegacyPrediction = (p) => ({
  description: p.text?.text ?? "",
  place_id: p.placeId,
  id: p.placeId,
  reference: p.placeId,
  matched_substrings: toSubstrings(p.text?.matches),
  structured_formatting: {
    main_text: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
    main_text_matched_substrings: toSubstrings(
      p.structuredFormat?.mainText?.matches,
    ),
    secondary_text: p.structuredFormat?.secondaryText?.text ?? "",
  },
  types: p.types ?? [],
  distance_meters: p.distanceMeters,
});

// Neue API -> Format der alten Bibliothek (details)
const toLegacyDetails = (d) => ({
  place_id: d.id,
  name: d.displayName?.text,
  formatted_address: d.formattedAddress,
  vicinity: d.shortFormattedAddress,
  types: d.types ?? [],
  geometry: {
    location: { lat: d.location?.latitude, lng: d.location?.longitude },
    viewport: d.viewport
      ? {
          northeast: {
            lat: d.viewport.high?.latitude,
            lng: d.viewport.high?.longitude,
          },
          southwest: {
            lat: d.viewport.low?.latitude,
            lng: d.viewport.low?.longitude,
          },
        }
      : undefined,
  },
  address_components: (d.addressComponents ?? []).map((c) => ({
    long_name: c.longText,
    short_name: c.shortText,
    types: c.types ?? [],
  })),
  rating: d.rating,
  user_ratings_total: d.userRatingCount,
  website: d.websiteUri,
  url: d.googleMapsUri,
  formatted_phone_number: d.nationalPhoneNumber,
  international_phone_number: d.internationalPhoneNumber,
  price_level: d.priceLevel,
  utc_offset: d.utcOffsetMinutes,
  opening_hours: d.regularOpeningHours,
  photos: d.photos,
  raw: d, // Originalantwort der neuen API
});

const rowKey = (r) =>
  r.isCurrentLocation ? "__current_location" : (r.place_id ?? r.description);

export const GooglePlacesAutocomplete = forwardRef(
  function GooglePlacesAutocomplete(
    {
      placeholder,
      onPress,
      onFail,
      onNotFound,
      onTimeout,
      fetchDetails = false,
      fields, // neue API: Feld-Maske oder "*"
      isNewPlacesAPI = true, // wird akzeptiert, hier immer die neue API
      query = {},
      styles: custom = {},
      suppressDefaultStyles = false,
      textInputProps = {},
      textInputHide = false,
      minLength = 1,
      debounce = 300,
      timeout = 20000,
      preProcess,
      autoFillOnNotFound = false,
      predefinedPlaces = [],
      predefinedPlacesAlwaysVisible = false,
      currentLocation = false,
      currentLocationLabel = "Current location",
      nearbyPlacesAPI = "GooglePlacesSearch", // "GooglePlacesSearch" | "GoogleReverseGeocoding" | "None"
      GooglePlacesSearchQuery = { rankby: "distance", type: "restaurant" },
      GooglePlacesDetailsQuery = {},
      GoogleReverseGeocodingQuery = {},
      filterReverseGeocodingByTypes = [],
      enableHighAccuracyLocation = true,
      enablePoweredByContainer = true,
      poweredByImage, // optional: require("...png") für das Google-Logo
      requestUrl, // { url, useOnPlatform: "all" | "web", headers }
      listViewDisplayed = "auto",
      keepResultsAfterBlur = false,
      keyboardShouldPersistTaps = "always",
      disableScroll = false,
      isRowScrollable = true,
      listUnderlayColor = "#c8c7cc",
      listHoverColor = "#ececec", // nur Web, auf iOS ohne Wirkung
      numberOfLines = 1,
      renderRow,
      renderDescription,
      renderLeftButton,
      renderRightButton,
      renderHeaderComponent,
      listEmptyComponent,
      listLoaderComponent,
    },
    ref,
  ) {
    const apiKey = query.key ?? process.env.EXPO_PUBLIC_GOOGLE_KEY;

    const [text, setText] = useState("");
    const [predictions, setPredictions] = useState([]);
    const [nearbyActive, setNearbyActive] = useState(false);
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingKey, setLoadingKey] = useState(null);
    const [searched, setSearched] = useState(false);

    const inputRef = useRef(null);
    const textRef = useRef("");
    const requestId = useRef(0);
    const debounceTimer = useRef(null);
    const sessionToken = useRef(newToken());
    const runSearchRef = useRef(null);
    textRef.current = text;

    useEffect(() => () => clearTimeout(debounceTimer.current), []);

    // ---------- Proxy-Unterstützung (requestUrl) ----------
    const useProxy =
      Boolean(requestUrl?.url) &&
      (requestUrl.useOnPlatform === "web" ? Platform.OS === "web" : true);
    const placesOrigin = useProxy
      ? requestUrl.url.replace(/\/$/, "")
      : PLACES_ORIGIN;
    const mapsOrigin = useProxy
      ? requestUrl.url.replace(/\/$/, "")
      : MAPS_ORIGIN;
    const extraHeaders = useProxy ? (requestUrl.headers ?? {}) : {};

    // ---------- Request-Helfer mit Timeout ----------
    const request = async (url, init = {}) => {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
      try {
        const res = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers: { ...(init.headers ?? {}), ...extraHeaders },
        });
        const json = await res.json();
        return { ok: res.ok, status: res.status, json };
      } catch (e) {
        e.timedOut = timedOut;
        throw e;
      } finally {
        clearTimeout(timer);
      }
    };

    const handleError = (e) => {
      if (e?.timedOut) onTimeout?.();
      else onFail?.(e?.message ?? String(e));
    };

    const rowText = (row) =>
      renderDescription
        ? renderDescription(row)
        : row.description || row.formatted_address || row.name || "";

    // ---------- Imperative Methoden (ref) ----------
    useImperativeHandle(ref, () => ({
      setAddressText: (t) => setText(t),
      getAddressText: () => textRef.current,
      blur: () => inputRef.current?.blur(),
      focus: () => inputRef.current?.focus(),
      isFocused: () => inputRef.current?.isFocused() ?? false,
      getCurrentLocation: () => getCurrentLocation(),
      clear: () => {
        requestId.current++;
        clearTimeout(debounceTimer.current);
        inputRef.current?.clear();
        setText("");
        setPredictions([]);
        setNearbyActive(false);
        setSearched(false);
        setLoading(false);
        setLoadingKey(null);
      },
    }));

    // ---------- Autocomplete ----------
    const buildBody = (input) => {
      const body = {
        input,
        sessionToken: query.sessiontoken ?? sessionToken.current,
      };
      if (query.language) body.languageCode = query.language;
      if (query.region) body.regionCode = query.region;
      if (query.components) {
        const codes = String(query.components)
          .split("|")
          .filter((c) => c.startsWith("country:"))
          .map((c) => c.slice(8));
        if (codes.length) body.includedRegionCodes = codes;
      }
      if (query.types) {
        const t = mapTypes(query.types);
        if (t.length) body.includedPrimaryTypes = t;
      }
      if (query.location && query.radius) {
        const [lat, lng] = String(query.location).split(",").map(Number);
        const circle = {
          center: { latitude: lat, longitude: lng },
          radius: Number(query.radius),
        };
        if (query.strictbounds) body.locationRestriction = { circle };
        else body.locationBias = { circle };
      }
      if (query.origin) {
        const [lat, lng] = String(query.origin).split(",").map(Number);
        body.origin = { latitude: lat, longitude: lng };
      }
      if (query.offset != null) body.inputOffset = Number(query.offset);
      return body;
    };

    const runSearch = async (raw) => {
      const q = preProcess ? preProcess(raw) : raw;
      if (!q || q.trim().length === 0 || q.length < minLength) {
        requestId.current++;
        setPredictions([]);
        setSearched(false);
        setLoading(false);
        return;
      }
      const id = ++requestId.current;
      setLoading(true);
      try {
        const { ok, status, json } = await request(
          `${placesOrigin}/v1/places:autocomplete`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": apiKey,
            },
            body: JSON.stringify(buildBody(q)),
          },
        );
        if (id !== requestId.current) return;
        if (!ok) {
          onFail?.(json?.error?.message ?? `HTTP ${status}`);
          setPredictions([]);
          return;
        }
        const rows = (json.suggestions ?? [])
          .filter((s) => s.placePrediction)
          .map((s) => toLegacyPrediction(s.placePrediction));
        setSearched(true);
        if (rows.length === 0) {
          onNotFound?.();
          setPredictions(
            autoFillOnNotFound
              ? [{ description: q, isPredefinedPlace: true, isAutoFill: true }]
              : [],
          );
        } else {
          setPredictions(rows);
        }
      } catch (e) {
        if (id !== requestId.current) return;
        handleError(e);
        setPredictions([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    };
    runSearchRef.current = runSearch; // immer die aktuellste Version

    const handleChangeText = (t) => {
      setText(t);
      setNearbyActive(false);
      clearTimeout(debounceTimer.current);
      if (t.length === 0) {
        runSearchRef.current("");
        return;
      }
      if (debounce > 0) {
        debounceTimer.current = setTimeout(
          () => runSearchRef.current(t),
          debounce,
        );
      } else {
        runSearchRef.current(t);
      }
    };

    // ---------- Auswahl abschließen ----------
    const commit = (row, details) => {
      clearTimeout(debounceTimer.current);
      requestId.current++;
      setLoading(false);
      setLoadingKey(null);
      setPredictions([]);
      setNearbyActive(false);
      setSearched(false);
      setText(rowText(row));
      inputRef.current?.blur();
      sessionToken.current = newToken();
      onPress?.(row, details);
    };

    // ---------- Aktueller Standort + Umgebung ----------
    const requestNearby = async (latitude, longitude) => {
      try {
        if (nearbyPlacesAPI === "GoogleReverseGeocoding") {
          const params = Object.entries({
            latlng: `${latitude},${longitude}`,
            key: apiKey,
            ...(query.language ? { language: query.language } : {}),
            ...GoogleReverseGeocodingQuery,
          })
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join("&");
          const { json } = await request(
            `${mapsOrigin}/maps/api/geocode/json?${params}`,
          );
          if (json.status !== "OK" && json.status !== "ZERO_RESULTS") {
            onFail?.(json.error_message ?? json.status);
            setLoadingKey(null);
            return;
          }
          let results = json.results ?? [];
          if (filterReverseGeocodingByTypes.length > 0) {
            results = results.filter((r) =>
              r.types?.some((t) => filterReverseGeocodingByTypes.includes(t)),
            );
          }
          if (results.length === 0) {
            onNotFound?.();
            setLoadingKey(null);
            return;
          }
          setPredictions(
            results.map((r) => ({
              description: r.formatted_address,
              formatted_address: r.formatted_address,
              place_id: r.place_id,
              geometry: r.geometry,
              types: r.types,
            })),
          );
        } else {
          const q = GooglePlacesSearchQuery;
          const body = {
            maxResultCount: Math.min(Number(q.maxResultCount ?? 20), 20),
            rankPreference:
              q.rankby === "prominence" ? "POPULARITY" : "DISTANCE",
            locationRestriction: {
              circle: {
                center: { latitude, longitude },
                radius: Number(q.radius ?? 5000),
              },
            },
          };
          const types = q.type ? [q.type] : q.types;
          if (types)
            body.includedTypes = Array.isArray(types) ? types : [types];
          if (query.language) body.languageCode = query.language;
          const { ok, status, json } = await request(
            `${placesOrigin}/v1/places:searchNearby`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask":
                  "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types",
              },
              body: JSON.stringify(body),
            },
          );
          if (!ok) {
            onFail?.(json?.error?.message ?? `HTTP ${status}`);
            setLoadingKey(null);
            return;
          }
          const places = json.places ?? [];
          if (places.length === 0) {
            onNotFound?.();
            setLoadingKey(null);
            return;
          }
          setPredictions(
            places.map((p) => {
              const name = p.displayName?.text ?? "";
              const vicinity = p.shortFormattedAddress ?? p.formattedAddress;
              return {
                description: vicinity ? `${name}, ${vicinity}` : name,
                name,
                vicinity,
                formatted_address: p.formattedAddress,
                place_id: p.id,
                geometry: {
                  location: {
                    lat: p.location?.latitude,
                    lng: p.location?.longitude,
                  },
                },
                types: p.types,
              };
            }),
          );
        }
        setNearbyActive(true);
        setSearched(true);
        setLoadingKey(null);
      } catch (e) {
        handleError(e);
        setLoadingKey(null);
      }
    };

    const getCurrentLocation = async () => {
      setLoadingKey("__current_location");
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== "granted") {
          onFail?.("Location permission denied");
          setLoadingKey(null);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: enableHighAccuracyLocation
            ? Location.Accuracy.High
            : Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = pos.coords;
        if (nearbyPlacesAPI === "None") {
          const loc = {
            description: currentLocationLabel,
            geometry: { location: { lat: latitude, lng: longitude } },
          };
          commit(loc, loc);
        } else {
          await requestNearby(latitude, longitude);
        }
      } catch (e) {
        handleError(e);
        setLoadingKey(null);
      }
    };

    // ---------- Zeile antippen ----------
    const handleRowPress = async (row) => {
      if (row.isCurrentLocation) {
        await getCurrentLocation();
        return;
      }
      if (row.isPredefinedPlace) {
        commit(row, row);
        return;
      }
      if (!fetchDetails) {
        commit(row);
        return;
      }
      clearTimeout(debounceTimer.current);
      requestId.current++;
      setLoading(false);
      setLoadingKey(rowKey(row));
      try {
        let mask = DEFAULT_FIELDS;
        if (fields) mask = Array.isArray(fields) ? fields.join(",") : fields;
        else if (GooglePlacesDetailsQuery.fields)
          mask = legacyFieldsToMask(GooglePlacesDetailsQuery.fields);

        const url =
          `${placesOrigin}/v1/places/${row.place_id}` +
          `?sessionToken=${sessionToken.current}` +
          (query.language ? `&languageCode=${query.language}` : "");
        const { ok, status, json } = await request(url, {
          headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": mask },
        });
        if (!ok) {
          onFail?.(json?.error?.message ?? `HTTP ${status}`);
          setLoadingKey(null);
          return;
        }
        commit(row, toLegacyDetails(json));
      } catch (e) {
        handleError(e);
        setLoadingKey(null);
      }
    };

    // ---------- Anzeige ----------
    const sx = (key) =>
      suppressDefaultStyles ? custom[key] : [defaultStyles[key], custom[key]];

    const special = [];
    if (!nearbyActive && (text.length === 0 || predefinedPlacesAlwaysVisible)) {
      if (currentLocation) {
        special.push({
          description: currentLocationLabel,
          isCurrentLocation: true,
        });
      }
      special.push(
        ...predefinedPlaces.map((p) => ({ ...p, isPredefinedPlace: true })),
      );
    }
    const data = nearbyActive ? predictions : [...special, ...predictions];

    const busy = loading || loadingKey !== null;
    const showEmpty =
      Boolean(listEmptyComponent) &&
      searched &&
      !busy &&
      predictions.length === 0 &&
      text.trim().length >= minLength;

    const showPowered =
      enablePoweredByContainer &&
      data.some((r) => !r.isCurrentLocation && !r.isPredefinedPlace);

    const visible =
      listViewDisplayed === "auto"
        ? (focused || keepResultsAfterBlur) &&
          (data.length > 0 ||
            showEmpty ||
            (busy && Boolean(listLoaderComponent)) ||
            Boolean(renderHeaderComponent))
        : Boolean(listViewDisplayed);

    const footer =
      (busy && listLoaderComponent) || showPowered ? (
        <>
          {busy ? (listLoaderComponent ?? null) : null}
          {showPowered ? (
            <View
              style={[
                suppressDefaultStyles ? {} : defaultStyles.row,
                defaultStyles.poweredContainer,
                custom.poweredContainer,
              ]}
            >
              {poweredByImage ? (
                <Image
                  style={[defaultStyles.powered, custom.powered]}
                  resizeMode="contain"
                  source={poweredByImage}
                />
              ) : (
                <Text style={[defaultStyles.poweredText, custom.powered]}>
                  powered by Google
                </Text>
              )}
            </View>
          ) : null}
        </>
      ) : null;

    const renderRowData = (row, index) =>
      renderRow ? (
        renderRow(row, index)
      ) : (
        <Text
          style={[
            suppressDefaultStyles ? {} : defaultStyles.description,
            custom.description,
            row.isPredefinedPlace || row.isCurrentLocation
              ? [
                  suppressDefaultStyles
                    ? {}
                    : defaultStyles.predefinedPlacesDescription,
                  custom.predefinedPlacesDescription,
                ]
              : {},
          ]}
          numberOfLines={numberOfLines}
        >
          {rowText(row)}
        </Text>
      );

    const renderLoader = (row) =>
      loadingKey !== null && loadingKey === rowKey(row) ? (
        <View
          style={[
            suppressDefaultStyles ? {} : defaultStyles.loader,
            custom.loader,
          ]}
        >
          <ActivityIndicator animating size="small" />
        </View>
      ) : null;

    const InputComp = textInputProps.InputComp ?? TextInput;
    const { InputComp: _ignored, ...inputProps } = textInputProps;

    return (
      <View style={sx("container")} pointerEvents="box-none">
        {!textInputHide && (
          <View style={sx("textInputContainer")}>
            {renderLeftButton?.()}
            <InputComp
              ref={inputRef}
              placeholder={placeholder}
              placeholderTextColor="gray"
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
              style={sx("textInput")}
              value={text}
              {...inputProps}
              onFocus={(e) => {
                setFocused(true);
                inputProps.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                inputProps.onBlur?.(e);
              }}
              onChangeText={(t) => {
                handleChangeText(t);
                inputProps.onChangeText?.(t);
              }}
            />
            {renderRightButton?.()}
          </View>
        )}

        {visible && (
          <FlatList
            style={sx("listView")}
            data={data}
            keyExtractor={(item, i) => `${rowKey(item)}-${i}`}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            scrollEnabled={!disableScroll}
            ItemSeparatorComponent={() => <View style={sx("separator")} />}
            ListHeaderComponent={
              renderHeaderComponent ? renderHeaderComponent(text) : null
            }
            ListFooterComponent={footer}
            ListEmptyComponent={showEmpty ? listEmptyComponent : null}
            renderItem={({ item, index }) => (
              <ScrollView
                style={{ flex: 1 }}
                scrollEnabled={isRowScrollable}
                keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <TouchableHighlight
                  style={{ minWidth: "100%" }}
                  onPress={() => handleRowPress(item)}
                  underlayColor={listUnderlayColor}
                >
                  <View
                    style={[
                      suppressDefaultStyles ? {} : defaultStyles.row,
                      custom.row,
                      item.isPredefinedPlace ? custom.specialItemRow : {},
                    ]}
                  >
                    {renderRowData(item, index)}
                    {renderLoader(item)}
                  </View>
                </TouchableHighlight>
              </ScrollView>
            )}
          />
        )}
      </View>
    );
  },
);

export default GooglePlacesAutocomplete;

// Standard-Styles wie bei der Original-Bibliothek
const defaultStyles = StyleSheet.create({
  container: { flex: 1 },
  textInputContainer: {
    flexDirection: "row",
    backgroundColor: "#C9C9CE",
    height: 44,
    borderTopColor: "#7e7e7e",
    borderBottomColor: "#b5b5b5",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    height: 28,
    marginTop: 7.5,
    marginLeft: 8,
    marginRight: 8,
    paddingTop: 4.5,
    paddingBottom: 4.5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
  },
  listView: {},
  row: {
    backgroundColor: "#FFFFFF",
    padding: 13,
    minHeight: 44,
    flexDirection: "row",
  },
  description: {},
  predefinedPlacesDescription: { color: "#1faadb" },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#c8c7cc" },
  loader: { flexDirection: "row", justifyContent: "flex-end", height: 20 },
  poweredContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 5,
    borderColor: "#c8c7cc",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  powered: {},
  poweredText: { fontSize: 12, color: "#5f6368" },
});
