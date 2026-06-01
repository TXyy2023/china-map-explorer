const DEFAULT_PIN_PLACEMENTS = [
  {
    pin: { x: '80%', y: '22%' },
    spotlight: { x: '74%', y: '42%' },
  },
  {
    pin: { x: '86%', y: '38%' },
    spotlight: { x: '73%', y: '55%' },
  },
  {
    pin: { x: '78%', y: '58%' },
    spotlight: { x: '70%', y: '70%' },
  },
  {
    pin: { x: '20%', y: '28%' },
    spotlight: { x: '28%', y: '45%' },
  },
  {
    pin: { x: '14%', y: '48%' },
    spotlight: { x: '30%', y: '62%' },
  },
  {
    pin: { x: '24%', y: '68%' },
    spotlight: { x: '34%', y: '76%' },
  },
];

export const CULTURE_MODULES = {
  food: {
    detailMode: 'process-and-quiz',
    fallbackProcess: ['选取本地食材', '保留地域风味', '火候成香', '形成图鉴'],
    features: {
      aiRegionFill: false,
      itemPins: true,
      itemSpotlight: true,
      quiz: true,
    },
    id: 'food',
    itemCollectionKey: 'foodItems',
    itemNoun: '食物小图',
    label: '美食文化',
    placementFallbacks: DEFAULT_PIN_PLACEMENTS,
    processTitle: '做法流程',
    quizTitle: '相关题目',
  },
  clothing: {
    detailMode: 'craft-and-quiz',
    fallbackProcess: ['纹样来源', '材质工艺', '版型结构', '穿着场景'],
    features: {
      aiRegionFill: false,
      itemPins: true,
      itemSpotlight: true,
      quiz: true,
    },
    id: 'clothing',
    itemCollectionKey: 'clothingItems',
    itemNoun: '服装小图',
    label: '服装文化',
    placementFallbacks: DEFAULT_PIN_PLACEMENTS,
    processTitle: '工艺逻辑',
    quizTitle: '服饰题目',
    scopedLogicNote: '服装专属交互、题目、工艺字段只挂在 clothing 模块下，不影响 food 模块。',
  },
};

function findLinkedAsset(area, item) {
  if (!area || !item) return null;
  return area.assets?.find((asset) => {
    if (item.assetId && asset.id === item.assetId) return true;
    if (item.provinceAdcode && String(asset.provinceAdcode) === String(item.provinceAdcode)) return true;
    return false;
  });
}

function resolvePlacement(area, item, index, moduleConfig) {
  const fallback = moduleConfig.placementFallbacks[index % moduleConfig.placementFallbacks.length];
  const configured = item.placement || area.itemPlacements?.[item.id] || {};
  const pin = configured.pin || item.mapPosition || fallback.pin;
  const spotlight = configured.spotlight || item.spotlightPosition || fallback.spotlight;

  return { pin, spotlight };
}

export function getCultureModule(theme) {
  return CULTURE_MODULES[theme?.moduleId] || CULTURE_MODULES[theme?.cultureType] || CULTURE_MODULES.food;
}

export function normalizeCultureItems(area, moduleConfig = CULTURE_MODULES.food) {
  if (!area) return [];

  const collection = area[moduleConfig.itemCollectionKey] || area.items || area.foodItems || [];
  if (!collection.length) {
    return (area.assets || []).map((asset, index) => ({
      accent: area.color,
      areaId: area.id,
      areaName: area.name,
      id: `${area.id}-item-${index}`,
      image: asset.src,
      name: asset.title,
      objectPosition: asset.objectPosition || '50% 50%',
      placement: resolvePlacement(area, asset, index, moduleConfig),
      process: moduleConfig.fallbackProcess,
      provinceAdcode: asset.provinceAdcode,
      quiz: asset.quiz || area.quiz,
      type: moduleConfig.id,
    }));
  }

  return collection.map((item, index) => {
    const linkedAsset = findLinkedAsset(area, item);
    return {
      ...item,
      accent: item.accent || area.color,
      areaId: area.id,
      areaName: area.name,
      id: item.id || `${area.id}-item-${index}`,
      image: item.image || item.src || linkedAsset?.src || area.summaryAsset?.src,
      name: item.name || item.title || linkedAsset?.title || `${moduleConfig.itemNoun}${index + 1}`,
      objectPosition: item.objectPosition || linkedAsset?.objectPosition || '50% 50%',
      placement: resolvePlacement(area, item, index, moduleConfig),
      process: item.process?.length ? item.process : moduleConfig.fallbackProcess,
      provinceAdcode: item.provinceAdcode || linkedAsset?.provinceAdcode,
      quiz: item.quiz || linkedAsset?.quiz || area.quiz,
      type: moduleConfig.id,
    };
  });
}
