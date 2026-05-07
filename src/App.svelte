<svelte:head>
  <title>UChicago Theft Incident Map</title>
  <meta
    name="description"
    content="A scrollytelling story of UChicago Police Department (UCPD) reported thefts."
  />
</svelte:head>

<script>
  import { onMount, tick } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import { incidentsToGeoJson, loadIncidents, loadOptionalGeoJson } from './lib/loadData.js';
  import {
    BOUNDARY_LINE_COLOR,
    BUILDING_FILL_COLOR,
    CAMPUS_CENTER,
    CARTO_POSITRON_STYLE,
    CATEGORY_COLORS,
    HIGHLIGHT_FILL_COLOR,
    HIGHLIGHT_LINE_COLOR,
    REGENSTEIN_BUILDING_ID,
    REGENSTEIN_BUILDING_NAME,
    STUDY_BOUNDS_ARRAY,
    UNKNOWN_CATEGORY,
    createBoundsFeature
  } from './lib/mapConfig.js';

  const fallbackBounds = createBoundsFeature();
  const emptyFeatureCollection = { type: 'FeatureCollection', features: [] };
  const handAssetPaths = ['/assets/hand1.svg', '/assets/hand2.svg', '/assets/hand3.svg', '/assets/hand4.svg'];
  const INTRO_TARGET_HANDS_PER_FRAME = 4;
  const INTRO_HAND_FRAME_MS = 750;
  const INTRO_HAND_LIFETIME_MS = 520;
  const timelineFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const SOURCE_IDS = {
    boundary: 'study-boundary',
    buildings: 'study-buildings',
    uchicagoBuildings: 'uchicago-buildings',
    incidents: 'theft-incidents'
  };

  const LAYER_IDS = {
    boundaryFill: 'study-boundary-fill',
    boundaryLine: 'study-boundary-line',
    buildingsFill: 'study-buildings-fill',
    buildingsLine: 'study-buildings-line',
    uchicagoBuildingsFill: 'uchicago-buildings-fill',
    uchicagoBuildingsLine: 'uchicago-buildings-line',
    buildingHighlightFill: 'study-building-highlight-fill',
    buildingHighlightLine: 'study-building-highlight-line',
    incidents: 'theft-incidents-layer'
  };

  const storyChapters = [
    {
      id: 'intro',
      kicker: ' ',
      title: 'May 2025 - May 2026 UChicago Crime Data',
      body:
        'The opening view is meant to feel alive: a few illustrated hands wander through Hyde Park using paths sampled from the theft coordinates.',
      graphic: 'lede'
    },
    {
      id: 'buildings',
      kicker: 'Context',
      title: 'Keep the base map clean for now',
      body:
        'The building source is loaded, but the full footprint layer stays hidden. That keeps the landing view lighter while preserving the option to highlight one building or a selected group later.',
      graphic: 'stats'
    },
    {
      id: 'regenstein',
      kicker: 'Anchor',
      title: 'Call out Regenstein directly',
      body:
        'Instead of manually hunting a polygon by eye, the map highlights Regenstein from the building attributes. In your current file that building is identified by its `BLDG_ID` and `BLDG_NAME1` fields.',
      graphic: 'regenstein'
    },
    {
      id: 'categories',
      kicker: 'Incidents',
      title: 'What gets taken most often',
      body:
        'Once the incidents appear, the strongest pattern is category mix. Merchandise dominates this dataset, while bikes, wallets, and tech items form the next most visible clusters.',
      graphic: 'categories'
    },
    {
      id: 'tech',
      kicker: 'Filter',
      title: 'Zoom into tech thefts',
      body:
        'A focused chapter can filter the points to a single category and tighten the map to the campus core. That makes it easier to stage a narrative around a specific kind of theft.',
      graphic: 'tech'
    },
    {
      id: 'bikes',
      kicker: 'Filter',
      title: 'Then compare bikes and scooters',
      body:
        'You can keep adding chapters like this: each scroll step can update filters, zoom, building emphasis, labels, or hand visibility without changing the underlying data source.',
      graphic: 'bikes'
    }
  ];

  let mapContainer;
  let map;
  let loading = true;
  let error = '';
  let incidents = [];
  let buildings = emptyFeatureCollection;
  let uchicagoBuildings = emptyFeatureCollection;
  let boundary = emptyFeatureCollection;
  let introHands = [];
  let introTimeline = [];
  let mapLoaded = false;
  let handsEnabled = true;
  let activeChapterId = 'intro';
  let chapterRefs = [];
  let regensteinBounds = null;
  let categoryMap = {};
  let categoryCounts = [];
  let topCategories = [];
  let maxCategoryCount = 1;
  let techCount = 0;
  let bikeCount = 0;
  let merchandiseCount = 0;
  let activeChapter = storyChapters[0];
  let introMonthYearLabel = '';
  let introTimelineProgress = 0;
  let introTimelineDayLabel = '';

  onMount(() => {
    let popup;
    let observer;
    let cancelled = false;
    let introTimer = 0;

    async function initialize() {
      try {
        await tick();
        observer = setupChapterObserver();

        const [loadedIncidents, loadedBoundary, loadedBuildings, loadedUchicagoBuildings] = await Promise.all([
          loadIncidents(),
          loadOptionalGeoJson('/geo/hyde-park-boundary.geojson'),
          loadOptionalGeoJson('/geo/buildings_hydepark_region.geojson').then(
            (geojson) =>
              geojson.features?.length ? geojson : loadOptionalGeoJson('/geo/hyde-park-buildings.geojson')
          ),
          loadOptionalGeoJson('/geo/uchicago-buildings.geojson')
        ]);

        if (cancelled) {
          return;
        }

        incidents = loadedIncidents;
        boundary = loadedBoundary;
        buildings = loadedBuildings;
        uchicagoBuildings = loadedUchicagoBuildings;

        const regensteinFeature = loadedBuildings.features?.find(
          (feature) => feature.properties?.BLDG_ID === REGENSTEIN_BUILDING_ID
        );
        regensteinBounds = regensteinFeature ? getFeatureBounds(regensteinFeature) : null;

        map = new maplibregl.Map({
          container: mapContainer,
          style: CARTO_POSITRON_STYLE,
          center: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
          zoom: 14,
          minZoom: 11.5,
          attributionControl: true
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
          if (cancelled) {
            return;
          }

          setupMapLayers();
          syncMapData();
          introTimeline = createIntroTimeline(loadedIncidents);
          applyIntroFrame(0);
          mapLoaded = true;
          applyChapterState(activeChapterId);
          projectIntroHands();
          startIntroPlayback();

          popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 14,
            maxWidth: '320px'
          });

          map.on('mouseenter', LAYER_IDS.incidents, () => {
            map.getCanvas().style.cursor = 'pointer';
          });

          map.on('mouseleave', LAYER_IDS.incidents, () => {
            map.getCanvas().style.cursor = '';
            popup?.remove();
          });

          map.on('mousemove', LAYER_IDS.incidents, (event) => {
            const feature = event.features?.[0];

            if (!feature) {
              return;
            }

            const { itemCategory, itemStolen, comments } = feature.properties;
            const safeTitle = itemStolen || 'Unspecified item';
            const safeCategory = itemCategory || UNKNOWN_CATEGORY;
            const safeComment = comments || '';

            popup
              ?.setLngLat(event.lngLat)
              .setHTML(
                `
                  <div class="popup-content">
                    <div class="popup-category">${safeCategory}</div>
                    <div class="popup-title">${safeTitle}</div>
                    <div class="popup-text">${safeComment}</div>
                  </div>
                `
              )
              .addTo(map);
          });

          map.on('move', () => {
            projectIntroHands();
          });

          map.on('resize', () => {
            projectIntroHands();
          });

          loading = false;
        });
      } catch (cause) {
        if (cancelled) {
          return;
        }

        error = cause instanceof Error ? cause.message : 'Unable to load map data.';
        loading = false;
      }
    }

    initialize();

    return () => {
      cancelled = true;
      window.clearInterval(introTimer);
      observer?.disconnect();

      if (map) {
        map.remove();
        map = null;
      }
    };

    function startIntroPlayback() {
      if (!introTimeline.length) {
        return;
      }

      let frameIndex = 0;

      introTimer = window.setInterval(() => {
        if (cancelled || !handsEnabled || !introTimeline.length) {
          return;
        }

        frameIndex += 1;
        applyIntroFrame(frameIndex);
        projectIntroHands();
      }, INTRO_HAND_FRAME_MS);
    }
  });

  function setupChapterObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        if (visible[0]) {
          activeChapterId = visible[0].target.dataset.chapterId || 'intro';
        }
      },
      {
        root: null,
        rootMargin: '-12% 0px -32% 0px',
        threshold: [0.25, 0.45, 0.65]
      }
    );

    chapterRefs.forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return observer;
  }

  function addSourceIfMissing(id, source) {
    if (!map.getSource(id)) {
      map.addSource(id, source);
    }
  }

  function setSourceData(id, data) {
    const source = map?.getSource(id);

    if (source && 'setData' in source) {
      source.setData(data);
    }
  }

  function colorForCategory(category) {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS[UNKNOWN_CATEGORY];
  }

  function withDisplayColor(featureCollection) {
    return {
      ...featureCollection,
      features: featureCollection.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          color: colorForCategory(feature.properties.itemCategory)
        }
      }))
    };
  }

  function stableUnit(value) {
    const text = String(value ?? '');
    let hash = 0;

    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
    }

    return (hash % 1000) / 1000;
  }

  function getIncidentTimestamp(incident) {
    const parsedReportedDate = Date.parse(incident.reportedDate || '');

    if (Number.isFinite(parsedReportedDate)) {
      return parsedReportedDate;
    }

    const parsed = Date.parse(incident.reported || '');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function createIntroTimeline(allIncidents) {
    if (!allIncidents.length) {
      return [];
    }

    const groups = [];
    const groupMap = new Map();

    [...allIncidents]
      .map((incident, index) => ({
        incident,
        index,
        timestamp: getIncidentTimestamp(incident),
        dayJitter: stableUnit(`${incident.id}-${incident.reportedDate || index}`)
      }))
      .sort((left, right) => {
        if (left.timestamp !== right.timestamp) {
          return left.timestamp - right.timestamp;
        }

        return left.dayJitter - right.dayJitter;
      })
      .forEach(({ incident, index, timestamp }) => {
        const date = Number.isFinite(timestamp) ? new Date(timestamp) : null;
        const label = date ? monthYearFormatter.format(date) : incident.reportedDate || 'Unknown';
        const key = date ? `${date.getFullYear()}-${date.getMonth()}` : `unknown-${index}`;
        const daysInMonth = date ? new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() : 1;
        const dayOfMonth = date ? date.getDate() : 1;
        const dayOffset = stableUnit(`day-slot-${incident.id}-${incident.reportedDate || index}`);
        const monthProgress = Math.min(0.999, ((dayOfMonth - 1) + dayOffset) / daysInMonth);

        if (!groupMap.has(key)) {
          const group = {
            key,
            label,
            hands: []
          };
          groupMap.set(key, group);
          groups.push(group);
        }

        groupMap.get(key).hands.push({
          id: `hand-${incident.id}-${index}`,
          assetPath: handAssetPaths[Math.floor(Math.random() * handAssetPaths.length)],
          size: 14 + Math.floor(Math.random() * 10),
          rotation: -24 + Math.random() * 48,
          timestamp,
          monthProgress,
          x: 0,
          y: 0,
          occurredDisplay: incident.occurredDisplay,
          occurredStartMs: incident.occurredStartMs,
          occurredEndMs: incident.occurredEndMs,
          occurredPointMs: incident.occurredPointMs,
          reported: incident.reported,
          reportedDate: incident.reportedDate,
          longitude: incident.longitude,
          latitude: incident.latitude
        });
      });

    return groups.map((group) => {
      const sortedHands = [...group.hands].sort((left, right) => left.monthProgress - right.monthProgress);

      return {
        ...group,
        hands: sortedHands,
        frameCount: Math.max(1, Math.ceil(sortedHands.length / INTRO_TARGET_HANDS_PER_FRAME))
      };
    });
  }

  function locateIntroFrame(frameIndex) {
    if (!introTimeline.length) {
      return null;
    }

    const totalFrames = introTimeline.reduce((sum, group) => sum + (group.frameCount || 1), 0);

    if (!totalFrames) {
      return null;
    }

    let normalizedFrame = ((frameIndex % totalFrames) + totalFrames) % totalFrames;

    for (let monthIndex = 0; monthIndex < introTimeline.length; monthIndex += 1) {
      const frameCount = introTimeline[monthIndex].frameCount || 1;

      if (normalizedFrame < frameCount) {
        return {
          monthIndex,
          frameInMonth: normalizedFrame,
          frameCount
        };
      }

      normalizedFrame -= frameCount;
    }

    return {
      monthIndex: 0,
      frameInMonth: 0,
      frameCount: introTimeline[0].frameCount || 1
    };
  }

  function getIntroFrameState(frameIndex) {
    const frameLocation = locateIntroFrame(frameIndex);

    if (!frameLocation) {
      return {
        hands: [],
        monthLabel: '',
        progress: 0,
        dayLabel: ''
      };
    }

    const { monthIndex, frameInMonth } = frameLocation;
    const group = introTimeline[monthIndex];

    if (!group?.hands?.length) {
      return {
        hands: [],
        monthLabel: group?.label || '',
        progress: 0,
        dayLabel: ''
      };
    }

    const frameCount = group.frameCount || 1;
    const sliceStart = Math.floor((frameInMonth / frameCount) * group.hands.length);
    const sliceEnd = Math.max(
      sliceStart + 1,
      Math.floor(((frameInMonth + 1) / frameCount) * group.hands.length)
    );
    const sliceHands = group.hands.slice(sliceStart, sliceEnd);
    const timedHands = sliceHands.filter((hand) => Number.isFinite(hand.monthProgress));
    const availableDelayWindow = Math.max(0, INTRO_HAND_FRAME_MS - INTRO_HAND_LIFETIME_MS);
    const delayStep =
      timedHands.length > 1 ? availableDelayWindow / (timedHands.length - 1) : availableDelayWindow / 2;
    const hands = sliceHands.map((hand, index) => ({
      ...hand,
      animationDurationMs: INTRO_HAND_LIFETIME_MS,
      animationDelayMs: Math.round(delayStep * index)
    }));
    let progress = 0;
    let dayLabel = '';

    if (timedHands.length) {
      progress =
        timedHands.reduce((sum, hand) => sum + hand.monthProgress, 0) / timedHands.length;
      const timestamps = timedHands.map((hand) => hand.timestamp).filter((value) => Number.isFinite(value));
      const averageTimestamp =
        timestamps.reduce((sum, value) => sum + value, 0) / Math.max(1, timestamps.length);
      const referenceDate = new Date(averageTimestamp);
      dayLabel = timelineFormatter.format(referenceDate);
    }

    return {
      hands,
      monthLabel: group.label || '',
      progress,
      dayLabel
    };
  }

  function applyIntroFrame(frameIndex) {
    const frameState = getIntroFrameState(frameIndex);
    introHands = frameState.hands;
    introMonthYearLabel = frameState.monthLabel;
    introTimelineProgress = frameState.progress;
    introTimelineDayLabel = frameState.dayLabel;
  }

  function projectIntroHands() {
    if (!map || !introHands.length) {
      return;
    }

    introHands = introHands.map((hand) => {
      const projected = map.project([hand.longitude, hand.latitude]);

      return {
        ...hand,
        x: projected.x,
        y: projected.y
      };
    });
  }

  function extendBounds(bounds, coordinates) {
    if (!Array.isArray(coordinates)) {
      return;
    }

    if (typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
      const [longitude, latitude] = coordinates;
      bounds.west = Math.min(bounds.west, longitude);
      bounds.east = Math.max(bounds.east, longitude);
      bounds.south = Math.min(bounds.south, latitude);
      bounds.north = Math.max(bounds.north, latitude);
      return;
    }

    coordinates.forEach((value) => extendBounds(bounds, value));
  }

  function getFeatureBounds(feature) {
    const geometry = feature?.geometry;

    if (!geometry?.coordinates) {
      return null;
    }

    const bounds = {
      west: Number.POSITIVE_INFINITY,
      east: Number.NEGATIVE_INFINITY,
      south: Number.POSITIVE_INFINITY,
      north: Number.NEGATIVE_INFINITY
    };

    extendBounds(bounds, geometry.coordinates);

    if (!Number.isFinite(bounds.west)) {
      return null;
    }

    return [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north]
    ];
  }

  function setLayerVisibility(layerId, visible) {
    if (map?.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    }
  }

  function setLayerPaint(layerId, property, value) {
    if (map?.getLayer(layerId)) {
      map.setPaintProperty(layerId, property, value);
    }
  }

  function setupMapLayers() {
    const firstSymbolLayerId = map?.getStyle()?.layers?.find((layer) => layer.type === 'symbol')?.id;

    addSourceIfMissing(SOURCE_IDS.boundary, {
      type: 'geojson',
      data: emptyFeatureCollection
    });

    addSourceIfMissing(SOURCE_IDS.buildings, {
      type: 'geojson',
      data: emptyFeatureCollection
    });

    addSourceIfMissing(SOURCE_IDS.uchicagoBuildings, {
      type: 'geojson',
      data: emptyFeatureCollection
    });

    addSourceIfMissing(SOURCE_IDS.incidents, {
      type: 'geojson',
      data: emptyFeatureCollection
    });

    map.addLayer(
      {
        id: LAYER_IDS.boundaryFill,
        type: 'fill',
        source: SOURCE_IDS.boundary,
        paint: {
          'fill-color': BUILDING_FILL_COLOR,
          'fill-opacity': 0.04
        }
      },
      firstSymbolLayerId
    );

    map.addLayer(
      {
        id: LAYER_IDS.buildingsFill,
        type: 'fill',
        source: SOURCE_IDS.buildings,
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-color': BUILDING_FILL_COLOR,
          'fill-opacity': 0.24
        }
      },
      firstSymbolLayerId
    );

    map.addLayer(
      {
        id: LAYER_IDS.buildingsLine,
        type: 'line',
        source: SOURCE_IDS.buildings,
        layout: {
          visibility: 'none'
        },
        paint: {
          'line-color': BUILDING_FILL_COLOR,
          'line-width': 0.8,
          'line-opacity': 0.42
        }
      },
      firstSymbolLayerId
    );

    map.addLayer(
      {
        id: LAYER_IDS.uchicagoBuildingsFill,
        type: 'fill',
        source: SOURCE_IDS.uchicagoBuildings,
        layout: {
          visibility: 'visible'
        },
        paint: {
          'fill-color': HIGHLIGHT_FILL_COLOR,
          'fill-opacity': 0.42
        }
      }
    );

    map.addLayer(
      {
        id: LAYER_IDS.uchicagoBuildingsLine,
        type: 'line',
        source: SOURCE_IDS.uchicagoBuildings,
        layout: {
          visibility: 'visible'
        },
        paint: {
          'line-color': HIGHLIGHT_LINE_COLOR,
          'line-width': 1.3,
          'line-opacity': 0.9
        }
      }
    );

    map.addLayer(
      {
        id: LAYER_IDS.buildingHighlightFill,
        type: 'fill',
        source: SOURCE_IDS.buildings,
        filter: ['==', ['get', 'BLDG_ID'], REGENSTEIN_BUILDING_ID],
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-color': HIGHLIGHT_FILL_COLOR,
          'fill-opacity': 0.9
        }
      }
    );

    map.addLayer(
      {
        id: LAYER_IDS.buildingHighlightLine,
        type: 'line',
        source: SOURCE_IDS.buildings,
        filter: ['==', ['get', 'BLDG_ID'], REGENSTEIN_BUILDING_ID],
        layout: {
          visibility: 'none'
        },
        paint: {
          'line-color': HIGHLIGHT_LINE_COLOR,
          'line-width': 2.8,
          'line-opacity': 1
        }
      }
    );

    map.addLayer(
      {
        id: LAYER_IDS.boundaryLine,
        type: 'line',
        source: SOURCE_IDS.boundary,
        paint: {
          'line-color': BOUNDARY_LINE_COLOR,
          'line-width': 2,
          'line-opacity': 0.7
        }
      },
      firstSymbolLayerId
    );

    map.addLayer({
      id: LAYER_IDS.incidents,
      type: 'circle',
      source: SOURCE_IDS.incidents,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          11,
          4.5,
          14,
          6.5,
          17,
          9
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#fff9f1',
        'circle-stroke-width': 1.2,
        'circle-opacity': 0.88
      }
    });
  }

  function syncMapData() {
    if (!map) {
      return;
    }

    setSourceData(SOURCE_IDS.boundary, boundaryCollection);
    setSourceData(SOURCE_IDS.buildings, buildingCollection);
    setSourceData(SOURCE_IDS.uchicagoBuildings, uchicagoBuildingCollection);
    setSourceData(SOURCE_IDS.incidents, withDisplayColor(incidentsGeoJson));
  }

  function applyChapterState(chapterId) {
    if (!mapLoaded || !map) {
      return;
    }

    handsEnabled = chapterId === 'intro';
    if (handsEnabled) {
      projectIntroHands();
    }

    const showIncidents = !['intro', 'buildings', 'regenstein'].includes(chapterId);
    setLayerVisibility(LAYER_IDS.incidents, showIncidents);
    setLayerVisibility(LAYER_IDS.buildingsFill, false);
    setLayerVisibility(LAYER_IDS.buildingsLine, false);
    setLayerVisibility(LAYER_IDS.uchicagoBuildingsFill, true);
    setLayerVisibility(LAYER_IDS.uchicagoBuildingsLine, true);
    setLayerVisibility(LAYER_IDS.buildingHighlightFill, chapterId === 'regenstein');
    setLayerVisibility(LAYER_IDS.buildingHighlightLine, chapterId === 'regenstein');

    if (chapterId === 'intro') {
      map.setFilter(LAYER_IDS.incidents, null);
      map.fitBounds(STUDY_BOUNDS_ARRAY, {
        padding: { top: 48, right: 48, bottom: 48, left: 48 },
        duration: 900
      });
      return;
    }

    if (chapterId === 'buildings') {
      map.setFilter(LAYER_IDS.incidents, null);
      map.fitBounds(STUDY_BOUNDS_ARRAY, {
        padding: { top: 60, right: 60, bottom: 60, left: 60 },
        duration: 900
      });
      return;
    }

    if (chapterId === 'regenstein') {
      map.setFilter(LAYER_IDS.incidents, null);

      if (regensteinBounds) {
        map.fitBounds(regensteinBounds, {
          padding: { top: 120, right: 120, bottom: 120, left: 120 },
          duration: 900
        });
      }

      return;
    }

    if (chapterId === 'categories') {
      map.setFilter(LAYER_IDS.incidents, null);
      map.fitBounds(STUDY_BOUNDS_ARRAY, {
        padding: { top: 54, right: 54, bottom: 54, left: 54 },
        duration: 900
      });
      return;
    }

    if (chapterId === 'tech') {
      map.setFilter(LAYER_IDS.incidents, ['==', ['get', 'itemCategory'], 'Tech']);
      map.easeTo({
        center: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
        zoom: 14.9,
        duration: 900
      });
      return;
    }

    if (chapterId === 'bikes') {
      map.setFilter(LAYER_IDS.incidents, ['==', ['get', 'itemCategory'], 'Bikes & E-scooters']);
      map.fitBounds(STUDY_BOUNDS_ARRAY, {
        padding: { top: 54, right: 54, bottom: 54, left: 54 },
        duration: 900
      });
    }
  }

  function statValueFor(category) {
    return categoryCounts.find(([name]) => name === category)?.[1] || 0;
  }

  function percentOfTotal(value) {
    return incidents.length ? Math.round((value / incidents.length) * 100) : 0;
  }

  $: boundaryFeatures = boundary.features?.length ? boundary.features : [fallbackBounds];
  $: buildingFeatures = Array.isArray(buildings.features) ? buildings.features : [];
  $: boundaryCollection = {
    type: 'FeatureCollection',
    features: boundaryFeatures
  };
  $: buildingCollection = {
    type: 'FeatureCollection',
    features: buildingFeatures
  };
  $: uchicagoBuildingFeatures = Array.isArray(uchicagoBuildings.features) ? uchicagoBuildings.features : [];
  $: uchicagoBuildingCollection = {
    type: 'FeatureCollection',
    features: uchicagoBuildingFeatures
  };
  $: incidentsGeoJson = incidentsToGeoJson(incidents);
  $: categoryMap = incidents.reduce((accumulator, incident) => {
    accumulator[incident.itemCategory] = (accumulator[incident.itemCategory] || 0) + 1;
    return accumulator;
  }, {});
  $: categoryCounts = Object.entries(categoryMap).sort((left, right) => right[1] - left[1]);
  $: topCategories = categoryCounts.slice(0, 6);
  $: maxCategoryCount = topCategories[0]?.[1] || 1;
  $: techCount = statValueFor('Tech');
  $: bikeCount = statValueFor('Bikes & E-scooters');
  $: merchandiseCount = statValueFor('Merchandise');
  $: activeChapter = storyChapters.find((chapter) => chapter.id === activeChapterId) || storyChapters[0];
  $: if (map && map.isStyleLoaded()) {
    syncMapData();
  }
  $: if (mapLoaded) {
    applyChapterState(activeChapterId);
  }
</script>

<div class="layout">
  <section class="map-column">
    <div class="map-sticky">
      <div class="map-shell">
        <div bind:this={mapContainer} class="map-canvas" aria-label="Theft incidents around Hyde Park"></div>

        {#if handsEnabled && introMonthYearLabel}
          <div class="timeline-chip">
            <div class="timeline-chip-month">{introMonthYearLabel}</div>
            <div class="timeline-track-wrap" aria-hidden="true">
              <div class="timeline-track"></div>
              <div class="timeline-marker" style={`left:${introTimelineProgress * 100}%;`}></div>
            </div>
            {#if introTimelineDayLabel}
              <div class="timeline-chip-day">{introTimelineDayLabel}</div>
            {/if}
          </div>
        {/if}

        {#if mapLoaded}
          <div class:disabled={!handsEnabled} class="hand-overlay" aria-hidden="true">
            {#each introHands as hand (hand.id)}
              <img
                class="walking-hand"
                src={hand.assetPath}
                alt=""
                style={`width:${hand.size}px; left:${hand.x - hand.size / 2}px; top:${hand.y - hand.size / 2}px; transform:rotate(${hand.rotation}deg); animation-duration:${hand.animationDurationMs || INTRO_HAND_LIFETIME_MS}ms; animation-delay:${hand.animationDelayMs || 0}ms;`}
              />
            {/each}
          </div>
        {/if}

        {#if loading}
          <div class="floating-note">Loading map and data...</div>
        {:else if error}
          <div class="floating-note error">{error}</div>
        {/if}
      </div>
    </div>
  </section>

  <aside class="story-column">
    <div class="story-header">
      <div class="eyebrow">May 2025 - May 2026</div>
      <h1>Map of UChicago Police Department Reported Thefts</h1>
      <p>
        This project explores a year of theft data reported around the University of Chicago’s campus, 
        examining what items were most commonly stolen, where incidents occurred, and the unusual edge 
        cases that appear throughout the records. Familiar hotspots emerge, including the
         Hyde Park Shopping Center, CCD/UCMED. 
         <br>
         In one year we observe 584 reported thefts, of which:
        <ul>
          <li>258 involved merchandise</li>
          <li>72 involved bikes and scooters taken from at least 31 unique bike rack locations</li>
          <li>49 involved wallets, credit cards, or cash</li>
          <li>40 involved tech: 13 phones, 7 laptops, 5 airpods, 4 ipads, 2 cameras, 1 TV</li>
          <li>28 cars</li>
          <li>22 bags or backpacks</li>
          <li>27 tools, taken mainly from maintenance vans</li>
          <li>20 packages or food deliveries</li>
          <li>11 articles of clothing, mostly jackets, and 3 pieces of jewelry</li>
        </ul>

      <!-- <br> -->
          Data was retrieved using Michael Plunkett’s tool that scrapes UCPD incident reports, published on the 
        <a href="https://chicagomaroon.com/41255/grey-city/the-maroon-launches-uchicago-police-department-incident-reporter/" target="_blank" rel="noopener noreferrer">
       Maroon's Incident Reporter Project</a>.
      <!-- </p> -->
    </div>

    {#each storyChapters as chapter, index}
      <section
        class:active={activeChapterId === chapter.id}
        bind:this={chapterRefs[index]}
        class="story-step"
        data-chapter-id={chapter.id}
      >
        <div class="step-kicker">{chapter.kicker}</div>
        <h2>{chapter.title}</h2>
        <p>{chapter.body}</p>

        {#if chapter.graphic === 'stats'}
          <div class="metric-grid">
            <article>
              <span>Building footprints</span>
              <strong>{buildingFeatures.length.toLocaleString()}</strong>
            </article>
            <article>
              <span>Theft points</span>
              <strong>{incidents.length}</strong>
            </article>
          </div>
        {/if}

        {#if chapter.graphic === 'regenstein'}
          <div class="metric-grid single">
            <article>
              <span>Current highlighted building</span>
              <strong>{REGENSTEIN_BUILDING_NAME}</strong>
              <small>`BLDG_ID` {REGENSTEIN_BUILDING_ID}</small>
            </article>
          </div>
        {/if}

        {#if chapter.graphic === 'categories'}
          <div class="chart-card">
            <div class="chart-title">Top stolen-item categories</div>
            {#each topCategories as [category, count]}
              <div class="bar-row">
                <div class="bar-label">{category}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    style={`width:${(count / maxCategoryCount) * 100}%; background:${colorForCategory(category)};`}
                  ></div>
                </div>
                <div class="bar-value">{count}</div>
              </div>
            {/each}
          </div>
        {/if}

        {#if chapter.graphic === 'tech'}
          <div class="chart-card compact">
            <div class="chart-title">Tech thefts</div>
            <div class="big-number">{techCount}</div>
            <div class="chart-caption">{percentOfTotal(techCount)}% of the theft rows with coordinates</div>
          </div>
        {/if}

        {#if chapter.graphic === 'bikes'}
          <div class="chart-card compact">
            <div class="chart-title">Bikes and scooters</div>
            <div class="big-number">{bikeCount}</div>
            <div class="compare-line">
              Merchandise: <strong>{merchandiseCount}</strong>
            </div>
          </div>
        {/if}
      </section>
    {/each}
  </aside>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
    background:
      linear-gradient(180deg, #f9f4ee 0%, #efe1d3 100%);
  }

  .map-column {
    position: relative;
    min-width: 0;
    border-right: 1px solid rgba(67, 35, 31, 0.12);
  }

  .map-sticky {
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .map-shell {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #f7f3ed;
  }

  .map-canvas {
    width: 100%;
    height: 100%;
  }

  .eyebrow,
  .step-kicker {
    color: #8c1d18;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .timeline-chip {
    position: absolute;
    top: 1.1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    min-width: 14rem;
    padding: 0.65rem 0.9rem 0.7rem;
    border-radius: 18px;
    background: rgba(75, 64, 62, 0.8);
    color: #fff8f2;
    box-shadow: 0 12px 28px rgba(25, 17, 16, 0.2);
  }

  .timeline-chip-month {
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
  }

  .timeline-track-wrap {
    position: relative;
    margin-top: 0.42rem;
    padding: 0 0.15rem;
  }

  .timeline-track {
    height: 1px;
    width: 100%;
    background: rgba(255, 248, 242, 0.34);
  }

  .timeline-marker {
    position: absolute;
    top: 50%;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #f2c14e;
    box-shadow: 0 0 0 2px rgba(242, 193, 78, 0.18);
    transform: translate(-50%, -50%);
    transition: left 260ms ease;
  }

  .timeline-chip-day {
    margin-top: 0.36rem;
    color: rgba(255, 248, 242, 0.7);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-align: center;
    text-transform: uppercase;
  }

  .hand-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 3;
    opacity: 1;
    transition: opacity 320ms ease;
  }

  .hand-overlay.disabled {
    opacity: 0;
  }

  .walking-hand {
    position: absolute;
    transform-origin: 50% 50%;
    filter: drop-shadow(0 8px 14px rgba(49, 20, 20, 0.14));
    user-select: none;
    opacity: 0;
    animation-name: handPulse;
    animation-timing-function: ease-in-out;
    animation-fill-mode: both;
    animation-iteration-count: 1;
  }

  @keyframes handPulse {
    0% {
      opacity: 0;
    }

    32% {
      opacity: 0.82;
    }

    68% {
      opacity: 0.82;
    }

    100% {
      opacity: 0;
    }
  }

  .floating-note {
    position: absolute;
    left: 1.1rem;
    bottom: 1.1rem;
    z-index: 4;
    padding: 0.75rem 0.95rem;
    border-radius: 14px;
    background: rgba(35, 24, 22, 0.88);
    color: #fff8f2;
    font-size: 0.95rem;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  }

  .floating-note.error {
    background: rgba(122, 24, 24, 0.92);
  }

  .story-column {
    padding: 2rem 1.5rem 20vh;
  }

  .story-header {
    max-width: 40rem;
    margin: 0 auto 2rem;
  }

  .story-header h1,
  .story-step h2,
  .story-header p,
  .story-step p {
    margin: 0;
  }

  .story-header h1 {
    margin-top: 0.35rem;
    color: #201413;
    font-size: clamp(2rem, 4vw, 3.2rem);
    line-height: 0.96;
    letter-spacing: -0.04em;
  }

  .story-header p {
    margin-top: 0.95rem;
    color: #5e4a45;
    font-size: 1.02rem;
    line-height: 1.55;
  }

  .story-step {
    max-width: 40rem;
    min-height: 88vh;
    margin: 0 auto;
    padding: 1.1rem 0 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    opacity: 0.46;
    transform: translateY(20px);
    transition:
      opacity 220ms ease,
      transform 220ms ease;
  }

  .story-step.active {
    opacity: 1;
    transform: translateY(0);
  }

  .story-step h2 {
    color: #201413;
    font-size: clamp(1.75rem, 3vw, 2.4rem);
    line-height: 1.02;
    letter-spacing: -0.03em;
  }

  .story-step p {
    color: #5e4a45;
    line-height: 1.65;
    font-size: 1rem;
    max-width: 34rem;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
    margin-top: 0.3rem;
  }

  .metric-grid.single {
    grid-template-columns: 1fr;
  }

  .metric-grid article,
  .chart-card {
    padding: 1rem;
    border-radius: 18px;
    background: rgba(255, 252, 247, 0.88);
    border: 1px solid rgba(67, 35, 31, 0.08);
    box-shadow: 0 18px 40px rgba(44, 25, 21, 0.06);
  }

  .metric-grid span,
  .chart-title,
  .chart-caption,
  .metric-grid small {
    color: #6b5751;
    font-size: 0.85rem;
  }

  .metric-grid strong,
  .big-number {
    display: block;
    margin-top: 0.35rem;
    color: #231715;
    font-size: 1.7rem;
    line-height: 1.05;
  }

  .chart-card {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .chart-card.compact {
    max-width: 18rem;
  }

  .bar-row {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 3fr) auto;
    align-items: center;
    gap: 0.65rem;
  }

  .bar-label,
  .bar-value,
  .compare-line {
    color: #3e2d29;
    font-size: 0.92rem;
  }

  .bar-track {
    height: 0.8rem;
    border-radius: 999px;
    background: rgba(120, 95, 86, 0.14);
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: inherit;
  }

  .big-number {
    font-size: 3.15rem;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  :global(.maplibregl-canvas) {
    outline: none;
  }

  :global(.maplibregl-ctrl-top-right) {
    top: 1rem;
    right: 1rem;
  }

  :global(.maplibregl-ctrl-group) {
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(50, 31, 29, 0.18);
    border: 1px solid rgba(60, 29, 24, 0.1);
  }

  :global(.maplibregl-popup-content) {
    border-radius: 14px;
    padding: 0.8rem 0.9rem;
    box-shadow: 0 18px 40px rgba(25, 17, 16, 0.14);
  }

  :global(.popup-category) {
    color: #8c1d18;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  :global(.popup-title) {
    margin-top: 0.2rem;
    color: #241716;
    font-size: 1rem;
    font-weight: 700;
  }

  :global(.popup-text) {
    margin-top: 0.35rem;
    color: #5d4a45;
    line-height: 1.35;
    font-size: 0.88rem;
  }

  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .map-column {
      border-right: 0;
      border-bottom: 1px solid rgba(67, 35, 31, 0.12);
    }

    .map-sticky {
      position: relative;
      height: 70vh;
    }

    .story-column {
      padding-top: 1.25rem;
    }

    .story-step {
      min-height: 72vh;
    }
  }

  @media (max-width: 640px) {
    .story-column {
      padding: 1rem 1rem 16vh;
    }

    .floating-note {
      left: 0.8rem;
      right: 0.8rem;
      max-width: none;
    }

    .timeline-chip {
      top: 5.8rem;
      left: auto;
      right: 0.8rem;
      transform: none;
    }

    .metric-grid {
      grid-template-columns: 1fr;
    }

    .bar-row {
      grid-template-columns: 1fr;
    }
  }
</style>
