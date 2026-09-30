/**
 * 后端 seed 接口的数据类型定义
 * 所有 API 方法返回的均为后端统一响应体 R 中的 data 部分（已在 requestClient 中解包）
 */

/** 登录结果 */
interface LoginResult {
  /** 访问令牌 */
  accessToken: string;
  /** 访问令牌剩余有效期（秒） */
  expiresIn: number;
  /** 刷新令牌 */
  refreshToken: string;
  /** 令牌类型，固定 Bearer */
  tokenType: string;
  /** 用户id */
  userId: number;
  /** 账号 */
  username: string;
}

/** 分页数据 */
interface PageData<T> {
  /** 当前页数据列表 */
  list: T[];
  /** 当前页数 */
  page: number;
  /** 每页条数 */
  size: number;
  /** 总数 */
  total: number;
}

/** 分页查询入参 */
interface PageQuery<T> {
  /** 排序，如 create_time asc */
  orderBy?: string;
  /** 页数 */
  page: number;
  params?: T;
  /** 每页条数 */
  size: number;
  /** 总数，小于0表示需要计算总数 */
  total?: number;
}

/** 游标分页查询入参（日志类接口使用） */
interface CursorPageQuery<T> {
  /** 是否统计总数 */
  countTotal?: boolean;
  /** 游标 */
  cursor?: number;
  /** 是否降序 */
  desc?: boolean;
  page: number;
  params?: T;
  size: number;
}

/** 树节点公共字段 */
interface TreeNode {
  children?: any[];
  description?: string;
  disabled?: boolean;
  icon?: string;
  isLeaf?: boolean;
  label?: string;
  parent?: number;
  selected?: boolean;
  sorts?: number;
  value?: number;
}

/** 菜单（权限）树节点 */
interface PermissionTreeNode extends TreeNode {
  /** 前端组件路径，如 system/user/index */
  component?: string;
  /** 是否路由缓冲，0：否；1：是 */
  isKeepAlive?: number;
  /** 是否显示，0：否；1：是 */
  isVisible?: number;
  /** 路由路径 */
  path?: string;
  /** 权限标识 */
  permission?: string;
}

/** 部门树节点 */
type DeptTreeNode = TreeNode;

/** 角色 */
interface Role {
  code?: string;
  description?: string;
  id?: number;
  name?: string;
}

/** 字典 */
interface Dict {
  description?: string;
  id?: number;
  /** 是否系统内置，1：是 */
  isSystem?: number;
  name?: string;
  /** 字典类型 */
  type?: string;
}

/** 字典项 */
interface DictData {
  description?: string;
  dictId?: number;
  id?: number;
  label?: string;
  /** 扩展数据（JSON 字符串） */
  metaData?: string;
  sorts?: number;
  value?: string;
}

/** 部门 */
interface Dept {
  /** 树形表格子节点 */
  children?: Dept[];
  id?: number;
  name?: string;
  parentId?: null | number;
  sorts?: number;
}

/** 用户 */
interface SysUser {
  avatar?: string;
  birthDate?: string;
  citizenId?: string;
  createdAt?: string;
  dept?: Dept;
  deptId?: number;
  email?: string;
  gender?: string;
  id?: number;
  mobile?: string;
  name?: string;
  /** 密码，新增时必填，查询时不返回 */
  password?: string;
  /** 角色id列表，新增/修改用户时使用 */
  roleIds?: number[];
  roles?: Role[];
  status?: number;
  updatedAt?: string;
  username?: string;
}

/** 新增/修改用户入参 */
interface AddUserParams extends SysUser {
  roleIds?: number[];
}

/** 用户查询条件 */
interface UserQuery {
  deptId?: number;
  excludeSelf?: boolean;
  gender?: string;
  loginUserId?: number;
  mobile?: string;
  nameLike?: string;
  status?: number;
  username?: string;
}

/** 权限（菜单/按钮） */
interface Permission {
  /** 树形表格子节点 */
  children?: Permission[];
  /** 权限标识 */
  code?: string;
  component?: string;
  description?: string;
  icon?: string;
  id?: number;
  keepAlive?: number;
  name?: string;
  parentId?: null | number;
  path?: string;
  sorts?: number;
  /** menu：菜单；button：按钮 */
  type?: string;
  visible?: number;
}

/** 系统配置 */
interface SysConfig {
  configKey?: string;
  configValue?: string;
  description?: string;
  id?: number;
  isEncrypted?: number;
  isSystem?: number;
}

/** 登录日志 */
interface LoginLog {
  clientIp?: string;
  id?: number;
  location?: string;
  loginAt?: string;
  resultCode?: number;
  type?: string;
  userAgent?: string;
  userId?: number;
  username?: string;
}

/** 操作日志 */
interface OperationLog {
  clientIp?: string;
  costTime?: number;
  description?: string;
  httpMethod?: string;
  id?: number;
  method?: string;
  operatedAt?: string;
  refId?: number;
  refModule?: string;
  requestUri?: string;
  resultCode?: number;
  traceId?: string;
  type?: string;
  userAgent?: string;
  userId?: number;
}

/** 短信日志 */
interface SmsLog {
  bizId?: string;
  content?: string;
  id?: number;
  mobile?: string;
  priority?: number;
  resultCode?: string;
  resultMessage?: string;
  retryCount?: number;
  scene?: string;
  sendAt?: string;
  signName?: string;
  smsNo?: string;
  status?: number;
  templateCode?: string;
}

/** 通用文本查询条件（角色、字典、配置等） */
interface TextQuery {
  query?: string;
}

/** 图形验证码 */
interface ImageCaptcha {
  /** 带 data:image/png;base64, 前缀，可直接用于 img 的 src */
  image: string;
  /** 验证码标识 */
  key: string;
}

export type {
  AddUserParams,
  CursorPageQuery,
  Dept,
  DeptTreeNode,
  Dict,
  DictData,
  ImageCaptcha,
  LoginLog,
  LoginResult,
  OperationLog,
  PageData,
  PageQuery,
  Permission,
  PermissionTreeNode,
  Role,
  SmsLog,
  SysConfig,
  SysUser,
  TextQuery,
  UserQuery,
};
