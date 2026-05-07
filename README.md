# UChicago Theft Map Starter

This is a lightweight Svelte + MapLibre GL starter for plotting theft incidents around the Hyde Park / UChicago area.

## What it does

- Loads `ucpd-incident-data.05-06-2026_THEFT_CATEGORIZED.csv`
- Parses the `validated_location` column into latitude/longitude
- Uses the CARTO Positron vector basemap
- Colors theft points by `item_category`
- Draws optional building footprints as maroon fills on top of the basemap
- Auto-loads optional GeoJSON overlays for a boundary and building footprints

## Run it

1. Install a recent Node.js release.
2. Install dependencies:

```bash
npm install
```

3. Copy the theft CSV into the app's public data folder:

```bash
npm run sync-data
```

4. Start the dev server:

```bash
npm run dev
```

## Data files the app expects

- Incident CSV: `public/data/ucpd-theft-categorized.csv`
- Optional study-area boundary: `public/geo/hyde-park-boundary.geojson`
- Optional building footprints: `public/geo/hyde-park-buildings.geojson`

If those GeoJSON files exist, the app will draw them automatically.

## Visual approach

This starter now matches the same general pattern as the Chicago Maroon property map:

- MapLibre GL JS for the map engine
- CARTO Positron as the basemap
- building polygons drawn as a maroon `fill` layer
- incident points drawn as interactive `circle` layers

## Suggested map data sources

If you want to get moving quickly, use OpenStreetMap building footprints exported from Overpass Turbo for the Hyde Park bounding box. It is the fastest way to get campus-scale building polygons into GeoJSON without setting up a GIS pipeline.

- Overpass Turbo: https://overpass-turbo.eu/
- OpenStreetMap data access overview: https://wiki.openstreetmap.org/wiki/Downloading_data

For a cleaner neighborhood outline, use the City of Chicago community area boundary data and pull the Hyde Park polygon:

- Chicago community areas dataset: https://data.cityofchicago.org/

If you decide to expand to a bigger citywide project later, the City of Chicago building footprints dataset is a better long-term source than hand-exporting from Overpass:

- Chicago Data Portal: https://data.cityofchicago.org/

## Recommended first path

1. Keep this starter as-is and verify your theft points render correctly.
2. Add OSM building footprints for the campus and nearby blocks.
3. Replace the placeholder Hyde Park boundary with a cleaner neighborhood or campus outline.
4. Later, add hover popups, time filters, or scrollytelling.

## Overpass query to export buildings

Paste this into Overpass Turbo, run it, and export GeoJSON. Save the result as `public/geo/hyde-park-buildings.geojson`.

```txt
[out:json][timeout:25];
(
  way["building"](41.7790,-87.6155,41.8045,-87.5780);
  relation["building"](41.7790,-87.6155,41.8045,-87.5780);
);
out geom;
```
