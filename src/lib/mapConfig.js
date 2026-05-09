export const UNKNOWN_CATEGORY = 'Uncategorized';
export const CARTO_POSITRON_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
export const BUILDING_FILL_COLOR = '#5f0606';
export const BUILDING_OUTLINE_COLOR = '#5f0606';
export const BOUNDARY_LINE_COLOR = '#5f0606';
export const HIGHLIGHT_FILL_COLOR = '#5f0606';
export const HIGHLIGHT_LINE_COLOR = '#5f0606';
export const REGENSTEIN_BUILDING_ID = 487268;
export const REGENSTEIN_BUILDING_NAME = 'JOSEPH REGENSTEIN LIBRARY';

export const CAMPUS_CENTER = {
  latitude: 41.7897,
  longitude: -87.5997,
  label: 'UChicago campus core'
};

export const STUDY_BOUNDS = {
  north: 41.8045,
  south: 41.7790,
  west: -87.6155,
  east: -87.5780
};

export const STUDY_BOUNDS_ARRAY = [
  [STUDY_BOUNDS.west, STUDY_BOUNDS.south],
  [STUDY_BOUNDS.east, STUDY_BOUNDS.north]
];

export const CATEGORY_COLORS = {
  Merchandise: '#8c1d18',
  'Bikes & E-scooters': '#005f73',
  'Wallet, Credit cards, Cash': '#c46b00',
  Tech: '#386641',
  'Car & Car parts': '#3d405b',
  'Unspecified - `Property`': '#6c757d',
  Tools: '#7f5539',
  Bags: '#9a031e',
  'Packages & Food delivery': '#2a9d8f',
  Miscellaneous: '#7b2cbf',
  'Clothing & Jewelry': '#b56576',
  [UNKNOWN_CATEGORY]: '#4f5d75'
};

export function createBoundsFeature(bounds = STUDY_BOUNDS) {
  return {
    type: 'Feature',
    properties: {
      name: 'Hyde Park Study Area'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [bounds.west, bounds.south],
        [bounds.east, bounds.south],
        [bounds.east, bounds.north],
        [bounds.west, bounds.north],
        [bounds.west, bounds.south]
      ]]
    }
  };
}
