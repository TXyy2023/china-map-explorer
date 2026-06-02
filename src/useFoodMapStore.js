import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_CULTURE_THEME_ID,
  STORAGE_KEY,
  cloneTheme,
  getCultureThemeById,
} from './foodMapConfig.js';

/**
 * 中华美食文化地图状态管理 Store (使用 Zustand)
 * 并结合 persist 中间件，自动将主题配置持久化缓存至 localStorage 中
 */
export const useFoodMapStore = create(
  persist(
    (set) => ({
      cultureThemeId: DEFAULT_CULTURE_THEME_ID,
      // 初始化状态：深度克隆默认的中华美食主题配置
      theme: cloneTheme(getCultureThemeById(DEFAULT_CULTURE_THEME_ID)),

      // 绑定/附加 AI 图像素材到指定的文化区
      attachImageAsset: (areaId, asset) => set((state) => ({
        theme: {
          ...state.theme,
          areas: state.theme.areas.map((area) => {
            if (area.id !== areaId) return area;
            // 如果已存在该素材 ID，则更新；否则将新素材追加至 assets 列表末尾
            const assets = area.assets.some((item) => item.id === asset.id)
              ? area.assets.map((item) => (item.id === asset.id ? { ...item, ...asset } : item))
              : [...area.assets, asset];
            return { ...area, assets };
          }),
        },
      })),

      // 恢复/重置当前主题为最初的默认美食地图配置
      resetTheme: () => set((state) => ({
        theme: cloneTheme(getCultureThemeById(state.cultureThemeId || DEFAULT_CULTURE_THEME_ID)),
      })),

      switchCultureTheme: (cultureThemeId) => set({
        cultureThemeId,
        theme: cloneTheme(getCultureThemeById(cultureThemeId)),
      }),

      // 局部更新指定文化区的具体配置项（如中心点坐标、颜色等）
      updateAreaConfig: (areaId, patch) => set((state) => ({
        theme: {
          ...state.theme,
          areas: state.theme.areas.map((area) => (area.id === areaId ? { ...area, ...patch } : area)),
        },
      })),
    }),
    {
      name: STORAGE_KEY, // localStorage 的 key 键名
      partialize: (state) => ({ cultureThemeId: state.cultureThemeId, theme: state.theme }), // 仅持久化存储主题配置状态
    },
  ),
);
