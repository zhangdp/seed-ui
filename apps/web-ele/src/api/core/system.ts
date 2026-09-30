import type {
  AddUserParams,
  Dept,
  DeptTreeNode,
  PageData,
  PageQuery,
  Permission,
  PermissionTreeNode,
  SysConfig,
  SysUser,
  UserQuery,
} from '#/types/api';

import { requestClient } from '#/api/request';

/* ------------------------------ 用户 ------------------------------ */

/** 分页查询用户 */
export async function getUserPageApi(data: PageQuery<UserQuery>) {
  return requestClient.post<PageData<SysUser>>('/sys/user/page', data);
}

/** 新增用户 */
export async function addUserApi(data: AddUserParams) {
  return requestClient.post<boolean>('/sys/user/add', data);
}

/** 修改用户 */
export async function updateUserApi(data: AddUserParams) {
  return requestClient.put<boolean>('/sys/user/update', data);
}

/** 删除用户 */
export async function deleteUserApi(id: number) {
  return requestClient.delete<boolean>(`/sys/user/delete/${id}`);
}

/* ------------------------------ 部门 ------------------------------ */

/** 部门树 */
export async function getDeptTreeApi() {
  return requestClient.get<DeptTreeNode[]>('/sys/dept/tree');
}

/** 新增部门 */
export async function addDeptApi(data: Dept) {
  return requestClient.post<boolean>('/sys/dept/add', data);
}

/** 修改部门 */
export async function updateDeptApi(data: Dept) {
  return requestClient.put<boolean>('/sys/dept/update', data);
}

/** 删除部门 */
export async function deleteDeptApi(id: number) {
  return requestClient.delete<boolean>(`/sys/dept/delete/${id}`);
}

/* ------------------------------ 权限 ------------------------------ */

/** 权限树（含菜单与按钮） */
export async function getPermissionTreeApi() {
  return requestClient.get<PermissionTreeNode[]>('/sys/permission/tree');
}

/** 新增权限 */
export async function addPermissionApi(data: Permission) {
  return requestClient.post<boolean>('/sys/permission/add', data);
}

/** 修改权限（后端为 PATCH） */
export async function updatePermissionApi(data: Permission) {
  return requestClient.request<boolean>('/sys/permission/update', {
    data,
    method: 'PATCH',
  });
}

/** 删除权限 */
export async function deletePermissionApi(id: number) {
  return requestClient.delete<boolean>(`/sys/permission/delete/${id}`);
}

/* ------------------------------ 参数配置 ------------------------------ */

/** 分页查询配置 */
export async function getConfigPageApi(data: PageQuery<Record<string, any>>) {
  return requestClient.post<PageData<SysConfig>>('/sys/config/page', data);
}

/** 配置列表 */
export async function getConfigListApi() {
  return requestClient.post<SysConfig[]>('/sys/config/list');
}

/** 新增配置 */
export async function addConfigApi(data: SysConfig) {
  return requestClient.post<boolean>('/sys/config/add', data);
}

/** 修改配置 */
export async function updateConfigApi(data: SysConfig) {
  return requestClient.put<boolean>('/sys/config/update', data);
}

/** 删除配置 */
export async function deleteConfigApi(id: number) {
  return requestClient.delete<boolean>(`/sys/config/delete/${id}`);
}
