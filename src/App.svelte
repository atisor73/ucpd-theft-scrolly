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
  import MapOverlay from './components/MapOverlay.svelte';
  import StoryPanel from './components/StoryPanel.svelte';
  import { incidentsToGeoJson, loadIncidents, loadOptionalGeoJson } from './lib/loadData.js';
  import { storyChapters } from './lib/storyChapters.js';
  import {
    BOUNDARY_LINE_COLOR,
    BUILDING_FILL_COLOR,
    CAMPUS_CENTER,
    CARTO_POSITRON_STYLE,
    CATEGORY_COLORS,
    HIGHLIGHT_FILL_COLOR,
    HIGHLIGHT_LINE_COLOR,
    REGENSTEIN_BUILDING_ID,
    STUDY_BOUNDS_ARRAY,
    UNKNOWN_CATEGORY,
    createBoundsFeature
  } from './lib/mapConfig.js';

  const fallbackBounds = createBoundsFeature();
  const emptyFeatureCollection = { type: 'FeatureCollection', features: [] };
  const handAssetPaths = ['/assets/hand1.svg', '/assets/hand2.svg', '/assets/hand3.svg', '/assets/hand4.svg'];
  const merchandiseAssetPath = '/assets/merchandise.svg';
  const INTRO_TARGET_HANDS_PER_FRAME = 4;
  const INTRO_HAND_FRAME_MS = 500; //750;
  const INTRO_HAND_LIFETIME_MS = 300; //520;
  const AGGREGATE_HAND_MIN_SIZE = 9;
  const AGGREGATE_HAND_MAX_SIZE = 30;
  const MERCHANDISE_ICON_MIN_SIZE = 15;
  const MERCHANDISE_ICON_MAX_SIZE = 35;
  const BIKE_ICON_MIN_SIZE = 18;
  const BIKE_ICON_MAX_SIZE = 42;
  const CAR_ICON_MIN_SIZE = 25;
  const CAR_ICON_MAX_SIZE = 25;
  const BAG_ICON_MIN_SIZE = 13;
  const BAG_ICON_MAX_SIZE = 18;
  const WALLET_ICON_MIN_SIZE = 13;
  const WALLET_ICON_MAX_SIZE = 15;
  const TECH_ICON_MIN_SIZE = 15;
  const TECH_ICON_MAX_SIZE = 20;
  const PACKAGE_ICON_MIN_SIZE = 17;
  const PACKAGE_ICON_MAX_SIZE = 38;
  const CLOTHING_JEWELRY_ICON_MIN_SIZE = 30;
  const CLOTHING_JEWELRY_ICON_MAX_SIZE = 33;
  const TOOL_ICON_MIN_SIZE = 25;
  const TOOL_ICON_MAX_SIZE = 30;
  const MISC_ICON_MIN_SIZE = 16;
  const MISC_ICON_MAX_SIZE = 36;
  const MERCH_CALLOUT_BOX_WIDTH = 168;
  const MERCH_CALLOUT_BOX_HEIGHT = 76;
  const REGENSTEIN_ADDRESS_FRAGMENT = '1100 e. 57th st.';
  const jewelryPattern = /(jewel|ring|necklace|bracelet|earring|watch)/i;
  const merchandiseHotspotDefs = [
    {
      id: 'walgreens-plaza',
      title: 'Walgreens / Hyde Park Plaza',
      locationNames: ['Walgreens', "Trader Joe's"],
      buildingIds: [821453],
      longitude: -87.5891,
      latitude: 41.79542,
      offsetX: 0,
      offsetY: +92
    },
    {
      id: 'target',
      title: 'Target',
      locationNames: ['Target'],
      buildingIds: [462849],
      longitude: -87.59306282,
      latitude: 41.79955044,
      offsetX: 0,
      offsetY: -180
    },
    {
      id: 'cvs',
      title: 'CVS on 53rd',
      locationNames: ['CVS'],
      buildingIds: [867667],
      longitude: -87.59614964,
      latitude: 41.79951603,
      offsetX: -150,
      offsetY: -180
    }
  ];
  const HOTSPOT_SCENES = {
    bikes: {
      category: 'Bikes & E-scooters',
      assetPaths: ['/assets/bike1.svg', '/assets/bike2.svg'],
      previewGlyphs: ['/assets/bike2.svg', '/assets/bike1.svg'],
      panelTitle: 'Bike and scooter reports',
      uniqueLabel: 'unique bike and scooter locations',
      hotspotLabel: 'bike/scooter',
      minSize: BIKE_ICON_MIN_SIZE,
      maxSize: BIKE_ICON_MAX_SIZE
    },
    cars: {
      category: 'Car & Car parts',
      assetPaths: ['/assets/car1.svg', '/assets/car2.svg'],
      previewGlyphs: ['/assets/car2.svg', '/assets/car1.svg'],
      panelTitle: 'Car and car-part reports',
      uniqueLabel: 'unique vehicle locations',
      hotspotLabel: 'car/car-part',
      minSize: CAR_ICON_MIN_SIZE,
      maxSize: CAR_ICON_MAX_SIZE
    },
    bags: {
      category: 'Bags',
      assetPaths: ['/assets/bag.svg'],
      previewGlyphs: ['/assets/bag.svg', '/assets/bag.svg'],
      panelTitle: 'Bag theft reports',
      uniqueLabel: 'unique bag-theft locations',
      hotspotLabel: 'bag',
      minSize: BAG_ICON_MIN_SIZE,
      maxSize: BAG_ICON_MAX_SIZE
    },
    wallets: {
      category: 'Wallet, Credit cards, Cash',
      assetPaths: ['/assets/wallet.svg'],
      previewGlyphs: ['/assets/wallet.svg', '/assets/wallet.svg'],
      panelTitle: 'Wallet and cash reports',
      uniqueLabel: 'unique wallet/cash locations',
      hotspotLabel: 'wallet/cash',
      minSize: WALLET_ICON_MIN_SIZE,
      maxSize: WALLET_ICON_MAX_SIZE
    },
    tech: {
      category: 'Tech',
      assetPaths: ['/assets/device.svg'],
      previewGlyphs: ['/assets/device.svg', '/assets/device.svg'],
      panelTitle: 'Tech theft reports',
      uniqueLabel: 'unique tech-theft locations',
      hotspotLabel: 'tech',
      minSize: TECH_ICON_MIN_SIZE,
      maxSize: TECH_ICON_MAX_SIZE
    },
    packages: {
      category: 'Packages & Food delivery',
      assetPaths: ['/assets/package.svg'],
      previewGlyphs: ['/assets/package.svg', '/assets/package.svg'],
      panelTitle: 'Package and delivery reports',
      uniqueLabel: 'unique package/delivery locations',
      hotspotLabel: 'package/delivery',
      minSize: PACKAGE_ICON_MIN_SIZE,
      maxSize: PACKAGE_ICON_MAX_SIZE
    },
    clothingJewelry: {
      category: 'Clothing & Jewelry',
      previewGlyphs: ['/assets/jacket.svg', '/assets/ring.svg'],
      panelTitle: 'Clothing and jewelry reports',
      uniqueLabel: 'unique clothing/jewelry locations',
      hotspotLabel: 'clothing/jewelry',
      minSize: CLOTHING_JEWELRY_ICON_MIN_SIZE,
      maxSize: CLOTHING_JEWELRY_ICON_MAX_SIZE
    },
    tools: {
      category: 'Tools',
      assetPaths: ['/assets/hammer1.svg', '/assets/hammer2.svg'],
      previewGlyphs: ['/assets/hammer2.svg', '/assets/hammer1.svg'],
      panelTitle: 'Tool theft reports',
      uniqueLabel: 'unique tool-theft locations',
      hotspotLabel: 'tool',
      minSize: TOOL_ICON_MIN_SIZE,
      maxSize: TOOL_ICON_MAX_SIZE
    },
    miscellaneous: {
      category: 'Miscellaneous',
      assetPaths: handAssetPaths,
      previewGlyphs: ['/assets/hand2.svg', '/assets/hand4.svg'],
      panelTitle: 'Miscellaneous reports',
      uniqueLabel: 'unique miscellaneous locations',
      hotspotLabel: 'miscellaneous',
      minSize: MISC_ICON_MIN_SIZE,
      maxSize: MISC_ICON_MAX_SIZE
    }
  };
  const PANEL_SCENES = {
    merchandise: {
      category: 'Merchandise',
      previewGlyphs: ['/assets/merchandise.svg', '/assets/merchandise.svg'],
      panelTitle: 'Merchandise reports',
      uniqueLabel: 'unique merchandise hotspot locations',
      hotspotLabel: 'merchandise'
    },
    ...HOTSPOT_SCENES
  };
  const HOTSPOT_SCENE_IDS = new Set(Object.keys(HOTSPOT_SCENES));
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
    merchandiseHighlights: 'merchandise-highlights',
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
    merchandiseHighlightFill: 'merchandise-highlight-fill',
    merchandiseHighlightLine: 'merchandise-highlight-line',
    incidents: 'theft-incidents-layer'
  };

  let mapContainer;
  let map;
  let loading = true;
  let error = '';
  let incidents = [];
  let buildings = emptyFeatureCollection;
  let uchicagoBuildings = emptyFeatureCollection;
  let merchandiseHighlightBuildings = emptyFeatureCollection;
  let boundary = emptyFeatureCollection;
  let introHands = [];
  let aggregateHands = [];
  let merchandiseHands = [];
  let bikeCallouts = [];
  let hotspotHandsByScene = {};
  let visibleHands = [];
  let merchandiseCallouts = [];
  let visibleCallouts = [];
  let introTimeline = [];
  let mapLoaded = false;
  let activeHandScene = 'intro';
  let activeChapterId = 'intro';
  let chapterRefs = [];
  let introMonthYearLabel = '';
  let introTimelineProgress = 0;
  let introTimelineDayLabel = '';
  let panelSceneStats = {};

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
          aggregateHands = createAggregateHands(loadedIncidents);
          merchandiseHands = createMerchandiseHands(loadedIncidents);
          bikeCallouts = createBikeCallouts(loadedIncidents);
          hotspotHandsByScene = Object.fromEntries(
            Object.entries(HOTSPOT_SCENES).map(([sceneId, scene]) => [
              sceneId,
              createHotspotHands(loadedIncidents, sceneId, scene)
            ])
          );
          merchandiseHighlightBuildings = createMerchandiseHighlightBuildings(loadedBuildings);
          merchandiseCallouts = createMerchandiseCallouts(loadedIncidents);
          applyIntroFrame(0);
          mapLoaded = true;
          applyChapterState(activeChapterId);
          refreshVisibleHands();
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
            refreshVisibleHands();
          });

          map.on('resize', () => {
            refreshVisibleHands();
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
        if (cancelled || activeHandScene !== 'intro' || !introTimeline.length) {
          return;
        }

        frameIndex += 1;
        applyIntroFrame(frameIndex);
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

  function createAggregateHands(allIncidents) {
    if (!allIncidents.length) {
      return [];
    }

    const groupedHands = new Map();

    allIncidents.forEach((incident, index) => {
      if (!Number.isFinite(incident.longitude) || !Number.isFinite(incident.latitude)) {
        return;
      }

      const roundedLongitude = Number(incident.longitude.toFixed(5));
      const roundedLatitude = Number(incident.latitude.toFixed(5));
      const key = `${roundedLatitude}|${roundedLongitude}`;

      if (!groupedHands.has(key)) {
        groupedHands.set(key, {
          id: `aggregate-${key}`,
          key,
          longitude: roundedLongitude,
          latitude: roundedLatitude,
          count: 0,
          assetPath:
            handAssetPaths[Math.floor(stableUnit(`aggregate-${key}`) * handAssetPaths.length)] ||
            handAssetPaths[0],
          rotation: -12 + stableUnit(`rotation-${key}`) * 24,
          animationDurationMs: 480,
          animationDelayMs: Math.round(stableUnit(`delay-${key}`) * 220),
          mode: 'aggregate',
          firstIndex: index
        });
      }

      const hand = groupedHands.get(key);
      hand.count += 1;
      hand.firstIndex = Math.min(hand.firstIndex ?? index, index);
    });

    const aggregateList = [...groupedHands.values()].sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return (left.firstIndex ?? 0) - (right.firstIndex ?? 0);
    });

    const maxCount = aggregateList[0]?.count || 1;

    return aggregateList.map((hand) => {
      const scale = Math.sqrt(hand.count / maxCount);

      return {
        ...hand,
        size: AGGREGATE_HAND_MIN_SIZE + scale * (AGGREGATE_HAND_MAX_SIZE - AGGREGATE_HAND_MIN_SIZE),
        opacity: 1 //0.5 + scale * 0.38
      };
    });
  }

  function createMerchandiseHands(allIncidents) {
    const merchandiseIncidents = allIncidents.filter((incident) => incident.itemCategory === 'Merchandise');
    const hotspotSummaries = buildHotspotSummaries(merchandiseIncidents);

    const maxCount = Math.max(...[...hotspotSummaries.values()].map((summary) => summary.count), 1);

    return merchandiseIncidents.map((incident, index) => {
      const roundedLongitude = Number(incident.longitude.toFixed(5));
      const roundedLatitude = Number(incident.latitude.toFixed(5));
      const hotspotKey = `${roundedLatitude}|${roundedLongitude}`;
      const hotspotSummary = hotspotSummaries.get(hotspotKey) || { count: 1, firstComment: '' };
      const count = hotspotSummary.count || 1;
      const scale = Math.sqrt(count / maxCount);

      return {
        id: `merchandise-${incident.id}-${index}`,
        assetPath: merchandiseAssetPath,
        size: MERCHANDISE_ICON_MIN_SIZE + scale * (MERCHANDISE_ICON_MAX_SIZE - MERCHANDISE_ICON_MIN_SIZE),
        rotation: 0,
        animationDurationMs: 420,
        animationDelayMs: Math.round(stableUnit(`merch-delay-${incident.id}-${index}`) * 180),
        mode: 'merchandise',
        hotspotCount: count,
        firstComment: hotspotSummary.firstComment,
        longitude: incident.longitude,
        latitude: incident.latitude,
        itemCategory: incident.itemCategory,
        itemStolen: incident.itemStolen,
        locationName: incident.locationName,
        location: incident.location,
        validatedAddress: incident.validatedAddress
      };
    });
  }

  function buildHotspotSummaries(filteredIncidents) {
    const hotspotSummaries = new Map();

    filteredIncidents.forEach((incident) => {
      const roundedLongitude = Number(incident.longitude.toFixed(5));
      const roundedLatitude = Number(incident.latitude.toFixed(5));
      const hotspotKey = `${roundedLatitude}|${roundedLongitude}`;
      const timestamp = getIncidentTimestamp(incident) || Number.POSITIVE_INFINITY;

      if (!hotspotSummaries.has(hotspotKey)) {
        hotspotSummaries.set(hotspotKey, {
          count: 0,
          firstComment: '',
          firstTimestamp: Number.POSITIVE_INFINITY,
          locationName: incident.locationName || incident.location || 'Unknown hotspot'
        });
      }

      const summary = hotspotSummaries.get(hotspotKey);
      summary.count += 1;

      if (!summary.locationName && (incident.locationName || incident.location)) {
        summary.locationName = incident.locationName || incident.location;
      }

      if (timestamp < summary.firstTimestamp) {
        summary.firstTimestamp = timestamp;
        summary.firstComment = incident.comments || '';
      } else if (!summary.firstComment && incident.comments) {
        summary.firstComment = incident.comments;
      }
    });

    return hotspotSummaries;
  }

  function buildPanelSceneStats(allIncidents, scenes) {
    return Object.fromEntries(
      Object.entries(scenes).map(([sceneId, scene]) => {
        const sceneIncidents = allIncidents.filter((incident) => incident.itemCategory === scene.category);
        const hotspotSummaries = buildHotspotSummaries(sceneIncidents);
        const topHotspot = [...hotspotSummaries.values()].sort((left, right) => right.count - left.count)[0];

        return [
          sceneId,
          {
            count: sceneIncidents.length,
            uniqueHotspots: hotspotSummaries.size,
            largestHotspotCount: topHotspot?.count || 0,
            topHotspotName: topHotspot?.locationName || ''
          }
        ];
      })
    );
  }

  function assetPathForHotspotIncident(sceneId, scene, incident, index) {
    if (sceneId === 'clothingJewelry') {
      return jewelryPattern.test(incident.itemStolen || '') ? '/assets/ring.svg' : '/assets/jacket.svg';
    }

    const assetPaths = scene.assetPaths?.length ? scene.assetPaths : handAssetPaths;
    const assetIndex = Math.min(
      assetPaths.length - 1,
      Math.floor(stableUnit(`${sceneId}-asset-${incident.id}-${index}-${incident.itemStolen || ''}`) * assetPaths.length)
    );

    return assetPaths[assetIndex] || assetPaths[0];
  }

  function createHotspotHands(allIncidents, sceneId, scene) {
    const sceneIncidents = allIncidents.filter((incident) => incident.itemCategory === scene.category);
    const hotspotSummaries = buildHotspotSummaries(sceneIncidents);

    const maxCount = Math.max(...[...hotspotSummaries.values()].map((summary) => summary.count), 1);

    return sceneIncidents.map((incident, index) => {
      const roundedLongitude = Number(incident.longitude.toFixed(5));
      const roundedLatitude = Number(incident.latitude.toFixed(5));
      const hotspotKey = `${roundedLatitude}|${roundedLongitude}`;
      const hotspotSummary = hotspotSummaries.get(hotspotKey) || { count: 1, firstComment: '' };
      const count = hotspotSummary.count || 1;
      const scale = Math.sqrt(count / maxCount);

      return {
        id: `${sceneId}-${incident.id}-${index}`,
        assetPath: assetPathForHotspotIncident(sceneId, scene, incident, index),
        size: scene.minSize + scale * (scene.maxSize - scene.minSize),
        rotation: 0,
        animationDurationMs: 420,
        animationDelayMs: Math.round(stableUnit(`${sceneId}-delay-${incident.id}-${index}`) * 180),
        mode: 'category-hotspot',
        hotspotCount: count,
        hotspotLabel: scene.hotspotLabel,
        firstComment: hotspotSummary.firstComment,
        longitude: incident.longitude,
        latitude: incident.latitude,
        itemCategory: incident.itemCategory,
        itemStolen: incident.itemStolen,
        locationName: incident.locationName,
        location: incident.location,
        validatedAddress: incident.validatedAddress
      };
    });
  }

  function createBikeCallouts(allIncidents) {
    const bikeCalloutDefs = [
      {
        id: 'regenstein-bike-rack',
        title: 'Regenstein bike rack cluster',
        matches(incident) {
          const locationName = String(incident.locationName || '').toLowerCase();
          const location = String(incident.location || '').toLowerCase();

          return locationName.includes('regenstein') || location.includes(REGENSTEIN_ADDRESS_FRAGMENT);
        },
        detailText(totalCount) {
          return `${totalCount} total theft reports tied to Regenstein / 1100 E. 57th St.`;
        },
        offsetX: 118,
        offsetY: 90
      },
      {
        id: 'ratner-bike-rack',
        title: 'Ratner bike racks',
        matches(incident) {
          return String(incident.locationName || '').toLowerCase().includes('ratner');
        },
        detailText() {
          return '5530 S. Ellis Ave.';
        },
        offsetX: -160,
        offsetY: -160
      },
      {
        id: 'campus-north-bike-rack',
        title: 'Campus North bike racks',
        matches(incident) {
          return String(incident.locationName || '').toLowerCase().includes('campus north');
        },
        detailText() {
          return '5500 S. University Ave.';
        },
        offsetX: 104,
        offsetY: -174
      }
    ];

    return bikeCalloutDefs.flatMap((callout) => {
      const matchedRows = allIncidents.filter((incident) => callout.matches(incident));
      const bikeRows = matchedRows.filter((incident) => incident.itemCategory === 'Bikes & E-scooters');

      if (!bikeRows.length) {
        return [];
      }

      return {
        id: callout.id,
        title: callout.title,
        metaText: `${bikeRows.length} bike and scooter reports`,
        detailText: callout.detailText(matchedRows.length),
        longitude: bikeRows[0].longitude,
        latitude: bikeRows[0].latitude,
        offsetX: callout.offsetX,
        offsetY: callout.offsetY
      };
    });
  }

  function createMerchandiseHighlightBuildings(allBuildings) {
    const selectedIds = new Set(merchandiseHotspotDefs.flatMap((hotspot) => hotspot.buildingIds));

    return {
      type: 'FeatureCollection',
      features: (allBuildings.features || []).filter((feature) =>
        selectedIds.has(feature.properties?.BLDG_ID)
      )
    };
  }

  function createMerchandiseCallouts(allIncidents) {
    return merchandiseHotspotDefs.map((hotspot) => {
      const count = allIncidents.filter(
        (incident) =>
          incident.itemCategory === 'Merchandise' && hotspot.locationNames.includes(incident.locationName)
      ).length;
      const storesLabel = hotspot.locationNames.join(' + ');

      return {
        ...hotspot,
        count,
        metaText: `${count} merchandise reports`,
        detailText: storesLabel
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
    if (activeHandScene === 'intro') {
      refreshVisibleHands();
    }
  }

  function projectHandSet(handSet) {
    if (!map || !handSet.length) {
      return [];
    }

    return handSet.map((hand) => {
      const projected = map.project([hand.longitude, hand.latitude]);

      return {
        ...hand,
        x: projected.x,
        y: projected.y
      };
    });
  }

  function refreshVisibleHands() {
    if (activeHandScene === 'intro') {
      visibleHands = projectHandSet(
        introHands.map((hand) => ({
          ...hand,
          mode: 'intro'
        }))
      );
      visibleCallouts = [];
      return;
    }

    if (activeHandScene === 'aggregate') {
      visibleHands = projectHandSet(aggregateHands);
      visibleCallouts = [];
      return;
    }

    if (activeHandScene === 'merchandise') {
      visibleHands = projectHandSet(merchandiseHands);
      visibleCallouts = projectOverlayCallouts(merchandiseCallouts);
      return;
    }

    if (HOTSPOT_SCENE_IDS.has(activeHandScene)) {
      visibleHands = projectHandSet(hotspotHandsByScene[activeHandScene] || []);
      visibleCallouts = activeHandScene === 'bikes' ? projectOverlayCallouts(bikeCallouts) : [];
      return;
    }

    visibleHands = [];
    visibleCallouts = [];
  }

  function projectOverlayCallouts(callouts) {
    return callouts.map((callout) => {
      const projected = map.project([callout.longitude, callout.latitude]);
      const edgeMidpoints = [
        { x: callout.offsetX + MERCH_CALLOUT_BOX_WIDTH / 2, y: callout.offsetY },
        { x: callout.offsetX + MERCH_CALLOUT_BOX_WIDTH, y: callout.offsetY + MERCH_CALLOUT_BOX_HEIGHT / 2 },
        { x: callout.offsetX + MERCH_CALLOUT_BOX_WIDTH / 2, y: callout.offsetY + MERCH_CALLOUT_BOX_HEIGHT },
        { x: callout.offsetX, y: callout.offsetY + MERCH_CALLOUT_BOX_HEIGHT / 2 }
      ];
      const nearestEdge = edgeMidpoints.reduce((best, point) => {
        const distance = Math.hypot(point.x, point.y);
        return !best || distance < best.distance ? { ...point, distance } : best;
      }, null);
      const lineLength = nearestEdge?.distance || 0;
      const lineAngle = Math.atan2(nearestEdge?.y || 0, nearestEdge?.x || 0);

      return {
        ...callout,
        x: projected.x,
        y: projected.y,
        lineLength,
        lineAngle
      };
    });
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

    addSourceIfMissing(SOURCE_IDS.merchandiseHighlights, {
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
          'fill-opacity': 0.84
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
        id: LAYER_IDS.merchandiseHighlightFill,
        type: 'fill',
        source: SOURCE_IDS.merchandiseHighlights,
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-color': '#800000',
          'fill-opacity': 0.3
        }
      }
    );

    map.addLayer(
      {
        id: LAYER_IDS.merchandiseHighlightLine,
        type: 'line',
        source: SOURCE_IDS.merchandiseHighlights,
        layout: {
          visibility: 'none'
        },
        paint: {
          'line-color': '#800000',
          'line-width': 2.4,
          'line-opacity': 0.95
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
    setSourceData(SOURCE_IDS.merchandiseHighlights, merchandiseHighlightCollection);
    setSourceData(SOURCE_IDS.incidents, withDisplayColor(incidentsGeoJson));
  }

  function applyChapterState(chapterId) {
    if (!mapLoaded || !map) {
      return;
    }

    activeHandScene =
      chapterId === 'intro'
        ? 'intro'
        : chapterId === 'buildings'
          ? 'aggregate'
          : chapterId === 'merchandise'
            ? 'merchandise'
            : HOTSPOT_SCENE_IDS.has(chapterId)
              ? chapterId
              : 'none';
    refreshVisibleHands();

    const showIncidents =
      chapterId !== 'intro' &&
      chapterId !== 'buildings' &&
      chapterId !== 'merchandise' &&
      !HOTSPOT_SCENE_IDS.has(chapterId);
    setLayerVisibility(LAYER_IDS.incidents, showIncidents);
    setLayerVisibility(LAYER_IDS.buildingsFill, false);
    setLayerVisibility(LAYER_IDS.buildingsLine, false);
    setLayerVisibility(LAYER_IDS.uchicagoBuildingsFill, true);
    setLayerVisibility(LAYER_IDS.uchicagoBuildingsLine, true);
    setLayerVisibility(LAYER_IDS.buildingHighlightFill, chapterId === 'bikes');
    setLayerVisibility(LAYER_IDS.buildingHighlightLine, chapterId === 'bikes');
    setLayerVisibility(LAYER_IDS.merchandiseHighlightFill, chapterId === 'merchandise');
    setLayerVisibility(LAYER_IDS.merchandiseHighlightLine, chapterId === 'merchandise');

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

    if (chapterId === 'merchandise') {
      map.setFilter(LAYER_IDS.incidents, null);
      map.fitBounds(STUDY_BOUNDS_ARRAY, {
        padding: { top: 72, right: 72, bottom: 72, left: 72 },
        duration: 900
      });

      return;
    }

    if (HOTSPOT_SCENE_IDS.has(chapterId)) {
      const scene = HOTSPOT_SCENES[chapterId];

      map.setFilter(LAYER_IDS.incidents, ['==', ['get', 'itemCategory'], scene.category]);

      if (scene.zoom) {
        map.easeTo({
          center: [CAMPUS_CENTER.longitude, CAMPUS_CENTER.latitude],
          zoom: scene.zoom,
          duration: 900
        });
        return;
      }

      map.fitBounds(STUDY_BOUNDS_ARRAY, {
        padding: { top: 54, right: 54, bottom: 54, left: 54 },
        duration: 900
      });
    }
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
  $: merchandiseHighlightFeatures = Array.isArray(merchandiseHighlightBuildings.features)
    ? merchandiseHighlightBuildings.features
    : [];
  $: merchandiseHighlightCollection = {
    type: 'FeatureCollection',
    features: merchandiseHighlightFeatures
  };
  $: incidentsGeoJson = incidentsToGeoJson(incidents);
  $: panelSceneStats = buildPanelSceneStats(incidents, PANEL_SCENES);
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

        <MapOverlay
          {activeHandScene}
          {introMonthYearLabel}
          {introTimelineProgress}
          {introTimelineDayLabel}
          {mapLoaded}
          {visibleHands}
          {visibleCallouts}
          introHandLifetimeMs={INTRO_HAND_LIFETIME_MS}
          {loading}
          {error}
        />
      </div>
    </div>
  </section>

  <StoryPanel
    {storyChapters}
    {activeChapterId}
    {chapterRefs}
    buildingFeaturesLength={buildingFeatures.length}
    incidentsLength={incidents.length}
    {incidents}
    hotspotScenes={PANEL_SCENES}
    sceneStats={panelSceneStats}
  />
</div>

<style>
  .layout {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
    /* background: #f7f3ed; */
    background: #f3f1ee;
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
  }
</style>
