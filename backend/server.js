import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());

// Vorschläge beim Tippen
app.get("/autocomplete", async (req, res) => {
    try {
        const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.GOOGLE_MAPS_KEY,
            },
            body: JSON.stringify({
                input: req.query.input || "",
                languageCode: req.query.language || "en",
            }),
        });
        res.json(await r.json());
    } catch (e) {
        res.status(500).json({ error: "Autocomplete failed" });
    }
});

// Koordinaten zu einem ausgewählten Ort
app.get("/details/:placeId", async (req, res) => {
    try {
        const r = await fetch(`https://places.googleapis.com/v1/places/${req.params.placeId}`, {
            headers: {
                "X-Goog-Api-Key": process.env.GOOGLE_MAPS_KEY,
                "X-Goog-FieldMask": "id,displayName,formattedAddress,location",
            },
        });
        res.json(await r.json());
    } catch (e) {
        res.status(500).json({ error: "Details failed" });
    }
});

app.listen(5000, () => console.log("Backend läuft auf Port 5000"));