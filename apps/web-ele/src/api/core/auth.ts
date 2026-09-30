import type {
  ImageCaptcha,
  LoginResult,
  PermissionTreeNode,
  SysUser,
} from '#/types/api';

import { useAccessStore } from '@vben/stores';

import { baseRequestClient, requestClient } from '#/api/request';

/** 后端统一响应体（baseRequestClient 未做解包，返回原始结构） */
interface R<T> {
  code: number;
  data: T;
  message: string;
}

export namespace AuthApi {
  /** 密码登录入参 */
  export interface PasswordLoginParams {
    /** 图形验证码 */
    code: string;
    /** 图形验证码标识 */
    captchaKey: string;
    password: string;
    username: string;
  }

  /** 短信登录入参 */
  export interface SmsLoginParams {
    code: string;
    mobile: string;
  }
}

/** 密码登录 */
export async function loginByPasswordApi(data: AuthApi.PasswordLoginParams) {
  return requestClient.post<LoginResult>('/auth/login/password', data);
}

/** 短信验证码登录 */
export async function loginBySmsApi(data: AuthApi.SmsLoginParams) {
  return requestClient.post<LoginResult>('/auth/login/sms', data);
}

/** 注销，服务端会一并作废刷新令牌 */
export async function logoutApi() {
  return requestClient.delete<boolean>('/auth/logout');
}

/**
 * 刷新令牌
 * refreshToken 由本地 store 提供，无需调用方传入
 */
export async function refreshTokenApi() {
  const accessStore = useAccessStore();
  const resp = await baseRequestClient.post<R<LoginResult>>(
    '/auth/token/refresh',
    null,
    { params: { refreshToken: accessStore.refreshToken } },
  );
  return resp.data;
}

/** 检测当前令牌是否有效 */
export async function checkTokenApi() {
  return requestClient.post<boolean>('/auth/token/check');
}

/** 获取当前登录用户的详细信息 */
export async function getUserInfoApi() {
  return requestClient.get<SysUser>('/auth/user/info');
}

/** 获取当前登录用户的菜单树 */
export async function getUserMenusApi() {
  return requestClient.get<PermissionTreeNode[]>('/auth/user/menus');
}

/**
 * 获取权限标识列表（含菜单与按钮）
 * 后端暂无“我的权限码”接口，这里复用权限树接口；
 * 无权限时（普通用户）返回空数组，按钮全部隐藏
 */
export async function getAccessCodesApi() {
  try {
    const tree = await requestClient.get<PermissionTreeNode[]>(
      '/sys/permission/tree',
    );
    const codes: string[] = [];
    const walk = (nodes?: PermissionTreeNode[]) => {
      (nodes ?? []).forEach((node) => {
        if (node.permission) {
          codes.push(node.permission);
        }
        walk(node.children);
      });
    };
    walk(tree);
    return codes;
  } catch {
    return [] as string[];
  }
}

/** 获取图形验证码 */
export async function getImageCaptchaApi(scene = 'login') {
  return requestClient.get<ImageCaptcha>('/captcha/image', {
    params: { scene },
  });
}

/** 发送短信验证码 */
export async function sendSmsCaptchaApi(data: {
  mobile: string;
  scene?: string;
}) {
  return requestClient.post<boolean>('/captcha/sms', {
    ...data,
    scene: data.scene ?? 'login',
  });
}
