# AI 传统文化交互地图

面向比赛展示的中国传统文化交互地图 Demo。当前版本以“中国宗教信仰文化区”为主题，支持全国大盘、六大信仰文化区、省份下钻、图板预览、文化线索热点和趣味问答。

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

如果你是第一次打开前端项目，可以按这个顺序来：

1. 打开项目文件夹。
2. 在终端运行 `npm install` 安装依赖。
3. 再运行 `npm run dev` 启动页面。
4. 浏览器访问终端里显示的本地地址。

## 构建

```bash
npm run build
```

## 项目结构

- `src/`: 前端交互地图应用
- `server/`: 本地 MCP bridge 与素材配置数据
- `public/`: 地图 GeoJSON、图板素材、视频和 AI 生成素材
- `scripts/`: 素材裁剪与轮廓生成脚本
- `PRD.md`: 产品需求说明
