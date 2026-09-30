import type { PageData, PageQuery, Role, TextQuery } from '#/types/api';

import { requestClient } from '#/api/request';

/** 分页查询角色 */
export async function getRolePageApi(data: PageQuery<TextQuery>) {
  return requestClient.post<PageData<Role>>('/sys/role/page', data);
}

/** 角色列表（不分页） */
export async function getRoleListApi() {
  return requestClient.post<Role[]>('/sys/role/list');
}

/** 新增角色 */
export async function addRoleApi(data: Role) {
  return requestClient.post<boolean>('/sys/role/add', data);
}

/** 修改角色 */
export async function updateRoleApi(data: Role) {
  return requestClient.put<boolean>('/sys/role/update', data);
}

/** 删除角色 */
export async function deleteRoleApi(id: number) {
  return requestClient.delete<boolean>(`/sys/role/delete/${id}`);
}

/** 查询角色已分配的权限id */
export async function getRolePermissionIdsApi(roleId: number) {
  return requestClient.get<number[]>(`/sys/role/permission/${roleId}`);
}

/** 分配角色权限（全量覆盖） */
export async function saveRolePermissionsApi(
  roleId: number,
  permissionIds: number[],
) {
  return requestClient.put<boolean>('/sys/role/permission', {
    permissionIds,
    roleId,
  });
}
