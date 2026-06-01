# AI 传统文化交互地图

面向比赛展示的中国传统文化交互地图 Demo。当前版本以美食文化为主题，支持全国大盘、文化大区和省份下钻，并展示 AI 图片、视频和可配置互动内容。

## 技术栈

- React 18
- Vite
- Zustand
- React Simple Maps
- Hono MCP bridge

## 本地运行

```bash
npm install
npm run dev
```

默认前端地址为 `http://localhost:5174/`。

## 构建

```bash
npm run build
```

## 项目结构

- `src/`: 前端交互地图应用
- `server/`: 本地 MCP bridge 与素材配置数据
- `public/`: 地图 GeoJSON、视频和 AI 生成素材
- `scripts/`: 素材裁剪与轮廓生成脚本
- `PRD.md`: 产品需求说明
