import React, { useMemo } from "react";
import "./liveMap.css";

function LiveMap() {
  // Mock people with coordinates around Makkah
  const people = useMemo(() => [
    { id: 1, name: "Ahmed", lat: 21.4225, lng: 39.8262 },
    { id: 2, name: "Sara", lat: 21.425, lng: 39.8275 },
    { id: 3, name: "Omar", lat: 21.421, lng: 39.8289 },
  ], []);

  const markersParam = people
    .map((p) => `markers=color:red%7C${p.lat},${p.lng}`)
    .join("&");

  const base = "https://maps.googleapis.com/maps/api/staticmap";
  const key = ""; // optional: place your Google Static Maps key here
  const url = `${base}?center=21.4225,39.8262&zoom=14&size=640x320&scale=2&${markersParam}${key ? `&key=${key}` : ""}`;

  return (
    <div className="page live-map-page">
      <h2>Live Map</h2>
      <div className="card">
        <img className="map-image" src={url} alt="live map" />
        <div className="legend">
          {people.map((p) => (
            <div key={p.id} className="legend-item">
              <span className="dot" />
              <span>{p.name} — {p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiveMap;





