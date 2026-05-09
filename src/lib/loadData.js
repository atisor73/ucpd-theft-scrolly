import { csv } from 'd3-fetch';
import { UNKNOWN_CATEGORY } from './mapConfig.js';

const COORDINATE_PATTERN = /-?\d+\.\d+/g;
const DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
const MISCELLANEOUS_ITEM_PATTERNS = [/brass caps? of fire hose/i, /steel caps? of fire hoses/i];
const withBase = (path) => {
  const value = String(path ?? '');

  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith(import.meta.env.BASE_URL)) {
    return value;
  }

  return `${import.meta.env.BASE_URL}${value.replace(/^\//, '')}`;
};

function parseDatePart(value) {
  const match = String(value ?? '').trim().match(DATE_PATTERN);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  return {
    month: Number(month),
    day: Number(day),
    year: 2000 + Number(year)
  };
}

function toTimestamp(datePart) {
  if (!datePart) {
    return null;
  }

  return new Date(datePart.year, datePart.month - 1, datePart.day).getTime();
}

function extractDateParts(text) {
  const matches = String(text ?? '').match(/\d{1,2}\/\d{1,2}\/\d{2}/g) || [];
  return matches.map(parseDatePart).filter(Boolean);
}

export function parseOccurredWindow(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return {
      startMs: null,
      endMs: null,
      pointMs: null,
      display: ''
    };
  }

  const dateParts = extractDateParts(text);

  if (dateParts.length) {
    const startMs = toTimestamp(dateParts[0]);
    const endMs = toTimestamp(dateParts[dateParts.length - 1]);

    return {
      startMs,
      endMs,
      pointMs: startMs,
      display: text
    };
  }

  return {
    startMs: null,
    endMs: null,
    pointMs: null,
    display: text
  };
}

export function parseValidatedLocation(value) {
  const matches = String(value ?? '').match(COORDINATE_PATTERN);

  if (!matches || matches.length < 2) {
    return null;
  }

  const [latitude, longitude] = matches.slice(0, 2).map(Number);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export function normalizeCategory(value, itemStolen = '') {
  if (MISCELLANEOUS_ITEM_PATTERNS.some((pattern) => pattern.test(String(itemStolen)))) {
    return 'Miscellaneous';
  }

  const cleaned = String(value ?? '').trim();
  return cleaned || UNKNOWN_CATEGORY;
}

export async function loadIncidents() {
  const rows = await csv(withBase('/data/ucpd-theft-categorized.csv'));

  return rows
    .map((row, index) => {
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      const location =
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? { latitude, longitude }
          : parseValidatedLocation(row.validated_location);
      const occurredWindow = parseOccurredWindow(row.occurred);

      if (!location) {
        return null;
      }

      return {
        id: row.ucpd_id || String(index),
        comments: row.comments || '',
        disposition: row.disposition || '',
        incident: row.incident || '',
        occurred: row.occurred || '',
        occurredStartMs: occurredWindow.startMs,
        occurredEndMs: occurredWindow.endMs,
        occurredPointMs: occurredWindow.pointMs,
        occurredDisplay: occurredWindow.display,
        reported: row.reported || '',
        reportedDate: row.reported_date || '',
        location: row.location || '',
        locationName: row.location_name || '',
        validatedAddress: row.validated_address || '',
        itemStolen: row.item_stolen || '',
        itemCategory: normalizeCategory(row.item_category, row.item_stolen),
        latitude: location.latitude,
        longitude: location.longitude
      };
    })
    .filter(Boolean);
}

export async function loadSceneStats() {
  const rows = await csv(withBase('/data/panel-scene-stats.csv'));

  console.log('[loadSceneStats] row count', rows.length);
  console.log('[loadSceneStats] sceneIds', rows.map((row) => row.sceneId));
  console.log('[loadSceneStats] cars row', rows.find((row) => row.sceneId === 'cars'));

  return Object.fromEntries(
    rows.map((row) => [
      row.sceneId,
      {
        count: Number(row.count) || 0,
        uniqueHotspots: Number(row.uniqueHotspots) || 0,
        largestHotspotCount: Number(row.largestHotspotCount) || 0,
        topHotspotName: row.topHotspotName || ''
      }
    ])
  );
}

export function incidentsToGeoJson(incidents) {
  return {
    type: 'FeatureCollection',
    features: incidents.map((incident) => ({
      type: 'Feature',
      properties: {
        id: incident.id,
        comments: incident.comments,
        disposition: incident.disposition,
        incident: incident.incident,
        occurred: incident.occurred,
        reported: incident.reported,
        reportedDate: incident.reportedDate,
        location: incident.location,
        locationName: incident.locationName,
        validatedAddress: incident.validatedAddress,
        itemStolen: incident.itemStolen,
        itemCategory: incident.itemCategory
      },
      geometry: {
        type: 'Point',
        coordinates: [incident.longitude, incident.latitude]
      }
    }))
  };
}

export function incidentToGeoJson(incident) {
  if (!incident) {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }

  return incidentsToGeoJson([incident]);
}

export async function loadOptionalGeoJson(url) {
  try {
    const response = await fetch(withBase(url));

    if (!response.ok) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }

    return await response.json();
  } catch {
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}
