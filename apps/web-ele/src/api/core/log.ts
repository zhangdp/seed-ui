import type {
  CursorPageQuery,
  LoginLog,
  OperationLog,
  PageData,
  SmsLog,
} from '#/types/api';

import { requestClient } from '#/api/request';

/** 登录日志查询条件 */
interface LoginLogQuery {
  endTime?: string;
  loginType?: string;
  startTime?: string;
  userId?: number;
}

/** 操作日志查询条件 */
interface OperationLogQuery {
  endTime?: string;
  refModule?: string;
  startTime?: string;
  type?: string;
  uri?: string;
  userId?: number;
}

/** 短信日志查询条件 */
interface SmsLogQuery {
  endTime?: string;
  mobile?: string;
  priority?: number;
  scene?: string;
  smsNo?: string;
  startTime?: string;
  status?: number;
}

/** 分页查询登录日志 */
export async function getLoginLogPageApi(
  data: CursorPageQuery<LoginLogQuery>,
) {
  return requestClient.post<PageData<LoginLog>>('/sys/loginLog/page', data);
}

/** 分页查询操作日志 */
export async function getOperationLogPageApi(
  data: CursorPageQuery<OperationLogQuery>,
) {
  return requestClient.post<PageData<OperationLog>>(
    '/sys/operationLog/page',
    data,
  );
}

/** 分页查询短信日志 */
export async function getSmsLogPageApi(data: CursorPageQuery<SmsLogQuery>) {
  return requestClient.post<PageData<SmsLog>>('/sys/smsLog/page', data);
}
