/**
 * 宗教信仰文化区交互地图配置
 *
 * 为了少动学长已经写好的交互框架，暂时保留 DEFAULT_FOOD_THEME、
 * foodItems 等字段名；页面展示内容已经切换为宗教信仰文化主题。
 */

export const STORAGE_KEY = 'agy-religion-culture-map-v1';

const BOARD = {
  bashu: '/assets/religion/boards/04-bashu-local-gods-buddhist-daoist.png',
  coast: '/assets/religion/boards/02-jiangnan-southeast-coastal-folk-deities.png',
  nature: '/assets/religion/boards/03-central-southwest-shamanic-nuo-nature.png',
  north: '/assets/religion/boards/01-north-ancestor-ritual-confucian-buddhist-daoist.png',
  northwest: '/assets/religion/boards/05-northwest-islamic-silk-road-oasis.png',
  tibet: '/assets/religion/boards/06-qinghai-tibet-tibetan-buddhism.png',
};

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
  src,
  title: item.title,
  type: 'image',
});

const makeAssets = (areaId, src, items, quiz) => items.map((item) => makeAsset(areaId, src, item, quiz));

const makeSignal = (areaId, src, provinceAdcode, id, name, process) => ({
  accent: undefined,
  id,
  image: src,
  name,
  objectPosition: '50% 50%',
  process,
  provinceAdcode,
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

export const DEFAULT_FOOD_THEME = {
  chinaAsset: {
    id: 'china-religion-summary',
    src: BOARD.north,
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
