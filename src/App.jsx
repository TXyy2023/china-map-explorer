/**
 * ==========================================
 * 宗教信仰文化区交互地图主程序
 * ==========================================
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';
import { geoIdentity, geoPath } from 'd3-geo';
import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Bot,
  Building2,
  Check,
  Image as ImageIcon,
  Landmark,
  Loader2,
  MapPin,
  PanelRightOpen,
  RefreshCw,
  Save,
  Shirt,
  Sparkles,
  Trophy,
  HelpCircle,
  Award,
  Utensils,
} from 'lucide-react';
import {
  CULTURE_THEME_OPTIONS,
  DEFAULT_CULTURE_THEME_ID,
  FLOW_STEPS,
  DEFAULT_FOOD_THEME,
  FOOD_IMAGE_ASSET,
  buildProvinceAreaMap,
  getAreaById,
  getCultureThemeById,
} from './foodMapConfig.js';
import {
  useAnimeFoodLayer,
  useAnimeFoodSelection,
  useAnimeHoverInteractions,
  useAnimeMapStage,
  useAnimePanelMotion,
  useAnimeSpinners,
  useAnimeThemeSwap,
} from './animeMotion.js';
import { useFoodMapStore } from './useFoodMapStore.js';

// 中国省级地图 GeoJSON 边界数据路径
const GEO_URL = '/geo/china.json';
// 自适应地图的默认兜底尺寸
const FALLBACK_MAP_SIZE = { height: 560, width: 960 };
// 地图在画布容器中的边缘填充边距
const MAP_PADDING = 20;
const FOOD_LAYOUT_GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const IMAGE_CACHE_NAME = 'china-map-explorer-image-cache-v1';
const IMAGE_ASSET_RE = /\.(png|jpe?g|webp|gif|svg)$/i;
const IMAGE_DB_NAME = 'china-map-explorer-image-cache';
const IMAGE_DB_STORE = 'images';
const IMAGE_DB_VERSION = 1;

let imageDbPromise = null;

/**
 * 由 XState 严谨驱动的视图状态机
 * 精准管控：运行/开发模式、开发流程步骤、当前聚焦选中的文化区状态
 */
const mapMachine = createMachine({
  id: 'religionCultureMap',
  initial: 'country', // 默认状态为全国视图
  context: {
    appMode: 'run',    // 运作模式：'run' 运行浏览，'dev' AI自主开发
    flowStep: 'select', // 当前进行到的开发工序
    selectedAreaId: 'north-ancestor-ritual', // 当前聚焦的信仰文化区 ID
  },
  on: {
    // 动作事件：返回全国视图
    BACK_COUNTRY: {
      target: '.country',
      actions: assign({
        flowStep: 'select',
      }),
    },
    // 动作事件：选中特定信仰文化区
    SELECT_AREA: {
      target: '.area',
      actions: assign({
        selectedAreaId: ({ event }) => event.areaId,
      }),
    },
    // 动作事件：变更开发流程控制步骤
    SET_FLOW_STEP: {
      actions: assign({
        flowStep: ({ event }) => event.flowStep,
      }),
    },
    // 动作事件：切换工作模式
    SET_MODE: {
      actions: assign({
        appMode: ({ event }) => event.appMode,
      }),
    },
    SET_ACTIVE_AREA: {
      actions: assign({
        selectedAreaId: ({ event }) => event.areaId,
      }),
    },
  },
  states: {
    area: {},    // 区域聚焦渲染详情
    country: {}, // 全国视图大盘
  },
});

/**
 * 校验开发模式下绑定 AI 图片表单输入的 Schema 规则 (Zod)
 */
const mcpFormSchema = z.object({
  areaId: z.string().min(1, '请选择文化区'),
  height: z.coerce.number().min(96, '图片高度不能小于96px').max(260, '图片高度不能大于260px'),
  lng: z.coerce.number().min(73, '经度范围不合法').max(136, '经度范围不合法'),
  style: z.string().min(2, '绘图风格描述太短').max(80, '绘图风格描述太长'),
  width: z.coerce.number().min(140, '图片宽度不能小于140px').max(360, '图片宽度不能大于360px'),
  lat: z.coerce.number().min(18, '纬度范围不合法').max(54, '纬度范围不合法'),
});

/**
 * 获取当前 Node.js MCP 桥接服务端注册的全部工具
 */
async function getMcpTools() {
  const response = await fetch('/api/mcp/tools');
  if (!response.ok) throw new Error('MCP 桥接工具不可用');
  return response.json();
}

async function getImageAssets() {
  const response = await fetch('/api/assets');
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || '图片资产库不可用');
  }
  return payload;
}

async function saveImageAssetPrompt({ assetId, prompt }) {
  const response = await fetch(`/api/assets/${encodeURIComponent(assetId)}`, {
    body: JSON.stringify({ prompt }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || '保存图片 Prompt 失败');
  }
  return payload.asset;
}

async function regenerateImageAsset({ assetId, prompt }) {
  const response = await fetch(`/api/assets/${encodeURIComponent(assetId)}/regenerate`, {
    body: JSON.stringify({ prompt }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || '重新生成图片失败');
  }
  return payload;
}

/**
 * 通用执行指定 MCP 桥接工具的方法
 */
async function runMcpTool({ tool, params }) {
  const response = await fetch('/api/mcp/run', {
    body: JSON.stringify({ params, tool }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || `MCP 工具执行失败: ${tool}`);
  }
  return payload.result;
}

/**
 * 异步拉取中国省级行政边界的 GeoJSON 数据
 */
async function loadChinaGeography() {
  const response = await fetch(GEO_URL);
  if (!response.ok) throw new Error('中国地图数据加载失败');
  return response.json();
}

/**
 * 将 GeoJSON 要素集合组装为 FeatureCollection 格式
 */
function buildFeatureCollection(features = []) {
  return {
    features,
    type: 'FeatureCollection',
  };
}

function addVersionedImageUrl(urls, src, assetVersions) {
  if (!src) return;
  const cleanSrc = String(src).split('?')[0];
  if (!cleanSrc || !IMAGE_ASSET_RE.test(cleanSrc)) return;
  const version = assetVersions[cleanSrc];
  urls.add(version ? `${cleanSrc}?v=${version}` : cleanSrc);
}

function collectThemeImageUrls(theme, assetVersions) {
  const urls = new Set();
  addVersionedImageUrl(urls, theme?.chinaAsset?.src, assetVersions);

  theme?.areas?.forEach((area) => {
    addVersionedImageUrl(urls, area.summaryAsset?.src, assetVersions);
    Object.values(area.mapFills || {}).forEach((src) => addVersionedImageUrl(urls, src, assetVersions));

    area.assets?.forEach((asset) => {
      addVersionedImageUrl(urls, asset.src, assetVersions);
      addVersionedImageUrl(urls, asset.outputImage, assetVersions);
      addVersionedImageUrl(urls, asset.sourceImage, assetVersions);
    });

    area.foodItems?.forEach((item) => {
      addVersionedImageUrl(urls, item.image, assetVersions);
      addVersionedImageUrl(urls, item.detailImage, assetVersions);
      addVersionedImageUrl(urls, item.fallbackImage, assetVersions);
    });
  });

  return Array.from(urls);
}

function openImageCacheDb() {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (imageDbPromise) return imageDbPromise;

  imageDbPromise = new Promise((resolve) => {
    const request = window.indexedDB.open(IMAGE_DB_NAME, IMAGE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_DB_STORE)) {
        db.createObjectStore(IMAGE_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return imageDbPromise;
}

function readCachedImageBlob(db, url) {
  if (!db) return Promise.resolve(null);
  return new Promise((resolve) => {
    const transaction = db.transaction(IMAGE_DB_STORE, 'readonly');
    const request = transaction.objectStore(IMAGE_DB_STORE).get(url);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => resolve(null);
  });
}

function writeCachedImageBlob(db, url, blob) {
  if (!db || !blob) return Promise.resolve();
  return new Promise((resolve) => {
    const transaction = db.transaction(IMAGE_DB_STORE, 'readwrite');
    transaction.objectStore(IMAGE_DB_STORE).put({ blob, cachedAt: Date.now() }, url);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}

function getCachedImageUrl(src, assetVersions, cachedImageUrls) {
  const cleanSrc = String(src || '').split('?')[0];
  if (!cleanSrc) return cleanSrc;
  const version = assetVersions[cleanSrc];
  const versionedSrc = version ? `${cleanSrc}?v=${version}` : cleanSrc;
  return cachedImageUrls[versionedSrc] || cachedImageUrls[cleanSrc] || versionedSrc;
}

function useLocalImageCache(theme, assetVersions) {
  const [cachedImageUrls, setCachedImageUrls] = useState({});
  const objectUrlRef = useRef(new Map());
  const imageUrls = useMemo(
    () => collectThemeImageUrls(theme, assetVersions),
    [theme, assetVersions],
  );
  const imageCacheKey = imageUrls.join('\n');

  useEffect(() => () => {
    objectUrlRef.current.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    objectUrlRef.current.clear();
  }, []);

  useEffect(() => {
    if (!imageUrls.length || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let idleId = null;
    let fallbackTimer = null;
    const preloadedImages = [];

    function publishBlobUrl(url, blob) {
      if (cancelled || !blob) return;
      let objectUrl = objectUrlRef.current.get(url);
      if (!objectUrl) {
        objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current.set(url, objectUrl);
      }
      setCachedImageUrls((previous) => (
        previous[url] === objectUrl ? previous : { ...previous, [url]: objectUrl }
      ));
    }

    async function warmImageCache() {
      const cache = 'caches' in window
        ? await window.caches.open(IMAGE_CACHE_NAME).catch(() => null)
        : null;
      const db = await openImageCacheDb();
      let nextIndex = 0;

      async function worker() {
        while (!cancelled && nextIndex < imageUrls.length) {
          const url = imageUrls[nextIndex];
          nextIndex += 1;

          try {
            const dbBlob = await readCachedImageBlob(db, url);
            if (dbBlob) {
              publishBlobUrl(url, dbBlob);
              continue;
            }

            if (cache) {
              const cached = await cache.match(url);
              if (cached) {
                const blob = await cached.blob();
                publishBlobUrl(url, blob);
                await writeCachedImageBlob(db, url, blob);
                continue;
              } else {
                const response = await fetch(url, { cache: 'force-cache' });
                if (response.ok) {
                  await cache.put(url, response.clone());
                  const blob = await response.blob();
                  publishBlobUrl(url, blob);
                  await writeCachedImageBlob(db, url, blob);
                  continue;
                }
              }
            } else {
              const response = await fetch(url, { cache: 'force-cache' });
              if (response.ok) {
                const blob = await response.blob();
                publishBlobUrl(url, blob);
                await writeCachedImageBlob(db, url, blob);
              }
            }

            const image = new Image();
            image.decoding = 'async';
            image.src = objectUrlRef.current.get(url) || url;
            preloadedImages.push(image);
            await image.decode?.().catch(() => undefined);
          } catch {
            // 缓存预热失败不影响正常图片加载。
          }
        }
      }

      await Promise.all(Array.from({ length: Math.min(4, imageUrls.length) }, worker));
    }

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(warmImageCache, { timeout: 1800 });
    } else {
      fallbackTimer = window.setTimeout(warmImageCache, 0);
    }

    return () => {
      cancelled = true;
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      preloadedImages.length = 0;
    };
  }, [imageCacheKey, imageUrls]);

  return cachedImageUrls;
}

/**
 * 监听画布大小改变，实现一屏式完美自适应布局的 ResizeObserver 自定义 Hook
 */
function useElementSize(fallbackSize = FALLBACK_MAP_SIZE) {
  const ref = useRef(null);
  const [size, setSize] = useState(fallbackSize);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    function updateSize() {
      const rect = element.getBoundingClientRect();
      setSize({
        height: Math.max(280, Math.round(rect.height)),
        width: Math.max(300, Math.round(rect.width)),
      });
    }

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

function clampNumber(value, min, max) {
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

function getDefaultFoodArea(areaId) {
  return DEFAULT_FOOD_THEME.areas.find((area) => area.id === areaId);
}

function normalizeFoodItems(area) {
  if (!area) return [];
  const defaultArea = getDefaultFoodArea(area.id);
  const configuredItems = area.foodItems?.length ? area.foodItems : defaultArea?.foodItems;
  const items = configuredItems?.length
    ? configuredItems
    : (area.assets || []).map((asset) => ({
        id: `food-${asset.id}`,
        image: asset.src,
        name: asset.title.replace('图', ''),
        provinceAdcode: asset.provinceAdcode,
        process: ['识别核心场景', '梳理文化关键词', '连接区域省份', '转化为 UI 热点'],
      }));

  return items.map((item, index) => ({
    accent: item.accent || area.color,
    areaId: area.id,
    areaName: area.name,
    id: item.id || `${area.id}-food-${index}`,
    image: item.image || item.src || area.summaryAsset?.src,
    name: item.name || item.title || `文化线索 ${index + 1}`,
    objectPosition: item.objectPosition || '50% 50%',
    process: item.process?.length ? item.process : ['识别场景', '提取关键词', '关联省份', '形成讲解卡'],
    provinceAdcode: item.provinceAdcode || area.provinceAdcodes?.[0],
  }));
}

function getThemeCopy(theme) {
  return {
    areaCountLabel: '文化区',
    areaDetailLabel: '文化区详情',
    countryKicker: theme?.name || '中国文化地图',
    countryStatus: `${theme?.name || '中国文化地图'}视图`,
    exploreLabel: '中国文化区探索 ✦ React 自适应投影',
    loadingLabel: '文化地图加载中...',
    overviewTitle: `${theme?.areas?.length || 0} 大文化区总览`,
    provinceDescription: '探索省级文化线索。',
    provinceLabel: '省级文化线索',
    quizLabel: '文化区知识问答',
    readyNotice: '中国文化地图已就绪，等待探索',
    resetNotice: '系统成功复位：地图已恢复至默认文化配置',
    returnCountryNotice: '已返回全国文化大盘',
    targetAreaLabel: '目标文化区',
    ...(theme?.copy || {}),
  };
}

function isInsideRect(point, rect, padding = 0) {
  if (!rect) return false;
  return (
    point.x >= rect.x - padding
    && point.x <= rect.x + rect.w + padding
    && point.y >= rect.y - padding
    && point.y <= rect.y + rect.h + padding
  );
}

function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function buildFoodItemLayout(items, mapSize, focusBounds, viewLevel, areaId) {
  const width = mapSize?.width || FALLBACK_MAP_SIZE.width;
  const height = mapSize?.height || FALLBACK_MAP_SIZE.height;
  const isDetailView = viewLevel !== 'country';
  const baseSize = isDetailView
    ? clampNumber(Math.min(width, height) * 0.092, 54, 72)
    : clampNumber(Math.min(width, height) * 0.12, 58, 82);
  const safeX = baseSize / 2 + 18;
  const safeTop = baseSize / 2 + 28;
  const safeBottom = baseSize / 2 + (isDetailView ? 148 : 78);
  const random = seededRandom(hashString(`${areaId}-${viewLevel}-${items.length}-${Math.round(width)}-${Math.round(height)}`));
  const focus = focusBounds || {
    h: height * 0.58,
    w: width * 0.58,
    x: width * 0.21,
    y: height * 0.18,
  };
  const focusCenter = {
    x: clampNumber(focus.x + focus.w / 2, safeX, width - safeX),
    y: clampNumber(focus.y + focus.h / 2, safeTop, height - safeBottom),
  };
  const avoidRect = viewLevel === 'country'
    ? { h: height * 0.56, w: width * 0.48, x: width * 0.26, y: height * 0.2 }
    : { h: focus.h * 0.76, w: focus.w * 0.78, x: focus.x + focus.w * 0.11, y: focus.y + focus.h * 0.12 };
  const candidates = [];

  function pushCandidate(x, y, weight = 1) {
    candidates.push({
      weight,
      x: clampNumber(x, safeX, width - safeX),
      y: clampNumber(y, safeTop, Math.max(safeTop, height - safeBottom)),
    });
  }

  const fixedSlots = [
    [0.14, 0.2], [0.34, 0.13], [0.66, 0.14], [0.86, 0.22],
    [0.88, 0.48], [0.78, 0.72], [0.53, 0.82], [0.26, 0.74],
    [0.12, 0.52], [0.42, 0.7], [0.62, 0.32], [0.2, 0.35],
  ];

  fixedSlots.forEach(([xRatio, yRatio]) => {
    pushCandidate(
      width * xRatio + (random() - 0.5) * baseSize * 0.9,
      height * yRatio + (random() - 0.5) * baseSize * 0.9,
      1.15,
    );
  });

  const ringCount = Math.max(48, items.length * 16);
  const startAngle = random() * Math.PI * 2;
  for (let index = 0; index < ringCount; index += 1) {
    const angle = startAngle + index * FOOD_LAYOUT_GOLDEN_ANGLE;
    const radiusJitter = 0.82 + random() * 0.4;
    const radiusX = Math.max(focus.w * 0.5 + baseSize * 0.62, width * 0.16) * radiusJitter;
    const radiusY = Math.max(focus.h * 0.5 + baseSize * 0.58, height * 0.17) * radiusJitter;
    pushCandidate(
      focusCenter.x + Math.cos(angle) * radiusX,
      focusCenter.y + Math.sin(angle) * radiusY,
      1,
    );
  }

  const placed = [];
  return items.map((item, itemIndex) => {
    let bestCandidate = candidates[itemIndex % candidates.length] || focusCenter;
    let bestScore = -Infinity;

    candidates.forEach((candidate) => {
      const minDistance = placed.length
        ? Math.min(...placed.map((point) => distanceBetween(point, candidate)))
        : Math.min(
            distanceBetween(candidate, { x: width * 0.16, y: height * 0.16 }),
            distanceBetween(candidate, { x: width * 0.84, y: height * 0.84 }),
          );
      const edgeComfort = Math.min(
        candidate.x - safeX,
        width - safeX - candidate.x,
        candidate.y - safeTop,
        height - safeBottom - candidate.y,
      );
      const centerDistance = distanceBetween(candidate, focusCenter);
      const avoidPenalty = isInsideRect(candidate, avoidRect, -baseSize * 0.15)
        ? (viewLevel === 'country' ? -88 : -145)
        : 72;
      const score =
        minDistance * 1.85
        + centerDistance * 0.18
        + edgeComfort * 0.08
        + avoidPenalty * candidate.weight
        + random() * 18;

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    });

    placed.push(bestCandidate);
    const size = Math.round(baseSize + (random() - 0.5) * 14);
    return {
      ...item,
      delay: itemIndex * 72,
      rotate: Math.round((random() - 0.5) * 12),
      size,
      x: Math.round(bestCandidate.x),
      y: Math.round(bestCandidate.y),
    };
  });
}

/**
 * 地图图形渲染层：基于 React-Simple-Maps 并利用 D3-Geo 的自适应投影实现省份自适应定位
 */
function FoodMap({
  assetVersions,
  cachedImageUrls,
  currentArea,
  hoveredAreaId,
  hoveredProvinceAdcode,
  selectedFoodItem,
  viewLevel,
  onFoodItemSelect,
  onHoverArea,
  onHoverProvince,
  onSelectArea,
  selectedProvinceAdcode,
  onSelectProvince,
  onViewLevelChange,
  provinceAreaMap,
  theme,
}) {
  const [mapStageRef, mapSize] = useElementSize();
  const [foodBurstOrigin, setFoodBurstOrigin] = useState({
    x: FALLBACK_MAP_SIZE.width / 2,
    y: FALLBACK_MAP_SIZE.height / 2,
  });
  const [isFoodLayerReady, setIsFoodLayerReady] = useState(false);
  const themeCopy = getThemeCopy(theme);

  function getVersionedAsset(src) {
    return getCachedImageUrl(src, assetVersions, cachedImageUrls);
  }

  function getProvinceFillAsset(area, adcode) {
    const asset = area?.assets?.find((item) => String(item.provinceAdcode) === String(adcode));
    return asset?.src || area?.mapFills?.province || area?.mapFills?.area || area?.mapFills?.country || theme.chinaAsset?.src;
  }

  function recordFoodOrigin(event) {
    const stage = mapStageRef.current;
    if (!stage || !event?.clientX || !event?.clientY) return;
    const rect = stage.getBoundingClientRect();
    setFoodBurstOrigin({
      x: clampNumber(event.clientX - rect.left, 0, rect.width),
      y: clampNumber(event.clientY - rect.top, 0, rect.height),
    });
  }

  function handleAreaPointer(event, area) {
    if (viewLevel !== 'country' || !area) return;
    if (area.id !== hoveredAreaId) {
      recordFoodOrigin(event);
      onHoverArea(area.id);
    }
  }

  function handleProvincePointer(event, { adcode, area, isHidden }) {
    if (isHidden) return;
    recordFoodOrigin(event);
    if (area) {
      handleAreaPointer(event, area);
    }
    if (String(adcode) !== String(hoveredProvinceAdcode || '')) {
      onHoverProvince(adcode, area?.id);
    }
  }

  function handleStagePointerLeave() {
    onHoverProvince(null);
  }

  function activateProvince(event, { adcode, area, isHidden, isInFocusedArea }) {
    if (isHidden) return;
    recordFoodOrigin(event);
    if (viewLevel === 'country') {
      if (area) {
        onSelectArea(area.id);
        onViewLevelChange('area');
      } else {
        onSelectProvince(adcode);
        onViewLevelChange('province');
      }
    } else if (viewLevel === 'area' && isInFocusedArea) {
      onSelectProvince(adcode);
      onViewLevelChange('province');
    }
  }

  function handleProvinceKeyDown(event, provinceState) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    activateProvince(event, provinceState);
  }

  // 用 React Query 异步拉取并缓存 GeoJSON
  const { data: chinaGeoJson, isLoading: mapLoading } = useQuery({
    queryFn: loadChinaGeography,
    queryKey: ['china-geography'],
    staleTime: Infinity,
  });

  const validFeatures = useMemo(
    () => chinaGeoJson?.features?.filter((geo) => geo.properties?.name && geo.properties?.adcode) || [],
    [chinaGeoJson],
  );

  const visibleAdcodes = useMemo(
    () => new Set((currentArea?.provinceAdcodes || []).map(String)),
    [currentArea?.provinceAdcodes],
  );

  const activeFoodArea = useMemo(() => {
    if (viewLevel === 'country') {
      return getAreaById(theme, hoveredAreaId || currentArea?.id);
    }
    return currentArea;
  }, [currentArea, hoveredAreaId, theme, viewLevel]);

  const activeFoodItems = useMemo(
    () => normalizeFoodItems(activeFoodArea),
    [activeFoodArea],
  );

  // 计算当前聚焦区域或省份所涵盖的地理要素集合
  const focusedGeoJson = useMemo(() => {
    if (viewLevel === 'country') {
      return buildFeatureCollection(validFeatures);
    } else if (viewLevel === 'area') {
      return buildFeatureCollection(validFeatures.filter((geo) => visibleAdcodes.has(String(geo.properties.adcode))));
    } else if (viewLevel === 'province') {
      if (currentArea && visibleAdcodes.has(String(selectedProvinceAdcode))) {
        // 属于当前信仰区，投影聚焦到整个信仰区，保持区域环境感
        return buildFeatureCollection(validFeatures.filter((geo) => visibleAdcodes.has(String(geo.properties.adcode))));
      } else {
        // 独立省份，投影完美聚焦到该省份本身，屏幕自适应拉近
        return buildFeatureCollection(validFeatures.filter((geo) => String(geo.properties.adcode) === String(selectedProvinceAdcode)));
      }
    }
    return buildFeatureCollection(validFeatures);
  }, [viewLevel, validFeatures, visibleAdcodes, selectedProvinceAdcode, currentArea]);

  // 利用 D3-Geo 计算适应当前分辨率与纵横比的最优地图地理投影坐标转换
  const projection = useMemo(() => {
    if (!focusedGeoJson.features.length) {
      return geoIdentity().reflectY(true).translate([mapSize.width / 2, mapSize.height / 2]);
    }
    return geoIdentity().reflectY(true).fitExtent(
      [[MAP_PADDING, MAP_PADDING], [mapSize.width - MAP_PADDING, mapSize.height - MAP_PADDING]],
      focusedGeoJson,
    );
  }, [focusedGeoJson, mapSize]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  // 1. 计算全国省份的合并 bounds (外接矩形)
  const chinaBounds = useMemo(() => {
    if (!chinaGeoJson || !validFeatures.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    validFeatures.forEach(geo => {
      const bounds = pathGenerator.bounds(geo);
      if (bounds) {
        x0 = Math.min(x0, bounds[0][0]);
        y0 = Math.min(y0, bounds[0][1]);
        x1 = Math.max(x1, bounds[1][0]);
        y1 = Math.max(y1, bounds[1][1]);
      }
    });
    return { h: y1 - y0, w: x1 - x0, x: x0, y: y0 };
  }, [chinaGeoJson, validFeatures, pathGenerator]);

  // 2. 计算当前激活大区的合并 bounds
  const areaBounds = useMemo(() => {
    if (!chinaGeoJson || !currentArea || !validFeatures.length) return null;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    let found = false;
    validFeatures.forEach(geo => {
      if (visibleAdcodes.has(String(geo.properties.adcode))) {
        const bounds = pathGenerator.bounds(geo);
        if (bounds) {
          x0 = Math.min(x0, bounds[0][0]);
          y0 = Math.min(y0, bounds[0][1]);
          x1 = Math.max(x1, bounds[1][0]);
          y1 = Math.max(y1, bounds[1][1]);
          found = true;
        }
      }
    });
    return found ? { h: y1 - y0, w: x1 - x0, x: x0, y: y0 } : null;
  }, [chinaGeoJson, currentArea, validFeatures, visibleAdcodes, pathGenerator]);

  // 3. 各省份的 bounds Map
  const provinceBoundsMap = useMemo(() => {
    const m = new Map();
    if (!chinaGeoJson || !validFeatures.length) return m;
    validFeatures.forEach(geo => {
      const adcode = String(geo.properties.adcode);
      const bounds = pathGenerator.bounds(geo);
      if (bounds) {
        m.set(adcode, {
          h: bounds[1][1] - bounds[0][1],
          w: bounds[1][0] - bounds[0][0],
          x: bounds[0][0],
          y: bounds[0][1]
        });
      }
    });
    return m;
  }, [chinaGeoJson, validFeatures, pathGenerator]);

  const mapFillItems = useMemo(() => {
    if (theme.useImageFills === false || !validFeatures.length) return [];
    const selectedAdcode = String(selectedProvinceAdcode || '');
    const previewAdcode = String(hoveredProvinceAdcode || '');

    return validFeatures
      .map((geo) => {
        const adcode = String(geo.properties.adcode);
        const area = provinceAreaMap.get(adcode);
        if (!area) return null;

        const bounds = provinceBoundsMap.get(adcode);
        if (!bounds) return null;

        const isInFocusedArea = currentArea && visibleAdcodes.has(adcode);
        const isActiveProvince = viewLevel === 'province' && selectedAdcode === adcode;
        const isPreviewArea = viewLevel === 'country' && hoveredAreaId && area.id === hoveredAreaId;
        const isPreviewProvince = previewAdcode === adcode;
        let opacity = 0.84;
        let shouldShow = viewLevel === 'country';

        if (viewLevel === 'area') {
          shouldShow = Boolean(isInFocusedArea);
          opacity = isPreviewProvince || selectedAdcode === adcode ? 0.96 : 0.72;
        } else if (viewLevel === 'province') {
          shouldShow = Boolean(isInFocusedArea || isActiveProvince);
          opacity = isActiveProvince ? 0.95 : 0.22;
        } else if (hoveredAreaId) {
          opacity = isPreviewArea ? 0.96 : 0.5;
        }

        if (!shouldShow) return null;

        return {
          adcode,
          bounds,
          isActiveProvince,
          isPreviewArea,
          isPreviewProvince,
          opacity,
          src: getProvinceFillAsset(area, adcode),
        };
      })
      .filter(Boolean)
      .sort((left, right) => (
        Number(left.isActiveProvince || left.isPreviewProvince || left.isPreviewArea)
        - Number(right.isActiveProvince || right.isPreviewProvince || right.isPreviewArea)
      ));
  }, [currentArea, hoveredAreaId, hoveredProvinceAdcode, provinceAreaMap, provinceBoundsMap, selectedProvinceAdcode, theme, validFeatures, viewLevel, visibleAdcodes]);

  const foodFocusBounds = useMemo(() => {
    if (viewLevel === 'province' && selectedProvinceAdcode) {
      return provinceBoundsMap.get(String(selectedProvinceAdcode)) || areaBounds || chinaBounds;
    }
    if (!activeFoodArea || !validFeatures.length) return areaBounds || chinaBounds;
    const activeAdcodes = new Set((activeFoodArea.provinceAdcodes || []).map(String));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    let found = false;
    validFeatures.forEach((geo) => {
      if (!activeAdcodes.has(String(geo.properties.adcode))) return;
      const bounds = pathGenerator.bounds(geo);
      if (!bounds) return;
      x0 = Math.min(x0, bounds[0][0]);
      y0 = Math.min(y0, bounds[0][1]);
      x1 = Math.max(x1, bounds[1][0]);
      y1 = Math.max(y1, bounds[1][1]);
      found = true;
    });
    return found ? { h: y1 - y0, w: x1 - x0, x: x0, y: y0 } : areaBounds || chinaBounds;
  }, [activeFoodArea, areaBounds, chinaBounds, pathGenerator, provinceBoundsMap, selectedProvinceAdcode, validFeatures, viewLevel]);

  const foodLayoutItems = useMemo(
    () => buildFoodItemLayout(activeFoodItems, mapSize, foodFocusBounds, viewLevel, activeFoodArea?.id || 'country'),
    [activeFoodArea?.id, activeFoodItems, foodFocusBounds, mapSize, viewLevel],
  );

  const foodLayerKey = `${activeFoodArea?.id || 'country'}-${viewLevel}-${Math.round(mapSize.width)}-${Math.round(mapSize.height)}`;
  const mapStageMotionKey = [
    theme.id,
    viewLevel,
    hoveredAreaId || 'none',
    hoveredProvinceAdcode || 'none',
    selectedProvinceAdcode || 'none',
    Math.round(mapSize.width),
    Math.round(mapSize.height),
    mapFillItems.map((item) => `${item.adcode}:${item.opacity}`).join('|'),
  ].join('-');
  const foodSelectionKey = `${foodLayerKey}-${selectedFoodItem?.areaId || 'none'}-${selectedFoodItem?.id || 'none'}`;

  useAnimeMapStage(mapStageRef, mapStageMotionKey, mapLoading);
  useAnimeFoodLayer(mapStageRef, foodLayerKey, foodLayoutItems.length, setIsFoodLayerReady);
  useAnimeFoodSelection(mapStageRef, foodSelectionKey, isFoodLayerReady);

  return (
    <div className="map-stage" onPointerLeave={handleStagePointerLeave} ref={mapStageRef}>
      <ComposableMap
        height={mapSize.height}
        projection={projection}
        width={mapSize.width}
      >
        <defs>
          {/* 全国裁切路径 */}
          {validFeatures.length > 0 && (
            <clipPath id="clip-china">
              {validFeatures.map((geo) => (
                <path d={pathGenerator(geo)} key={`clip-path-china-${geo.properties.adcode}`} />
              ))}
            </clipPath>
          )}

          {/* 大区裁切路径：全国视图也需要逐区裁切文化纹理 */}
          {theme.areas.map((area) => {
            const areaAdcodes = new Set((area.provinceAdcodes || []).map(String));
            return (
              <clipPath id={`clip-area-${area.id}`} key={`clip-area-${area.id}`}>
                {validFeatures.filter(geo => areaAdcodes.has(String(geo.properties.adcode))).map((geo) => (
                  <path d={pathGenerator(geo)} key={`clip-path-area-${area.id}-${geo.properties.adcode}`} />
                ))}
            </clipPath>
            );
          })}

          {/* 省份单独裁切路径 */}
          {validFeatures.map((geo) => {
            const adcode = String(geo.properties.adcode);
            return (
              <clipPath id={`clip-province-${adcode}`} key={`clip-path-province-${adcode}`}>
                <path d={pathGenerator(geo)} />
              </clipPath>
            );
          })}
        </defs>

        {mapLoading ? (
          <text className="map-loading" x={mapSize.width / 2} y={mapSize.height / 2}>
            {themeCopy.loadingLabel}
          </text>
        ) : (
          <>
            {/* 1. 底层负责地图底板底色及所有的 hover、点击交互和基本描边 (唯一标准的 Geographies 容器，绝不报错) */}
            <Geographies geography={chinaGeoJson}>
              {({ geographies }) => {
                if (!geographies) return null;
                return geographies
                  .filter((geo) => geo.properties?.name && geo.properties?.adcode)
                  .map((geo) => {
                    const adcode = String(geo.properties.adcode);
                    const area = provinceAreaMap.get(adcode);
                    const isInFocusedArea = currentArea && visibleAdcodes.has(adcode);
                    const isHidden = (viewLevel === 'area' || viewLevel === 'province') && !isInFocusedArea;
                    const isActiveProvince = viewLevel === 'province' && String(selectedProvinceAdcode) === adcode;
                    const isPreviewArea = viewLevel === 'country' && area?.id === hoveredAreaId;
                    const isPreviewProvince = String(hoveredProvinceAdcode || '') === adcode;
                    
                    let defaultFill = 'var(--map-empty-fill)';
                    let defaultFillOpacity = 1;
                    let defaultStroke = area?.color || 'var(--map-empty-stroke)';
                    let defaultStrokeWidth = 0.75;
                    let defaultStrokeOpacity = 0.85;

                    if (viewLevel === 'country' && area) {
                      defaultFill = area.color;
                      defaultFillOpacity = 0.74;
                      defaultStroke = '#ffffff';
                      defaultStrokeOpacity = 0.72;
                      defaultStrokeWidth = 1.1;
                      if (isPreviewArea) {
                        defaultFillOpacity = 0.94;
                        defaultStroke = '#d4af37';
                        defaultStrokeOpacity = 1;
                        defaultStrokeWidth = 2.35;
                      }
                    } else if (viewLevel === 'area') {
                      if (isInFocusedArea) {
                        defaultStroke = currentArea.color;
                        defaultStrokeWidth = 1.5;
                        defaultFillOpacity = isPreviewProvince || String(selectedProvinceAdcode || '') === adcode ? 0.9 : 0.58;
                        if (isPreviewProvince || String(selectedProvinceAdcode || '') === adcode) {
                          defaultStroke = '#d4af37';
                          defaultStrokeOpacity = 1;
                          defaultStrokeWidth = 2.7;
                        }
                      } else {
                        defaultFillOpacity = 0.08;
                        defaultStrokeOpacity = 0.1;
                      }
                    } else if (viewLevel === 'province') {
                      if (isActiveProvince) {
                        defaultStroke = '#d4af37';
                        defaultStrokeWidth = 3.0;
                      } else if (isInFocusedArea) {
                        defaultStroke = currentArea.color;
                        defaultStrokeWidth = 1.0;
                        defaultStrokeOpacity = 0.4;
                        defaultFillOpacity = 0.18;
                      } else {
                        defaultFillOpacity = 0.08;
                        defaultStrokeOpacity = 0.1;
                      }
                    }

                    return (
                      <Geography
                        aria-label={area ? `${geo.properties.name}，属于${area.name}` : geo.properties.name}
                        className={`province ${isHidden ? 'is-hidden' : ''} ${viewLevel !== 'country' && isInFocusedArea ? 'is-focused' : ''} ${isPreviewArea || isPreviewProvince ? 'is-hover-preview' : ''} ${isActiveProvince ? 'is-active-province' : ''}`}
                        geography={geo}
                        key={`geo-interact-${geo.rsmKey}`}
                        onBlur={() => onHoverProvince(null)}
                        onClick={(event) => activateProvince(event, { adcode, area, isHidden, isInFocusedArea })}
                        onFocus={() => {
                          if (viewLevel === 'country' && area) onHoverArea(area.id);
                          onHoverProvince(adcode, area?.id);
                        }}
                        onKeyDown={(event) => handleProvinceKeyDown(event, { adcode, area, isHidden, isInFocusedArea })}
                        onMouseEnter={(event) => handleProvincePointer(event, { adcode, area, isHidden })}
                        onMouseLeave={() => onHoverProvince(null)}
                        onMouseMove={(event) => handleProvincePointer(event, { adcode, area, isHidden })}
                        role="button"
                        style={{
                          default: {
                            fill: defaultFill,
                            fillOpacity: defaultFillOpacity,
                            outline: 'none',
                            stroke: defaultStroke,
                            strokeOpacity: defaultStrokeOpacity,
                            strokeWidth: defaultStrokeWidth,
                          },
                          hover: {
                            fill: 'rgba(212, 175, 55, 0.05)',
                            fillOpacity: isHidden ? 0.08 : 0.95,
                            outline: 'none',
                            stroke: '#d4af37',
                            strokeOpacity: 1,
                            strokeWidth: 2.5,
                          },
                          pressed: {
                            fill: defaultFill,
                            outline: 'none',
                          },
                        }}
                        tabIndex={isHidden ? -1 : 0}
                      />
                    );
                  });
              }}
            </Geographies>

            {/* 2. AI 生成图填充层：使用 SVG clipPath 保持地图轮廓精确 */}
            {mapFillItems.map((item) => (
              <image
                className={`map-fill-image map-fill-province ${item.isActiveProvince ? 'is-active-fill' : ''}`}
                data-anime-opacity={String(item.opacity)}
                href={getVersionedAsset(item.src)}
                key={`province-map-fill-${viewLevel}-${item.adcode}`}
                x={item.bounds.x}
                y={item.bounds.y}
                width={item.bounds.w}
                height={item.bounds.h}
                clipPath={`url(#clip-province-${item.adcode})`}
                preserveAspectRatio="xMidYMid slice"
                style={{ '--map-fill-opacity': item.opacity, pointerEvents: 'none' }}
              />
            ))}

            <g className={`map-boundary-layer boundaries-${viewLevel}`} pointerEvents="none">
              {validFeatures.map((geo) => {
                const adcode = String(geo.properties.adcode);
                const isInFocusedArea = currentArea && visibleAdcodes.has(adcode);
                const isActiveProvince = viewLevel === 'province' && String(selectedProvinceAdcode) === adcode;
                const shouldShow = viewLevel === 'country' || isInFocusedArea || isActiveProvince;
                if (!shouldShow) return null;
                return (
                  <path
                    d={pathGenerator(geo)}
                    key={`map-boundary-${adcode}`}
                    style={{ '--boundary-color': provinceAreaMap.get(adcode)?.color || currentArea?.color || '#d4af37' }}
                  />
                );
              })}
            </g>

          </>
        )}
      </ComposableMap>

      {viewLevel !== 'country' && activeFoodArea && foodLayoutItems.length > 0 && (
        <div className={`food-orbit-layer ${isFoodLayerReady ? 'is-ready' : ''}`} aria-label={`${activeFoodArea.name}文化线索`}>
          {foodLayoutItems.map((item) => {
            const isSelected = selectedFoodItem?.id === item.id && selectedFoodItem?.areaId === activeFoodArea.id;
            return (
              <button
                aria-label={`查看${item.name}文化线索`}
                aria-pressed={isSelected}
                className={`food-float-item ${isSelected ? 'is-selected' : ''}`}
                key={`${foodLayerKey}-${item.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  recordFoodOrigin(event);
                  onFoodItemSelect(item, activeFoodArea.id);
                }}
                style={{
                  '--food-accent': item.accent || activeFoodArea.color,
                  '--food-delay': `${item.delay}ms`,
                  '--food-rotate': `${item.rotate}deg`,
                  '--food-size': `${item.size}px`,
                  '--from-x': `${foodBurstOrigin.x}px`,
                  '--from-y': `${foodBurstOrigin.y}px`,
                  '--to-x': `${item.x}px`,
                  '--to-y': `${item.y}px`,
                }}
                title={item.name}
                type="button"
              >
              <span className="food-float-content">
                  {item.image ? (
                    <img
                      alt=""
                      aria-hidden="true"
                      src={getVersionedAsset(item.image)}
                      style={{ objectPosition: item.objectPosition || '50% 50%' }}
                    />
                  ) : (
                    <span className="culture-symbol" aria-hidden="true">{item.symbol || item.name.slice(0, 1)}</span>
                  )}
                  <span className="food-float-label">{item.name}</span>
                </span>
                <span className="food-float-ghost" aria-hidden="true">
                  {item.image ? (
                    <img
                      alt=""
                      src={getVersionedAsset(item.image)}
                      style={{ objectPosition: item.objectPosition || '50% 50%' }}
                    />
                  ) : (
                    <span className="culture-symbol">{item.symbol || item.name.slice(0, 1)}</span>
                  )}
                  <span className="food-float-label">{item.name}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 底部悬浮的传统文化区图例 */}
      <div className="map-legend">
        {theme.areas.map((area) => (
          <button
            className={area.id === currentArea.id ? 'is-active' : ''}
            key={area.id}
            onClick={() => onSelectArea(area.id)}
            style={area.id === currentArea.id ? { color: area.color, borderColor: area.color } : {}}
            type="button"
          >
            <i style={{ background: area.color, color: area.color }} />
            <span>{area.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 独创：运行模式下的趣味问答通关小游戏及人文摘要组件
 */
function RunSummary({ assetVersions, cachedImageUrls, currentArea, selectedFoodItem, selectedProvinceAdcode, viewLevel, onBackCountry, onBackArea, onSelectArea, theme }) {
  // 分数统计及答题闯关状态
  const [score, setScore] = useState(0);
  const [answeredMap, setAnsweredMap] = useState({}); // 保存每个省份/大区的答题记录
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const panelRef = useRef(null);
  const themeCopy = getThemeCopy(theme);

  // 寻找当前选中的省级文化资产
  const activeAsset = useMemo(() => {
    if (!currentArea || !currentArea.assets) return null;
    return currentArea.assets.find(a => String(a.provinceAdcode) === String(selectedProvinceAdcode));
  }, [currentArea, selectedProvinceAdcode]);

  // 根据当前是在大区视图还是省份视图，动态加载对应的 quiz
  const quiz = useMemo(() => {
    if (viewLevel === 'province' && activeAsset?.quiz) {
      return activeAsset.quiz;
    }
    if (viewLevel === 'area' && currentArea?.quiz) {
      return currentArea.quiz;
    }
    return null;
  }, [viewLevel, activeAsset, currentArea]);

  // 生成唯一的答题 key（让每一个省份都拥有独立的答题机制，且答对得分可累计！）
  const quizKey = useMemo(() => {
    if (viewLevel === 'province' && selectedProvinceAdcode) {
      return `${currentArea?.id || 'independent'}-${selectedProvinceAdcode}`;
    }
    if (viewLevel === 'area' && currentArea) {
      return currentArea.id;
    }
    return 'country';
  }, [viewLevel, currentArea, selectedProvinceAdcode]);

  // 切换省份或大区时，重置当前这道题的选择状态
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
  }, [quizKey]);

  const isCurrentCorrect = answeredMap[quizKey] === 'correct';
  const detailPreviewAsset = useMemo(() => {
    if (viewLevel === 'province' && activeAsset?.src) {
      return {
        alt: `${activeAsset.title.replace('图', '')}省级大图`,
        src: activeAsset.src,
        title: activeAsset.title,
      };
    }
    if (viewLevel === 'area' && currentArea?.summaryAsset?.src) {
      return {
        alt: `${currentArea.name}图板预览`,
        src: currentArea.summaryAsset.src,
        title: currentArea.summaryAsset.title,
      };
    }
    return null;
  }, [activeAsset, currentArea, viewLevel]);
  const panelMotionKey = [
    theme.id,
    currentArea?.id || 'country',
    viewLevel,
    selectedProvinceAdcode || 'none',
    selectedFoodItem?.id || 'none',
    quizKey,
    selectedOption ?? 'none',
    isCurrentCorrect ? 'correct' : 'pending',
  ].join('-');

  useAnimePanelMotion(panelRef, panelMotionKey);

  function versionedImage(src) {
    return getCachedImageUrl(src, assetVersions, cachedImageUrls);
  }

  function handleOptionClick(index) {
    if (isAnswered || isCurrentCorrect || !quiz) return;

    setSelectedOption(index);
    setIsAnswered(true);

    if (index === quiz.answerIndex) {
      setScore((prev) => prev + 20);
      setAnsweredMap((prev) => ({ ...prev, [quizKey]: 'correct' }));
    } else {
      setAnsweredMap((prev) => ({ ...prev, [quizKey]: 'wrong' }));
    }
  }

  function handleRetry() {
    setSelectedOption(null);
    setIsAnswered(false);
    setAnsweredMap((prev) => ({ ...prev, [quizKey]: null }));
  }

  return (
    <aside className="side-card run-card" ref={panelRef}>
      <div className="card-kicker">
        <Landmark size={16} aria-hidden="true" />
        <span>
          {viewLevel === 'province'
            ? themeCopy.provinceLabel
            : viewLevel === 'area'
            ? themeCopy.areaDetailLabel
            : themeCopy.countryKicker}
        </span>
      </div>
      
      <h2 style={{ borderLeftColor: (viewLevel !== 'country' && currentArea) ? currentArea.color : '#d4af37' }}>
        {viewLevel === 'province' && activeAsset
          ? `${currentArea ? currentArea.name : '独立省份'} · ${activeAsset.title.replace('图', '')}`
          : (viewLevel === 'area' && currentArea)
          ? currentArea.name
          : theme.name}
      </h2>
      <p>
        {viewLevel === 'province' && activeAsset
          ? (activeAsset.quiz?.question ? `这里展示${activeAsset.title.replace('图', '')}，用于理解该省份在当前文化区中的文化线索与代表性场景。` : themeCopy.provinceDescription)
          : (viewLevel === 'area' && currentArea)
          ? currentArea.description
          : theme.description}
      </p>

      {detailPreviewAsset?.src && (
        <figure className={`region-board-preview ${viewLevel === 'province' ? 'province-board-preview' : ''}`}>
          <img
            alt={detailPreviewAsset.alt}
            src={versionedImage(detailPreviewAsset.src)}
          />
          <figcaption>{detailPreviewAsset.title}</figcaption>
        </figure>
      )}
      
      <div className="metric-row">
        {viewLevel === 'country' ? (
          <>
            <span style={{ color: '#d4af37', borderColor: '#d4af3740', background: '#d4af3710' }}>
              {theme.areas.length} 个{themeCopy.areaCountLabel}
            </span>
            <span>
              {theme.areas.reduce((acc, a) => acc + (a.assets?.length || 0), 0)} 条省级线索
            </span>
          </>
        ) : (
          <>
            <span style={{ color: currentArea?.color, borderColor: `${currentArea?.color}40`, background: `${currentArea?.color}10` }}>
              {currentArea?.provinceAdcodes.length} 个省级行政区
            </span>
            <span>{currentArea?.assets?.length || 0} 条省级线索</span>
          </>
        )}
      </div>

      {viewLevel === 'country' && (
        <div className="area-overview-list">
          {theme.areas.map((area) => (
            <button
              key={area.id}
              onClick={() => onSelectArea(area.id)}
              style={{ '--area-color': area.color }}
              type="button"
            >
              <i />
              <span>{area.name}</span>
            </button>
          ))}
        </div>
      )}

      {viewLevel !== 'country' && selectedFoodItem && (
        <section
          className="food-process-card"
          key={`${selectedFoodItem.areaId}-${selectedFoodItem.id}`}
          style={{ '--food-accent': selectedFoodItem.accent || currentArea?.color || '#d4af37' }}
        >
          <div className="food-process-head">
            {selectedFoodItem.image ? (
              <img
                alt={`${selectedFoodItem.name}信息图缩略图`}
                src={versionedImage(selectedFoodItem.image)}
                style={{ objectPosition: selectedFoodItem.objectPosition || '50% 50%' }}
              />
            ) : (
              <div className="culture-symbol process-symbol" aria-hidden="true">
                {selectedFoodItem.symbol || selectedFoodItem.name.slice(0, 1)}
              </div>
            )}
            <div>
              <span>{selectedFoodItem.areaName || currentArea?.name}</span>
              <strong>{selectedFoodItem.name}</strong>
            </div>
          </div>
          {(selectedFoodItem.detailImage || selectedFoodItem.image) && (
            <figure className="process-infographic">
              <img
                alt={`${selectedFoodItem.name}信息图讲解`}
                src={versionedImage(selectedFoodItem.detailImage || selectedFoodItem.image)}
                style={{ objectPosition: selectedFoodItem.objectPosition || '50% 50%' }}
              />
            </figure>
          )}
          <div className="process-sketch-grid">
            {selectedFoodItem.process.map((step, index) => (
              <article className="process-sketch-step" key={`${selectedFoodItem.id}-step-${index}`}>
                <div className="sketch-icon" aria-hidden="true">
                  <i />
                  <span className="steam-line steam-line-left" />
                  <span className="steam-line steam-line-right" />
                  <b>{index + 1}</b>
                </div>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 趣味知识问答板块 */}
      {viewLevel !== 'country' && quiz && (
        <div className="game-container">
          <div className="game-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={15} style={{ color: '#d4af37' }} />
              <span>
                {viewLevel === 'province' && activeAsset ? `${activeAsset.title.substring(0, 3)}·线索问答` : themeCopy.quizLabel}
              </span>
            </div>
            <div className="score-badge">
              <Trophy size={12} />
              <span>得分: {score}</span>
            </div>
          </div>

          <div className="quiz-box">
            {isCurrentCorrect ? (
              <div className="game-reward">
                <Award size={36} style={{ color: '#d4af37', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontWeight: 'bold', color: '#fff' }}>恭喜通关！答题正确 🎯</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  {quiz.successReward}
                </p>
              </div>
            ) : (
              <div>
                <p className="quiz-question">{quiz.question}</p>
                <div className="quiz-options">
                  {quiz.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrectOption = idx === quiz.answerIndex;
                    let btnClass = '';
                    
                    if (isAnswered) {
                      if (isCorrectOption) {
                        btnClass = 'is-correct';
                      } else if (isSelected) {
                        btnClass = 'is-wrong';
                      }
                    }

                    return (
                      <button
                        className={`quiz-option-btn ${btnClass}`}
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        type="button"
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && !isCurrentCorrect && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <button className="secondary-action btn-reset" onClick={handleRetry} type="button">
                      重新挑战 🔄
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="run-card-actions" style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexDirection: 'column' }}>
        {viewLevel === 'province' && (
          <>
            {currentArea && (
              <button className="secondary-action" onClick={onBackArea} type="button" style={{ width: '100%' }}>
                <ArrowLeft size={16} aria-hidden="true" />
                返回大区详情
              </button>
            )}
            <button className="secondary-action" onClick={onBackCountry} type="button" style={{ width: '100%' }}>
              <ArrowLeft size={16} aria-hidden="true" />
              返回全国版图
            </button>
          </>
        )}
        {viewLevel === 'area' && (
          <button className="secondary-action" onClick={onBackCountry} type="button" style={{ width: '100%' }}>
            <ArrowLeft size={16} aria-hidden="true" />
            返回全国版图
          </button>
        )}
      </div>
    </aside>
  );
}

/**
 * AI 灵感生成舱：开发模式下步骤式引导评委和开发者接入 MCP 协议与 AI 交互控制台
 */
function McpPanel({ assetVersions, cachedImageUrls, currentArea, flowStep, onAssetRegenerated, onFlowStep, onSelectArea, onToolResult, theme }) {
  const [prompt, setPrompt] = useState('');
  const [assetPrompt, setAssetPrompt] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const panelRef = useRef(null);
  const attachImageAsset = useFoodMapStore((state) => state.attachImageAsset);
  const updateAreaConfig = useFoodMapStore((state) => state.updateAreaConfig);
  const themeCopy = getThemeCopy(theme);

  // 借助 React Query 查询当前暴露的 MCP 工具列表
  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryFn: getMcpTools,
    queryKey: ['mcp-tools'],
    retry: 1,
  });

  const { data: imageAssetData, isLoading: assetsLoading, refetch: refetchImageAssets } = useQuery({
    queryFn: getImageAssets,
    queryKey: ['image-assets'],
    retry: 1,
  });

  // 调用 MCP 工具的 Mutation 过程
  const mcpMutation = useMutation({
    mutationFn: runMcpTool,
    onError: (error) => onToolResult(error.message),
  });

  const savePromptMutation = useMutation({
    mutationFn: saveImageAssetPrompt,
    onError: (error) => onToolResult(error.message),
    onSuccess: () => {
      refetchImageAssets();
      onToolResult('图片资产 Prompt 已保存');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: regenerateImageAsset,
    onError: (error) => onToolResult(error.message),
    onSuccess: (result) => {
      refetchImageAssets();
      onAssetRegenerated(result.asset, result.cacheBust);
      onToolResult(`重新生成完成：${result.asset.title}`);
    },
  });

  const form = useForm({
    defaultValues: {
      areaId: currentArea.id,
      height: FOOD_IMAGE_ASSET.size.height,
      lat: FOOD_IMAGE_ASSET.coordinates[1],
      lng: FOOD_IMAGE_ASSET.coordinates[0],
      style: '精美中国风，传统古典配色，国风科技插画，写实细腻',
      width: FOOD_IMAGE_ASSET.size.width,
    },
    resolver: zodResolver(mcpFormSchema),
  });

  // 监听当前所选文化区，智能重置表单为该文化区的数据坐标
  useEffect(() => {
    form.reset({
      areaId: currentArea.id,
      height: currentArea.assets[0]?.size.height || FOOD_IMAGE_ASSET.size.height,
      lat: currentArea.assets[0]?.coordinates[1] || currentArea.center[1],
      lng: currentArea.assets[0]?.coordinates[0] || currentArea.center[0],
      style: '精美中国风，传统古典配色，国风科技插画，写实细腻',
      width: currentArea.assets[0]?.size.width || FOOD_IMAGE_ASSET.size.width,
    });
  }, [currentArea, form]);

  // 调用 MCP：生成 AI 绘图提示词
  async function generatePrompt(values) {
    const result = await mcpMutation.mutateAsync({
      params: {
        areaId: values.areaId,
        areaName: getAreaById(theme, values.areaId).name,
        description: getAreaById(theme, values.areaId).description,
        style: values.style,
      },
      tool: 'food.generatePrompt',
    });
    setPrompt(result.prompt);
    onFlowStep('prompt');
    onToolResult('AI 灵感舱成功编译：文化图板 Prompt 已就绪');
  }

  // 调用 MCP：将图片素材一键附着绑定到指定的经纬度上
  async function attachImage(values) {
    const area = getAreaById(theme, values.areaId);
    const result = await mcpMutation.mutateAsync({
      params: {
        areaId: values.areaId,
        coordinates: [values.lng, values.lat],
        size: { height: values.height, width: values.width },
        src: FOOD_IMAGE_ASSET.src,
        title: `${area.name} AI 灵感图`,
      },
      tool: 'food.attachImageAsset',
    });
    attachImageAsset(values.areaId, result.asset);
    updateAreaConfig(values.areaId, { center: [values.lng, values.lat] });
    onSelectArea(values.areaId);
    onFlowStep('asset');
    onToolResult('AI 绑定成功：图片资产已挂载至指定地理经纬度');
  }

  // 调用 MCP：一键将当前的配置持久化写入到 Node.js 后端的本地 JSON
  async function saveConfig() {
    await mcpMutation.mutateAsync({
      params: { theme },
      tool: 'food.saveConfig',
    });
    onFlowStep('save');
    onToolResult('配置持久化成功：地图配置文件已安全存档至本地');
  }

  // 调用 MCP：一键导出 JSON 配置并拷贝至系统剪贴板
  async function exportConfig() {
    const result = await mcpMutation.mutateAsync({
      params: { themeId: theme.id },
      tool: 'food.exportConfig',
    });
    await navigator.clipboard?.writeText(result.configText);
    onToolResult('导出成功：地图 JSON 配置数据已安全拷贝至剪贴板');
  }

  const watchedAreaId = form.watch('areaId');
  const imageAssets = imageAssetData?.assets || [];
  const selectedImageAsset = imageAssets.find((asset) => asset.id === selectedAssetId) || imageAssets[0];
  const assetBusy = savePromptMutation.isPending || regenerateMutation.isPending;
  const spinnerMotionKey = [
    mcpMutation.isPending ? 'mcp' : 'idle',
    regenerateMutation.isPending ? 'regen' : 'idle',
    toolsLoading ? 'tools' : 'tools-ready',
    assetsLoading ? 'assets' : 'assets-ready',
  ].join('-');

  useAnimeSpinners(panelRef, spinnerMotionKey);

  function versionedAsset(src) {
    return getCachedImageUrl(src, assetVersions, cachedImageUrls);
  }

  function getAssetKindLabel(asset) {
    if (asset.kind === 'item') return '线索图';
    if (asset.kind === 'map') {
      if (asset.level === 'country') return '全国图层';
      if (asset.level === 'area') return '大区图层';
      if (asset.level === 'province') return '省级图层';
      return '地图图层';
    }
    if (asset.kind === 'country') return '全国';
    if (asset.kind === 'area') return '大区';
    if (asset.kind === 'province') return '省份';
    return '图片';
  }

  useEffect(() => {
    if (!imageAssets.length) return;
    const currentAreaAsset = imageAssets.find((asset) => asset.areaId === currentArea.id && asset.kind === 'map' && asset.level === 'area');
    const nextAsset = currentAreaAsset || imageAssets[0];
    if (!selectedAssetId) {
      setSelectedAssetId(nextAsset.id);
    }
  }, [currentArea.id, imageAssets, selectedAssetId]);

  useEffect(() => {
    if (selectedImageAsset) {
      setAssetPrompt(selectedImageAsset.prompt || '');
    }
  }, [selectedImageAsset]);

  return (
    <aside className="side-card mcp-panel" ref={panelRef}>
      <div className="card-kicker">
        <Bot size={16} aria-hidden="true" />
        <span>AI 灵感生成舱控制台</span>
      </div>

      {/* 科技感引导步骤条 */}
      <div className="stepper" aria-label="生成舱步骤">
        {FLOW_STEPS.map((step) => (
          <button
            className={flowStep === step.id ? 'is-active' : ''}
            key={step.id}
            onClick={() => onFlowStep(step.id)}
            type="button"
          >
            {step.label}
          </button>
        ))}
      </div>

      <form className="mcp-form" onSubmit={form.handleSubmit(generatePrompt)}>
        <label>
          <span>1. {themeCopy.targetAreaLabel}</span>
          <select
            {...form.register('areaId')}
            onChange={(event) => {
              form.setValue('areaId', event.target.value);
              onSelectArea(event.target.value);
            }}
            value={watchedAreaId}
          >
            {theme.areas.map((area) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
        </label>
        <label className="wide">
          <span>2. 绘图意境与艺术风格</span>
          <select
            {...form.register('style')}
            onChange={(e) => form.setValue('style', e.target.value)}
          >
            <option value="精美中国风，传统古典配色，国风科技插画，写实细腻">科技国风 ✦</option>
            <option value="水墨丹青，意境深远，虚实相生，中国传统水墨画">水墨丹青 ❀</option>
            <option value="青花瓷质感，蓝白相间，古典瓷器釉色，清雅秀丽">青花瓷釉 ❈</option>
            <option value="经典像素艺术，复古红白机游戏风格，8-bit，精致像素颗粒">复古像素 🕹️</option>
          </select>
        </label>
        <div className="coordinate-grid">
          <label>
            <span>落点经度</span>
            <input step="0.1" type="number" {...form.register('lng')} />
          </label>
          <label>
            <span>落点纬度</span>
            <input step="0.1" type="number" {...form.register('lat')} />
          </label>
          <label>
            <span>卡片宽度 (px)</span>
            <input type="number" {...form.register('width')} />
          </label>
          <label>
            <span>卡片高度 (px)</span>
            <input type="number" {...form.register('height')} />
          </label>
        </div>

        {/* 核心操作按钮 */}
        <div className="mcp-actions">
          <button disabled={mcpMutation.isPending} type="submit">
            <Sparkles size={14} aria-hidden="true" />
            生成 Prompt
          </button>
          <button className="btn-bind" disabled={mcpMutation.isPending} onClick={form.handleSubmit(attachImage)} type="button">
            <ImageIcon size={14} aria-hidden="true" />
            绑定图片
          </button>
          <button className="btn-save" disabled={mcpMutation.isPending} onClick={saveConfig} type="button">
            <Save size={14} aria-hidden="true" />
            保存配置
          </button>
        </div>
      </form>

      {/* 桥接状态监控 */}
      <div className="mcp-status">
        <span>{toolsLoading ? '探测后台 API 隧道...' : `发现 ${tools?.tools?.length || 0} 个活动 AI MCP 通道`}</span>
        {mcpMutation.isPending && <Loader2 className="anime-spin" size={14} aria-hidden="true" />}
      </div>

      {/* 生成的 Prompt 或已有图片资产路径展示 */}
      <div className="prompt-box">
        <strong>{prompt ? '编译生成的 AI 图板提示词' : '当前地图图片资产'}</strong>
        <p>{prompt || FOOD_IMAGE_ASSET.src}</p>
      </div>

      <button className="secondary-action btn-export" onClick={exportConfig} type="button">
        <PanelRightOpen size={14} aria-hidden="true" />
        导出配置数据并复制
      </button>

      <section className="asset-regenerator">
        <div className="card-kicker">
          <ImageIcon size={15} aria-hidden="true" />
          <span>轮廓生图资产库</span>
        </div>

        <label>
          <span>选择要重新生成的图片</span>
          <select
            disabled={assetsLoading || assetBusy}
            onChange={(event) => setSelectedAssetId(event.target.value)}
            value={selectedImageAsset?.id || ''}
          >
            {imageAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {getAssetKindLabel(asset)} · {asset.title}
              </option>
            ))}
          </select>
        </label>

        {selectedImageAsset && (
          <>
            <div className="asset-preview-grid">
              {selectedImageAsset.inputImage ? (
                <figure>
                  <img alt={`${selectedImageAsset.title} 输入轮廓`} src={versionedAsset(selectedImageAsset.inputImage)} />
                  <figcaption>输入轮廓</figcaption>
                </figure>
              ) : (
                <figure>
                  <img alt={`${selectedImageAsset.title} AI 源图`} src={versionedAsset(selectedImageAsset.sourceImage || selectedImageAsset.outputImage)} />
                  <figcaption>AI 源图</figcaption>
                </figure>
              )}
              <figure>
                <img alt={`${selectedImageAsset.title} 当前输出`} src={versionedAsset(selectedImageAsset.outputImage)} />
                <figcaption>当前输出</figcaption>
              </figure>
            </div>

            <label>
              <span>图片生成 Prompt</span>
              <textarea
                disabled={assetBusy}
                onChange={(event) => setAssetPrompt(event.target.value)}
                rows={8}
                value={assetPrompt}
              />
            </label>

            <div className="asset-meta">
              <span>{selectedImageAsset.model}</span>
              <span>{selectedImageAsset.size}</span>
              <span>{selectedImageAsset.quality}</span>
            </div>

            <div className="asset-actions">
              <button
                disabled={assetBusy || !assetPrompt.trim()}
                onClick={() => savePromptMutation.mutate({ assetId: selectedImageAsset.id, prompt: assetPrompt })}
                type="button"
              >
                <Save size={14} aria-hidden="true" />
                保存词
              </button>
              <button
                className="btn-regenerate"
                disabled={assetBusy || !assetPrompt.trim()}
                onClick={() => regenerateMutation.mutate({ assetId: selectedImageAsset.id, prompt: assetPrompt })}
                type="button"
              >
                {regenerateMutation.isPending ? <Loader2 className="anime-spin" size={14} aria-hidden="true" /> : <RefreshCw size={14} aria-hidden="true" />}
                重新生成
              </button>
            </div>
          </>
        )}
      </section>
    </aside>
  );
}

/**
 * 宗教信仰文化交互地图大盘——React 核心主入口组件
 */
function App() {
  const appShellRef = useRef(null);
  const [notice, setNotice] = useState(getThemeCopy(getCultureThemeById(DEFAULT_CULTURE_THEME_ID)).readyNotice);
  const [assetVersions, setAssetVersions] = useState({});
  const siteTheme = 'dark-ink';
  const [hoveredAreaId, setHoveredAreaId] = useState('north-ancestor-ritual');
  const [hoveredProvinceAdcode, setHoveredProvinceAdcode] = useState(null);
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [selectedProvinceAdcode, setSelectedProvinceAdcode] = useState(null); // 省级行政区下钻状态
  const [viewLevel, setViewLevel] = useState('country'); // 三级下钻层级：'country', 'area', 'province'
  const cultureThemeId = useFoodMapStore((state) => state.cultureThemeId);
  const theme = useFoodMapStore((state) => state.theme);
  const resetTheme = useFoodMapStore((state) => state.resetTheme);
  const switchCultureTheme = useFoodMapStore((state) => state.switchCultureTheme);
  const [snapshot, send] = useMachine(mapMachine);
  const { appMode, flowStep, selectedAreaId } = snapshot.context;
  const currentArea = getAreaById(theme, selectedAreaId);
  const provinceAreaMap = useMemo(() => buildProvinceAreaMap(theme), [theme]);
  const themeCopy = getThemeCopy(theme);
  const appMotionKey = [
    cultureThemeId,
    appMode,
    flowStep,
    viewLevel,
    selectedAreaId,
    selectedProvinceAdcode || 'none',
  ].join('-');

  const cachedImageUrls = useLocalImageCache(theme, assetVersions);
  useAnimeHoverInteractions(appShellRef);
  useAnimeThemeSwap(appShellRef, appMotionKey);
  useAnimeSpinners(appShellRef, appMotionKey);

  // 实现多主题平滑挂载及一屏式沉浸感设计，强制不溢出滚动
  useEffect(() => {
    document.documentElement.className = `theme-${siteTheme}`;
    document.body.className = `theme-${siteTheme}`;
  }, [siteTheme]);

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // 选择大区时，默认将当前选中省份初始化为该大区关联的第一个省份
  function selectArea(areaId) {
    send({ areaId, type: 'SELECT_AREA' });
    const area = getAreaById(theme, areaId);
    if (area) {
      setHoveredAreaId(area.id);
      setViewLevel('area');
      setSelectedProvinceAdcode(null);
      setSelectedFoodItem(null);
      setNotice(`成功聚焦至：${area.name}`);
    }
  }

  function handleHoverArea(areaId) {
    if (!areaId || viewLevel !== 'country') return;
    if (areaId === hoveredAreaId) return;
    setHoveredAreaId(areaId);
    const area = getAreaById(theme, areaId);
    if (area?.id) {
      send({ areaId: area.id, type: 'SET_ACTIVE_AREA' });
      setNotice(`指针预览：${area.name}`);
    }
  }

  function handleHoverProvince(adcode, areaId) {
    const nextAdcode = String(adcode || '');
    if (!nextAdcode) {
      if (hoveredProvinceAdcode !== null) {
        setHoveredProvinceAdcode(null);
      }
      return;
    }
    if (nextAdcode === String(hoveredProvinceAdcode || '')) return;
    setHoveredProvinceAdcode(nextAdcode);
    if (areaId && viewLevel === 'country') {
      const area = getAreaById(theme, areaId);
      if (area?.id && area.id !== currentArea?.id) {
        send({ areaId: area.id, type: 'SET_ACTIVE_AREA' });
      }
      return;
    }
    if (viewLevel === 'area' && currentArea?.provinceAdcodes?.map(String).includes(nextAdcode)) {
      const asset = currentArea.assets?.find((item) => String(item.provinceAdcode) === nextAdcode);
      if (asset) {
        setNotice(`指针高亮：${asset.title.replace('图', '')}`);
      }
    }
  }

  function handleCultureThemeSwitch(nextCultureThemeId) {
    if (nextCultureThemeId === cultureThemeId) return;
    const nextTheme = getCultureThemeById(nextCultureThemeId);
    const nextAreaId = nextTheme.areas[0]?.id;
    switchCultureTheme(nextCultureThemeId);
    setHoveredAreaId(nextAreaId);
    setHoveredProvinceAdcode(null);
    setSelectedProvinceAdcode(null);
    setSelectedFoodItem(null);
    setViewLevel('country');
    if (nextAreaId) {
      send({ areaId: nextAreaId, type: 'SET_ACTIVE_AREA' });
    }
    send({ type: 'BACK_COUNTRY' });
    setNotice(CULTURE_THEME_OPTIONS.find((option) => option.id === nextCultureThemeId)?.notice || getThemeCopy(nextTheme).readyNotice);
  }

  function handleFoodItemSelect(item, areaId) {
    const area = getAreaById(theme, areaId || item.areaId || currentArea.id);
    const nextFoodItem = {
      ...item,
      accent: item.accent || area.color,
      areaId: area.id,
      areaName: area.name,
    };

    setHoveredAreaId(area.id);
    setSelectedFoodItem(nextFoodItem);
    send({ areaId: area.id, type: 'SELECT_AREA' });

    if (viewLevel === 'country') {
      setSelectedProvinceAdcode(null);
      setViewLevel('area');
      setNotice(`已进入${area.name}，展开「${nextFoodItem.name}」文化线索`);
      return;
    }

    if (nextFoodItem.provinceAdcode) {
      setSelectedProvinceAdcode(String(nextFoodItem.provinceAdcode));
      setViewLevel('province');
    }
    setNotice(`「${nextFoodItem.name}」文化线索已展开`);
  }

  function handleSelectProvince(adcode) {
    const nextAdcode = String(adcode);
    setSelectedProvinceAdcode(nextAdcode);
    setHoveredProvinceAdcode(nextAdcode);
    setSelectedFoodItem(null);
    const area = currentArea || provinceAreaMap.get(nextAdcode);
    const asset = area?.assets?.find((item) => String(item.provinceAdcode) === nextAdcode);
    if (asset) {
      setNotice(`已进入省级大图：${asset.title.replace('图', '')}`);
    }
  }

  function handleBackCountry() {
    setSelectedProvinceAdcode(null);
    setHoveredProvinceAdcode(null);
    setSelectedFoodItem(null);
    setViewLevel('country');
    send({ type: 'BACK_COUNTRY' });
    setNotice(themeCopy.returnCountryNotice);
  }

  function handleBackArea() {
    setSelectedProvinceAdcode(null);
    setHoveredProvinceAdcode(null);
    setSelectedFoodItem(null);
    setViewLevel('area');
    setNotice(`已返回 ${currentArea?.name}`);
  }

  const activeAsset = useMemo(() => {
    if (!currentArea || !currentArea.assets) return null;
    return currentArea.assets.find(a => String(a.provinceAdcode) === String(selectedProvinceAdcode));
  }, [currentArea, selectedProvinceAdcode]);

  return (
    <main className={`app-shell mode-${appMode} theme-${siteTheme}`} ref={appShellRef}>
      {/* 高端磨砂玻璃顶栏 */}
      <header className="topbar">
        <button className="brand" onClick={handleBackCountry} type="button">
          <div className="brand-icon-wrapper">
            <Landmark size={22} aria-hidden="true" />
          </div>
          <span>中国文化地图</span>
        </button>
        <div className="topbar-status">
          <MapPin size={14} aria-hidden="true" />
          <span>
            {viewLevel === 'province'
              ? `已聚焦：${activeAsset ? activeAsset.title.replace('图', '') : '省份详情'}`
              : viewLevel === 'area'
              ? `已聚焦：${currentArea.name}`
              : themeCopy.countryStatus}
          </span>
        </div>

        <div className="culture-theme-switch" aria-label="文化类型切换">
          {CULTURE_THEME_OPTIONS.map((option) => {
            const CultureIcon = option.id === 'architecture'
              ? Building2
              : option.id === 'clothing'
              ? Shirt
              : option.id === 'food'
              ? Utensils
              : Landmark;
            return (
              <button
                className={cultureThemeId === option.id ? 'is-active' : ''}
                aria-pressed={cultureThemeId === option.id}
                key={option.id}
                onClick={() => handleCultureThemeSwitch(option.id)}
                style={{ '--culture-color': option.accent }}
                type="button"
              >
                <CultureIcon size={15} aria-hidden="true" />
                <span className="culture-option-copy">
                  <span>{option.label}</span>
                  <small>{option.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mode-switch">
          <button
            className={appMode === 'run' ? 'is-active' : ''}
            onClick={() => send({ appMode: 'run', type: 'SET_MODE' })}
            type="button"
          >
            运行模式
          </button>
          <button
            className={appMode === 'dev' ? 'is-active' : ''}
            onClick={() => send({ appMode: 'dev', type: 'SET_MODE' })}
            type="button"
          >
            AI 开发舱
          </button>
        </div>
      </header>

      {/* 主工作台 */}
      <section className="workspace">
        {/* 左半侧：交互中国地图舞台 */}
        <div className="map-column">
          <div className="map-title-row">
            <div>
              <span>{themeCopy.exploreLabel}</span>
              <h1>
                {viewLevel === 'province'
                  ? `${activeAsset ? activeAsset.title.replace('图', '') : '省份详情'}`
                  : viewLevel === 'area'
                  ? `${currentArea.name}详情`
                  : themeCopy.overviewTitle}
              </h1>
            </div>
            {viewLevel === 'area' && (
              <button className="secondary-action" onClick={handleBackCountry} type="button">
                <ArrowLeft size={14} aria-hidden="true" />
                返回全国
              </button>
            )}
            {viewLevel === 'province' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {currentArea && (
                  <button className="secondary-action" onClick={handleBackArea} type="button">
                    <ArrowLeft size={14} aria-hidden="true" />
                    返回大区
                  </button>
                )}
                <button className="secondary-action" onClick={handleBackCountry} type="button">
                  <ArrowLeft size={14} aria-hidden="true" />
                  返回全国
                </button>
              </div>
            )}
          </div>
          <FoodMap
            assetVersions={assetVersions}
            cachedImageUrls={cachedImageUrls}
            currentArea={currentArea}
            hoveredAreaId={hoveredAreaId}
            hoveredProvinceAdcode={hoveredProvinceAdcode}
            selectedFoodItem={selectedFoodItem}
            viewLevel={viewLevel}
            onFoodItemSelect={handleFoodItemSelect}
            onHoverArea={handleHoverArea}
            onHoverProvince={handleHoverProvince}
            onSelectArea={selectArea}
            selectedProvinceAdcode={selectedProvinceAdcode}
            onSelectProvince={handleSelectProvince}
            onViewLevelChange={setViewLevel}
            provinceAreaMap={provinceAreaMap}
            theme={theme}
          />
        </div>

        {/* 右半侧：控制或游戏交互摘要栏 */}
        <div className="side-column">
          {appMode === 'dev' ? (
            <McpPanel
              assetVersions={assetVersions}
              cachedImageUrls={cachedImageUrls}
              currentArea={currentArea}
              flowStep={flowStep}
              onAssetRegenerated={(asset, cacheBust) => {
                setAssetVersions((prev) => ({
                  ...prev,
                  [asset.outputImage]: cacheBust,
                }));
              }}
              onFlowStep={(nextStep) => send({ flowStep: nextStep, type: 'SET_FLOW_STEP' })}
              onSelectArea={selectArea}
              onToolResult={setNotice}
              theme={theme}
            />
          ) : (
            <RunSummary
              assetVersions={assetVersions}
              cachedImageUrls={cachedImageUrls}
              currentArea={currentArea}
              selectedFoodItem={selectedFoodItem}
              selectedProvinceAdcode={selectedProvinceAdcode}
              viewLevel={viewLevel}
              onBackCountry={handleBackCountry}
              onBackArea={handleBackArea}
              onSelectArea={selectArea}
              theme={theme}
            />
          )}

          {/* 底部悬浮的日志通知与复位卡片 */}
          <div className="side-card notice-card">
            <div>
              <div className="card-kicker">
                <Check size={14} aria-hidden="true" />
                <span>系统监控日志</span>
              </div>
              <p title={notice}>{notice}</p>
            </div>
            <button
              className="secondary-action btn-reset"
              onClick={() => {
                const defaultTheme = getCultureThemeById(cultureThemeId);
                const defaultAreaId = defaultTheme.areas[0]?.id;
                resetTheme();
                setHoveredProvinceAdcode(null);
                setSelectedProvinceAdcode(null);
                setSelectedFoodItem(null);
                setHoveredAreaId(defaultAreaId);
                setViewLevel('country');
                if (defaultAreaId) {
                  send({ areaId: defaultAreaId, type: 'SET_ACTIVE_AREA' });
                }
                send({ type: 'BACK_COUNTRY' });
                setNotice(getThemeCopy(defaultTheme).resetNotice);
              }}
              type="button"
            >
              <RefreshCw size={12} aria-hidden="true" />
              重置
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
