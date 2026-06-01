/**
 * ==========================================
 * 全新国风美食交互地图配置文件 (AIGC比赛_agy)
 * ==========================================
 */

// 本地持久化缓存地图状态的 localStorage key 键名
export const STORAGE_KEY = 'agy-culture-map-v6';

// 初始默认的川渝火锅 AI 绘图资源配置
export const FOOD_IMAGE_ASSET = {
  areaId: 'sichuan-chongqing-food',
  coordinates: [104.7, 30.4], // 川渝经纬度坐标
  id: 'asset-sichuan-hotpot-ai',
  size: { height: 160, width: 260 },
  src: '/assets/food/510000-food-ai.png',
  title: '川渝火锅 AI 图像',
  type: 'image',
};

// 预设六大美食文化区及关联的省级行政 adcode
// 每一个区域均精心定制了主题色、中心坐标、缩放级别以及国风趣味答题题库
export const DEFAULT_FOOD_THEME = {
  cultureType: 'food',
  moduleId: 'food',
  chinaAsset: {
    id: 'china-food-summary',
    src: '/assets/food/china-food-ai.png',
  },
  description: '重构暗色国风设计，用智能地图探寻华夏大地传统地域美食与人文典故。',
  features: {
    aiRegionFill: false,
    itemPins: true,
    itemSpotlight: true,
  },
  id: 'chinese-food-map-agy',
  labels: {
    countryTitle: '可交互中国美食地图',
    mapSubtitle: '地图轮廓 / 食物小图点位优先',
    sidebarTitle: '华夏珍馐文化地图',
    topbarMeta: 'Interactive Culture Map',
  },
  name: '华夏珍馐文化地图',
  areas: [
    {
      center: [104.7, 30.4],
      color: '#e63946', // 朱砂红 (川渝麻辣)
      description: '麻辣火锅、豆花、串串与江湖菜共同构成热烈的川渝味觉，麻辣鲜香间显现巴蜀人豪爽炙热的性格。',
      id: 'sichuan-chongqing-food',
      name: '川渝麻辣美食区',
      provinceAdcodes: ['500000', '510000'], // 重庆市、四川省
      zoom: 4.8,
      summaryAsset: {
        coordinates: [104.7, 30.4],
        id: 'summary-sichuan-chongqing-food',
        size: { height: 160, width: 220 },
        src: '/assets/food/sichuan-chongqing-food-summary.png',
        title: '巴蜀川渝美食汇',
        type: 'image',
      },
      // 每个文化小图都可以独立指定地图点位和选中后的弹出位置。
      itemPlacements: {
        'sichuan-hotpot-bowl': {
          pin: { x: '82%', y: '24%' },
          spotlight: { x: '74%', y: '42%' },
        },
        'mapo-tofu': {
          pin: { x: '88%', y: '42%' },
          spotlight: { x: '74%', y: '58%' },
        },
        'chongqing-noodle': {
          pin: { x: '17%', y: '38%' },
          spotlight: { x: '30%', y: '54%' },
        },
        'twice-cooked-pork': {
          pin: { x: '22%', y: '66%' },
          spotlight: { x: '34%', y: '74%' },
        },
      },
      foodItems: [
        {
          id: 'sichuan-hotpot-bowl',
          name: '九宫火锅',
          image: '/assets/food/500000-food-ai.png',
          provinceAdcode: '500000',
          objectPosition: '52% 50%',
          process: ['炒香牛油底料', '倒入红汤烧沸', '分格涮烫毛肚鸭肠', '蘸蒜泥香油入口'],
        },
        {
          id: 'mapo-tofu',
          name: '麻婆豆腐',
          image: '/assets/food/510000-food-ai.png',
          provinceAdcode: '510000',
          objectPosition: '48% 52%',
          process: ['豆腐切块焯水', '豆瓣酱炒出红油', '下牛肉末与豆腐轻烧', '撒花椒面和蒜苗'],
        },
        {
          id: 'chongqing-noodle',
          name: '重庆小面',
          image: '/assets/food/500000-food-ai.png',
          provinceAdcode: '500000',
          objectPosition: '58% 48%',
          process: ['碗底调红油花椒', '面条煮至筋道', '浇入高汤拌匀', '铺青菜花生碎'],
        },
        {
          id: 'twice-cooked-pork',
          name: '回锅肉',
          image: '/assets/food/510000-food-ai.png',
          provinceAdcode: '510000',
          objectPosition: '42% 56%',
          process: ['五花肉煮熟切片', '锅中煸出灯盏窝', '豆瓣甜面酱同炒', '下蒜苗快炒出锅'],
        },
      ],
      assets: [
        {
          areaId: 'sichuan-chongqing-food',
          provinceAdcode: '510000',
          coordinates: [103.0, 30.5], // 四川中心
          id: 'asset-sichuan-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/510000-food-ai.png',
          title: '巴蜀天府美食图',
          type: 'image',
          quiz: {
            question: '四川名菜“回锅肉”在烹饪时，通常会加入以下哪种四川极富盛名的豆瓣酱来调味增香？',
            options: ['A. 郫县豆瓣酱', 'B. 临沂豆瓣酱', 'C. 贵州油辣椒豆瓣', 'D. 广东海鲜酱'],
            answerIndex: 0,
            successReward: '挑战成功！已点亮“四川回锅肉图鉴” 🎯'
          }
        },
        {
          areaId: 'sichuan-chongqing-food',
          provinceAdcode: '500000',
          coordinates: [108.3, 29.5], // 重庆中心
          id: 'asset-chongqing-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/500000-food-ai.png',
          title: '山城九宫火锅图',
          type: 'image',
          quiz: {
            question: '重庆老火锅著名的“九宫格”设计，在传统的码头文化中，其最初的主要作用是什么？',
            options: ['A. 方便区分食材成熟时间', 'B. 方便不同食客拼桌与算账', 'C. 增加火锅的艺术美感', 'D. 减少木炭的火力损耗'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“重庆九宫格图鉴” 🎯'
          }
        }
      ],
      quiz: {
        question: '四川火锅之所以有极其浓厚的麻辣醇厚口感，除了辣椒外，主要使用了哪种四川特产的顶级麻味香料？',
        options: ['A. 大红袍花椒', 'B. 汉源贡椒', 'C. 广西八角', 'D. 云南木姜子'],
        answerIndex: 1,
        successReward: '解锁成功！您已集齐“巴蜀火锅图鉴”'
      }
    },
    {
      center: [119.6, 31.2],
      color: '#2a9d8f', // 黛绿色 (江南水乡)
      description: '小笼、汤包、糕团、鲜食与水乡风物形成细腻温润的江南食谱，诉说着吴侬软语里的江南温婉。',
      id: 'jiangnan-snack-food',
      name: '江南点心鲜食区',
      provinceAdcodes: ['310000', '320000', '330000', '340000'], // 上海市、江苏省、浙江省、安徽省
      zoom: 4.2,
      summaryAsset: {
        coordinates: [119.6, 31.2],
        id: 'summary-jiangnan-snack-food',
        size: { height: 160, width: 220 },
        src: '/assets/food/jiangnan-snack-food-summary.png',
        title: '江南水乡鲜食汇',
        type: 'image',
      },
      foodItems: [
        {
          id: 'xiaolongbao',
          name: '小笼汤包',
          image: '/assets/food/310000-food-ai.png',
          provinceAdcode: '310000',
          objectPosition: '52% 52%',
          process: ['猪皮冻拌入肉馅', '擀薄皮包出褶纹', '旺火蒸至汤汁充盈', '蘸姜丝香醋品尝'],
        },
        {
          id: 'salted-duck',
          name: '金陵盐水鸭',
          image: '/assets/food/320000-food-ai.png',
          provinceAdcode: '320000',
          objectPosition: '48% 48%',
          process: ['鸭身抹盐花椒', '低温腌透入味', '清卤小火浸熟', '冷却斩件装盘'],
        },
        {
          id: 'west-lake-fish',
          name: '西湖醋鱼',
          image: '/assets/food/330000-food-ai.png',
          provinceAdcode: '330000',
          objectPosition: '54% 48%',
          process: ['鲜鱼改刀汆熟', '姜末入锅调糖醋汁', '薄芡淋到鱼身', '趁热保持鲜嫩'],
        },
        {
          id: 'huizhou-tofu',
          name: '徽州毛豆腐',
          image: '/assets/food/340000-food-ai.png',
          provinceAdcode: '340000',
          objectPosition: '46% 54%',
          process: ['毛豆腐轻拍干粉', '平锅煎至两面金黄', '刷辣酱撒葱花', '外酥内嫩趁热吃'],
        },
      ],
      assets: [
        {
          areaId: 'jiangnan-snack-food',
          provinceAdcode: '310000',
          coordinates: [121.47, 31.23], // 上海中心
          id: 'asset-shanghai-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/310000-food-ai.png',
          title: '沪上小笼生煎图',
          type: 'image',
          quiz: {
            question: '上海经典小吃“生煎馒头”（生煎包）在出锅时，传统上会撒上以下哪组配料来增香增色？',
            options: ['A. 翠绿香菜末与干辣椒粉', 'B. 香浓黑白芝麻与翠绿小葱花', 'C. 秘制酱油膏与金黄蒜蓉', 'D. 油炸花生碎与白胡椒粉'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“沪上生煎图鉴” 🎯'
          }
        },
        {
          areaId: 'jiangnan-snack-food',
          provinceAdcode: '320000',
          coordinates: [119.78, 33.04], // 江苏中心
          id: 'asset-jiangsu-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/320000-food-ai.png',
          title: '金陵盐水板鸭图',
          type: 'image',
          quiz: {
            question: '著名淮扬菜“大煮干丝”极为考究刀工，通常要求把豆腐干片成几十片后再切丝，其主要原料豆腐干属于什么类型？',
            options: ['A. 软嫩的水豆腐', 'B. 质地绵密的百页豆腐', 'C. 特制的金陵方干或白干', 'D. 经过发酵的毛豆腐'],
            answerIndex: 2,
            successReward: '挑战成功！已点亮“淮扬干丝图鉴” 🎯'
          }
        },
        {
          areaId: 'jiangnan-snack-food',
          provinceAdcode: '330000',
          coordinates: [120.15, 29.18], // 浙江中心
          id: 'asset-zhejiang-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/330000-food-ai.png',
          title: '西湖醋鱼东坡图',
          type: 'image',
          quiz: {
            question: '名菜“西湖醋鱼”通常选用的主要淡水鱼类原料是以下哪一种？',
            options: ['A. 鲜美草鱼或鳜鱼', 'B. 海水鲈鱼', 'C. 黄河鲤鱼', 'D. 太湖银鱼'],
            answerIndex: 0,
            successReward: '挑战成功！已点亮“西湖醋鱼图鉴” 🎯'
          }
        },
        {
          areaId: 'jiangnan-snack-food',
          provinceAdcode: '340000',
          coordinates: [117.27, 31.86], // 安徽中心
          id: 'asset-anhui-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/340000-food-ai.png',
          title: '徽州毛豆腐宴图',
          type: 'image',
          quiz: {
            question: '经典徽菜“臭鳜鱼”在烹饪前需要经过独特的腌制工艺，其成菜口感特征是？',
            options: ['A. 骨酥肉烂，入口即化', 'B. 闻起来臭，吃起来香，肉质呈蒜瓣状且极为鲜嫩', 'C. 麻辣醇厚，汤汁浓郁', 'D. 清淡甜润，果香丰富'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“徽州臭鳜鱼图鉴” 🎯'
          }
        }
      ],
      quiz: {
        question: '江南名点“小笼馒头”（小笼包）在制作时，其鲜美丰盈的汤汁主要来自于掺入肉馅中的哪种天然原料？',
        options: ['A. 提前打入的高汤冰块', 'B. 熬制过滤后的猪皮冻', 'C. 肥嫩的鲜猪瘦肉丁', 'D. 秘制的浓缩蚝油汤汁'],
        answerIndex: 1,
        successReward: '解锁成功！您已集齐“江南点心图鉴”'
      }
    },
    {
      center: [113.9, 22.8],
      color: '#f4a261', // 琥珀金 (岭南早茶)
      description: '早茶、烧腊、海味与骑楼市井串联出烟火气十足的岭南餐桌，一盅两件里蕴含着务实悠闲的生活美学。',
      id: 'lingnan-dim-sum-food',
      name: '岭南早茶海味区',
      provinceAdcodes: ['440000', '450000', '460000', '810000', '820000'], // 广东省、广西壮族自治区、海南省、香港、澳门
      zoom: 4.0,
      summaryAsset: {
        coordinates: [113.9, 22.8],
        id: 'summary-lingnan-dim-sum-food',
        size: { height: 160, width: 220 },
        src: '/assets/food/lingnan-dim-sum-food-summary.png',
        title: '岭南早茶海味汇',
        type: 'image',
      },
      foodItems: [
        {
          id: 'shrimp-dumpling',
          name: '水晶虾饺',
          image: '/assets/food/440000-food-ai.png',
          provinceAdcode: '440000',
          objectPosition: '50% 52%',
          process: ['澄面烫成透明皮', '鲜虾粒拌笋丁', '捏成弯月褶', '蒸至晶莹弹牙'],
        },
        {
          id: 'luosifen',
          name: '柳州螺蛳粉',
          image: '/assets/food/450000-food-ai.png',
          provinceAdcode: '450000',
          objectPosition: '52% 50%',
          process: ['螺蛳骨汤熬香', '米粉烫软入碗', '加酸笋腐竹花生', '淋红油趁热嗦粉'],
        },
        {
          id: 'wenchang-chicken',
          name: '文昌鸡',
          image: '/assets/food/460000-food-ai.png',
          provinceAdcode: '460000',
          objectPosition: '48% 48%',
          process: ['整鸡小火浸熟', '冰水收紧鸡皮', '斩件码盘', '配沙姜桔汁蘸料'],
        },
        {
          id: 'macao-egg-tart',
          name: '葡式蛋挞',
          image: '/assets/food/820000-food-ai.png',
          provinceAdcode: '820000',
          objectPosition: '52% 54%',
          process: ['酥皮压入挞模', '倒入蛋奶液', '高温烤出焦斑', '微温时香酥入口'],
        },
        {
          id: 'hongkong-milk-tea',
          name: '丝袜奶茶',
          image: '/assets/food/810000-food-ai.png',
          provinceAdcode: '810000',
          objectPosition: '50% 48%',
          process: ['拼配红茶反复撞茶', '滤出浓厚茶汤', '加入淡奶调匀', '冷热皆可上桌'],
        },
      ],
      assets: [
        {
          areaId: 'lingnan-dim-sum-food',
          provinceAdcode: '440000',
          coordinates: [113.25, 23.10], // 广东中心
          id: 'asset-guangdong-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/440000-food-ai.png',
          title: '广式烧腊水晶饺',
          type: 'image',
          quiz: {
            question: '广式经典甜点“双皮奶”源自顺德，其制作时需要形成两层奶皮，关键在于使用哪种乳脂含量极高的原奶？',
            options: ['A. 脱脂牛奶', 'B. 顺德特产水牛奶', 'C. 进口山羊奶', 'D. 炼乳稀释液'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“顺德双皮奶图鉴” 🎯'
          }
        },
        {
          areaId: 'lingnan-dim-sum-food',
          provinceAdcode: '450000',
          coordinates: [108.32, 22.81], // 广西中心
          id: 'asset-guangxi-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/450000-food-ai.png',
          title: '柳州螺蛳粉风味',
          type: 'image',
          quiz: {
            question: '柳州螺蛳粉中让人魂牵梦绕、带有独特“酸臭”风味的灵魂配料是哪一种？',
            options: ['A. 油炸腐竹', 'B. 秘制酸笋', 'C. 精煮螺蛳肉', 'D. 爽脆酸豆角'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“柳州螺蛳粉图鉴” 🎯'
          }
        },
        {
          areaId: 'lingnan-dim-sum-food',
          provinceAdcode: '460000',
          coordinates: [110.35, 19.00], // 海南中心
          id: 'asset-hainan-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/460000-food-ai.png',
          title: '椰风海韵文昌鸡',
          type: 'image',
          quiz: {
            question: '海南名菜“文昌鸡”最正宗的吃法通常是白切，搭配以下哪种特制酱料能完美衬托其鲜嫩？',
            options: ['A. 沙茶酱与干辣椒', 'B. 沙姜、桔子汁与本地生抽', 'C. 京式甜面酱', 'D. 芝麻酱与香油'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“海南文昌鸡图鉴” 🎯'
          }
        },
        {
          areaId: 'lingnan-dim-sum-food',
          provinceAdcode: '810000',
          coordinates: [114.17, 22.28], // 香港中心
          id: 'asset-hongkong-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/810000-food-ai.png',
          title: '港式茶餐厅风情',
          type: 'image',
          quiz: {
            question: '香港著名的茶餐厅饮品“鸳鸯”，是由以下哪两种经典饮品按比例混合而成的？',
            options: ['A. 柠檬茶与红豆冰', 'B. 丝袜奶茶与香浓咖啡', 'C. 杏仁露与阿华田', 'D. 鲜牛奶与可口可乐'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“港式鸳鸯奶茶图鉴” 🎯'
          }
        },
        {
          areaId: 'lingnan-dim-sum-food',
          provinceAdcode: '820000',
          coordinates: [113.54, 22.19], // 澳门中心
          id: 'asset-macao-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/820000-food-ai.png',
          title: '镜海葡挞肉扒包',
          type: 'image',
          quiz: {
            question: '澳门著名街头小吃“猪扒包”，其特色在于将调味煎炸后的猪排夹在什么面包中？',
            options: ['A. 软糯的吐司面包', 'B. 带有一点硬度和韧性的葡式猪仔包', 'C. 甜润的菠萝包', 'D. 中式白馒头'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“澳门猪扒包图鉴” 🎯'
          }
        }
      ],
      quiz: {
        question: '在广东饮早茶常说的“一盅两件”中，最具岭南茶楼传统文化代表性的“两件”点心，通常包含以下哪一组？',
        options: ['A. 经典蚝汁叉烧包与水晶大虾饺', 'B. 大良双皮奶与沙湾姜撞奶', 'C. 古法马拉糕与香叶糯米鸡', 'D. 葡式蛋挞与广式香滑肠粉'],
        answerIndex: 0,
        successReward: '解锁成功！您已集齐“岭南早茶图鉴”'
      }
    },
    {
      center: [95.6, 38.9],
      color: '#e9c46a', // 秋香黄 (西北香料)
      description: '面食、羊肉、香料与绿洲集市让西北味道有清晰的地理线索，秦腔高亢中大口吃肉的塞外豪情跃然纸上。',
      id: 'northwest-noodle-food',
      name: '西北面食香料区',
      provinceAdcodes: ['610000', '620000', '630000', '640000', '650000'], // 陕西省、甘肃省、青海省、宁夏回族自治区、新疆维吾尔自治区
      zoom: 3.0,
      summaryAsset: {
        coordinates: [95.6, 38.9],
        id: 'summary-northwest-noodle-food',
        size: { height: 160, width: 220 },
        src: '/assets/food/northwest-noodle-food-summary.png',
        title: '丝路塞外香料汇',
        type: 'image',
      },
      foodItems: [
        {
          id: 'roujiamo',
          name: '腊汁肉夹馍',
          image: '/assets/food/610000-food-ai.png',
          provinceAdcode: '610000',
          objectPosition: '48% 50%',
          process: ['白吉馍烙至起层', '腊汁肉炖到酥烂', '剁肉夹入馍中', '淋少许肉汁提香'],
        },
        {
          id: 'big-plate-chicken',
          name: '新疆大盘鸡',
          image: '/assets/food/650000-food-ai.png',
          provinceAdcode: '650000',
          objectPosition: '54% 52%',
          process: ['鸡块土豆炒上色', '香料辣椒焖煮', '收汁盖住皮带面', '撒青红椒提香'],
        },
        {
          id: 'lanzhou-noodle',
          name: '牛肉拉面',
          image: '/assets/food/620000-food-ai.png',
          provinceAdcode: '620000',
          objectPosition: '52% 48%',
          process: ['牛骨汤熬到清亮', '手工拉出筋道面', '碗中铺牛肉萝卜', '红油蒜苗点睛'],
        },
        {
          id: 'tan-lamb',
          name: '滩羊手抓',
          image: '/assets/food/640000-food-ai.png',
          provinceAdcode: '640000',
          objectPosition: '50% 54%',
          process: ['羊肉冷水慢煮', '撇净浮沫留清汤', '切块撒盐装盘', '配蒜醋解腻'],
        },
        {
          id: 'qinghai-noodle-pieces',
          name: '青海尕面片',
          image: '/assets/food/630000-food-ai.png',
          provinceAdcode: '630000',
          objectPosition: '48% 48%',
          process: ['面团醒透揪片', '羊肉蔬菜炒香', '下汤煮入面片', '撒香菜辣油'],
        },
      ],
      assets: [
        {
          areaId: 'northwest-noodle-food',
          provinceAdcode: '610000',
          coordinates: [108.95, 34.27], // 陕西中心
          id: 'asset-shaanxi-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/610000-food-ai.png',
          title: '三秦凉皮肉夹馍',
          type: 'image',
          quiz: {
            question: '陕西名吃“羊肉泡馍”在食用时，最讲究的吃法是让食客自己动手将饦饦馍掰成多大碎块，以便高汤入味？',
            options: ['A. 越大越好，像硬币一样', 'B. 越小越好，碎如蜜蜂头或指甲盖大小', 'C. 掰成两半即可', 'D. 用刀切成均匀小方丁'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“三秦泡馍图鉴” 🎯'
          }
        },
        {
          areaId: 'northwest-noodle-food',
          provinceAdcode: '650000',
          coordinates: [87.68, 43.77], // 新疆中心
          id: 'asset-xinjiang-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/650000-food-ai.png',
          title: '西域大盘鸡烤串',
          type: 'image',
          quiz: {
            question: '新疆名菜“大盘鸡”起源于沙湾县，其特色在于鸡肉块、土豆块焖煮后，通常会伴入哪种宽厚筋道的面条？',
            options: ['A. 细拉面', 'B. 新疆特色皮带面', 'C. 荞麦面条', 'D. 刀削面'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“新疆大盘鸡图鉴” 🎯'
          }
        },
        {
          areaId: 'northwest-noodle-food',
          provinceAdcode: '620000',
          coordinates: [103.82, 36.06], // 甘肃中心
          id: 'asset-gansu-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/620000-food-ai.png',
          title: '陇上拉面麻辣烫',
          type: 'image',
          quiz: {
            question: '著名的小吃“天水麻辣烫”之所以在全国爆火，其独特的香辣口感主要得益于使用了甘肃本土哪种顶级辣椒？',
            options: ['A. 四川二荆条', 'B. 甘肃甘谷辣椒', 'C. 贵州遵义朝天椒', 'D. 海南黄灯笼椒'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“天水麻辣烫图鉴” 🎯'
          }
        },
        {
          areaId: 'northwest-noodle-food',
          provinceAdcode: '630000',
          coordinates: [101.78, 36.62], // 青海中心
          id: 'asset-qinghai-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/630000-food-ai.png',
          title: '高原土锅羊肉片',
          type: 'image',
          quiz: {
            question: '青海特色面食“尕面片”，其名字中的“尕”在西北方言中通常是什么意思？',
            options: ['A. 大', 'B. 小', 'C. 酸', 'D. 辣'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“青海尕面片图鉴” 🎯'
          }
        },
        {
          areaId: 'northwest-noodle-food',
          provinceAdcode: '640000',
          coordinates: [106.27, 38.47], // 宁夏中心
          id: 'asset-ningxia-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/640000-food-ai.png',
          title: '塞上塞北羊羔肉',
          type: 'image',
          quiz: {
            question: '宁夏滩羊肉质鲜嫩、无膻味，名满天下，这主要是因为宁夏半荒漠化草场上生长着什么中药材植物供滩羊食用？',
            options: ['A. 人参或当归', 'B. 野生甘草和苦豆子', 'C. 天山雪莲', 'D. 冬虫夏草'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“宁夏滩羊图鉴” 🎯'
          }
        }
      ],
      quiz: {
        question: '著名的兰州手工牛肉拉面讲究“一清二白三红四绿五黄”。其中的“三红”和“四绿”分别指什么配料？',
        options: ['A. 西红柿丁与爽口青豆', 'B. 秘制红油辣子与新鲜香菜蒜苗', 'C. 养生红枣与大麦菠菜面', 'D. 鲜香酱牛肉与翠绿小香葱'],
        answerIndex: 1,
        successReward: '解锁成功！您已集齐“陇上拉面图鉴”'
      }
    },
    {
      center: [114.2, 37.1],
      color: '#457b9d', // 霁蓝色 (北方宴席)
      description: '大开大合的面点、鲁菜、豫菜与大庄科宴席传统共同组成北方餐桌骨架，展现着礼仪之邦的热情好客。',
      id: 'northern-banquet-food',
      name: '北方宴席面点区',
      provinceAdcodes: ['110000', '120000', '130000', '370000', '140000', '410000'], // 北京市、天津市、河北省、山东省、山西省、河南省
      zoom: 3.8,
      summaryAsset: {
        coordinates: [114.2, 37.1],
        id: 'summary-northern-banquet-food',
        size: { height: 160, width: 220 },
        src: '/assets/food/northern-banquet-food-summary.png',
        title: '燕赵齐鲁宴席汇',
        type: 'image',
      },
      foodItems: [
        {
          id: 'peking-duck',
          name: '北京烤鸭',
          image: '/assets/food/110000-food-ai.png',
          provinceAdcode: '110000',
          objectPosition: '50% 52%',
          process: ['鸭坯吹气挂糖色', '果木炉中烤至酥亮', '片出薄皮嫩肉', '卷饼配葱酱黄瓜'],
        },
        {
          id: 'jiuzhuan-dachang',
          name: '九转大肠',
          image: '/assets/food/370000-food-ai.png',
          provinceAdcode: '370000',
          objectPosition: '52% 50%',
          process: ['大肠洗净焯煮', '过油定型上色', '糖醋香料反复烧', '收浓成九转滋味'],
        },
        {
          id: 'jianbing-guozi',
          name: '煎饼馃子',
          image: '/assets/food/120000-food-ai.png',
          provinceAdcode: '120000',
          objectPosition: '46% 54%',
          process: ['绿豆面摊成薄饼', '打蛋撒葱花', '刷酱夹馃篦', '折成长卷趁热吃'],
        },
        {
          id: 'donkey-burger',
          name: '驴肉火烧',
          image: '/assets/food/130000-food-ai.png',
          provinceAdcode: '130000',
          objectPosition: '54% 48%',
          process: ['火烧烤到外脆', '卤驴肉切薄片', '夹入焖子青椒', '热馍冷肉一口香'],
        },
        {
          id: 'knife-cut-noodle',
          name: '刀削面',
          image: '/assets/food/140000-food-ai.png',
          provinceAdcode: '140000',
          objectPosition: '50% 48%',
          process: ['面团揉硬醒足', '快刀削入滚水', '面叶煮到弹滑', '浇臊子老陈醋'],
        },
        {
          id: 'hulatang',
          name: '胡辣汤',
          image: '/assets/food/410000-food-ai.png',
          provinceAdcode: '410000',
          objectPosition: '52% 54%',
          process: ['牛骨汤加入胡椒', '面筋木耳粉条同煮', '勾芡成浓汤', '配油馍头做早餐'],
        },
      ],
      assets: [
        {
          areaId: 'northern-banquet-food',
          provinceAdcode: '110000',
          coordinates: [116.40, 40.20], // 北京中心
          id: 'asset-beijing-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/110000-food-ai.png',
          title: '帝都烤鸭涮羊肉',
          type: 'image',
          quiz: {
            question: '老北京涮羊肉传统上使用红铜木炭火锅，其烟囱和锅体设计最主要的科学原理是？',
            options: ['A. 增加受热面积并快速升温', 'B. 方便添加红糖', 'C. 仅为了美观大方', 'D. 降低汤水沸腾速度'],
            answerIndex: 0,
            successReward: '挑战成功！已点亮“老北京涮肉图鉴” 🎯'
          }
        },
        {
          areaId: 'northern-banquet-food',
          provinceAdcode: '370000',
          coordinates: [117.00, 36.65], // 山东中心
          id: 'asset-shandong-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/370000-food-ai.png',
          title: '齐鲁鲁菜葱海参',
          type: 'image',
          quiz: {
            question: '经典鲁菜“九转大肠”成菜后风味独特，其口味特征主要是融合了以下哪五种味道？',
            options: ['A. 麻辣鲜香咸', 'B. 酸甜苦辣咸', 'C. 甜咸酸鲜香', 'D. 椒香麻甜咸'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“齐鲁九转大肠图鉴” 🎯'
          }
        },
        {
          areaId: 'northern-banquet-food',
          provinceAdcode: '120000',
          coordinates: [117.20, 39.12], // 天津中心
          id: 'asset-tianjin-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/120000-food-ai.png',
          title: '津门麻花煎饼馃',
          type: 'image',
          quiz: {
            question: '正宗的天津煎饼馃子，其面糊必须选用哪种粮食磨制，以保证特有的豆香与松软度？',
            options: ['A. 精制小麦粉', 'B. 纯绿豆面', 'C. 纯黄豆粉', 'D. 糯米粉'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“津门煎饼馃子图鉴” 🎯'
          }
        },
        {
          areaId: 'northern-banquet-food',
          provinceAdcode: '130000',
          coordinates: [114.48, 38.03], // 河北中心
          id: 'asset-hebei-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/130000-food-ai.png',
          title: '直隶驴肉火烧图',
          type: 'image',
          quiz: {
            question: '著名的河北保定“驴肉火烧”所采用的火烧（烧饼），在传统的烤制工艺中呈什么形状？',
            options: ['A. 圆形', 'B. 方形或长方形', 'C. 三角形', 'D. 椭圆形'],
            answerIndex: 0,
            successReward: '挑战成功！已点亮“保定驴肉火烧图鉴” 🎯'
          }
        },
        {
          areaId: 'northern-banquet-food',
          provinceAdcode: '140000',
          coordinates: [112.55, 37.87], // 山西中心
          id: 'asset-shanxi-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/140000-food-ai.png',
          title: '三晋老醋面点图',
          type: 'image',
          quiz: {
            question: '山西是面食之乡，其最富盛名的“刀削面”，其面条在削制时的经典形态是？',
            options: ['A. 圆润细长', 'B. 中间厚两边薄，形似柳叶', 'C. 宽大扁平', 'D. 碎如小米粒'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“三晋刀削面图鉴” 🎯'
          }
        },
        {
          areaId: 'northern-banquet-food',
          provinceAdcode: '410000',
          coordinates: [113.65, 34.76], // 河南中心
          id: 'asset-henan-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/410000-food-ai.png',
          title: '中原烩面胡辣汤',
          type: 'image',
          quiz: {
            question: '河南经典早餐“胡辣汤”中浓郁的辛辣口感，主要是由哪种传统香料调配而成的？',
            options: ['A. 野生小米椒', 'B. 优质胡椒和花椒', 'C. 芥末油', 'D. 咖喱粉'],
            answerIndex: 1,
            successReward: '挑战成功！已点亮“中原胡辣汤图鉴” 🎯'
          }
        }
      ],
      quiz: {
        question: '北京挂炉烤鸭是享誉世界的名菜，其正宗工艺通常使用以下哪种木材作为燃料进行焖烤，以赋予鸭肉独特果香？',
        options: ['A. 枣木或梨木等天然老果木', 'B. 含有油脂较多的干松木', 'C. 质地均匀防腐的杉木', 'D. 散发浓烈驱虫香气的樟木'],
        answerIndex: 0,
        successReward: '解锁成功！您已集齐“北方烤肉图鉴”'
      }
    },
    {
      center: [106.7, 26.6],
      color: '#ad2831', // 黔红 (黔味酸辣)
      description: '酸汤鱼、辣子鸡、折耳根与肠旺面共同串起贵州山水间的酸辣滋味，风味独特，爽口开胃。',
      id: 'guizhou-sour-spicy-food',
      name: '黔味酸辣美食区',
      provinceAdcodes: ['520000'], // 贵州省
      zoom: 5.2,
      summaryAsset: {
        coordinates: [106.7, 26.6],
        id: 'summary-guizhou-sour-spicy-food',
        size: { height: 160, width: 220 },
        src: '/assets/food/guizhou-food-ai.png',
        title: '黔味山水酸辣汇',
        type: 'image',
      },
      foodItems: [
        {
          id: 'sour-soup-fish',
          name: '酸汤鱼',
          image: '/assets/food/520000-food-ai.png',
          provinceAdcode: '520000',
          objectPosition: '52% 50%',
          process: ['红酸汤煮开醒香', '鲜鱼切块入锅', '木姜子提清香', '配豆腐蔬菜同食'],
        },
        {
          id: 'guizhou-spicy-chicken',
          name: '辣子鸡',
          image: '/assets/food/520000-food-ai.png',
          provinceAdcode: '520000',
          objectPosition: '44% 54%',
          process: ['鸡块腌好炸香', '糍粑辣椒炒出红油', '回锅裹满酱香', '撒蒜苗收干'],
        },
        {
          id: 'changwang-noodle',
          name: '肠旺面',
          image: '/assets/food/guizhou-food-ai.png',
          provinceAdcode: '520000',
          objectPosition: '50% 48%',
          process: ['鸡蛋面煮到脆弹', '红油汤底入碗', '铺血旺肥肠脆哨', '撒葱花拌食'],
        },
        {
          id: 'siwawa-roll',
          name: '丝娃娃',
          image: '/assets/food/guizhou-sour-spicy-food-food-ai.png',
          provinceAdcode: '520000',
          objectPosition: '54% 52%',
          process: ['薄饼摊好叠放', '萝卜丝海带丝备齐', '卷成小束', '浇酸辣蘸水'],
        },
      ],
      assets: [
        {
          areaId: 'guizhou-sour-spicy-food',
          provinceAdcode: '520000',
          coordinates: [106.71, 26.57], // 贵阳中心
          id: 'asset-guizhou-food-ai',
          size: { height: 130, width: 180 },
          src: '/assets/food/520000-food-ai.png',
          title: '黔味酸汤辣子鸡',
          type: 'image',
          quiz: {
            question: '贵州名吃“肠旺面”中，“肠”指的是猪大肠，“旺”在传统美食中通常指的是哪种鲜嫩原料？',
            options: ['A. 新鲜猪血旺', 'B. 软嫩豆腐脑', 'C. 嫩滑鸡蛋白', 'D. 特制卤素鸡'],
            answerIndex: 0,
            successReward: '挑战成功！已点亮“黔山旺面图鉴” 🎯'
          }
        }
      ],
      quiz: {
        question: '贵州名菜“酸汤鱼”中独特的酸味和红亮汤色，主要是由以下哪种贵州本土特有的植物果实发酵熬制而成的？',
        options: ['A. 本地野生木姜子', 'B. 贵州毛辣果（红酸汤）', 'C. 广西老坛酸菜', 'D. 四川老陈醋'],
        answerIndex: 1,
        successReward: '解锁成功！您已集齐“黔山酸汤图鉴”'
      }
    }
  ],
};

const ADDITIONAL_FOOD_AREAS = [
  {
    center: [123.5, 44.6],
    color: '#8ab17d',
    description: '炖菜、杂粮、乳肉与冰雪市集构成北疆与东北的厚实风味，热汤热锅里有辽阔土地的爽朗。',
    id: 'northeast-grain-stew-food',
    name: '东北草原炖菜区',
    provinceAdcodes: ['150000', '210000', '220000', '230000'],
    zoom: 3.2,
    summaryAsset: {
      coordinates: [123.5, 44.6],
      id: 'summary-northeast-grain-stew-food',
      size: { height: 160, width: 220 },
      src: '/assets/food/china-food-ai.png',
      title: '东北草原炖菜汇',
      type: 'image',
    },
    assets: [],
    foodItems: [],
    quiz: {
      question: '东北与草原饮食中常见的炖煮方式，最能体现哪类地域饮食特征？',
      options: ['A. 小份冷食为主', 'B. 大锅热食、肉粮充足、御寒耐饱', 'C. 纯甜点饮食', 'D. 只吃生鲜海味'],
      answerIndex: 1,
      successReward: '解锁成功！已点亮“东北草原热锅图鉴”',
    },
  },
  {
    center: [117.8, 25.8],
    color: '#6d597a',
    description: '山海物产、米粉汤头、红糟沙茶与宝岛夜市相连，形成东南沿海轻巧鲜香的饮食脉络。',
    id: 'southeast-mintai-gan-food',
    name: '闽台赣山海米粉区',
    provinceAdcodes: ['350000', '360000', '710000'],
    zoom: 4.0,
    summaryAsset: {
      coordinates: [117.8, 25.8],
      id: 'summary-southeast-mintai-gan-food',
      size: { height: 160, width: 220 },
      src: '/assets/food/china-food-ai.png',
      title: '闽台赣山海米粉汇',
      type: 'image',
    },
    assets: [],
    foodItems: [],
    quiz: {
      question: '东南山海饮食常见米粉、汤羹与海味并重，其风味底色更接近哪一项？',
      options: ['A. 山海鲜香与米制主食并行', 'B. 只重油炸甜食', 'C. 完全不使用海产', 'D. 只吃干粮'],
      answerIndex: 0,
      successReward: '解锁成功！已点亮“东南山海米粉图鉴”',
    },
  },
  {
    center: [112.4, 29.5],
    color: '#d62828',
    description: '江湖湖鲜、莲藕汤、剁椒腊味与夜市烟火交织出荆楚湖湘的热辣鲜香。',
    id: 'jingchu-huxiang-food',
    name: '荆楚湖湘热辣区',
    provinceAdcodes: ['420000', '430000'],
    zoom: 4.6,
    summaryAsset: {
      coordinates: [112.4, 29.5],
      id: 'summary-jingchu-huxiang-food',
      size: { height: 160, width: 220 },
      src: '/assets/food/china-food-ai.png',
      title: '荆楚湖湘热辣汇',
      type: 'image',
    },
    assets: [],
    foodItems: [],
    quiz: {
      question: '荆楚湖湘餐桌常把湖鲜、腊味和辣椒结合，其共同气质更接近哪一项？',
      options: ['A. 清甜无油', 'B. 鲜辣下饭、烟火气浓', 'C. 只饮奶茶', 'D. 全部冷食'],
      answerIndex: 1,
      successReward: '解锁成功！已点亮“荆楚湖湘热辣图鉴”',
    },
  },
  {
    center: [95.6, 28.6],
    color: '#9d4edd',
    description: '菌菇、米线、牦牛肉、酥油茶与高原物产共同组成云藏风物，山野清香与高原温度并存。',
    id: 'yunnan-tibet-highland-food',
    name: '云藏高原风物区',
    provinceAdcodes: ['530000', '540000'],
    zoom: 3.4,
    summaryAsset: {
      coordinates: [95.6, 28.6],
      id: 'summary-yunnan-tibet-highland-food',
      size: { height: 160, width: 220 },
      src: '/assets/food/china-food-ai.png',
      title: '云藏高原风物汇',
      type: 'image',
    },
    assets: [],
    foodItems: [],
    quiz: {
      question: '云藏高原饮食中，最常体现地域生态差异的是哪类食材组合？',
      options: ['A. 山野菌菇与高原乳肉', 'B. 只用热带水果', 'C. 只吃海鲜刺身', 'D. 完全不吃主食'],
      answerIndex: 0,
      successReward: '解锁成功！已点亮“云藏高原风物图鉴”',
    },
  },
];

const PROVINCE_NAMES = {
  '110000': '北京',
  '120000': '天津',
  '130000': '河北',
  '140000': '山西',
  '150000': '内蒙古',
  '210000': '辽宁',
  '220000': '吉林',
  '230000': '黑龙江',
  '310000': '上海',
  '320000': '江苏',
  '330000': '浙江',
  '340000': '安徽',
  '350000': '福建',
  '360000': '江西',
  '370000': '山东',
  '410000': '河南',
  '420000': '湖北',
  '430000': '湖南',
  '440000': '广东',
  '450000': '广西',
  '460000': '海南',
  '500000': '重庆',
  '510000': '四川',
  '520000': '贵州',
  '530000': '云南',
  '540000': '西藏',
  '610000': '陕西',
  '620000': '甘肃',
  '630000': '青海',
  '640000': '宁夏',
  '650000': '新疆',
  '710000': '台湾',
  '810000': '香港',
  '820000': '澳门',
};

const PROVINCE_COORDINATES = {
  '110000': [116.4, 40.2],
  '120000': [117.2, 39.12],
  '130000': [114.48, 38.03],
  '140000': [112.55, 37.87],
  '150000': [111.67, 40.82],
  '210000': [123.43, 41.8],
  '220000': [125.32, 43.9],
  '230000': [126.64, 45.75],
  '310000': [121.47, 31.23],
  '320000': [119.78, 33.04],
  '330000': [120.15, 29.18],
  '340000': [117.27, 31.86],
  '350000': [119.3, 26.08],
  '360000': [115.85, 28.68],
  '370000': [117, 36.65],
  '410000': [113.65, 34.76],
  '420000': [114.3, 30.6],
  '430000': [112.98, 28.2],
  '440000': [113.25, 23.1],
  '450000': [108.32, 22.81],
  '460000': [110.35, 19],
  '500000': [108.3, 29.5],
  '510000': [103, 30.5],
  '520000': [106.71, 26.57],
  '530000': [102.72, 25.04],
  '540000': [91.13, 29.65],
  '610000': [108.95, 34.27],
  '620000': [103.82, 36.06],
  '630000': [101.78, 36.62],
  '640000': [106.27, 38.47],
  '650000': [87.68, 43.77],
  '710000': [121.56, 25.04],
  '810000': [114.17, 22.28],
  '820000': [113.54, 22.19],
};

const PROVINCE_FOOD_IMAGE_ADCODE_SET = new Set([
  '110000', '120000', '130000', '140000',
  '310000', '320000', '330000', '340000',
  '370000', '410000', '440000', '450000',
  '460000', '500000', '510000', '520000',
  '610000', '620000', '630000', '640000',
  '650000', '810000', '820000',
]);

const PROVINCE_FOOD_CATALOG = {
  '110000': ['北京烤鸭', '老北京涮羊肉', '炸酱面', '豆汁焦圈', '卤煮火烧', '爆肚'],
  '120000': ['煎饼馃子', '狗不理包子', '十八街麻花', '锅巴菜', '耳朵眼炸糕', '熟梨糕'],
  '130000': ['驴肉火烧', '金毛狮子鱼', '缸炉烧饼', '棋子烧饼', '承德杏仁露', '保定牛肉罩饼'],
  '140000': ['刀削面', '过油肉', '莜面栲栳栳', '平遥牛肉', '太原头脑', '山西油泼面'],
  '150000': ['手把肉', '烤全羊', '奶茶炒米', '莜面窝窝', '呼和浩特烧麦', '羊杂碎'],
  '210000': ['锅包肉', '沟帮子熏鸡', '海城馅饼', '老边饺子', '大连海鲜焖子', '沈阳鸡架'],
  '220000': ['延边冷面', '吉林白肉血肠', '打糕', '长春酱肉', '朝鲜族泡菜', '乌拉满族火锅'],
  '230000': ['哈尔滨红肠', '得莫利炖鱼', '大列巴', '小鸡炖蘑菇', '杀猪菜', '齐齐哈尔烤肉'],
  '310000': ['小笼汤包', '生煎馒头', '葱油拌面', '本帮红烧肉', '排骨年糕', '油墩子'],
  '320000': ['金陵盐水鸭', '扬州炒饭', '蟹粉狮子头', '无锡酱排骨', '苏式汤面', '鸭血粉丝汤'],
  '330000': ['西湖醋鱼', '东坡肉', '龙井虾仁', '片儿川', '宁波汤圆', '温州鱼丸'],
  '340000': ['徽州毛豆腐', '臭鳜鱼', '李鸿章杂烩', '黄山烧饼', '淮南牛肉汤', '庐州烤鸭'],
  '350000': ['佛跳墙', '沙县扁肉', '福州鱼丸', '闽南沙茶面', '土笋冻', '姜母鸭'],
  '360000': ['南昌拌粉', '瓦罐汤', '赣南小炒鱼', '藜蒿炒腊肉', '三杯鸡', '井冈烟笋'],
  '370000': ['九转大肠', '葱烧海参', '周村烧饼', '德州扒鸡', '鲅鱼水饺', '济南把子肉'],
  '410000': ['胡辣汤', '河南烩面', '道口烧鸡', '洛阳水席', '开封灌汤包', '鲤鱼焙面'],
  '420000': ['热干面', '清蒸武昌鱼', '排骨藕汤', '三鲜豆皮', '荆州鱼糕', '潜江油焖虾'],
  '430000': ['剁椒鱼头', '毛氏红烧肉', '长沙臭豆腐', '小炒黄牛肉', '糖油粑粑', '常德米粉'],
  '440000': ['水晶虾饺', '叉烧包', '白切鸡', '广式肠粉', '顺德双皮奶', '潮汕牛肉火锅'],
  '450000': ['柳州螺蛳粉', '桂林米粉', '柠檬鸭', '南宁老友粉', '梧州纸包鸡', '阳朔啤酒鱼'],
  '460000': ['文昌鸡', '海南鸡饭', '加积鸭', '清补凉', '东山羊', '抱罗粉'],
  '500000': ['九宫火锅', '重庆小面', '酸辣粉', '毛血旺', '歌乐山辣子鸡', '豆花饭'],
  '510000': ['麻婆豆腐', '回锅肉', '担担面', '夫妻肺片', '钟水饺', '钵钵鸡'],
  '520000': ['酸汤鱼', '辣子鸡', '肠旺面', '丝娃娃', '豆米火锅', '恋爱豆腐果'],
  '530000': ['过桥米线', '汽锅鸡', '野生菌火锅', '饵块', '宣威火腿', '大理乳扇'],
  '540000': ['酥油茶', '糌粑', '藏式牦牛肉', '甜茶', '藏面', '石锅鸡'],
  '610000': ['腊汁肉夹馍', '羊肉泡馍', '陕西凉皮', '裤带面', '岐山臊子面', '甑糕'],
  '620000': ['牛肉拉面', '天水麻辣烫', '手抓羊肉', '陇上酿皮', '灰豆子', '浆水面'],
  '630000': ['青海尕面片', '炕锅羊肉', '高原手抓羊肉', '甜醅', '青海酸奶', '羊肠面'],
  '640000': ['滩羊手抓', '羊肉臊子面', '宁夏烩小吃', '八宝茶', '枸杞叶面', '吴忠早茶'],
  '650000': ['新疆大盘鸡', '烤羊肉串', '手抓饭', '馕包肉', '拉条子', '烤包子'],
  '710000': ['卤肉饭', '台湾牛肉面', '蚵仔煎', '珍珠奶茶', '盐酥鸡', '凤梨酥'],
  '810000': ['丝袜奶茶', '菠萝油', '云吞面', '车仔面', '鸡蛋仔', '碗仔翅'],
  '820000': ['葡式蛋挞', '猪扒包', '水蟹粥', '非洲鸡', '杏仁饼', '大菜糕'],
};

const MIN_FOODS_PER_PROVINCE = 6;
const FOOD_OBJECT_POSITIONS = ['50% 50%', '52% 48%', '48% 52%', '54% 52%', '46% 50%'];

function getProvinceFoodImage(area, adcode) {
  if (PROVINCE_FOOD_IMAGE_ADCODE_SET.has(String(adcode))) return `/assets/food/${adcode}-food-ai.png`;
  return area.summaryAsset?.src || '/assets/food/china-food-ai.png';
}

function slugifyFoodId(name) {
  return String(name)
    .normalize('NFKD')
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function buildFoodProcess(provinceName, foodName) {
  return [
    `精选${provinceName}本地代表食材`,
    `按${foodName}传统风味处理主料`,
    '以地方调味和火候形成标志口感',
    '装盘呈现地域饮食记忆',
  ];
}

function buildGeneratedFoodItem(area, adcode, foodName, catalogIndex) {
  const provinceName = PROVINCE_NAMES[adcode] || adcode;
  return {
    id: `${area.id}-${adcode}-${slugifyFoodId(foodName) || `food-${catalogIndex + 1}`}`,
    name: foodName,
    image: getProvinceFoodImage(area, adcode),
    provinceAdcode: adcode,
    objectPosition: FOOD_OBJECT_POSITIONS[catalogIndex % FOOD_OBJECT_POSITIONS.length],
    process: buildFoodProcess(provinceName, foodName),
  };
}

function ensureAreaProvinceAssets(area) {
  const assets = [...(area.assets || [])];
  const existingAdcodes = new Set(assets.map((asset) => String(asset.provinceAdcode || '')));

  (area.provinceAdcodes || []).forEach((adcode) => {
    const key = String(adcode);
    if (existingAdcodes.has(key)) return;
    assets.push({
      areaId: area.id,
      provinceAdcode: key,
      coordinates: PROVINCE_COORDINATES[key] || area.center,
      id: `asset-${key}-food-expanded`,
      size: { height: 130, width: 180 },
      src: getProvinceFoodImage(area, key),
      title: `${PROVINCE_NAMES[key] || key}特色美食图`,
      type: 'image',
      quiz: area.quiz,
    });
  });

  area.assets = assets;
}

function expandAreaFoodItems(area) {
  const nextItems = [...(area.foodItems || [])];

  (area.provinceAdcodes || []).forEach((adcode) => {
    const key = String(adcode);
    const existingNames = new Set(nextItems
      .filter((item) => String(item.provinceAdcode || '') === key)
      .map((item) => item.name));
    const catalog = PROVINCE_FOOD_CATALOG[key] || [];

    catalog.forEach((foodName, index) => {
      if (nextItems.filter((item) => String(item.provinceAdcode || '') === key).length >= MIN_FOODS_PER_PROVINCE) return;
      if (existingNames.has(foodName)) return;
      nextItems.push(buildGeneratedFoodItem(area, key, foodName, index));
      existingNames.add(foodName);
    });
  });

  area.foodItems = nextItems;
  ensureAreaProvinceAssets(area);
}

DEFAULT_FOOD_THEME.areas.push(...ADDITIONAL_FOOD_AREAS);
DEFAULT_FOOD_THEME.areas.forEach(expandAreaFoodItems);

export const DEFAULT_CLOTHING_THEME = {
  cultureType: 'clothing',
  moduleId: 'clothing',
  chinaAsset: {
    id: 'china-clothing-summary',
    src: '',
  },
  description: '用于测试服装文化配置隔离的空白地图，后续可按地域补充服饰、纹样、工艺和题库。',
  features: {
    aiRegionFill: false,
    itemPins: true,
    itemSpotlight: true,
  },
  id: 'chinese-clothing-map-blank',
  labels: {
    countryTitle: '可交互中国服装文化地图',
    emptyState: '暂无服装区块，等待配置地域、服饰小图、纹样工艺与题目。',
    mapSubtitle: '地图轮廓 / 服装小图点位待配置',
    sidebarTitle: '华夏服装文化地图',
    topbarMeta: 'Interactive Clothing Map',
  },
  name: '华夏服装文化地图',
  areas: [],
};

export const CULTURE_THEMES = [
  DEFAULT_FOOD_THEME,
  DEFAULT_CLOTHING_THEME,
];

// 开发流程中 MCP 配置步骤
export const FLOW_STEPS = [
  { id: 'select', label: '① 选区' },
  { id: 'prompt', label: '② 画词' },
  { id: 'asset', label: '③ 绑定' },
  { id: 'save', label: '④ 保存' },
];

/**
 * 深度克隆配置项，防止直接修改 React 状态引起副作用
 */
export function cloneTheme(theme = DEFAULT_FOOD_THEME) {
  return JSON.parse(JSON.stringify(theme));
}

export function getThemeById(themeId) {
  return CULTURE_THEMES.find((theme) => theme.id === themeId) || DEFAULT_FOOD_THEME;
}

export function getDefaultAreaId(theme = DEFAULT_FOOD_THEME) {
  return theme.areas?.[0]?.id || '';
}

/**
 * 根据 ID 获取指定美食区域
 */
export function getAreaById(theme, areaId) {
  return theme?.areas?.find((area) => area.id === areaId) || theme?.areas?.[0] || null;
}

/**
 * 构建从省级行政 adcode 到对应美食区域的快速映射字典
 */
export function buildProvinceAreaMap(theme) {
  const lookup = new Map();
  (theme?.areas || []).forEach((area) => {
    (area.provinceAdcodes || []).forEach((adcode) => lookup.set(String(adcode), area));
  });
  return lookup;
}
