import type { PermissionTreeNode } from '#/types/api';
import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { ElMessage } from 'element-plus';

import { getUserMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

/**
 * 后端菜单图标（Element Plus 命名）到 lucide 图标的映射
 */
const ICON_MAP: Record<string, string> = {
  collection: 'list',
  document: 'file-text',
  folder: 'folder',
  key: 'key',
  menu: 'menu',
  officebuilding: 'building',
  setting: 'settings',
  tickets: 'ticket',
  tools: 'wrench',
  user: 'user',
  userfilled: 'user-round',
};

function normalizeIcon(icon?: string): string {
  if (!icon) {
    return 'lucide:circle-dot';
  }
  // 已经是 iconify 格式（如 lucide:user）时直接使用
  if (icon.includes(':')) {
    return icon;
  }
  return `lucide:${ICON_MAP[icon.toLowerCase()] ?? icon.toLowerCase()}`;
}

/** 由菜单路径生成唯一的路由名称 */
function toRouteName(path: string): string {
  return path.replace(/^\//, '').replaceAll('/', '-');
}

/**
 * 后端菜单树转换为前端路由树
 * - 顶层菜单（无组件）使用基础布局
 * - 子路由使用相对路径，vben 会自动生成到第一个子路由的重定向
 */
function convertMenus(
  menus: PermissionTreeNode[],
  parentPath?: string,
): any[] {
  return (menus ?? [])
    .filter((item) => !!item.path)
    .sort((a, b) => (a.sorts ?? 0) - (b.sorts ?? 0))
    .map((item) => {
      const fullPath = item.path as string;
      const path =
        parentPath && fullPath.startsWith(`${parentPath}/`)
          ? fullPath.slice(parentPath.length + 1)
          : fullPath;

      const children = convertMenus(item.children ?? [], fullPath);

      const route: Record<string, any> = {
        component: item.component || 'BasicLayout',
        meta: {
          hideInMenu: item.isVisible === 0,
          icon: normalizeIcon(item.icon),
          keepAlive: item.isKeepAlive === 1,
          title: item.label ?? '',
        },
        name: toRouteName(fullPath),
        path,
      };

      if (children.length > 0) {
        route.children = children;
      }
      return route;
    });
}

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      ElMessage({
        duration: 1500,
        message: `${$t('common.loadingMenu')}...`,
      });
      const menus = await getUserMenusApi();
      return convertMenus(menus);
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
