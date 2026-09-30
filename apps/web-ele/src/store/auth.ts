import type { PermissionTreeNode } from '#/types/api';
import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import {
  getAccessCodesApi,
  getUserInfoApi,
  getUserMenusApi,
  loginByPasswordApi,
  loginBySmsApi,
  logoutApi,
} from '#/api';
import { $t } from '#/locales';

/**
 * 从菜单树中解析首页地址：取第一个可访问（带组件）的菜单
 */
function resolveHomePath(menus?: PermissionTreeNode[]): string {
  const walk = (nodes?: PermissionTreeNode[]): string | undefined => {
    for (const node of nodes ?? []) {
      if (node.component && node.path) {
        return node.path;
      }
      const childPath = walk(node.children);
      if (childPath) {
        return childPath;
      }
    }
  };
  return walk(menus) ?? preferences.app.defaultHomePath;
}

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * @param params 登录表单数据
   * @param onSuccess 登录成功后的回调
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      // sms 为 true 时走短信验证码登录，否则为密码登录
      const result = params.sms
        ? await loginBySmsApi({
            code: params.code,
            mobile: params.mobile,
          })
        : await loginByPasswordApi({
            captchaKey: params.captchaKey ?? params.captcha?.key,
            code: params.code ?? params.captcha?.code,
            password: params.password,
            username: params.username,
          });

      if (result?.accessToken) {
        accessStore.setAccessToken(result.accessToken);
        accessStore.setRefreshToken(result.refreshToken);

        const [profile, accessCodes, menus] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
          getUserMenusApi(),
        ]);

        userInfo = { ...profile, homePath: resolveHomePath(menus) };
        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return { userInfo };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 无论服务端结果如何，前端都当做注销成功
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 已经在登录页时不能再带 redirect：否则反复登出会让 URL 逐跳变长
    const currentRoute = router.currentRoute.value;
    const alreadyOnLogin = currentRoute.path === LOGIN_PATH;

    await router.replace({
      path: LOGIN_PATH,
      query:
        redirect && !alreadyOnLogin
          ? { redirect: encodeURIComponent(currentRoute.fullPath) }
          : {},
    });
  }

  /**
   * 获取并转换当前登录用户信息
   */
  async function fetchUserInfo(): Promise<UserInfo> {
    const info = await getUserInfoApi();
    const userInfo: UserInfo = {
      avatar: info.avatar ?? '',
      desc: info.dept?.name ?? '',
      homePath: preferences.app.defaultHomePath,
      realName: info.name || info.username || '',
      roles: info.roles?.map((role) => role.code ?? '') ?? [],
      token: accessStore.accessToken ?? '',
      userId: String(info.id ?? ''),
      username: info.username ?? '',
    };
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
