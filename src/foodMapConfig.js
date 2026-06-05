/**
 * 宗教信仰文化区交互地图配置
 *
 * 为了少动学长已经写好的交互框架，暂时保留 DEFAULT_FOOD_THEME、
 * foodItems 等字段名；页面展示内容已经切换为宗教信仰文化主题。
 */

export const STORAGE_KEY = 'agy-china-culture-map-v3';

const BOARD = {
  bashu: '/assets/religion/boards/04-bashu-local-gods-buddhist-daoist.png',
  coast: '/assets/religion/boards/02-jiangnan-southeast-coastal-folk-deities.png',
  nature: '/assets/religion/boards/03-central-southwest-shamanic-nuo-nature.png',
  north: '/assets/religion/boards/01-north-ancestor-ritual-confucian-buddhist-daoist.png',
  northwest: '/assets/religion/boards/05-northwest-islamic-silk-road-oasis.png',
  tibet: '/assets/religion/boards/06-qinghai-tibet-tibetan-buddhism.png',
};

const GENERATED_CULTURE_ASSET_ROOT = '/assets/generated-culture';

const generatedCultureImage = (themeId, folder, name) => `${GENERATED_CULTURE_ASSET_ROOT}/${themeId}/${folder}/${name}.webp`;

const getGeneratedThemeId = (areaId) => {
  const id = String(areaId);
  if (id.startsWith('architecture-')) return 'architecture';
  if (id.startsWith('clothing-')) return 'clothing';
  if (id.includes('-food')) return 'food';
  return 'religion';
};

const generatedItemImage = (areaId, itemId) => (
  generatedCultureImage(getGeneratedThemeId(areaId), 'items', itemId)
);

const generatedMapFill = (areaId, zoomLevel) => (
  generatedCultureImage(getGeneratedThemeId(areaId), 'map', `${areaId}-${zoomLevel}`)
);

const generatedMapFills = (areaId) => ({
  area: generatedMapFill(areaId, 'area'),
  country: generatedMapFill(areaId, 'country'),
  province: generatedMapFill(areaId, 'province'),
});

const generatedCountryOverview = (themeId) => generatedCultureImage(themeId, 'map', 'country-overview');

const QUIZ = {
  bashu: {
    answerIndex: 1,
    options: ['A. 单一宗派主导', 'B. 佛道与民间神祇并置', 'C. 只强调海神崇拜', 'D. 完全脱离地方生活'],
    question: '巴蜀信仰文化最典型的复合特征是什么？',
    successReward: '已点亮“巴蜀佛道混融”文化线索。',
  },
  coast: {
    answerIndex: 0,
    options: ['A. 妈祖与天后信仰', 'B. 藏传佛教寺院', 'C. 河西绿洲礼拜', 'D. 草原萨满祭祀'],
    question: '东南沿海与航海、渔业、海上贸易关系最密切的民间信仰是哪一类？',
    successReward: '已点亮“沿海海神庇护”文化线索。',
  },
  nature: {
    answerIndex: 2,
    options: ['A. 经堂教育', 'B. 宗族科举礼制', 'C. 巫傩仪式与自然崇拜', 'D. 都市财神信仰'],
    question: '华中—西南山地信仰中，最能体现人与山林水系联系的表达是什么？',
    successReward: '已点亮“巫傩自然崇拜”文化线索。',
  },
  north: {
    answerIndex: 1,
    options: ['A. 海神信仰', 'B. 祖先祭祀与儒家礼制', 'C. 绿洲聚落礼拜', 'D. 神山圣湖朝圣'],
    question: '华北—中原信仰区最核心的社会秩序基础是什么？',
    successReward: '已点亮“祖先礼制”文化线索。',
  },
  northwest: {
    answerIndex: 3,
    options: ['A. 祠堂祭祖', 'B. 妈祖巡游', 'C. 巫傩驱邪', 'D. 清真寺与礼拜传统'],
    question: '西北伊斯兰信仰文化区最具识别度的宗教空间是什么？',
    successReward: '已点亮“清真寺礼拜”文化线索。',
  },
  tibet: {
    answerIndex: 0,
    options: ['A. 寺院中心与朝圣转经', 'B. 城隍庙会', 'C. 行业神祭祀', 'D. 财神商帮信仰'],
    question: '青藏高原信仰景观中，寺院通常承担什么核心角色？',
    successReward: '已点亮“藏传佛教高原”文化线索。',
  },
};

const province = (provinceAdcode, title, coordinates) => ({
  coordinates,
  provinceAdcode,
  title,
});

const makeAsset = (areaId, src, item, quiz) => ({
  areaId,
  coordinates: item.coordinates,
  id: `${areaId}-${item.provinceAdcode}`,
  provinceAdcode: item.provinceAdcode,
  quiz,
  size: { height: 130, width: 180 },
  src: generatedMapFill(areaId, 'province') || src,
  title: item.title,
  type: 'image',
});

const makeAssets = (areaId, src, items, quiz) => items.map((item) => makeAsset(areaId, src, item, quiz));

const makeSignal = (areaId, src, provinceAdcode, id, name, process) => ({
  accent: undefined,
  detailImage: generatedItemImage(areaId, id),
  fallbackImage: src,
  id,
  image: generatedItemImage(areaId, id),
  name,
  objectPosition: '50% 50%',
  process,
  provinceAdcode,
});

const makeGeneratedSummaryAsset = (themeId, area) => ({
  coordinates: area.summaryAsset?.coordinates || area.center,
  id: area.summaryAsset?.id || `summary-${area.id}`,
  size: area.summaryAsset?.size || { height: 160, width: 220 },
  src: generatedMapFill(area.id, 'area'),
  title: area.summaryAsset?.title || `${area.name}信息图板`,
  type: area.summaryAsset?.type || 'image',
});

const applyGeneratedCultureImages = (theme, themeId) => ({
  ...theme,
  chinaAsset: {
    ...(theme.chinaAsset || {}),
    src: generatedCountryOverview(themeId),
  },
  useImageFills: true,
  areas: theme.areas.map((area) => ({
    ...area,
    assets: (area.assets || []).map((asset) => ({
      ...asset,
      src: generatedMapFill(area.id, 'province'),
    })),
    mapFills: generatedMapFills(area.id),
    summaryAsset: makeGeneratedSummaryAsset(themeId, area),
  })),
});

export const FOOD_IMAGE_ASSET = {
  areaId: 'north-ancestor-ritual',
  coordinates: [114.2, 36.4],
  id: 'asset-north-ancestor-ritual',
  size: { height: 160, width: 260 },
  src: BOARD.north,
  title: '北方祖先礼制信仰图板',
  type: 'image',
};

const BASE_FOOD_THEME = {
  chinaAsset: {
    id: 'china-religion-summary',
    src: BOARD.north,
  },
  cultureType: 'religion',
  copy: {
    areaCountLabel: '信仰文化区',
    areaDetailLabel: '信仰文化区详情',
    countryKicker: '中国宗教信仰版图',
    countryStatus: '中国宗教信仰版图视图',
    exploreLabel: '中国宗教信仰文化区探索 ✦ React 自适应投影',
    loadingLabel: '文化地图加载中...',
    overviewTitle: '六大信仰文化区总览',
    provinceDescription: '探索省级信仰文化线索。',
    provinceLabel: '省级信仰线索',
    quizLabel: '信仰区知识问答',
    readyNotice: '宗教信仰文化地图已就绪，等待探索',
    resetNotice: '系统成功复位：地图已恢复至默认宗教信仰文化配置',
    returnCountryNotice: '已返回全国信仰文化大盘',
    targetAreaLabel: '目标信仰文化区',
  },
  description: '以中国省级地图为底盘，展示六类宗教信仰文化区：祖先礼制、沿海民间神祇、巫傩自然、巴蜀混融、西北伊斯兰与青藏藏传佛教。',
  id: 'chinese-religion-belief-map',
  name: '中国宗教信仰文化地图',
  useImageFills: false,
  areas: [
    {
      center: [114.2, 36.4],
      color: '#c76152',
      description: '华北—中原是传统汉文明礼制的核心区域，信仰生活常围绕祠堂、祖庙、城隍庙与关帝庙展开，强调血缘、家族伦理和社会秩序。',
      id: 'north-ancestor-ritual',
      name: '北方祖先祭祀—儒释道融合信仰区',
      provinceAdcodes: ['110000', '120000', '130000', '370000', '140000', '410000', '610000', '150000', '210000', '220000', '230000'],
      zoom: 3.8,
      summaryAsset: {
        coordinates: [114.2, 36.4],
        id: 'summary-north-ancestor-ritual',
        size: { height: 160, width: 220 },
        src: BOARD.north,
        title: '北方祖先礼制信仰图板',
        type: 'image',
      },
      foodItems: [
        makeSignal('north-ancestor-ritual', BOARD.north, '130000', 'north-ancestral-hall', '祠堂祖庙', ['祖先牌位与家族谱系成为祭祀核心。', '节令祭祖连接家庭记忆与伦理秩序。', '宗族礼制强化长幼、亲疏与乡土归属。', '适合在 UI 中作为“祖先礼制”热点。']),
        makeSignal('north-ancestor-ritual', BOARD.north, '410000', 'north-confucian-ritual', '儒家礼制', ['礼仪规范提供社会秩序框架。', '乡约、庙会与祭礼共同维护地方秩序。', '佛道信仰常与民间礼俗并置。', '可作为详情页的制度线索。']),
        makeSignal('north-ancestor-ritual', BOARD.north, '370000', 'north-city-god', '城隍关帝', ['城隍象征城市守护与司法想象。', '关帝信仰连接忠义伦理与商旅庇护。', '庙宇常是社区公共活动中心。', '可作为地图点击后的庙宇网络说明。']),
        makeSignal('north-ancestor-ritual', BOARD.north, '610000', 'north-temples', '佛道寺观', ['佛寺与道观长期共存。', '香火、祈福与还愿进入日常生活。', '与祖先祭祀共同构成复合信仰结构。', '适合放入图文素材轮播。']),
      ],
      assets: makeAssets('north-ancestor-ritual', BOARD.north, [
        province('110000', '北京礼制与庙宇线索图', [116.4, 40.0]),
        province('120000', '天津城隍与民间庙会线索图', [117.2, 39.1]),
        province('130000', '河北宗族祭祀线索图', [115.1, 38.5]),
        province('370000', '山东儒家礼制线索图', [118.2, 36.4]),
        province('140000', '山西祖庙与关帝线索图', [112.5, 37.7]),
        province('410000', '河南中原礼俗线索图', [113.7, 34.4]),
        province('610000', '陕西关中祖先礼制线索图', [108.8, 35.8]),
        province('150000', '内蒙古邻近北方礼俗借色线索图', [111.8, 43.8]),
        province('210000', '辽宁邻近北方庙宇借色线索图', [123.4, 41.8]),
        province('220000', '吉林邻近北方祖灵借色线索图', [126.0, 43.8]),
        province('230000', '黑龙江邻近北方礼俗借色线索图', [128.0, 47.2]),
      ], QUIZ.north),
      quiz: QUIZ.north,
    },
    {
      center: [119.5, 27.5],
      color: '#2e9fa3',
      description: '江南—东南沿海商业与海洋文化发达，民间信仰密度高且生活化，妈祖、天后、观音、财神和地方保护神共同构成信仰网络。',
      id: 'coastal-folk-deities',
      name: '江南—东南沿海民间神祇信仰区',
      provinceAdcodes: ['320000', '310000', '330000', '350000', '440000', '710000', '810000', '820000', '340000', '460000'],
      zoom: 4.0,
      summaryAsset: {
        coordinates: [119.5, 27.5],
        id: 'summary-coastal-folk-deities',
        size: { height: 160, width: 220 },
        src: BOARD.coast,
        title: '江南东南沿海民间神祇图板',
        type: 'image',
      },
      foodItems: [
        makeSignal('coastal-folk-deities', BOARD.coast, '350000', 'coast-mazu', '妈祖天后', ['海神信仰回应航海、渔业与迁徙风险。', '庙宇与巡游强化港口社区认同。', '福建、台湾海峡沿岸尤为突出。', '可作为地图主热点。']),
        makeSignal('coastal-folk-deities', BOARD.coast, '330000', 'coast-guanyin', '观音崇拜', ['观音信仰与佛教寺院关系密切。', '救苦、护佑与日常祈愿高度生活化。', '常与地方神祇共享信仰空间。', '适合做详情页图文卡。']),
        makeSignal('coastal-folk-deities', BOARD.coast, '310000', 'coast-caishen', '财神商帮', ['商业城镇强化财神与行业神信仰。', '市场、会馆与庙宇构成公共网络。', '江南水网让信仰嵌入街巷生活。', '可作为商业文化侧线。']),
        makeSignal('coastal-folk-deities', BOARD.coast, '440000', 'coast-local-gods', '地方保护神', ['地方神灵守护村社、港口与街区。', '宗族祖庙与民间神祇互相连接。', '庙会、巡游和节庆具有强互动感。', '适合后续做小游戏入口。']),
      ],
      assets: makeAssets('coastal-folk-deities', BOARD.coast, [
        province('320000', '江苏江南水网信仰线索图', [119.3, 32.7]),
        province('310000', '上海都市民间神祇线索图', [121.45, 31.2]),
        province('330000', '浙江观音与地方神线索图', [120.1, 29.2]),
        province('350000', '福建妈祖天后线索图', [118.2, 26.2]),
        province('440000', '广东沿海保护神线索图', [113.3, 23.35]),
        province('710000', '台湾海峡妈祖信仰线索图', [121.0, 23.7]),
        province('810000', '香港民间庙宇线索图', [114.18, 22.34]),
        province('820000', '澳门中西交汇信仰线索图', [113.56, 22.18]),
        province('340000', '安徽邻近江南民间信仰借色线索图', [117.2, 31.8]),
        province('460000', '海南邻近岭南海神信仰借色线索图', [110.3, 19.2]),
      ], QUIZ.coast),
      quiz: QUIZ.coast,
    },
    {
      center: [108.8, 26.8],
      color: '#6f9958',
      description: '华中—西南山地密集、族群多元，自然环境对信仰影响很强，祖灵、山林、水系、巫傩仪式与节庆歌舞共同构成信仰表达。',
      id: 'central-southwest-nature',
      name: '华中—西南巫傩与自然崇拜过渡区',
      provinceAdcodes: ['430000', '420000', '360000', '520000', '530000', '450000'],
      zoom: 4.2,
      summaryAsset: {
        coordinates: [108.8, 26.8],
        id: 'summary-central-southwest-nature',
        size: { height: 160, width: 220 },
        src: BOARD.nature,
        title: '华中西南巫傩自然崇拜图板',
        type: 'image',
      },
      foodItems: [
        makeSignal('central-southwest-nature', BOARD.nature, '430000', 'nature-nuo', '巫傩仪式', ['傩戏、巫仪与驱邪仪式保留古老信仰层。', '面具、歌舞和祭仪构成强视觉表达。', '仪式常连接疾病、灾害与社区秩序。', '适合做动态交互入口。']),
        makeSignal('central-southwest-nature', BOARD.nature, '530000', 'nature-animism', '万物有灵', ['山林、水系、洞穴与田地被赋予灵性。', '自然神崇拜强调人与环境的互惠关系。', '禁忌、祭仪与村寨生活相互嵌合。', '可作为自然崇拜主线。']),
        makeSignal('central-southwest-nature', BOARD.nature, '520000', 'nature-ancestor-spirits', '祖灵祭祀', ['祖灵维系家族、村寨与地方记忆。', '祭祀常与节庆、歌舞和宴饮连接。', '多民族地区呈现多样仪式形态。', '适合做民族文化信息卡。']),
        makeSignal('central-southwest-nature', BOARD.nature, '450000', 'nature-mountain-water', '祭山祭水', ['山川水系被看作具有守护与约束力量。', '祭山、祭水体现对自然环境的敬畏。', '山地交通与聚落形态影响信仰空间。', '适合在地图上做山水热点。']),
      ],
      assets: makeAssets('central-southwest-nature', BOARD.nature, [
        province('430000', '湖南巫傩仪式线索图', [111.8, 27.6]),
        province('420000', '湖北西部祖灵线索图', [112.5, 30.8]),
        province('360000', '江西南部山水信仰线索图', [115.8, 27.7]),
        province('520000', '贵州村寨祖灵线索图', [106.7, 26.6]),
        province('530000', '云南万物有灵线索图', [101.5, 24.5]),
        province('450000', '广西山地自然崇拜线索图', [108.5, 23.7]),
      ], QUIZ.nature),
      quiz: QUIZ.nature,
    },
    {
      center: [105.5, 30.2],
      color: '#d09a36',
      description: '巴蜀处在中原与西南之间，是典型宗教融合地带。道教传统、佛教信仰、土地神、行业神与地方保护神共同进入日常生活。',
      id: 'bashu-local-gods',
      name: '巴蜀地方神祇—佛道混融信仰区',
      provinceAdcodes: ['510000', '500000'],
      zoom: 4.8,
      summaryAsset: {
        coordinates: [105.5, 30.2],
        id: 'summary-bashu-local-gods',
        size: { height: 160, width: 220 },
        src: BOARD.bashu,
        title: '巴蜀地方神祇佛道混融图板',
        type: 'image',
      },
      foodItems: [
        makeSignal('bashu-local-gods', BOARD.bashu, '510000', 'bashu-daoism', '道教传统', ['巴蜀具有深厚道教传统。', '宫观、山岳与地方神谱彼此连接。', '道教仪式常与民间祈福相结合。', '适合作为区域主识别。']),
        makeSignal('bashu-local-gods', BOARD.bashu, '510000', 'bashu-buddhism', '佛教信仰', ['佛寺香火与日常祈愿关系密切。', '佛教与地方神灵常共处同一生活圈。', '寺院也是文化记忆与聚落节点。', '适合做图文详情区。']),
        makeSignal('bashu-local-gods', BOARD.bashu, '500000', 'bashu-earth-gods', '土地行业神', ['土地、行业神与市井生活相连。', '庙会、行会和商业活动强化多神共祀。', '地方神具有强烈生活化气质。', '适合做城市信仰热点。']),
        makeSignal('bashu-local-gods', BOARD.bashu, '500000', 'bashu-protectors', '地方保护神', ['地方保护神回应灾害、防护与祈福需求。', '多神并置形成鲜明的巴蜀地方性。', '中原礼俗与西南传统在此叠合。', '可作为融合文化说明。']),
      ],
      assets: makeAssets('bashu-local-gods', BOARD.bashu, [
        province('510000', '四川盆地佛道混融线索图', [102.8, 30.2]),
        province('500000', '重庆地方保护神线索图', [107.45, 30.0]),
      ], QUIZ.bashu),
      quiz: QUIZ.bashu,
    },
    {
      center: [91.5, 42.2],
      color: '#5577b7',
      description: '西北受丝绸之路交流影响深远，伊斯兰文化特征鲜明，清真寺、礼拜传统、经堂教育、几何装饰与绿洲聚落生活紧密结合。',
      id: 'northwest-islamic-oasis',
      name: '西北伊斯兰信仰文化区',
      provinceAdcodes: ['650000', '620000', '640000'],
      zoom: 3.0,
      summaryAsset: {
        coordinates: [91.5, 42.2],
        id: 'summary-northwest-islamic-oasis',
        size: { height: 160, width: 220 },
        src: BOARD.northwest,
        title: '西北伊斯兰绿洲信仰图板',
        type: 'image',
      },
      foodItems: [
        makeSignal('northwest-islamic-oasis', BOARD.northwest, '650000', 'northwest-mosque', '清真寺空间', ['清真寺是礼拜、教育与社区活动中心。', '建筑空间与日常生活高度连接。', '绿洲城市中宗教空间识别度强。', '适合做地图主热点。']),
        makeSignal('northwest-islamic-oasis', BOARD.northwest, '640000', 'northwest-prayer', '礼拜传统', ['礼拜节律组织日常时间。', '节庆礼仪强化社区共同体。', '饮食、服饰与礼仪共同构成生活规范。', '可作为互动时间线。']),
        makeSignal('northwest-islamic-oasis', BOARD.northwest, '620000', 'northwest-silk-road', '丝路交流', ['河西走廊连接东西交通。', '贸易、迁徙与宗教传播相互交织。', '绿洲聚落形成区别于中原的文化系统。', '适合作为历史线路说明。']),
        makeSignal('northwest-islamic-oasis', BOARD.northwest, '650000', 'northwest-geometry', '几何装饰', ['几何纹样、拱券与装饰构成视觉识别。', '非具象装饰强化宗教美学特征。', '适合转化为 UI 纹理与图标系统。', '可用于界面视觉资产。']),
      ],
      assets: makeAssets('northwest-islamic-oasis', BOARD.northwest, [
        province('650000', '新疆绿洲伊斯兰线索图', [84.6, 42.5]),
        province('620000', '甘肃河西走廊信仰线索图', [100.9, 38.1]),
        province('640000', '宁夏礼拜传统线索图', [106.15, 37.35]),
      ], QUIZ.northwest),
      quiz: QUIZ.northwest,
    },
    {
      center: [91.0, 32.2],
      color: '#8b5aa5',
      description: '青藏高原地理环境塑造强烈宗教空间意识，藏传佛教寺院、活佛体系、朝圣转经与神山圣湖崇拜共同构成高原文化格局。',
      id: 'qinghai-tibet-buddhism',
      name: '青藏藏传佛教信仰区',
      provinceAdcodes: ['540000', '630000'],
      zoom: 3.6,
      summaryAsset: {
        coordinates: [91.0, 32.2],
        id: 'summary-qinghai-tibet-buddhism',
        size: { height: 160, width: 220 },
        src: BOARD.tibet,
        title: '青藏藏传佛教信仰图板',
        type: 'image',
      },
      foodItems: [
        makeSignal('qinghai-tibet-buddhism', BOARD.tibet, '540000', 'tibet-monastery', '寺院中心', ['寺院既是信仰中心，也是聚落中心。', '宗教教育、节庆与地方生活在此汇聚。', '寺院空间组织高原文化景观。', '适合作为详情页主视觉。']),
        makeSignal('qinghai-tibet-buddhism', BOARD.tibet, '540000', 'tibet-pilgrimage', '朝圣转经', ['转经与朝圣是重要身体实践。', '路线、圣地与聚落形成宗教网络。', '朝圣行为强化空间神圣感。', '可做路径动画。']),
        makeSignal('qinghai-tibet-buddhism', BOARD.tibet, '630000', 'tibet-sacred-landscape', '神山圣湖', ['自然景观本身被赋予神圣属性。', '山、水、寺院与生活方式高度统一。', '高原地貌塑造独特信仰想象。', '适合做地图背景叙事。']),
        makeSignal('qinghai-tibet-buddhism', BOARD.tibet, '630000', 'tibet-living-buddha', '活佛体系', ['活佛体系构成藏传佛教重要制度。', '宗教权威与地方社会组织相互连接。', '仪式、教育与传承共同维系信仰。', '可作为制度说明卡。']),
      ],
      assets: makeAssets('qinghai-tibet-buddhism', BOARD.tibet, [
        province('540000', '西藏寺院朝圣线索图', [88.6, 31.9]),
        province('630000', '青海藏区神山圣湖线索图', [96.4, 35.4]),
      ], QUIZ.tibet),
      quiz: QUIZ.tibet,
    },
  ],
};

const ARCHITECTURE_PLACEHOLDER = '/assets/food/china_contour.png';

const ARCHITECTURE_QUIZ = {
  northCentral: {
    answerIndex: 0,
    options: ['A. 中轴礼制与院落秩序', 'B. 干栏架空居住', 'C. 骑楼商业街', 'D. 碉楼防御聚落'],
    question: '北方官式与中原建筑最突出的空间组织特征是什么？',
    successReward: '已点亮“中轴礼制与院落秩序”建筑线索。',
  },
  jiangnan: {
    answerIndex: 1,
    options: ['A. 厚墙平顶', 'B. 水网街巷与白墙黛瓦', 'C. 高原碉房', 'D. 草原毡帐'],
    question: '江南建筑文化区最容易被识别的环境基础是什么？',
    successReward: '已点亮“水网街巷与白墙黛瓦”建筑线索。',
  },
  chuXiangGan: {
    answerIndex: 2,
    options: ['A. 都城宫阙轴线', 'B. 海贸骑楼', 'C. 山地边渡与吊脚空间', 'D. 穹顶礼拜空间'],
    question: '楚湘赣—西南山地边渡建筑常围绕哪类地形与交通展开？',
    successReward: '已点亮“山地边渡建筑”线索。',
  },
  bashu: {
    answerIndex: 0,
    options: ['A. 天井院落与穿斗木构', 'B. 蒙古包', 'C. 闽南红砖厝', 'D. 藏式碉房'],
    question: '巴蜀/四川盆地民居常见的空间和构造组合是什么？',
    successReward: '已点亮“巴蜀天井院落”建筑线索。',
  },
  lingnan: {
    answerIndex: 1,
    options: ['A. 窑洞院落', 'B. 骑楼、镬耳墙与侨乡碉楼', 'C. 高原经堂', 'D. 江南水榭'],
    question: '岭南建筑最能体现湿热气候和海贸侨乡影响的组合是哪一项？',
    successReward: '已点亮“岭南骑楼侨乡”建筑线索。',
  },
  minTai: {
    answerIndex: 3,
    options: ['A. 平顶土掌房', 'B. 清真寺拱券', 'C. 白族三坊一照壁', 'D. 红砖厝、燕尾脊与土楼'],
    question: '闽系建筑文化区最具辨识度的传统建筑符号是什么？',
    successReward: '已点亮“闽系红砖土楼”建筑线索。',
  },
  southwestStilt: {
    answerIndex: 0,
    options: ['A. 干栏架空与竹木构造', 'B. 斗拱重檐', 'C. 沙漠土坯拱券', 'D. 欧式骑楼立面'],
    question: '西南少数民族干栏建筑主要回应了怎样的环境条件？',
    successReward: '已点亮“西南干栏架空”建筑线索。',
  },
  northwestIslamic: {
    answerIndex: 2,
    options: ['A. 水乡园林', 'B. 吊脚楼', 'C. 拱券穹顶与绿洲聚落', 'D. 祠堂围屋'],
    question: '西北丝路—伊斯兰建筑文化区常见的空间符号是什么？',
    successReward: '已点亮“丝路伊斯兰建筑”线索。',
  },
  tibetanPlateau: {
    answerIndex: 1,
    options: ['A. 水网廊棚', 'B. 厚墙平顶、碉房与寺院', 'C. 红砖燕尾脊', 'D. 镬耳山墙'],
    question: '青藏高原建筑为了适应高寒强日照，常呈现哪种形态？',
    successReward: '已点亮“高原厚墙寺院”建筑线索。',
  },
};

const BASE_ARCHITECTURE_CULTURE_THEME = {
  chinaAsset: {
    id: 'china-architecture-summary',
    src: ARCHITECTURE_PLACEHOLDER,
  },
  cultureType: 'architecture',
  copy: {
    areaCountLabel: '建筑文化区',
    areaDetailLabel: '建筑文化区详情',
    countryKicker: '中国建筑文化版图',
    countryStatus: '中国建筑文化版图视图',
    exploreLabel: '中国建筑文化区探索 ✦ React 自适应投影',
    loadingLabel: '文化地图加载中...',
    overviewTitle: '九大建筑文化区总览',
    provinceDescription: '探索省级建筑文化线索。',
    provinceLabel: '省级建筑线索',
    quizLabel: '建筑区知识问答',
    readyNotice: '建筑文化地图已就绪，等待探索',
    resetNotice: '系统成功复位：地图已恢复至默认建筑文化配置',
    returnCountryNotice: '已返回全国建筑文化大盘',
    targetAreaLabel: '目标建筑文化区',
  },
  description: '以中国省级地图为底盘，展示九类建筑文化区：北方官式与中原、江南水乡、楚湘赣山地边渡、巴蜀盆地、岭南、闽系、西南干栏、西北丝路伊斯兰与青藏高原建筑。',
  id: 'chinese-architecture-culture-map',
  name: '中国建筑文化地图',
  useImageFills: false,
  areas: [
    {
      center: [114.0, 38.0],
      color: '#d97757',
      description: '北方官式与中原建筑强调礼制轴线、院落秩序、厚重墙体和城镇公共空间，常以宫城、坛庙、衙署、四合院与中原民居构成核心识别。',
      id: 'architecture-north-central',
      name: '北方官式 / 中原建筑文化区',
      provinceAdcodes: ['110000', '120000', '130000', '140000', '150000', '210000', '220000', '230000', '370000', '410000', '610000'],
      zoom: 3.7,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-north-central', ARCHITECTURE_PLACEHOLDER, '110000', 'arch-palace-axis', '宫城轴线', ['中轴线组织城市礼制空间。', '宫殿、坛庙与城门形成等级秩序。', '适合在地图中作为北方官式建筑主线索。', '可连接北京、陕西等省级节点。']),
        makeSignal('architecture-north-central', ARCHITECTURE_PLACEHOLDER, '130000', 'arch-courtyard', '四合院落', ['院落围合形成内向生活空间。', '正房、厢房与门第体现家族秩序。', '冬季保温与防风需求影响墙体尺度。', '可作为民居结构说明热点。']),
        makeSignal('architecture-north-central', ARCHITECTURE_PLACEHOLDER, '370000', 'arch-ritual-buildings', '礼制建筑', ['孔庙、祠庙与书院强化礼教传统。', '轴线、院进和牌坊具有强符号性。', '建筑空间服务祭祀、教育与公共秩序。', '适合纳入右侧知识卡。']),
        makeSignal('architecture-north-central', ARCHITECTURE_PLACEHOLDER, '140000', 'arch-thick-wall', '厚墙民居', ['黄土、砖石与木构混合使用。', '厚墙、小窗回应风沙和温差。', '院落与街巷共同构成聚落肌理。', '适合做构造剖面线索。']),
      ],
      assets: makeAssets('architecture-north-central', ARCHITECTURE_PLACEHOLDER, [
        province('110000', '北京宫城轴线建筑线索图', [116.4, 40.0]),
        province('120000', '天津近代街区与院落线索图', [117.2, 39.1]),
        province('130000', '河北北方院落民居线索图', [115.1, 38.5]),
        province('140000', '山西晋商大院与堡寨线索图', [112.5, 37.7]),
        province('150000', '内蒙古草原聚落与边塞建筑线索图', [111.8, 43.8]),
        province('210000', '辽宁辽金遗构与近代城市线索图', [123.4, 41.8]),
        province('220000', '吉林东北院落与林区建筑线索图', [126.0, 43.8]),
        province('230000', '黑龙江寒地城镇建筑线索图', [128.0, 47.2]),
        province('370000', '山东礼制建筑与海岱民居线索图', [118.2, 36.4]),
        province('410000', '河南中原民居与古都线索图', [113.7, 34.4]),
        province('610000', '陕西关中院落与都城遗构线索图', [108.8, 35.8]),
      ], ARCHITECTURE_QUIZ.northCentral),
      quiz: ARCHITECTURE_QUIZ.northCentral,
    },
    {
      center: [119.0, 31.0],
      color: '#34a3a9',
      description: '江南建筑文化区依托水网、商业城镇与园林传统，形成白墙黛瓦、临水街巷、厅堂天井、园林借景和精细木作等典型表达。',
      id: 'architecture-jiangnan',
      name: '江南建筑文化区',
      provinceAdcodes: ['310000', '320000', '330000', '340000'],
      zoom: 4.4,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-jiangnan', ARCHITECTURE_PLACEHOLDER, '320000', 'arch-water-town', '水乡街巷', ['河道、桥梁与街市共同组织聚落。', '临水店铺和民居形成高密度生活界面。', '水网交通塑造江南建筑尺度。', '适合做区域主热点。']),
        makeSignal('architecture-jiangnan', ARCHITECTURE_PLACEHOLDER, '330000', 'arch-white-wall', '白墙黛瓦', ['粉墙、黛瓦与马头墙构成视觉识别。', '院落与天井调节采光、通风和排水。', '建筑色彩与水乡环境形成整体风貌。', '适合转化为 UI 色块与纹理。']),
        makeSignal('architecture-jiangnan', ARCHITECTURE_PLACEHOLDER, '320000', 'arch-garden', '园林借景', ['园林以叠山、理水、廊桥组织游线。', '小尺度空间制造丰富视线层次。', '文人审美影响住宅与公共园林。', '可做详情页审美线索。']),
        makeSignal('architecture-jiangnan', ARCHITECTURE_PLACEHOLDER, '340000', 'arch-ancestral-hall', '徽派厅堂', ['祠堂、牌坊与厅堂体现宗族秩序。', '高墙深巷适应聚落防火和家族管理。', '木雕、砖雕和石雕提供精细装饰层。', '适合作为构件知识卡。']),
      ],
      assets: makeAssets('architecture-jiangnan', ARCHITECTURE_PLACEHOLDER, [
        province('310000', '上海江南近代街区建筑线索图', [121.45, 31.2]),
        province('320000', '江苏水乡园林建筑线索图', [119.3, 32.7]),
        province('330000', '浙江白墙黛瓦与水乡线索图', [120.1, 29.2]),
        province('340000', '安徽徽派厅堂与村落线索图', [117.2, 31.8]),
      ], ARCHITECTURE_QUIZ.jiangnan),
      quiz: ARCHITECTURE_QUIZ.jiangnan,
    },
    {
      center: [113.0, 28.3],
      color: '#7aa85b',
      description: '楚湘赣—西南山地边渡建筑文化区处在江河、丘陵和山地交通之间，建筑常回应湿热气候、坡地聚落、边渡节点与地方宗族生活。',
      id: 'architecture-chu-xiang-gan',
      name: '楚湘赣—西南山地边渡建筑文化区',
      provinceAdcodes: ['360000', '420000', '430000'],
      zoom: 4.4,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-chu-xiang-gan', ARCHITECTURE_PLACEHOLDER, '430000', 'arch-stilt-transition', '吊脚过渡', ['坡地与河谷促成半架空空间。', '建筑下部常兼具通风、防潮和储物功能。', '山地民居连接汉地院落与西南干栏传统。', '适合做边渡结构说明。']),
        makeSignal('architecture-chu-xiang-gan', ARCHITECTURE_PLACEHOLDER, '420000', 'arch-river-town', '江河市镇', ['长江支流塑造码头、街巷和会馆。', '商业交通节点推动公共建筑发展。', '滨水界面兼具交易与生活功能。', '可作为区域经济线索。']),
        makeSignal('architecture-chu-xiang-gan', ARCHITECTURE_PLACEHOLDER, '360000', 'arch-clan-village', '宗族村落', ['祠堂、民居和巷道构成聚落骨架。', '山地防御和宗族秩序影响村落布局。', '木构、砖墙与马头墙混合出现。', '适合做聚落肌理热点。']),
        makeSignal('architecture-chu-xiang-gan', ARCHITECTURE_PLACEHOLDER, '430000', 'arch-climate', '湿热通风', ['深檐、天井和穿堂风回应湿热环境。', '屋面排水与架空处理减少潮气。', '材料常结合木、砖、石与夯土。', '适合做气候适应说明。']),
      ],
      assets: makeAssets('architecture-chu-xiang-gan', ARCHITECTURE_PLACEHOLDER, [
        province('360000', '江西宗族村落与山地建筑线索图', [115.8, 27.7]),
        province('420000', '湖北江河市镇建筑线索图', [112.5, 30.8]),
        province('430000', '湖南山地边渡建筑线索图', [111.8, 27.6]),
      ], ARCHITECTURE_QUIZ.chuXiangGan),
      quiz: ARCHITECTURE_QUIZ.chuXiangGan,
    },
    {
      center: [105.4, 30.3],
      color: '#d49b3a',
      description: '巴蜀/四川盆地建筑文化区以天井院落、穿斗木构、坡屋面、茶馆街巷和山地城镇为代表，呈现盆地湿润气候与市井生活的复合形态。',
      id: 'architecture-bashu',
      name: '巴蜀 / 四川盆地建筑文化区',
      provinceAdcodes: ['500000', '510000'],
      zoom: 4.8,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-bashu', ARCHITECTURE_PLACEHOLDER, '510000', 'arch-bashu-courtyard', '天井院落', ['天井改善采光、排水和通风。', '院落尺度服务家庭生活与市井交往。', '湿润气候影响屋面和排水细节。', '适合作为区域主结构线索。']),
        makeSignal('architecture-bashu', ARCHITECTURE_PLACEHOLDER, '510000', 'arch-timber-frame', '穿斗木构', ['穿斗式木构适应地方材料和施工传统。', '轻巧构架便于坡地和街巷环境布置。', '构件尺度体现民居日常性。', '适合做构造热点。']),
        makeSignal('architecture-bashu', ARCHITECTURE_PLACEHOLDER, '500000', 'arch-mountain-city', '山城街巷', ['重庆山地地形形成层叠街巷。', '吊脚、梯道和码头空间紧密相连。', '建筑常回应高差、湿热和江岸交通。', '适合做城市剖面线索。']),
        makeSignal('architecture-bashu', ARCHITECTURE_PLACEHOLDER, '510000', 'arch-teahouse', '茶馆院坝', ['茶馆和院坝承载社区交往。', '半开放空间适应温润气候。', '建筑与生活方式高度融合。', '适合放入生活场景卡。']),
      ],
      assets: makeAssets('architecture-bashu', ARCHITECTURE_PLACEHOLDER, [
        province('510000', '四川盆地穿斗院落建筑线索图', [102.8, 30.2]),
        province('500000', '重庆山城街巷与坡地建筑线索图', [107.45, 30.0]),
      ], ARCHITECTURE_QUIZ.bashu),
      quiz: ARCHITECTURE_QUIZ.bashu,
    },
    {
      center: [113.5, 22.8],
      color: '#3aa6a1',
      description: '岭南建筑文化区回应湿热气候、海贸交流与侨乡网络，骑楼、镬耳墙、祠堂、园林、碉楼和中西合璧立面构成鲜明地域景观。',
      id: 'architecture-lingnan',
      name: '岭南建筑文化区',
      provinceAdcodes: ['440000', '450000', '460000', '810000', '820000'],
      zoom: 4.2,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-lingnan', ARCHITECTURE_PLACEHOLDER, '440000', 'arch-qilou', '骑楼街廊', ['连续廊道遮阳避雨，服务商业街市。', '立面常吸收近代海贸和侨乡装饰。', '街道尺度强调步行与店铺展示。', '适合作为岭南主热点。']),
        makeSignal('architecture-lingnan', ARCHITECTURE_PLACEHOLDER, '440000', 'arch-wok-ear', '镬耳山墙', ['山墙轮廓具有礼制和装饰意味。', '与祠堂、民居和村落轴线共同出现。', '防火与排水需求影响墙体处理。', '适合作为建筑符号卡。']),
        makeSignal('architecture-lingnan', ARCHITECTURE_PLACEHOLDER, '460000', 'arch-tropical', '热带通风', ['深檐、廊道和开敞空间回应湿热气候。', '材料和庭院组织强调通风遮阳。', '建筑与庭院植物共同塑造微气候。', '适合做气候适应线索。']),
        makeSignal('architecture-lingnan', ARCHITECTURE_PLACEHOLDER, '820000', 'arch-mix', '中西交汇', ['港澳与侨乡建筑体现中西混合。', '拱廊、阳台和装饰立面强化城市界面。', '海贸网络改变地方建筑表情。', '适合放入开放交流线索。']),
      ],
      assets: makeAssets('architecture-lingnan', ARCHITECTURE_PLACEHOLDER, [
        province('440000', '广东骑楼祠堂与侨乡建筑线索图', [113.3, 23.35]),
        province('450000', '广西岭南山地与廊式建筑线索图', [108.5, 23.7]),
        province('460000', '海南热带民居与骑楼线索图', [110.3, 19.2]),
        province('810000', '香港近代城市建筑线索图', [114.18, 22.34]),
        province('820000', '澳门中西合璧建筑线索图', [113.56, 22.18]),
      ], ARCHITECTURE_QUIZ.lingnan),
      quiz: ARCHITECTURE_QUIZ.lingnan,
    },
    {
      center: [119.2, 24.8],
      color: '#cf5d92',
      description: '闽系建筑文化区以山海交错、宗族聚落与海峡交流为底色，红砖厝、燕尾脊、土楼、石厝和寺庙装饰形成高辨识度建筑语言。',
      id: 'architecture-min-tai',
      name: '闽系建筑文化区',
      provinceAdcodes: ['350000', '710000'],
      zoom: 4.4,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-min-tai', ARCHITECTURE_PLACEHOLDER, '350000', 'arch-red-brick', '红砖燕尾', ['红砖墙面和燕尾脊形成强烈轮廓。', '宗族礼制与海洋贸易共同影响装饰。', '建筑色彩与庙宇文化联系密切。', '适合作为视觉主线索。']),
        makeSignal('architecture-min-tai', ARCHITECTURE_PLACEHOLDER, '350000', 'arch-tulou', '土楼聚落', ['夯土外墙围合大型家族共同体。', '圆形或方形平面兼具防御和居住功能。', '山地环境影响聚落选址。', '适合做空间模型说明。']),
        makeSignal('architecture-min-tai', ARCHITECTURE_PLACEHOLDER, '710000', 'arch-stone-house', '石厝海风', ['沿海石材民居回应台风和盐雾环境。', '厚墙与小窗强化防护性。', '海峡两岸共享相近建筑语汇。', '适合做材料线索。']),
        makeSignal('architecture-min-tai', ARCHITECTURE_PLACEHOLDER, '350000', 'arch-temple-craft', '寺庙装饰', ['剪粘、彩绘和木雕形成繁复装饰。', '地方神祇与宗族活动塑造庙宇空间。', '山门、戏台和广场连接公共生活。', '适合纳入文化叙事卡。']),
      ],
      assets: makeAssets('architecture-min-tai', ARCHITECTURE_PLACEHOLDER, [
        province('350000', '福建红砖土楼与山海建筑线索图', [118.2, 26.2]),
        province('710000', '台湾闽系红砖与庙宇建筑线索图', [121.0, 23.7]),
      ], ARCHITECTURE_QUIZ.minTai),
      quiz: ARCHITECTURE_QUIZ.minTai,
    },
    {
      center: [103.8, 25.2],
      color: '#59a96a',
      description: '西南少数民族干栏建筑文化区以云南、贵州多民族山地聚落为核心，干栏架空、竹木构造、寨门鼓楼、风雨桥和梯田村寨共同构成生活景观。',
      id: 'architecture-southwest-stilt',
      name: '西南少数民族干栏建筑文化区',
      provinceAdcodes: ['520000', '530000'],
      zoom: 4.4,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-southwest-stilt', ARCHITECTURE_PLACEHOLDER, '530000', 'arch-stilt-house', '干栏民居', ['架空层回应潮湿、坡地和牲畜储藏。', '竹木材料便于在山地快速建造。', '空间组织体现多民族生活习俗。', '适合作为区域主热点。']),
        makeSignal('architecture-southwest-stilt', ARCHITECTURE_PLACEHOLDER, '520000', 'arch-drum-tower', '寨门鼓楼', ['寨门、鼓楼与广场组织公共生活。', '节庆、议事和仪式常在核心空间展开。', '建筑是村寨身份的视觉标志。', '适合作为社区节点线索。']),
        makeSignal('architecture-southwest-stilt', ARCHITECTURE_PLACEHOLDER, '530000', 'arch-terrace-village', '梯田村寨', ['村寨选址顺应山坡、河谷和梯田。', '民居、粮仓和道路适应高差变化。', '建筑与农耕景观构成整体系统。', '适合做地形适应卡。']),
        makeSignal('architecture-southwest-stilt', ARCHITECTURE_PLACEHOLDER, '520000', 'arch-wind-rain-bridge', '风雨桥廊', ['桥廊兼具通行、休憩和公共交往功能。', '木构榫卯和屋盖保护桥身。', '跨水节点连接村寨网络。', '适合作为桥梁建筑线索。']),
      ],
      assets: makeAssets('architecture-southwest-stilt', ARCHITECTURE_PLACEHOLDER, [
        province('520000', '贵州干栏村寨与风雨桥线索图', [106.7, 26.6]),
        province('530000', '云南多民族干栏聚落线索图', [101.5, 24.5]),
      ], ARCHITECTURE_QUIZ.southwestStilt),
      quiz: ARCHITECTURE_QUIZ.southwestStilt,
    },
    {
      center: [91.0, 40.8],
      color: '#8f70c8',
      description: '西北丝路—伊斯兰建筑文化区受绿洲城市、丝路交流和伊斯兰空间传统影响，清真寺、拱券、穹顶、土坯厚墙和几何装饰构成主要识别。',
      id: 'architecture-northwest-islamic',
      name: '西北一丝路—伊斯兰建筑文化区',
      provinceAdcodes: ['620000', '640000', '650000'],
      zoom: 3.2,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-northwest-islamic', ARCHITECTURE_PLACEHOLDER, '650000', 'arch-mosque', '清真寺院', ['礼拜空间、庭院和宣礼塔形成核心组织。', '建筑与社区日常生活紧密相连。', '绿洲城市中宗教空间识别度强。', '适合作为主热点。']),
        makeSignal('architecture-northwest-islamic', ARCHITECTURE_PLACEHOLDER, '620000', 'arch-silk-road-city', '丝路城镇', ['河西走廊连接东西交通和聚落网络。', '驿站、城堡和寺观遗构叠加出现。', '交通线路影响城镇选址和空间形态。', '适合作为历史线路说明。']),
        makeSignal('architecture-northwest-islamic', ARCHITECTURE_PLACEHOLDER, '640000', 'arch-arch-dome', '拱券穹顶', ['拱券、穹顶和几何纹样构成视觉识别。', '土坯、砖石与装饰面层回应干旱环境。', '建筑形态体现交流融合。', '适合作为构件符号卡。']),
        makeSignal('architecture-northwest-islamic', ARCHITECTURE_PLACEHOLDER, '650000', 'arch-oasis-courtyard', '绿洲院落', ['厚墙小窗适应干旱、风沙和温差。', '庭院提供遮阴与家庭生活空间。', '聚落依水源和贸易节点展开。', '适合做气候适应线索。']),
      ],
      assets: makeAssets('architecture-northwest-islamic', ARCHITECTURE_PLACEHOLDER, [
        province('620000', '甘肃河西丝路建筑线索图', [100.9, 38.1]),
        province('640000', '宁夏清真寺与院落建筑线索图', [106.15, 37.35]),
        province('650000', '新疆绿洲伊斯兰建筑线索图', [84.6, 42.5]),
      ], ARCHITECTURE_QUIZ.northwestIslamic),
      quiz: ARCHITECTURE_QUIZ.northwestIslamic,
    },
    {
      center: [91.0, 33.5],
      color: '#6f93bd',
      description: '青藏高原建筑文化区回应高寒、强日照与宗教景观，厚墙平顶、碉房、寺院、经堂、院落台地和山地聚落共同构成高原建筑谱系。',
      id: 'architecture-tibetan-plateau',
      name: '青藏高原建筑文化区',
      provinceAdcodes: ['540000', '630000'],
      zoom: 3.6,
      summaryAsset: null,
      foodItems: [
        makeSignal('architecture-tibetan-plateau', ARCHITECTURE_PLACEHOLDER, '540000', 'arch-thick-flat', '厚墙平顶', ['厚墙体提高保温和稳定性。', '平顶适应日照、晾晒和高原生活。', '小窗和内院回应高寒风环境。', '适合作为气候适应线索。']),
        makeSignal('architecture-tibetan-plateau', ARCHITECTURE_PLACEHOLDER, '540000', 'arch-monastery', '寺院台地', ['寺院常与山体、台地和聚落共同组织。', '经堂、廊院和转经路径形成宗教空间。', '建筑尺度强化圣地感。', '适合作为区域主热点。']),
        makeSignal('architecture-tibetan-plateau', ARCHITECTURE_PLACEHOLDER, '630000', 'arch-fortified-house', '碉房聚落', ['碉房强调防御、保温和垂直空间。', '石木混合构造适应高原材料条件。', '村落常依山势层叠布置。', '适合作为构造线索。']),
        makeSignal('architecture-tibetan-plateau', ARCHITECTURE_PLACEHOLDER, '630000', 'arch-color-decoration', '色彩装饰', ['白墙、红边、金顶和经幡形成高辨识色彩。', '装饰系统与宗教象征紧密相关。', '建筑与山水环境共同构成景观。', '适合作为视觉符号卡。']),
      ],
      assets: makeAssets('architecture-tibetan-plateau', ARCHITECTURE_PLACEHOLDER, [
        province('540000', '西藏寺院台地与厚墙建筑线索图', [88.6, 31.9]),
        province('630000', '青海高原碉房与寺院线索图', [96.4, 35.4]),
      ], ARCHITECTURE_QUIZ.tibetanPlateau),
      quiz: ARCHITECTURE_QUIZ.tibetanPlateau,
    },
  ],
};

const CLOTHING_PLACEHOLDER = '/assets/food/china_contour.png';

const CLOTHING_QUIZ = {
  jiangnanSilk: {
    answerIndex: 0,
    options: ['A. 丝绸织造与精细刺绣', 'B. 厚毡靴帽', 'C. 高原氆氇袍', 'D. 海神庙会服饰'],
    question: '江南丝绸服饰文化区最突出的工艺基础是什么？',
    successReward: '已点亮“江南丝绸织绣”服饰线索。',
  },
  northRitual: {
    answerIndex: 2,
    options: ['A. 海岛棉麻', 'B. 苗银盛装', 'C. 礼制袍服与寒地袍褂', 'D. 藏式氆氇'],
    question: '北方礼制服饰区常同时体现哪两类需求？',
    successReward: '已点亮“北方礼制与寒地服饰”线索。',
  },
  northwestSilkRoad: {
    answerIndex: 1,
    options: ['A. 水乡旗袍', 'B. 丝路织锦、毡靴与回族绣饰', 'C. 蜡染银饰', 'D. 岭南骑楼长衫'],
    question: '西北丝路服饰区最容易被识别的复合来源是什么？',
    successReward: '已点亮“西北丝路服饰”线索。',
  },
  southeastMaritime: {
    answerIndex: 3,
    options: ['A. 藏袍腰带', 'B. 关中袍服', 'C. 羌绣披肩', 'D. 闽粤海洋贸易与侨乡织绣'],
    question: '东南闽粤岭南服饰为何常呈现开放混合的视觉特征？',
    successReward: '已点亮“东南海洋织绣”线索。',
  },
  southwestEthnic: {
    answerIndex: 0,
    options: ['A. 银饰、蜡染、织锦与节庆盛装', 'B. 宫廷补服', 'C. 海派旗袍', 'D. 回族小帽'],
    question: '西南多民族服饰区最具展示性的视觉组合是什么？',
    successReward: '已点亮“西南多民族盛装”线索。',
  },
  tibetanPlateau: {
    answerIndex: 2,
    options: ['A. 水网丝绸', 'B. 闽南红砖纹样', 'C. 藏袍、氆氇与绿松石饰件', 'D. 海派盘扣'],
    question: '青藏高原服饰最典型的材料和配饰组合是什么？',
    successReward: '已点亮“青藏高原藏式服饰”线索。',
  },
};

const BASE_CLOTHING_CULTURE_THEME = {
  chinaAsset: {
    id: 'china-clothing-summary',
    src: CLOTHING_PLACEHOLDER,
  },
  cultureType: 'clothing',
  moduleId: 'clothing',
  copy: {
    areaCountLabel: '服饰文化区',
    areaDetailLabel: '服饰文化区详情',
    countryKicker: '中国服饰文化版图',
    countryStatus: '中国服饰文化版图视图',
    exploreLabel: '中国服饰文化区探索 ✦ React 自适应投影',
    loadingLabel: '文化地图加载中...',
    overviewTitle: '六大服饰文化区总览',
    provinceDescription: '探索省级服饰文化线索。',
    provinceLabel: '省级服饰线索',
    quizLabel: '服饰区知识问答',
    readyNotice: '服饰文化地图已就绪，等待探索',
    resetNotice: '系统成功复位：地图已恢复至默认服饰文化配置',
    returnCountryNotice: '已返回全国服饰文化大盘',
    targetAreaLabel: '目标服饰文化区',
  },
  description: '以中国省级地图为底盘，展示六类服饰文化区：北方礼制与寒地袍服、江南丝绸织绣、东南闽粤岭南海洋织绣、西南多民族盛装、西北丝路毡绣与青藏高原藏式服饰。',
  id: 'chinese-clothing-culture-map',
  name: '中国服饰文化地图',
  useImageFills: false,
  areas: [
    {
      center: [114.0, 39.0],
      color: '#c86f49',
      description: '北方礼制与寒地袍服区连接都城礼仪、家族节令与寒地生活，袍褂、云肩、盘扣、皮毛边饰和厚棉衣共同构成稳重的北方服饰气质。',
      id: 'clothing-north-ritual',
      name: '北方礼制与寒地袍服区',
      provinceAdcodes: ['110000', '120000', '130000', '140000', '150000', '210000', '220000', '230000', '370000', '410000', '610000'],
      zoom: 3.7,
      summaryAsset: null,
      foodItems: [
        makeSignal('clothing-north-ritual', CLOTHING_PLACEHOLDER, '110000', 'cloth-court-robe', '礼制袍服', ['袍服形制强调等级、礼序与场合。', '盘扣、立领和宽袖形成清晰轮廓。', '适合在地图中作为北方服饰主线索。', '可连接都城礼仪与家族节令。']),
        makeSignal('clothing-north-ritual', CLOTHING_PLACEHOLDER, '220000', 'cloth-padded-robe', '寒地袍褂', ['厚棉、皮毛和叠穿回应寒冷气候。', '宽松结构便于保暖和行动。', '东北寒地生活让服装更重防护性。', '适合做气候适应说明。']),
        makeSignal('clothing-north-ritual', CLOTHING_PLACEHOLDER, '370000', 'cloth-cloud-collar', '云肩纹样', ['云肩与刺绣承载吉祥寓意。', '礼仪、婚嫁和节庆场景常出现装饰层。', '纹样把地域审美转化为可视符号。', '适合做纹样热点。']),
      ],
      assets: makeAssets('clothing-north-ritual', CLOTHING_PLACEHOLDER, [
        province('110000', '北京礼制袍服线索图', [116.4, 40.0]),
        province('120000', '天津近代袍褂线索图', [117.2, 39.1]),
        province('130000', '河北节令服饰线索图', [115.1, 38.5]),
        province('140000', '山西晋地云肩纹样线索图', [112.5, 37.7]),
        province('150000', '内蒙古毡帽袍服线索图', [111.8, 43.8]),
        province('210000', '辽宁寒地袍褂线索图', [123.4, 41.8]),
        province('220000', '吉林皮毛棉衣线索图', [126.0, 43.8]),
        province('230000', '黑龙江寒地防护服饰线索图', [128.0, 47.2]),
        province('370000', '山东礼俗织绣线索图', [118.2, 36.4]),
        province('410000', '河南中原礼俗服饰线索图', [113.7, 34.4]),
        province('610000', '陕西关中袍服线索图', [108.8, 35.8]),
      ], CLOTHING_QUIZ.northRitual),
      quiz: CLOTHING_QUIZ.northRitual,
    },
    {
      center: [119.0, 31.2],
      color: '#2f9f9a',
      description: '江南丝绸织绣区依托水网城镇、丝织业和精细工艺，形成丝绸、缂丝、苏绣、旗袍、徽派纹样和雅致日常服饰的复合谱系。',
      id: 'clothing-jiangnan-silk',
      name: '江南丝绸织绣与海派服饰区',
      provinceAdcodes: ['310000', '320000', '330000', '340000'],
      zoom: 4.5,
      summaryAsset: null,
      foodItems: [
        makeSignal('clothing-jiangnan-silk', CLOTHING_PLACEHOLDER, '320000', 'cloth-silk-weave', '丝绸织造', ['丝绸织造奠定轻薄、细腻的材料基础。', '水网市镇与手工业推动纹样迭代。', '适合作为江南服饰主线索。', '可连接苏绣、缂丝和成衣。']),
        makeSignal('clothing-jiangnan-silk', CLOTHING_PLACEHOLDER, '310000', 'cloth-haipai-qipao', '海派旗袍', ['近代都市审美改变服装剪裁。', '盘扣、滚边和修身线条形成识别。', '海派服饰体现传统与现代的转换。', '适合做城市服饰热点。']),
        makeSignal('clothing-jiangnan-silk', CLOTHING_PLACEHOLDER, '340000', 'cloth-hui-embroidery', '徽派纹样', ['徽州纹样常与家族礼俗、厅堂审美连接。', '刺绣和织纹体现细密装饰趣味。', '白墙黛瓦环境影响服饰色彩想象。', '适合做纹样信息卡。']),
      ],
      assets: makeAssets('clothing-jiangnan-silk', CLOTHING_PLACEHOLDER, [
        province('310000', '上海海派旗袍线索图', [121.45, 31.2]),
        province('320000', '江苏苏绣丝绸线索图', [119.3, 32.7]),
        province('330000', '浙江丝绸织造线索图', [120.1, 29.2]),
        province('340000', '安徽徽派纹样线索图', [117.2, 31.8]),
      ], CLOTHING_QUIZ.jiangnanSilk),
      quiz: CLOTHING_QUIZ.jiangnanSilk,
    },
    {
      center: [116.5, 23.8],
      color: '#d35f8f',
      description: '东南闽粤岭南海洋织绣区受海贸、侨乡、宗族礼俗和湿热气候影响，红黑织绣、香云纱、广绣、海岛棉麻与中西混合剪裁并置。',
      id: 'clothing-southeast-maritime',
      name: '东南闽粤岭南海洋织绣区',
      provinceAdcodes: ['350000', '440000', '460000', '710000', '810000', '820000'],
      zoom: 4.3,
      summaryAsset: null,
      foodItems: [
        makeSignal('clothing-southeast-maritime', CLOTHING_PLACEHOLDER, '350000', 'cloth-min-embroidery', '闽系织绣', ['闽系织绣与宗族礼俗、庙会节庆紧密相关。', '高饱和色彩和纹样边饰形成强识别。', '海峡交流让服饰语言跨区域流动。', '适合作为闽台线索。']),
        makeSignal('clothing-southeast-maritime', CLOTHING_PLACEHOLDER, '440000', 'cloth-lingnan-gauze', '香云纱广绣', ['香云纱回应岭南湿热环境。', '广绣强调细密针法和华丽色彩。', '侨乡网络带来开放混合的审美。', '适合做材质工艺热点。']),
        makeSignal('clothing-southeast-maritime', CLOTHING_PLACEHOLDER, '460000', 'cloth-island-cotton', '海岛棉麻', ['轻薄棉麻适应海岛气候。', '服饰与渔业、迁徙和节庆活动相连。', '热带色彩让纹样更明亮。', '适合做气候适应说明。']),
      ],
      assets: makeAssets('clothing-southeast-maritime', CLOTHING_PLACEHOLDER, [
        province('350000', '福建闽系织绣线索图', [118.2, 26.2]),
        province('440000', '广东香云纱广绣线索图', [113.3, 23.35]),
        province('460000', '海南海岛棉麻线索图', [110.3, 19.2]),
        province('710000', '台湾闽台礼俗服饰线索图', [121.0, 23.7]),
        province('810000', '香港海派中西服饰线索图', [114.18, 22.34]),
        province('820000', '澳门中西混合服饰线索图', [113.56, 22.18]),
      ], CLOTHING_QUIZ.southeastMaritime),
      quiz: CLOTHING_QUIZ.southeastMaritime,
    },
    {
      center: [108.0, 27.0],
      color: '#6ba65d',
      description: '西南多民族银饰蜡染区以山地村寨、多民族节庆和手工艺传承为核心，苗银、蜡染、织锦、挑花、羌绣和彝绣共同构成高密度视觉系统。',
      id: 'clothing-southwest-ethnic',
      name: '西南多民族银饰蜡染区',
      provinceAdcodes: ['360000', '420000', '430000', '450000', '500000', '510000', '520000', '530000'],
      zoom: 4.1,
      summaryAsset: null,
      foodItems: [
        makeSignal('clothing-southwest-ethnic', CLOTHING_PLACEHOLDER, '520000', 'cloth-miao-silver', '苗银盛装', ['银饰在节庆和仪式中形成强视觉中心。', '头饰、胸饰和衣片共同表达身份。', '金属光泽适合做地图高亮图像。', '可作为西南服饰主热点。']),
        makeSignal('clothing-southwest-ethnic', CLOTHING_PLACEHOLDER, '530000', 'cloth-batik', '蜡染织锦', ['蜡染用蓝白对比构成鲜明纹样。', '织锦和挑花记录族群记忆。', '图案常连接山水、祖先和日常生活。', '适合做纹样工艺说明。']),
        makeSignal('clothing-southwest-ethnic', CLOTHING_PLACEHOLDER, '510000', 'cloth-qiang-yi', '羌绣彝绣', ['羌绣、彝绣重视色块和几何纹样。', '披肩、腰带和头饰回应山地生活。', '川渝边地让多种服饰系统交汇。', '适合做山地服饰线索。']),
      ],
      assets: makeAssets('clothing-southwest-ethnic', CLOTHING_PLACEHOLDER, [
        province('360000', '江西赣南挑花线索图', [115.8, 27.7]),
        province('420000', '湖北土家织锦线索图', [112.5, 30.8]),
        province('430000', '湖南苗瑶织绣线索图', [111.8, 27.6]),
        province('450000', '广西壮锦瑶绣线索图', [108.5, 23.7]),
        province('500000', '重庆山地织绣线索图', [107.45, 30.0]),
        province('510000', '四川羌绣彝绣线索图', [102.8, 30.2]),
        province('520000', '贵州苗银蜡染线索图', [106.7, 26.6]),
        province('530000', '云南多民族织锦线索图', [101.5, 24.5]),
      ], CLOTHING_QUIZ.southwestEthnic),
      quiz: CLOTHING_QUIZ.southwestEthnic,
    },
    {
      center: [91.5, 40.5],
      color: '#8f77c9',
      description: '西北丝路毡绣区受绿洲贸易、游牧生活和多民族交流影响，艾德莱斯绸、毡帽毡靴、回族绣饰、几何纹样和长袍腰带构成主识别。',
      id: 'clothing-northwest-silk-road',
      name: '西北丝路毡绣服饰区',
      provinceAdcodes: ['620000', '640000', '650000'],
      zoom: 3.2,
      summaryAsset: null,
      foodItems: [
        makeSignal('clothing-northwest-silk-road', CLOTHING_PLACEHOLDER, '650000', 'cloth-atlas-silk', '艾德莱斯绸', ['丝路交流塑造鲜明的彩条织物。', '绿洲市集让纹样和材料持续流动。', '色彩节奏适合作为地图纹理。', '可作为新疆主热点。']),
        makeSignal('clothing-northwest-silk-road', CLOTHING_PLACEHOLDER, '620000', 'cloth-felt-boots', '毡帽毡靴', ['毡制品回应干旱、风沙和温差。', '帽靴和长袍形成完整防护系统。', '游牧与绿洲生活共同影响造型。', '适合做气候适应线索。']),
        makeSignal('clothing-northwest-silk-road', CLOTHING_PLACEHOLDER, '640000', 'cloth-hui-cap-embroidery', '回族绣饰', ['回族服饰强调简洁、洁净和局部装饰。', '小帽、围巾和绣饰形成日常识别。', '几何纹样适合转化为 UI 图案。', '适合做纹样卡片。']),
      ],
      assets: makeAssets('clothing-northwest-silk-road', CLOTHING_PLACEHOLDER, [
        province('620000', '甘肃丝路毡绣线索图', [100.9, 38.1]),
        province('640000', '宁夏回族绣饰线索图', [106.15, 37.35]),
        province('650000', '新疆艾德莱斯绸线索图', [84.6, 42.5]),
      ], CLOTHING_QUIZ.northwestSilkRoad),
      quiz: CLOTHING_QUIZ.northwestSilkRoad,
    },
    {
      center: [91.0, 33.5],
      color: '#6695bf',
      description: '青藏高原藏式服饰区回应高寒、强日照和游牧生活，藏袍、氆氇、围裙、腰带、绿松石饰件与靴帽系统共同构成高原服饰景观。',
      id: 'clothing-tibetan-plateau',
      name: '青藏高原藏式服饰区',
      provinceAdcodes: ['540000', '630000'],
      zoom: 3.6,
      summaryAsset: null,
      foodItems: [
        makeSignal('clothing-tibetan-plateau', CLOTHING_PLACEHOLDER, '540000', 'cloth-chuba', '藏袍结构', ['藏袍适合昼夜温差和游牧活动。', '腰带、袖部和叠穿方式形成可调节结构。', '服装与高原生活节律紧密相关。', '适合作为主热点。']),
        makeSignal('clothing-tibetan-plateau', CLOTHING_PLACEHOLDER, '630000', 'cloth-pulu', '氆氇织物', ['氆氇提供保暖和耐用的材料基础。', '织物色彩和纹理连接地域身份。', '适合在地图块中表现材料质感。', '可作为工艺说明。']),
        makeSignal('clothing-tibetan-plateau', CLOTHING_PLACEHOLDER, '540000', 'cloth-turquoise', '绿松石饰件', ['绿松石、珊瑚和金属饰件具有强装饰性。', '配饰在节庆和礼仪中强化身份表达。', '高原色彩适合做视觉记忆点。', '适合做详情图板。']),
      ],
      assets: makeAssets('clothing-tibetan-plateau', CLOTHING_PLACEHOLDER, [
        province('540000', '西藏藏袍氆氇线索图', [88.6, 31.9]),
        province('630000', '青海藏式饰件线索图', [96.4, 35.4]),
      ], CLOTHING_QUIZ.tibetanPlateau),
      quiz: CLOTHING_QUIZ.tibetanPlateau,
    },
  ],
};

const FOOD_PROVINCES = {
  '110000': { coordinates: [116.4, 40.2], dish: '北京烤鸭', name: '北京', title: '帝都烤鸭涮羊肉图' },
  '120000': { coordinates: [117.2, 39.12], dish: '煎饼馃子', name: '天津', title: '津门麻花煎饼馃图' },
  '130000': { coordinates: [114.48, 38.03], dish: '驴肉火烧', name: '河北', title: '直隶驴肉火烧图' },
  '140000': { coordinates: [112.55, 37.87], dish: '刀削面', name: '山西', title: '三晋老醋面点图' },
  '150000': { coordinates: [111.67, 40.82], dish: '手把肉', name: '内蒙古', title: '草原手把肉奶茶图' },
  '210000': { coordinates: [123.43, 41.8], dish: '锅包肉', name: '辽宁', title: '辽沈锅包肉鸡架图' },
  '220000': { coordinates: [125.32, 43.9], dish: '延边冷面', name: '吉林', title: '吉林延边冷面打糕图' },
  '230000': { coordinates: [126.64, 45.75], dish: '哈尔滨红肠', name: '黑龙江', title: '黑龙江红肠炖菜图' },
  '310000': { coordinates: [121.47, 31.23], dish: '小笼汤包', name: '上海', title: '沪上小笼生煎图' },
  '320000': { coordinates: [119.78, 33.04], dish: '金陵盐水鸭', name: '江苏', title: '金陵盐水板鸭图' },
  '330000': { coordinates: [120.15, 29.18], dish: '西湖醋鱼', name: '浙江', title: '西湖醋鱼东坡肉图' },
  '340000': { coordinates: [117.27, 31.86], dish: '徽州毛豆腐', name: '安徽', title: '徽州毛豆腐臭鳜鱼图' },
  '350000': { coordinates: [119.3, 26.08], dish: '佛跳墙', name: '福建', title: '福建佛跳墙沙茶面图' },
  '360000': { coordinates: [115.85, 28.68], dish: '南昌拌粉', name: '江西', title: '江西拌粉瓦罐汤图' },
  '370000': { coordinates: [117, 36.65], dish: '九转大肠', name: '山东', title: '齐鲁九转大肠葱海参图' },
  '410000': { coordinates: [113.65, 34.76], dish: '胡辣汤', name: '河南', title: '中原烩面胡辣汤图' },
  '420000': { coordinates: [114.3, 30.6], dish: '热干面', name: '湖北', title: '荆楚热干面藕汤图' },
  '430000': { coordinates: [112.98, 28.2], dish: '剁椒鱼头', name: '湖南', title: '湖湘剁椒鱼头臭豆腐图' },
  '440000': { coordinates: [113.25, 23.1], dish: '水晶虾饺', name: '广东', title: '广式烧腊水晶虾饺图' },
  '450000': { coordinates: [108.32, 22.81], dish: '柳州螺蛳粉', name: '广西', title: '柳州螺蛳粉桂林米粉图' },
  '460000': { coordinates: [110.35, 19], dish: '文昌鸡', name: '海南', title: '椰风文昌鸡清补凉图' },
  '500000': { coordinates: [108.3, 29.5], dish: '九宫火锅', name: '重庆', title: '山城九宫火锅图' },
  '510000': { coordinates: [103, 30.5], dish: '麻婆豆腐', name: '四川', title: '巴蜀天府麻辣图' },
  '520000': { coordinates: [106.71, 26.57], dish: '酸汤鱼', name: '贵州', title: '黔味酸汤辣子鸡图' },
  '530000': { coordinates: [102.72, 25.04], dish: '过桥米线', name: '云南', title: '云南米线菌菇图' },
  '540000': { coordinates: [91.13, 29.65], dish: '酥油茶', name: '西藏', title: '西藏酥油茶牦牛肉图' },
  '610000': { coordinates: [108.95, 34.27], dish: '腊汁肉夹馍', name: '陕西', title: '三秦凉皮肉夹馍图' },
  '620000': { coordinates: [103.82, 36.06], dish: '牛肉拉面', name: '甘肃', title: '陇上牛肉拉面图' },
  '630000': { coordinates: [101.78, 36.62], dish: '青海尕面片', name: '青海', title: '高原尕面片羊肉图' },
  '640000': { coordinates: [106.27, 38.47], dish: '滩羊手抓', name: '宁夏', title: '塞上滩羊八宝茶图' },
  '650000': { coordinates: [87.68, 43.77], dish: '新疆大盘鸡', name: '新疆', title: '西域大盘鸡烤串图' },
  '710000': { coordinates: [121.56, 25.04], dish: '卤肉饭', name: '台湾', title: '台湾卤肉饭夜市图' },
  '810000': { coordinates: [114.17, 22.28], dish: '丝袜奶茶', name: '香港', title: '港式茶餐厅风情图' },
  '820000': { coordinates: [113.54, 22.19], dish: '葡式蛋挞', name: '澳门', title: '澳门葡挞猪扒包图' },
};

const foodImage = (adcode) => `/assets/food/${adcode}-food-ai.png`;

const foodProcess = (meta) => [
  `精选${meta.name}代表食材`,
  `围绕${meta.dish}处理主味`,
  '用地方调味和火候形成标志口感',
  '生成省级美食图鉴线索',
];

const foodQuiz = (name, dish) => ({
  answerIndex: 1,
  options: ['A. 只看餐具形制', `B. ${dish}与地方食材、火候和调味`, 'C. 完全脱离地域物产', 'D. 只按现代快餐分类'],
  question: `${name}美食线索最应该从哪一组信息理解？`,
  successReward: `已点亮“${name}${dish}”美食线索。`,
});

const makeFoodArea = ({
  center,
  color,
  description,
  id,
  name,
  provinceAdcodes,
  summarySrc,
  summaryTitle,
  zoom,
}) => {
  const areaQuiz = foodQuiz(name, FOOD_PROVINCES[provinceAdcodes[0]]?.dish || '地方风味');
  return {
    center,
    color,
    description,
    id,
    name,
    provinceAdcodes,
    zoom,
    summaryAsset: {
      coordinates: center,
      id: `summary-${id}`,
      size: { height: 160, width: 220 },
      src: summarySrc,
      title: summaryTitle,
      type: 'image',
    },
    foodItems: provinceAdcodes.map((adcode) => {
      const meta = FOOD_PROVINCES[adcode];
      return {
        detailImage: foodImage(adcode),
        id: `food-${adcode}`,
        image: foodImage(adcode),
        name: meta.dish,
        objectPosition: '50% 50%',
        process: foodProcess(meta),
        provinceAdcode: adcode,
      };
    }),
    assets: provinceAdcodes.map((adcode) => {
      const meta = FOOD_PROVINCES[adcode];
      return {
        areaId: id,
        coordinates: meta.coordinates,
        id: `${id}-${adcode}`,
        provinceAdcode: adcode,
        quiz: foodQuiz(meta.name, meta.dish),
        size: { height: 130, width: 180 },
        src: foodImage(adcode),
        title: meta.title,
        type: 'image',
      };
    }),
    quiz: areaQuiz,
  };
};

const BASE_CULINARY_CULTURE_THEME = {
  chinaAsset: {
    id: 'china-food-summary',
    src: '/assets/food/china-food-ai.png',
  },
  cultureType: 'food',
  moduleId: 'food',
  copy: {
    areaCountLabel: '美食文化区',
    areaDetailLabel: '美食文化区详情',
    countryKicker: '中国美食文化版图',
    countryStatus: '中国美食文化版图视图',
    exploreLabel: '中国美食文化区探索 ✦ React 自适应投影',
    loadingLabel: '美食地图加载中...',
    overviewTitle: '十大美食文化区总览',
    provinceDescription: '探索省级美食文化线索。',
    provinceLabel: '省级美食线索',
    quizLabel: '美食区知识问答',
    readyNotice: '美食文化地图已就绪，等待探索',
    resetNotice: '系统成功复位：地图已恢复至默认美食文化配置',
    returnCountryNotice: '已返回全国美食文化大盘',
    targetAreaLabel: '目标美食文化区',
  },
  description: '以中国省级地图为底盘，展示十大地域美食文化区，串联川渝麻辣、江南鲜食、岭南早茶、西北面食、北方宴席、黔味酸辣、东北炖菜、闽台山海、荆楚湖湘与云藏高原风物。',
  id: 'chinese-food-culture-map',
  name: '中国美食文化地图',
  useImageFills: true,
  areas: [
    makeFoodArea({
      center: [104.7, 30.4],
      color: '#e65d4f',
      description: '麻辣火锅、豆花、串串与江湖菜共同构成热烈的川渝味觉，麻辣鲜香间显现巴蜀人爽朗炙热的性格。',
      id: 'sichuan-chongqing-food',
      name: '川渝麻辣美食区',
      provinceAdcodes: ['500000', '510000'],
      summarySrc: '/assets/food/sichuan-chongqing-food-summary.png',
      summaryTitle: '巴蜀川渝美食汇',
      zoom: 4.8,
    }),
    makeFoodArea({
      center: [119.6, 31.2],
      color: '#2a9d8f',
      description: '小笼、汤包、糕团、鲜食与水乡风物形成细腻温润的江南食谱。',
      id: 'jiangnan-snack-food',
      name: '江南点心鲜食区',
      provinceAdcodes: ['310000', '320000', '330000', '340000'],
      summarySrc: '/assets/food/jiangnan-snack-food-summary.png',
      summaryTitle: '江南水乡鲜食汇',
      zoom: 4.2,
    }),
    makeFoodArea({
      center: [113.9, 22.8],
      color: '#f4a261',
      description: '早茶、烧腊、海味与骑楼市井串联出烟火气十足的岭南餐桌。',
      id: 'lingnan-dim-sum-food',
      name: '岭南早茶海味区',
      provinceAdcodes: ['440000', '450000', '460000', '810000', '820000'],
      summarySrc: '/assets/food/lingnan-dim-sum-food-summary.png',
      summaryTitle: '岭南早茶海味汇',
      zoom: 4.0,
    }),
    makeFoodArea({
      center: [95.6, 38.9],
      color: '#d6a84f',
      description: '面食、羊肉、香料与绿洲集市让西北味道有清晰的地理线索。',
      id: 'northwest-noodle-food',
      name: '西北面食香料区',
      provinceAdcodes: ['610000', '620000', '630000', '640000', '650000'],
      summarySrc: '/assets/food/northwest-noodle-food-summary.png',
      summaryTitle: '丝路塞外香料汇',
      zoom: 3.0,
    }),
    makeFoodArea({
      center: [114.2, 37.1],
      color: '#457b9d',
      description: '面点、鲁菜、豫菜与宴席传统共同组成北方餐桌骨架。',
      id: 'northern-banquet-food',
      name: '北方宴席面点区',
      provinceAdcodes: ['110000', '120000', '130000', '140000', '370000', '410000'],
      summarySrc: '/assets/food/northern-banquet-food-summary.png',
      summaryTitle: '燕赵齐鲁宴席汇',
      zoom: 3.8,
    }),
    makeFoodArea({
      center: [106.7, 26.6],
      color: '#ad2831',
      description: '酸汤鱼、辣子鸡、折耳根与肠旺面共同串起贵州山水间的酸辣滋味。',
      id: 'guizhou-sour-spicy-food',
      name: '黔味酸辣美食区',
      provinceAdcodes: ['520000'],
      summarySrc: '/assets/food/guizhou-food-ai.png',
      summaryTitle: '黔味山水酸辣汇',
      zoom: 5.2,
    }),
    makeFoodArea({
      center: [123.5, 44.6],
      color: '#8ab17d',
      description: '炖菜、杂粮、乳肉与冰雪市集构成北疆与东北的厚实风味。',
      id: 'northeast-grain-stew-food',
      name: '东北草原炖菜区',
      provinceAdcodes: ['150000', '210000', '220000', '230000'],
      summarySrc: '/assets/food/northeast-grain-stew-food-summary.png',
      summaryTitle: '东北草原炖菜汇',
      zoom: 3.2,
    }),
    makeFoodArea({
      center: [117.8, 25.8],
      color: '#6d597a',
      description: '山海物产、米粉汤头、红糟沙茶与宝岛夜市相连，形成东南沿海轻巧鲜香的饮食脉络。',
      id: 'southeast-mintai-gan-food',
      name: '闽台赣山海米粉区',
      provinceAdcodes: ['350000', '360000', '710000'],
      summarySrc: '/assets/food/southeast-mintai-gan-food-summary.png',
      summaryTitle: '闽台赣山海米粉汇',
      zoom: 4.0,
    }),
    makeFoodArea({
      center: [112.4, 29.5],
      color: '#d62828',
      description: '江湖湖鲜、莲藕汤、剁椒腊味与夜市烟火交织出荆楚湖湘的热辣鲜香。',
      id: 'jingchu-huxiang-food',
      name: '荆楚湖湘热辣区',
      provinceAdcodes: ['420000', '430000'],
      summarySrc: '/assets/food/jingchu-huxiang-food-summary.png',
      summaryTitle: '荆楚湖湘热辣汇',
      zoom: 4.6,
    }),
    makeFoodArea({
      center: [95.6, 28.6],
      color: '#9d4edd',
      description: '菌菇、米线、牦牛肉、酥油茶与高原物产共同组成云藏风物。',
      id: 'yunnan-tibet-highland-food',
      name: '云藏高原风物区',
      provinceAdcodes: ['530000', '540000'],
      summarySrc: '/assets/food/yunnan-tibet-highland-food-summary.png',
      summaryTitle: '云藏高原风物汇',
      zoom: 3.4,
    }),
  ],
};

export const DEFAULT_FOOD_THEME = applyGeneratedCultureImages(BASE_FOOD_THEME, 'religion');

export const ARCHITECTURE_CULTURE_THEME = applyGeneratedCultureImages(BASE_ARCHITECTURE_CULTURE_THEME, 'architecture');

export const CLOTHING_CULTURE_THEME = applyGeneratedCultureImages(BASE_CLOTHING_CULTURE_THEME, 'clothing');

export const CULINARY_CULTURE_THEME = BASE_CULINARY_CULTURE_THEME;

export const DEFAULT_CULTURE_THEME_ID = 'religion';

export const CULTURE_THEME_OPTIONS = [
  {
    accent: '#e65d4f',
    description: '十大美食文化区',
    id: 'food',
    label: '美食',
    notice: '已切换至美食文化地图',
  },
  {
    accent: '#d4af37',
    description: '六大信仰文化区',
    id: 'religion',
    label: '宗教',
    notice: '已切换至宗教信仰文化地图',
  },
  {
    accent: '#5fb3b3',
    description: '九大建筑文化区',
    id: 'architecture',
    label: '建筑',
    notice: '已切换至建筑文化地图',
  },
  {
    accent: '#d35f8f',
    description: '六大服饰文化区',
    id: 'clothing',
    label: '服饰',
    notice: '已切换至服饰文化地图',
  },
];

export const CULTURE_THEMES = {
  architecture: ARCHITECTURE_CULTURE_THEME,
  clothing: CLOTHING_CULTURE_THEME,
  food: CULINARY_CULTURE_THEME,
  religion: DEFAULT_FOOD_THEME,
};

export function getCultureThemeById(themeId = DEFAULT_CULTURE_THEME_ID) {
  return CULTURE_THEMES[themeId] || CULTURE_THEMES[DEFAULT_CULTURE_THEME_ID];
}

export const FLOW_STEPS = [
  { id: 'select', label: '① 选区' },
  { id: 'prompt', label: '② 画词' },
  { id: 'asset', label: '③ 绑定' },
  { id: 'save', label: '④ 保存' },
];

export function cloneTheme(theme = DEFAULT_FOOD_THEME) {
  return JSON.parse(JSON.stringify(theme));
}

export function getAreaById(theme, areaId) {
  return theme.areas.find((area) => area.id === areaId) || theme.areas[0];
}

export function buildProvinceAreaMap(theme) {
  const lookup = new Map();
  theme.areas.forEach((area) => {
    area.provinceAdcodes.forEach((adcode) => lookup.set(String(adcode), area));
  });
  return lookup;
}
