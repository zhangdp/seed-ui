import {
  appCopyrightPreferences,
  defineOverridesPreferences,
} from '@vben/preferences';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    // 菜单与路由由后端返回
    accessMode: 'backend',
    defaultHomePath: '/system/user',
    // 后端支持刷新令牌，开启后 accessToken 过期会自动续签
    enableRefreshToken: true,
    loginExpiredMode: 'modal',
  },
  copyright: appCopyrightPreferences,
  theme: {
    // 产品默认亮色，用户仍可自行切换暗色
    mode: 'light',
  },
});
