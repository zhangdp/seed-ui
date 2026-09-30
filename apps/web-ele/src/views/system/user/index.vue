<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { DeptTreeNode, Role, SysUser } from '#/types/api';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';

import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addUserApi,
  deleteUserApi,
  getDeptTreeApi,
  getRoleListApi,
  getUserPageApi,
  updateUserApi,
} from '#/api';

defineOptions({ name: 'SystemUser' });

const { hasAccessByCodes } = useAccess();

const deptTree = ref<DeptTreeNode[]>([]);
const roleOptions = ref<Role[]>([]);

const STATUS_OPTIONS = [
  { label: '正常', value: 0 },
  { label: '锁定', value: 1 },
];

const GENDER_OPTIONS = [
  { label: '男', value: 'M' },
  { label: '女', value: 'F' },
];

/** 部门id -> 部门名 */
const deptNameMap = computed(() => {
  const map = new Map<number, string>();
  const walk = (nodes: DeptTreeNode[]) => {
    for (const node of nodes) {
      map.set(Number(node.value), node.label ?? '');
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(deptTree.value);
  return map;
});

/* ------------------------------ 列表 ------------------------------ */

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '按账号/姓名/手机号搜索' },
      fieldName: 'keyword',
      label: '关键字',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        checkStrictly: true,
        placeholder: '请选择部门',
        treeData: [],
      },
      fieldName: 'deptId',
      label: '部门',
    },
    {
      component: 'Select',
      componentProps: { allowClear: true, options: STATUS_OPTIONS },
      fieldName: 'status',
      label: '状态',
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
};

const gridOptions: VxeGridProps<SysUser> = {
  align: 'left',
  columns: [
    {
      field: 'name',
      minWidth: 220,
      slots: { default: 'user' },
      title: '用户',
    },
    { field: 'mobile', minWidth: 120, title: '手机号' },
    {
      field: 'email',
      minWidth: 170,
      showOverflow: 'tooltip',
      title: '邮箱',
    },
    {
      field: 'deptId',
      minWidth: 100,
      slots: { default: 'dept' },
      title: '部门',
    },
    {
      field: 'roles',
      minWidth: 150,
      slots: { default: 'roles' },
      title: '角色',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'createdAt',
      formatter: 'formatDateTime',
      minWidth: 150,
      title: '创建时间',
    },
    {
      field: 'operation',
      fixed: 'right',
      slots: { default: 'operation' },
      title: '操作',
      width: 120,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const { keyword, ...rest } = formValues ?? {};
        return await getUserPageApi({
          page: page.currentPage,
          params: {
            ...rest,
            ...(keyword ? { nameLike: keyword } : {}),
          },
          size: page.pageSize,
        });
      },
    },
    response: { list: 'list', result: 'list', total: 'total' },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

/* ------------------------------ 新增/编辑 ------------------------------ */

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 90 },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入账号' },
      fieldName: 'username',
      label: '账号',
      rules: z.string().min(1, { message: '请输入账号' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入姓名' },
      fieldName: 'name',
      label: '姓名',
    },
    {
      component: 'InputPassword',
      componentProps: { placeholder: '新增时必填，留空表示不修改' },
      fieldName: 'password',
      label: '密码',
      rules: z.string().optional(),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入手机号' },
      fieldName: 'mobile',
      label: '手机号',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入邮箱' },
      fieldName: 'email',
      label: '邮箱',
    },
    {
      component: 'Select',
      componentProps: { options: GENDER_OPTIONS },
      fieldName: 'gender',
      label: '性别',
    },
    {
      component: 'DatePicker',
      componentProps: { placeholder: '请选择生日', valueFormat: 'YYYY-MM-DD' },
      fieldName: 'birthDate',
      label: '生日',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        checkStrictly: true,
        placeholder: '请选择部门',
        treeData: [],
      },
      fieldName: 'deptId',
      label: '部门',
    },
    {
      component: 'Select',
      componentProps: { options: STATUS_OPTIONS },
      defaultValue: 0,
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        multiple: true,
        options: [],
        placeholder: '请选择角色',
      },
      fieldName: 'roleIds',
      label: '角色',
      rules: z.array(z.number()).min(1, { message: '请至少选择一个角色' }),
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values = (await formApi.getValues()) as Record<string, any>;
    const payload: Record<string, any> = {
      birthDate: values.birthDate || undefined,
      deptId: values.deptId,
      email: values.email,
      gender: values.gender,
      mobile: values.mobile,
      name: values.name,
      roleIds: values.roleIds ?? [],
      status: values.status,
      username: values.username,
    };
    if (values.password) {
      payload.password = values.password;
    }

    const id = (modalApi.getData() as SysUser | undefined)?.id;
    const success = id
      ? await updateUserApi({ ...payload, id })
      : await addUserApi(payload);
    if (success) {
      ElMessage.success(id ? '修改成功' : '新增成功');
      modalApi.close();
      gridApi.reload();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as SysUser | undefined;
    formApi.resetForm();
    formApi.updateSchema([
      {
        componentProps: {
          multiple: true,
          options: roleOptions.value.map((item) => ({
            label: item.name,
            value: item.id,
          })),
        },
        fieldName: 'roleIds',
      },
    ]);
    if (data?.id) {
      formApi.setValues({
        ...data,
        password: '',
        roleIds: (data.roles ?? []).map((item) => item.id),
      });
      // 编辑时账号不允许修改
      formApi.updateSchema([{ disabled: true, fieldName: 'username' }]);
    } else {
      formApi.updateSchema([{ disabled: false, fieldName: 'username' }]);
    }
  },
  title: '用户',
});

function openModal(row?: SysUser) {
  modalApi.setData(row ?? ({} as SysUser));
  modalApi.open();
}

async function handleDelete(row: SysUser) {
  await ElMessageBox.confirm(
    `确认删除用户「${row.name ?? row.username}」？`,
    '提示',
    { type: 'warning' },
  );
  const success = await deleteUserApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    gridApi.reload();
  }
}

function initial(name?: string) {
  return (name ?? '?').slice(0, 1).toUpperCase();
}

/* ------------------------------ 初始化 ------------------------------ */

onMounted(async () => {
  try {
    deptTree.value = await getDeptTreeApi();
  } catch {
    deptTree.value = [];
  }
  try {
    roleOptions.value = await getRoleListApi();
  } catch {
    roleOptions.value = [];
  }
  // 部门树同时用于搜索表单与新增表单
  gridApi.formApi.updateSchema([
    { componentProps: { treeData: deptTree.value }, fieldName: 'deptId' },
  ]);
  formApi.updateSchema([
    { componentProps: { treeData: deptTree.value }, fieldName: 'deptId' },
  ]);
});
</script>

<template>
  <Page
    auto-content-height
    description="维护系统账号、所属部门与角色权限"
    title="用户管理"
  >
    <Grid :separator="false" class="seed-table">
      <template #toolbar-tools>
        <ElButton
          v-if="hasAccessByCodes(['sys:user:add'])"
          type="primary"
          @click="openModal()"
        >
          新增用户
        </ElButton>
      </template>

      <template #user="{ row }">
        <div class="flex items-center gap-3">
          <span class="seed-avatar">{{
            initial(row.name || row.username)
          }}</span>
          <div class="text-left">
            <div class="seed-cell-main">
              {{ row.name || row.username }}
            </div>
            <div class="seed-cell-sub">@{{ row.username }}</div>
          </div>
        </div>
      </template>

      <template #dept="{ row }">
        <span
          v-if="deptNameMap.get(Number(row.deptId))"
          class="seed-chip seed-chip--primary"
        >
          {{ deptNameMap.get(Number(row.deptId)) }}
        </span>
        <span v-else class="seed-muted">-</span>
      </template>

      <template #roles="{ row }">
        <div class="flex flex-wrap justify-start gap-1">
          <span
            v-for="role in row.roles ?? []"
            :key="role.id"
            class="seed-chip"
          >
            {{ role.name }}
          </span>
          <span v-if="!(row.roles ?? []).length" class="seed-muted">-</span>
        </div>
      </template>

      <template #status="{ row }">
        <span
          :class="row.status === 0 ? 'seed-chip--success' : 'seed-chip--danger'"
          class="seed-chip"
        >
          <i
            :class="row.status === 0 ? 'seed-dot' : 'seed-dot seed-dot--off'"
          ></i>
          {{ row.status === 0 ? '正常' : '锁定' }}
        </span>
      </template>

      <template #operation="{ row }">
        <div class="seed-row-actions">
          <ElButton
            v-if="hasAccessByCodes(['sys:user:update'])"
            link
            type="primary"
            @click="openModal(row)"
          >
            编辑
          </ElButton>
          <ElButton
            v-if="hasAccessByCodes(['sys:user:delete'])"
            link
            type="danger"
            @click="handleDelete(row)"
          >
            删除
          </ElButton>
        </div>
      </template>
    </Grid>

    <Modal class="w-[600px]">
      <Form />
    </Modal>
  </Page>
</template>
