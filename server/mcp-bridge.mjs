import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  clipImageAsset,
  readImageAssets,
  regenerateImageAsset,
  regenerateImageAssets,
  updateImageAsset,
} from './image-assets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, 'data/food-map-config.json');
const port = Number(process.env.MCP_BRIDGE_PORT || 8787);

const mcpServer = new McpServer({
  name: 'food-culture-map-bridge',
  version: '0.1.0',
});

const areaFallbacks = {
  'sichuan-chongqing-food': {
    description: '麻辣火锅、豆花、串串与江湖菜共同构成热烈的川渝味觉。',
    name: '川渝麻辣美食区',
  },
  'jiangnan-snack-food': {
    description: '小笼、汤包、糕团、鲜食与水乡风物形成细腻的江南食谱。',
    name: '江南点心鲜食区',
  },
  'lingnan-dim-sum-food': {
    description: '早茶、烧腊、海味与骑楼市井串联出岭南餐桌。',
    name: '岭南早茶海味区',
  },
  'northwest-noodle-food': {
    description: '面食、羊肉、香料与绿洲集市让西北味道有清晰的地理线索。',
    name: '西北面食香料区',
  },
  'northern-banquet-food': {
    description: '面点、鲁菜、豫菜与宴席传统共同组成北方餐桌骨架。',
    name: '北方宴席面点区',
  },
  'guizhou-sour-spicy-food': {
    description: '酸汤鱼、辣子鸡、折耳根与肠旺面共同串起贵州山水间的酸辣滋味。',
    name: '黔味酸辣美食区',
  },
};

const schemas = {
  'food.attachImageAsset': z.object({
    areaId: z.string(),
    coordinates: z.tuple([z.coerce.number(), z.coerce.number()]),
    size: z.object({
      height: z.coerce.number(),
      width: z.coerce.number(),
    }),
    src: z.string(),
    title: z.string(),
  }),
  'food.exportConfig': z.object({
    themeId: z.string().optional(),
  }),
  'food.generatePrompt': z.object({
    areaId: z.string(),
    areaName: z.string().optional(),
    description: z.string().optional(),
    style: z.string().optional(),
  }),
  'food.saveConfig': z.object({
    theme: z.unknown(),
  }),
  'food.updateAreaConfig': z.object({
    areaId: z.string(),
    patch: z.record(z.string(), z.unknown()),
  }),
};

const toolDefinitions = [
  {
    description: '根据文化区信息生成美食 AI 图片 prompt。',
    name: 'food.generatePrompt',
    title: '生成美食图片 Prompt',
  },
  {
    description: '把 AI 图片素材绑定到文化区地图坐标。',
    name: 'food.attachImageAsset',
    title: '绑定地图 AI 图片',
  },
  {
    description: '更新文化区配置补丁。',
    name: 'food.updateAreaConfig',
    title: '更新文化区配置',
  },
  {
    description: '保存当前美食主题配置。',
    name: 'food.saveConfig',
    title: '保存配置',
  },
  {
    description: '导出已保存的美食主题配置。',
    name: 'food.exportConfig',
    title: '导出配置',
  },
];

async function ensureDataDir() {
  await mkdir(dirname(dataPath), { recursive: true });
}

async function readSavedConfig() {
  try {
    return await readFile(dataPath, 'utf8');
  } catch {
    return '';
  }
}

const handlers = {
  async 'food.attachImageAsset'(params) {
    return {
      asset: {
        areaId: params.areaId,
        coordinates: params.coordinates,
        id: `asset-${params.areaId}-ai-food`,
        size: params.size,
        src: params.src,
        title: params.title,
        type: 'image',
      },
    };
  },

  async 'food.exportConfig'(params) {
    const saved = await readSavedConfig();
    return {
      configText: saved || JSON.stringify({ id: params.themeId || 'chinese-food-map', status: 'not-saved-yet' }, null, 2),
    };
  },

  async 'food.generatePrompt'(params) {
    const fallback = areaFallbacks[params.areaId] || {};
    const areaName = params.areaName || fallback.name || params.areaId;
    const description = params.description || fallback.description || '中国地域美食文化';
    const style = params.style || '高级教育 Demo，真实食物质感，温暖诱人的光线';
    return {
      prompt: `A polished AI-generated Chinese regional cuisine illustration for an interactive culture map: ${areaName}. ${description}. ${style}. No text, no watermark, landscape 16:9, premium educational demo visual.`,
    };
  },

  async 'food.saveConfig'(params) {
    await ensureDataDir();
    await writeFile(dataPath, JSON.stringify(params.theme, null, 2));
    return {
      path: dataPath,
      savedAt: new Date().toISOString(),
    };
  },

  async 'food.updateAreaConfig'(params) {
    return {
      areaId: params.areaId,
      patch: params.patch,
    };
  },
};

toolDefinitions.forEach((tool) => {
  mcpServer.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: schemas[tool.name],
      title: tool.title,
    },
    async (args) => {
      const result = await handlers[tool.name](args);
      return {
        content: [{ text: JSON.stringify(result, null, 2), type: 'text' }],
      };
    },
  );
});

const app = new Hono();
app.use('*', cors());

app.get('/api/mcp/tools', (c) => c.json({
  server: {
    name: 'food-culture-map-bridge',
    sdk: '@modelcontextprotocol/sdk',
  },
  tools: toolDefinitions,
}));

app.post('/api/mcp/run', async (c) => {
  try {
    const body = await c.req.json();
    const tool = String(body.tool || '');
    const definition = toolDefinitions.find((item) => item.name === tool);
    if (!definition) {
      return c.json({ error: `Unknown MCP tool: ${tool}`, ok: false, tool }, 404);
    }

    const params = schemas[tool].parse(body.params || {});
    const result = await handlers[tool](params);
    return c.json({
      ok: true,
      result,
      status: 'done',
      tool,
    });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      ok: false,
      status: 'failed',
    }, 400);
  }
});

app.get('/api/assets', async (c) => {
  try {
    const assets = await readImageAssets();
    return c.json({
      assets,
      settings: {
        apiBaseUrl: process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
        model: process.env.IMAGE_GEN_MODEL || 'gpt-image-2',
        quality: process.env.IMAGE_GEN_QUALITY || 'high',
        size: process.env.IMAGE_GEN_SIZE || 'auto',
      },
    });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    }, 500);
  }
});

app.patch('/api/assets/:assetId', async (c) => {
  try {
    const assetId = decodeURIComponent(c.req.param('assetId'));
    const body = await c.req.json();
    const patch = {};
    if (typeof body.prompt === 'string') patch.prompt = body.prompt;
    if (typeof body.model === 'string') patch.model = body.model;
    if (typeof body.quality === 'string') patch.quality = body.quality;
    if (typeof body.size === 'string') patch.size = body.size;
    const asset = await updateImageAsset(assetId, patch);
    return c.json({ asset, ok: true });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    }, 400);
  }
});

app.post('/api/assets/batch-regenerate', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await regenerateImageAssets({
      assetIds: Array.isArray(body.assetIds) ? body.assetIds : undefined,
      concurrency: body.concurrency,
      kinds: Array.isArray(body.kinds) ? body.kinds : undefined,
      limit: body.limit,
      onlyMissing: body.onlyMissing === true,
      patch: body.patch,
      patchById: body.patchById,
    });
    return c.json({ ...result, ok: true });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    }, 400);
  }
});

app.post('/api/assets/:assetId/regenerate', async (c) => {
  try {
    const assetId = decodeURIComponent(c.req.param('assetId'));
    const body = await c.req.json().catch(() => ({}));
    const result = await regenerateImageAsset(assetId, body);
    return c.json({ ...result, ok: true });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    }, 400);
  }
});

app.post('/api/assets/:assetId/clip', async (c) => {
  try {
    const assetId = decodeURIComponent(c.req.param('assetId'));
    const body = await c.req.json().catch(() => ({}));
    const result = await clipImageAsset(assetId, body);
    return c.json({ ...result, ok: true });
  } catch (error) {
    return c.json({
      error: error instanceof Error ? error.message : String(error),
      ok: false,
    }, 400);
  }
});

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`MCP bridge listening on http://localhost:${info.port}`);
});
