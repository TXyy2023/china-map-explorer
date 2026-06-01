import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { geoIdentity, geoPath } from 'd3-geo';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  MousePointer2,
  RefreshCw,
  Shirt,
} from 'lucide-react';
import {
  CULTURE_THEMES,
  buildProvinceAreaMap,
  getDefaultAreaId,
  getAreaById,
  getThemeById,
} from './foodMapConfig.js';
import {
  getCultureModule,
  normalizeCultureItems,
} from './cultureModules.js';
import { useFoodMapStore } from './useFoodMapStore.js';

const GEO_URL = '/geo/china.json';
const MAP_PADDING = 28;
const FALLBACK_STAGE_SIZE = { width: 980, height: 680 };
const DEFAULT_AREA_ID = 'sichuan-chongqing-food';

async function loadChinaGeography() {
  const response = await fetch(GEO_URL);
  if (!response.ok) throw new Error('中国地图数据加载失败');
  return response.json();
}

function stripQuery(path = '') {
  return String(path).split('?')[0];
}

function withVersion(src, versions) {
  const clean = stripQuery(src);
  const version = versions[clean];
  return version ? `${clean}?v=${version}` : clean;
}

function buildFeatureCollection(features = []) {
  return {
    type: 'FeatureCollection',
    features,
  };
}

function boundsFromFeatures(features, pathGenerator) {
  if (!features.length || !pathGenerator) return null;

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let found = false;

  features.forEach((feature) => {
    const bounds = pathGenerator.bounds(feature);
    if (!bounds) return;
    x0 = Math.min(x0, bounds[0][0]);
    y0 = Math.min(y0, bounds[0][1]);
    x1 = Math.max(x1, bounds[1][0]);
    y1 = Math.max(y1, bounds[1][1]);
    found = true;
  });

  if (!found) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function buildImageFrame(targetBounds, bitmapBounds) {
  if (!targetBounds || !bitmapBounds?.bbox || bitmapBounds.bbox.w <= 0 || bitmapBounds.bbox.h <= 0) {
    return targetBounds;
  }

  const scaleX = targetBounds.w / bitmapBounds.bbox.w;
  const scaleY = targetBounds.h / bitmapBounds.bbox.h;

  return {
    x: targetBounds.x - bitmapBounds.bbox.x * scaleX,
    y: targetBounds.y - bitmapBounds.bbox.y * scaleY,
    w: bitmapBounds.width * scaleX,
    h: bitmapBounds.height * scaleY,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hashString(input = '') {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function useElementSize(fallback = FALLBACK_STAGE_SIZE) {
  const ref = useRef(null);
  const [size, setSize] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    function measure() {
      const rect = element.getBoundingClientRect();
      setSize({
        width: Math.max(360, Math.round(rect.width)),
        height: Math.max(360, Math.round(rect.height)),
      });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

function useBitmapVisibleBounds(src) {
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    if (!src) {
      setBounds(null);
      return undefined;
    }

    let cancelled = false;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (cancelled) return;

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;

      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = pixels[(y * canvas.width + x) * 4 + 3];
          if (alpha > 16) {
            x0 = Math.min(x0, x);
            y0 = Math.min(y0, y);
            x1 = Math.max(x1, x);
            y1 = Math.max(y1, y);
          }
        }
      }

      setBounds({
        width: canvas.width,
        height: canvas.height,
        bbox: x1 >= x0
          ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
          : { x: 0, y: 0, w: canvas.width, h: canvas.height },
      });
    };
    image.onerror = () => {
      if (!cancelled) setBounds(null);
    };
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  return bounds;
}

function getAssetForView(theme, viewLevel, area, provinceAdcode) {
  if (viewLevel === 'country') {
    return {
      src: theme.chinaAsset?.src || (theme.moduleId === 'food' ? '/assets/food/china-food-ai.png' : ''),
      title: theme.labels?.sidebarTitle || theme.name,
    };
  }

  if (viewLevel === 'area' && area) {
    return {
      src: area.summaryAsset?.src,
      title: area.summaryAsset?.title || area.name,
    };
  }

  if (viewLevel === 'province' && area && provinceAdcode) {
    const asset = area.assets?.find((item) => String(item.provinceAdcode) === String(provinceAdcode));
    return asset ? { src: asset.src, title: asset.title } : null;
  }

  return null;
}

function formatProvinceName(feature) {
  return feature?.properties?.name || feature?.properties?.fullname || '未知区块';
}

function pointFromFeature(feature, pathGenerator, fallbackPoint) {
  if (!feature || !pathGenerator) return fallbackPoint;
  const centroid = pathGenerator.centroid(feature);
  if (Number.isFinite(centroid?.[0]) && Number.isFinite(centroid?.[1])) {
    return { x: centroid[0], y: centroid[1] };
  }
  const bounds = boundsFromFeatures([feature], pathGenerator);
  if (bounds) return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 };
  return fallbackPoint;
}

function buildCurvePath(origin, target, random) {
  const distance = Math.hypot(target.x - origin.x, target.y - origin.y);
  const lift = clamp(distance * 0.18, 34, 88);
  const side = random() > 0.5 ? 1 : -1;
  const control = {
    x: (origin.x + target.x) / 2 + side * (24 + random() * 64),
    y: (origin.y + target.y) / 2 - lift + (random() - 0.5) * 42,
  };
  return `M ${origin.x.toFixed(1)} ${origin.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${target.x.toFixed(1)} ${target.y.toFixed(1)}`;
}

function targetPointForItem({ areaBounds, index, itemCount, origin, random, stageSize }) {
  const safeX = 66;
  const safeTop = 66;
  const safeBottom = 82;
  const area = areaBounds || {
    x: stageSize.width * 0.22,
    y: stageSize.height * 0.18,
    w: stageSize.width * 0.56,
    h: stageSize.height * 0.58,
  };
  const rowOffset = itemCount > 1 ? (index - (itemCount - 1) / 2) * 72 : 0;
  const slots = [
    { x: area.x + area.w + 98, y: area.y + area.h * 0.22 + rowOffset },
    { x: area.x + area.w + 112, y: area.y + area.h * 0.68 + rowOffset },
    { x: area.x - 94, y: area.y + area.h * 0.3 + rowOffset },
    { x: area.x - 104, y: area.y + area.h * 0.76 + rowOffset },
    { x: area.x + area.w * 0.24 + rowOffset, y: area.y - 68 },
    { x: area.x + area.w * 0.76 + rowOffset, y: area.y + area.h + 76 },
  ];
  const slot = slots[(index + Math.floor(random() * slots.length)) % slots.length];
  let target = {
    x: slot.x + (random() - 0.5) * 82,
    y: slot.y + (random() - 0.5) * 72,
  };

  target.x = clamp(target.x, safeX, stageSize.width - safeX);
  target.y = clamp(target.y, safeTop, stageSize.height - safeBottom);

  if (Math.hypot(target.x - origin.x, target.y - origin.y) < 86) {
    target = {
      x: clamp(stageSize.width - origin.x + (random() - 0.5) * 120, safeX, stageSize.width - safeX),
      y: clamp(origin.y + (random() - 0.5) * 180, safeTop, stageSize.height - safeBottom),
    };
  }

  return target;
}

function buildCultureItemLayouts({
  activeArea,
  areaBounds,
  cultureModule,
  features,
  nonce,
  pathGenerator,
  selectedProvinceAdcode,
  stageSize,
}) {
  const items = normalizeCultureItems(activeArea, cultureModule);
  if (!activeArea || !items.length || !stageSize.width || !stageSize.height) return [];

  const areaCenter = areaBounds
    ? { x: areaBounds.x + areaBounds.w / 2, y: areaBounds.y + areaBounds.h / 2 }
    : { x: stageSize.width / 2, y: stageSize.height / 2 };
  const itemCount = items.length;

  return items.map((item, index) => {
    const random = seededRandom(hashString(`${activeArea.id}:${item.id}:${index}:${nonce}:${stageSize.width}:${stageSize.height}`));
    const provinceFeature = features.find((feature) => String(feature.properties.adcode) === String(item.provinceAdcode));
    const origin = pointFromFeature(provinceFeature, pathGenerator, areaCenter);
    const target = targetPointForItem({ areaBounds, index, itemCount, origin, random, stageSize });
    const selectedProvince = selectedProvinceAdcode ? String(selectedProvinceAdcode) : '';
    const itemProvince = item.provinceAdcode ? String(item.provinceAdcode) : '';

    return {
      ...item,
      curvePath: buildCurvePath(origin, target, random),
      dimmed: Boolean(selectedProvince && itemProvince && itemProvince !== selectedProvince),
      focused: Boolean(selectedProvince && itemProvince && itemProvince === selectedProvince),
      origin,
      target,
      travel: {
        x: origin.x - target.x,
        y: origin.y - target.y,
      },
    };
  });
}

function CultureMapPins({
  assetVersions,
  cultureModule,
  itemLayouts,
  layerPhase,
  onSelectFood,
  selectedFood,
}) {
  if (!itemLayouts.length) return null;

  return (
    <div className={`culture-map-pins ${layerPhase === 'leaving' ? 'is-leaving' : 'is-active'}`} aria-label={cultureModule.itemNoun}>
      <svg className="culture-pin-curves" aria-hidden="true">
        {itemLayouts.map((item) => (
          <g className={item.dimmed ? 'is-dimmed' : ''} key={`curve-${item.id}`}>
            <path
              className="culture-origin-curve"
              d={item.curvePath}
              style={{ '--food-accent': item.accent }}
            />
            <circle
              className="culture-origin-dot"
              cx={item.origin.x}
              cy={item.origin.y}
              r={item.focused ? 4.6 : 3.4}
              style={{ '--food-accent': item.accent }}
            />
          </g>
        ))}
      </svg>

      {itemLayouts.map((item) => {
        const selected = selectedFood?.id === item.id;
        return (
          <button
            aria-pressed={selected}
            className={[
              'culture-pin',
              selected ? 'is-selected' : '',
              item.dimmed ? 'is-dimmed' : '',
              item.focused ? 'is-province-focus' : '',
            ].join(' ')}
            key={item.id}
            onClick={() => onSelectFood(item)}
            style={{
              '--food-accent': item.accent,
              '--pin-x': `${item.target.x}px`,
              '--pin-y': `${item.target.y}px`,
              '--travel-x': `${item.travel.x}px`,
              '--travel-y': `${item.travel.y}px`,
            }}
            title={item.name}
            type="button"
          >
            <span className="culture-pin-image">
              <img
                alt={item.name}
                draggable="false"
                src={withVersion(item.image, assetVersions)}
                style={{ objectPosition: item.objectPosition || '50% 50%' }}
              />
            </span>
            <span className="culture-pin-label">{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function InteractiveMap({
  assetVersions,
  cultureModule,
  currentArea,
  hoveredAdcode,
  hoveredAreaId,
  onHoverProvince,
  onSelectArea,
  onSelectFood,
  onSelectProvince,
  selectedFood,
  selectedProvinceAdcode,
  setHoveredAreaId,
  showAiFill,
  showFoodPins,
  theme,
  viewLevel,
}) {
  const [stageRef, stageSize] = useElementSize();
  const [cursor, setCursor] = useState(null);
  const hoverClearTimerRef = useRef(null);
  const pinClearTimerRef = useRef(null);
  const pinLayerAreaRef = useRef(null);
  const [pinLayer, setPinLayer] = useState({ area: null, phase: 'hidden', nonce: 0 });
  const provinceAreaMap = useMemo(() => buildProvinceAreaMap(theme), [theme]);

  const { data: chinaGeoJson, isLoading, error } = useQuery({
    queryFn: loadChinaGeography,
    queryKey: ['china-geography'],
    staleTime: Infinity,
  });

  const features = useMemo(
    () => chinaGeoJson?.features?.filter((feature) => feature.properties?.adcode && feature.properties?.name) || [],
    [chinaGeoJson],
  );

  const currentAreaAdcodes = useMemo(
    () => new Set((currentArea?.provinceAdcodes || []).map(String)),
    [currentArea],
  );

  const selectedProvinceFeature = useMemo(
    () => features.find((feature) => String(feature.properties.adcode) === String(selectedProvinceAdcode)),
    [features, selectedProvinceAdcode],
  );

  const focusFeatures = useMemo(() => {
    if (viewLevel === 'area') {
      return features.filter((feature) => currentAreaAdcodes.has(String(feature.properties.adcode)));
    }
    if (viewLevel === 'province' && selectedProvinceFeature) {
      return [selectedProvinceFeature];
    }
    return features;
  }, [currentAreaAdcodes, features, selectedProvinceFeature, viewLevel]);

  const projection = useMemo(() => {
    if (!focusFeatures.length) {
      return geoIdentity().reflectY(true).translate([stageSize.width / 2, stageSize.height / 2]);
    }

    return geoIdentity().reflectY(true).fitExtent(
      [[MAP_PADDING, MAP_PADDING], [stageSize.width - MAP_PADDING, stageSize.height - MAP_PADDING]],
      buildFeatureCollection(focusFeatures),
    );
  }, [focusFeatures, stageSize]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const countryBounds = useMemo(
    () => boundsFromFeatures(features, pathGenerator),
    [features, pathGenerator],
  );

  const areaFeatures = useMemo(
    () => features.filter((feature) => currentAreaAdcodes.has(String(feature.properties.adcode))),
    [currentAreaAdcodes, features],
  );

  const areaBounds = useMemo(
    () => boundsFromFeatures(areaFeatures, pathGenerator),
    [areaFeatures, pathGenerator],
  );

  const provinceBounds = useMemo(
    () => selectedProvinceFeature ? boundsFromFeatures([selectedProvinceFeature], pathGenerator) : null,
    [pathGenerator, selectedProvinceFeature],
  );

  const fillFeatures = useMemo(() => {
    if (viewLevel === 'area') return areaFeatures;
    if (viewLevel === 'province' && selectedProvinceFeature) return [selectedProvinceFeature];
    return features;
  }, [areaFeatures, features, selectedProvinceFeature, viewLevel]);

  const fillTargetBounds = viewLevel === 'province'
    ? provinceBounds
    : viewLevel === 'area'
      ? areaBounds
      : countryBounds;
  const fillAsset = getAssetForView(theme, viewLevel, currentArea, selectedProvinceAdcode);
  const fillSrc = showAiFill && fillAsset?.src ? withVersion(fillAsset.src, assetVersions) : '';
  const bitmapBounds = useBitmapVisibleBounds(fillSrc);
  const imageFrame = buildImageFrame(fillTargetBounds, bitmapBounds);
  const activeAreaForItems = viewLevel === 'country'
    ? getAreaById(theme, hoveredAreaId)
    : currentArea;
  const pinLayouts = useMemo(
    () => buildCultureItemLayouts({
      activeArea: pinLayer.area,
      areaBounds,
      cultureModule,
      features,
      nonce: pinLayer.nonce,
      pathGenerator,
      selectedProvinceAdcode,
      stageSize,
    }),
    [areaBounds, cultureModule, features, pathGenerator, pinLayer.area, pinLayer.nonce, selectedProvinceAdcode, stageSize],
  );
  const focusKey = `${viewLevel}:${currentArea?.id || 'country'}:${selectedProvinceAdcode || 'all'}`;

  useEffect(() => () => {
    window.clearTimeout(hoverClearTimerRef.current);
    window.clearTimeout(pinClearTimerRef.current);
  }, []);

  useEffect(() => {
    window.clearTimeout(pinClearTimerRef.current);

    if (activeAreaForItems) {
      setPinLayer((prev) => {
        const sameArea = prev.area?.id === activeAreaForItems.id;
        const sameMode = prev.modeKey === `${viewLevel}:${activeAreaForItems.id}`;
        const next = {
          area: activeAreaForItems,
          modeKey: `${viewLevel}:${activeAreaForItems.id}`,
          nonce: sameArea && sameMode && prev.phase !== 'leaving' ? prev.nonce : prev.nonce + 1,
          phase: 'active',
        };
        pinLayerAreaRef.current = next.area;
        return next;
      });
      return undefined;
    }

    if (pinLayerAreaRef.current) {
      setPinLayer((prev) => ({ ...prev, phase: 'leaving' }));
      pinClearTimerRef.current = window.setTimeout(() => {
        pinLayerAreaRef.current = null;
        setPinLayer((prev) => ({
          area: null,
          modeKey: '',
          nonce: prev.nonce,
          phase: 'hidden',
        }));
      }, 360);
    }

    return undefined;
  }, [activeAreaForItems, viewLevel]);

  function handlePointerMove(event, feature, area) {
    window.clearTimeout(hoverClearTimerRef.current);
    const rect = stageRef.current?.getBoundingClientRect();
    if (rect) {
      setCursor({
        x: clamp(event.clientX - rect.left + 14, 12, rect.width - 260),
        y: clamp(event.clientY - rect.top + 14, 12, rect.height - 110),
        feature,
        area,
      });
    }
    onHoverProvince(String(feature.properties.adcode));
    if (viewLevel === 'country') {
      setHoveredAreaId(area?.id || null);
    }
  }

  function clearCountryHoverWithAnimation() {
    onHoverProvince(null);
    setCursor(null);
    if (viewLevel !== 'country') return;
    window.clearTimeout(hoverClearTimerRef.current);
    hoverClearTimerRef.current = window.setTimeout(() => {
      setHoveredAreaId(null);
    }, 90);
  }

  function selectFeature(feature) {
    const adcode = String(feature.properties.adcode);
    const area = provinceAreaMap.get(adcode);
    if (viewLevel === 'country' && area) {
      onSelectArea(area.id);
      return;
    }
    if (area && area.id !== currentArea?.id) {
      onSelectArea(area.id);
      return;
    }
    onSelectProvince(adcode, formatProvinceName(feature));
  }

  return (
    <section
      className="map-stage"
      onMouseLeave={() => {
        window.clearTimeout(hoverClearTimerRef.current);
        onHoverProvince(null);
        setCursor(null);
        if (viewLevel === 'country') setHoveredAreaId(null);
      }}
      ref={stageRef}
    >
      <div className="map-hud">
        <span><MousePointer2 size={14} aria-hidden="true" /> Hover / Click</span>
        <strong>
          {viewLevel === 'country'
            ? '全国总览'
            : viewLevel === 'area'
              ? currentArea?.name || '待配置区块'
              : formatProvinceName(selectedProvinceFeature)}
        </strong>
      </div>

      <svg
        aria-label={theme.labels?.countryTitle || theme.name}
        className="map-svg"
        height={stageSize.height}
        role="img"
        viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
        width={stageSize.width}
      >
        <defs>
          <clipPath id="active-map-fill">
            {fillFeatures.map((feature) => (
              <path d={pathGenerator(feature) || ''} key={`clip-${feature.properties.adcode}`} />
            ))}
          </clipPath>
          <filter id="provinceGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f4c95d" floodOpacity="0.75" />
          </filter>
        </defs>

        <rect className="map-bg-grid" width={stageSize.width} height={stageSize.height} rx="18" />

        {showAiFill && fillSrc && imageFrame && (
          <image
            className="map-ai-fill"
            clipPath="url(#active-map-fill)"
            height={imageFrame.h}
            href={fillSrc}
            preserveAspectRatio="none"
            width={imageFrame.w}
            x={imageFrame.x}
            y={imageFrame.y}
          />
        )}

        <g className="province-layer" key={focusKey}>
          {features.map((feature) => {
            const adcode = String(feature.properties.adcode);
            const area = provinceAreaMap.get(adcode);
            const inCurrentArea = currentAreaAdcodes.has(adcode);
            const hiddenByArea = (viewLevel === 'area' || viewLevel === 'province')
              && currentAreaAdcodes.size > 0
              && !inCurrentArea;
            const selected = adcode === String(selectedProvinceAdcode);
            const hovered = adcode === String(hoveredAdcode);
            const d = pathGenerator(feature) || '';

            return (
              <path
                aria-label={`${formatProvinceName(feature)}${area ? `，${area.name}` : ''}`}
                className={[
                  'province-path',
                  hiddenByArea ? 'is-muted' : '',
                  inCurrentArea && viewLevel !== 'country' ? 'is-in-area' : '',
                  selected ? 'is-selected' : '',
                  hovered ? 'is-hovered' : '',
                ].join(' ')}
                d={d}
                data-adcode={adcode}
                key={adcode}
                onClick={() => selectFeature(feature)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectFeature(feature);
                  }
                }}
                onMouseEnter={(event) => handlePointerMove(event, feature, area)}
                onMouseLeave={clearCountryHoverWithAnimation}
                onMouseMove={(event) => handlePointerMove(event, feature, area)}
                role="button"
                style={{ '--area-color': area?.color || '#64748b' }}
                tabIndex={0}
              />
            );
          })}
        </g>

        {isLoading && (
          <text className="map-loading" x={stageSize.width / 2} y={stageSize.height / 2}>
            地图加载中...
          </text>
        )}

        {error && (
          <text className="map-loading is-error" x={stageSize.width / 2} y={stageSize.height / 2}>
            地图加载失败
          </text>
        )}
      </svg>

      {cursor && (
        <div className="hover-card" style={{ left: cursor.x, top: cursor.y }}>
          <strong>{formatProvinceName(cursor.feature)}</strong>
          <span>{cursor.area?.name || `未绑定${cultureModule.label}区块`}</span>
        </div>
      )}

      {showFoodPins && (
        <CultureMapPins
          assetVersions={assetVersions}
          cultureModule={cultureModule}
          itemLayouts={pinLayouts}
          layerPhase={pinLayer.phase}
          onSelectFood={onSelectFood}
          selectedFood={selectedFood}
        />
      )}
    </section>
  );
}

function DetailPanel({
  activeAsset,
  assetVersions,
  cultureModule,
  currentArea,
  onBackArea,
  onBackCountry,
  selectedFood,
  selectedProvinceName,
  showFoodPins,
  toggleFoodPins,
  theme,
  viewLevel,
}) {
  const [quizChoice, setQuizChoice] = useState(null);

  useEffect(() => {
    setQuizChoice(null);
  }, [selectedFood?.id]);

  const selectedQuiz = selectedFood?.quiz;
  const currentItems = useMemo(
    () => normalizeCultureItems(currentArea, cultureModule),
    [currentArea, cultureModule],
  );
  const hasCultureAreas = Boolean(theme.areas?.length);
  const showEmptyState = !selectedFood && (!hasCultureAreas || !currentItems.length);

  return (
    <aside className="panel detail-panel">
      <div className="panel-kicker">
        <Layers size={16} aria-hidden="true" />
        <span>{cultureModule.label}</span>
      </div>

      <div className="focus-title">
        <span>{viewLevel === 'country' ? '全国视图' : viewLevel === 'area' ? '大区视图' : '省份视图'}</span>
        <h2>
          {viewLevel === 'country'
            ? theme.labels?.sidebarTitle || theme.name
            : viewLevel === 'area'
              ? currentArea?.name
              : selectedProvinceName || activeAsset?.title || '省份区块'}
        </h2>
      </div>

      <p className="panel-copy">
        {!hasCultureAreas
          ? theme.labels?.emptyState || '暂无文化区块配置。'
          : viewLevel === 'country'
            ? `点击任意省份进入对应文化区块；悬停时地图会高亮省份并切换${cultureModule.itemNoun}点位。`
          : viewLevel === 'area'
            ? currentArea?.description
            : `当前展示 ${activeAsset?.title || selectedProvinceName || '省份'} 的地图区块，可继续点击${cultureModule.itemNoun}查看题目与做法。`}
      </p>

      <div className="action-grid">
        {viewLevel !== 'country' && (
          <button onClick={onBackCountry} type="button">
            <ArrowLeft size={15} aria-hidden="true" />
            全国
          </button>
        )}
        {viewLevel === 'province' && (
          <button onClick={onBackArea} type="button">
            <ChevronRight size={15} aria-hidden="true" />
            大区
          </button>
        )}
        <button onClick={toggleFoodPins} type="button">
          {showFoodPins ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
          {cultureModule.itemNoun}
        </button>
      </div>

      {showEmptyState && (
        <section className="empty-culture-state">
          <strong>{theme.labels?.emptyState || `暂无${cultureModule.label}内容`}</strong>
          <span>{cultureModule.itemNoun}未配置 · {cultureModule.processTitle}待填充 · {cultureModule.quizTitle}待填充</span>
        </section>
      )}

      {selectedFood && (
        <section className="selected-culture-item">
          <figure className="selected-item-hero">
            <img
              alt={`${selectedFood.name}大图`}
              src={withVersion(selectedFood.image, assetVersions)}
              style={{ objectPosition: selectedFood.objectPosition || '50% 50%' }}
            />
            <figcaption>{selectedFood.name}</figcaption>
          </figure>

          <div className="selected-item-head">
            <img
              alt={selectedFood.name}
              src={withVersion(selectedFood.image, assetVersions)}
              style={{ objectPosition: selectedFood.objectPosition || '50% 50%' }}
            />
            <div>
              <span>{selectedFood.areaName}</span>
              <h3>{selectedFood.name}</h3>
            </div>
          </div>

          <section className="food-process">
            <div>
              <span>{cultureModule.processTitle}</span>
            </div>
            <ol>
              {selectedFood.process.map((step, index) => (
                <li key={`${selectedFood.id}-${index}`}>
                  <b>{index + 1}</b>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {selectedQuiz && (
            <section className="culture-quiz">
              <span>{cultureModule.quizTitle}</span>
              <h3>{selectedQuiz.question}</h3>
              <div className="quiz-options">
                {(selectedQuiz.options || []).map((option, index) => {
                  const answered = quizChoice !== null;
                  const correct = index === selectedQuiz.answerIndex;
                  const chosen = quizChoice === index;
                  return (
                    <button
                      className={[
                        answered && correct ? 'is-correct' : '',
                        answered && chosen && !correct ? 'is-wrong' : '',
                      ].join(' ')}
                      key={`${selectedFood.id}-quiz-${option}`}
                      onClick={() => setQuizChoice(index)}
                      type="button"
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              {quizChoice !== null && (
                <p>{quizChoice === selectedQuiz.answerIndex ? selectedQuiz.successReward : `参考答案：${selectedQuiz.options?.[selectedQuiz.answerIndex] || '请查看配置'}`}</p>
              )}
            </section>
          )}
        </section>
      )}

      <div className="layer-state">
        <span>AI 轮廓图层 OFF</span>
        <span className={showFoodPins ? 'is-on' : ''}>{cultureModule.itemNoun} {showFoodPins ? 'ON' : 'OFF'}</span>
      </div>
    </aside>
  );
}

function App() {
  const theme = useFoodMapStore((state) => state.theme);
  const activeThemeId = useFoodMapStore((state) => state.activeThemeId);
  const resetTheme = useFoodMapStore((state) => state.resetTheme);
  const setThemeById = useFoodMapStore((state) => state.setThemeById);
  const cultureModule = useMemo(() => getCultureModule(theme), [theme]);
  const [viewLevel, setViewLevel] = useState('country');
  const [selectedAreaId, setSelectedAreaId] = useState(DEFAULT_AREA_ID);
  const [hoveredAreaId, setHoveredAreaId] = useState(null);
  const [selectedProvinceAdcode, setSelectedProvinceAdcode] = useState(null);
  const [selectedProvinceLabel, setSelectedProvinceLabel] = useState('');
  const [hoveredAdcode, setHoveredAdcode] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const showAiFill = theme.features?.aiRegionFill === true && cultureModule.features.aiRegionFill === true;
  const [showFoodPins, setShowFoodPins] = useState(true);
  const [notice, setNotice] = useState('地图已切到小图点位模式：AI 轮廓图层暂时关闭。');
  const assetVersions = useMemo(() => ({}), []);
  const provinceAreaMap = useMemo(() => buildProvinceAreaMap(theme), [theme]);
  const currentArea = getAreaById(theme, selectedAreaId);

  const selectedProvinceName = useMemo(() => {
    if (!selectedProvinceAdcode) return '';
    const area = provinceAreaMap.get(String(selectedProvinceAdcode));
    const asset = area?.assets?.find((item) => String(item.provinceAdcode) === String(selectedProvinceAdcode));
    return asset?.title || selectedProvinceLabel || selectedProvinceAdcode;
  }, [provinceAreaMap, selectedProvinceAdcode, selectedProvinceLabel]);

  const activeMapAsset = getAssetForView(theme, viewLevel, currentArea, selectedProvinceAdcode);

  useEffect(() => {
    document.documentElement.className = 'app-document';
    document.body.className = 'app-document';
  }, []);

  function resetViewForTheme(nextTheme, message) {
    const nextAreaId = getDefaultAreaId(nextTheme);
    setSelectedAreaId(nextAreaId);
    setHoveredAreaId(null);
    setSelectedProvinceAdcode(null);
    setSelectedProvinceLabel('');
    setHoveredAdcode(null);
    setSelectedFood(null);
    setViewLevel('country');
    setNotice(message);
  }

  function switchCultureTheme(themeId) {
    const nextTheme = getThemeById(themeId);
    setThemeById(nextTheme.id);
    resetViewForTheme(nextTheme, `已切换到 ${nextTheme.name}。`);
  }

  function selectArea(areaId) {
    const area = getAreaById(theme, areaId);
    if (!area) {
      setNotice(`${theme.name} 暂无可进入的大区配置。`);
      return;
    }
    setSelectedAreaId(area.id);
    setHoveredAreaId(null);
    setSelectedProvinceAdcode(null);
    setSelectedProvinceLabel('');
    setSelectedFood(null);
    setViewLevel('area');
    setNotice(`已进入 ${area.name}，可点击省份或${cultureModule.itemNoun}继续查看。`);
  }

  function selectProvince(adcode, provinceName = '') {
    const area = provinceAreaMap.get(String(adcode));
    if (area) {
      setSelectedAreaId(area.id);
      setHoveredAreaId(null);
    }
    setSelectedProvinceAdcode(String(adcode));
    setSelectedProvinceLabel(provinceName);
    setViewLevel('province');
    setNotice(`已选择省份区块：${provinceName || String(adcode)}。`);
  }

  function selectFood(food) {
    setSelectedFood(food);
    if (food.areaId) {
      setSelectedAreaId(food.areaId);
      setHoveredAreaId(null);
    }
    if (food.provinceAdcode) {
      setSelectedProvinceAdcode(String(food.provinceAdcode));
      setSelectedProvinceLabel('');
      setViewLevel('province');
    } else {
      setSelectedProvinceAdcode(null);
      setSelectedProvinceLabel('');
      setViewLevel('area');
    }
    setNotice(`已选中${cultureModule.itemNoun}：${food.name}。`);
  }

  function backCountry() {
    setViewLevel('country');
    setSelectedProvinceAdcode(null);
    setSelectedProvinceLabel('');
    setHoveredAreaId(null);
    setSelectedFood(null);
    setNotice('已返回全国交互地图。');
  }

  function backArea() {
    if (!currentArea) {
      backCountry();
      setNotice(`${theme.name} 暂无大区配置。`);
      return;
    }
    setViewLevel('area');
    setSelectedProvinceAdcode(null);
    setSelectedProvinceLabel('');
    setHoveredAreaId(null);
    setSelectedFood(null);
    setNotice(`已返回 ${currentArea.name}。`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={backCountry} type="button">
          <MapPin size={20} aria-hidden="true" />
          <span>{theme.name}</span>
        </button>
        <div className="culture-tabs" aria-label="文化地图类型">
          {CULTURE_THEMES.map((cultureTheme) => {
            const selected = (activeThemeId || theme.id) === cultureTheme.id;
            return (
              <button
                className={selected ? 'is-active' : ''}
                key={cultureTheme.id}
                onClick={() => switchCultureTheme(cultureTheme.id)}
                type="button"
              >
                {cultureTheme.moduleId === 'clothing' && <Shirt size={14} aria-hidden="true" />}
                {cultureTheme.moduleId !== 'clothing' && <Layers size={14} aria-hidden="true" />}
                {cultureTheme.moduleId === 'clothing' ? '服装' : '美食'}
              </button>
            );
          })}
        </div>
        <div className="topbar-meta">
          <span>{viewLevel === 'country' ? '全国' : viewLevel === 'area' ? currentArea?.name || '待配置' : selectedProvinceName}</span>
          <b>{theme.labels?.topbarMeta || cultureModule.label}</b>
        </div>
        <button
          className="ghost-button"
          onClick={() => {
            const resetTarget = getThemeById(activeThemeId || theme.id);
            resetTheme();
            resetViewForTheme(resetTarget, `已重置 ${resetTarget.name}。`);
          }}
          type="button"
        >
          <RefreshCw size={15} aria-hidden="true" />
          重置
        </button>
      </header>

      <section className="workspace">
        <div className="map-column">
          <div className="map-title-row">
            <div>
              <span>{theme.labels?.mapSubtitle || `${cultureModule.itemNoun}点位 / 鼠标交互优先`}</span>
              <h1>
                {viewLevel === 'country'
                  ? theme.labels?.countryTitle || theme.name
                  : viewLevel === 'area'
                    ? currentArea?.name || '待配置文化区'
                    : activeMapAsset?.title || selectedProvinceName}
              </h1>
            </div>
            <div className="view-tabs" aria-label="视图层级">
              <button className={viewLevel === 'country' ? 'is-active' : ''} onClick={backCountry} type="button">全国</button>
              <button className={viewLevel === 'area' ? 'is-active' : ''} disabled={!currentArea} onClick={backArea} type="button">大区</button>
              <button className={viewLevel === 'province' ? 'is-active' : ''} disabled={!selectedProvinceAdcode} type="button">省份</button>
            </div>
          </div>

          <InteractiveMap
            assetVersions={assetVersions}
            cultureModule={cultureModule}
            currentArea={currentArea}
            hoveredAdcode={hoveredAdcode}
            hoveredAreaId={hoveredAreaId}
            key={theme.id}
            onHoverProvince={setHoveredAdcode}
            onSelectArea={selectArea}
            onSelectFood={selectFood}
            onSelectProvince={selectProvince}
            selectedFood={selectedFood}
            selectedProvinceAdcode={selectedProvinceAdcode}
            setHoveredAreaId={setHoveredAreaId}
            showAiFill={showAiFill}
            showFoodPins={showFoodPins}
            theme={theme}
            viewLevel={viewLevel}
          />
        </div>

        <div className="side-column">
          <DetailPanel
            activeAsset={activeMapAsset}
            assetVersions={assetVersions}
            cultureModule={cultureModule}
            currentArea={currentArea}
            onBackArea={backArea}
            onBackCountry={backCountry}
            selectedFood={selectedFood}
            selectedProvinceName={selectedProvinceName}
            showFoodPins={showFoodPins}
            toggleFoodPins={() => setShowFoodPins((value) => !value)}
            theme={theme}
            viewLevel={viewLevel}
          />

          <div className="notice-bar">
            <Check size={15} aria-hidden="true" />
            <span>{notice}</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
