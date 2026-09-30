import type {
  Dict,
  DictData,
  PageData,
  PageQuery,
  TextQuery,
} from '#/types/api';

import { requestClient } from '#/api/request';

/** 分页查询字典 */
export async function getDictPageApi(data: PageQuery<TextQuery>) {
  return requestClient.post<PageData<Dict>>('/sys/dict/page', data);
}

/** 字典列表（不分页） */
export async function getDictListApi() {
  return requestClient.post<Dict[]>('/sys/dict/list');
}

/** 新增字典 */
export async function addDictApi(data: Dict) {
  return requestClient.post<boolean>('/sys/dict/add', data);
}

/** 修改字典 */
export async function updateDictApi(data: Dict) {
  return requestClient.put<boolean>('/sys/dict/update', data);
}

/** 删除字典 */
export async function deleteDictApi(id: number) {
  return requestClient.delete<boolean>(`/sys/dict/delete/${id}`);
}

/** 查询字典项列表 */
export async function getDictDataListApi(dictId: number) {
  return requestClient.get<DictData[]>('/sys/dict/data/list', {
    params: { dictId },
  });
}

/** 新增字典项 */
export async function addDictDataApi(data: DictData) {
  return requestClient.post<boolean>('/sys/dict/data/add', data);
}

/** 修改字典项 */
export async function updateDictDataApi(data: DictData) {
  return requestClient.put<boolean>('/sys/dict/data/update', data);
}

/** 删除字典项 */
export async function deleteDictDataApi(id: number) {
  return requestClient.delete<boolean>(`/sys/dict/data/delete/${id}`);
}
