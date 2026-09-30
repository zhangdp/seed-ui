<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { DeptTreeNode, SysUser } from '#/types/api';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addUserApi,
  deleteUserApi,
  getDeptTreeApi,
  getUserPageApi,
  updateUserApi,
} from '#/api';

defineOptions({ name: 'SystemUser' });

const { hasAccessByCodes } = useAccess();

/** vxe 列格式化函数参数 */
interface FormatterParams {
  cellValue: any;
}

const deptTree = ref<DeptTreeNode[]>([]);

const STATUS_OPTIONS = [
  { label: '正常', value: 0 },
  { label: '锁定', value: 1 },
];

const GENDER_OPTIONS = [
  { label: '男', value: 'M' },
  { label: '女', value: 'F' },
];

/* ------------------------------ 列表 ------------------------------ */

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入账号' },
      fieldName: 'username',
      label: '账号',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入姓名关键字' },
      fieldName: 'nameLike',
      label: '姓名',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入手机号' },
      fieldName: 'mobile',
      label: '手机号',
    },
    {
      component: 'TreeSelect',
      componentProps: {
        checkStrictly: true,
        placeholder: '请选择部门',
        showCheckbox: false,
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
  showCollapseButton: true,
  submitButtonOptions: { content: '查询' },
};

const gridOptions: VxeGridProps<SysUser> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'username', minWidth: 120, title: '账号' },
    { field: 'name', minWidth: 120, title: '姓名' },
    { field: 'mobile', minWidth: 130, title: '手机号' },
    { field: 'email', minWidth: 180, title: '邮箱' },
    {
      field: 'dept',
      formatter: ({ cellValue }: FormatterParams) => cellValue?.name ?? '-',
      minWidth: 120,
      title: '部门',
    },
    {
      field: 'roles',
      formatter: ({ cellValue }: FormatterParams) =>
        (cellValue ?? []).map((item: any) => item.name).join('、') || '-',
      minWidth: 160,
      title: '角色',
    },
    {
      field: 'status',
      formatter: ({ cellValue }: FormatterParams) =>
        cellValue === 0 ? '正常' : '锁定',
      minWidth: 90,
      title: '状态',
    },
    {
      field: 'createdAt',
      formatter: 'formatDateTime',
      minWidth: 160,
      title: '创建时间',
    },
    {
      field: 'operation',
      fixed: 'right',
      slots: { default: 'operation' },
      title: '操作',
      width: 160,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        return await getUserPageApi({
          page: page.currentPage,
          params: formValues,
          size: page.pageSize,
        });
      },
    },
    response: { list: 'list', result: 'list', total: 'total' },
  },
  // search 为 vben 扩展配置，用于显示搜索表单的显示/隐藏切换按钮
  toolbarConfig: { search: true } as any,
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
      component: 'Input',
      componentProps: {
        placeholder: '角色ID，多个用逗号分隔，如 1,2',
      },
      fieldName: 'roleIdsText',
      label: '角色ID',
      rules: z.string().min(1, { message: '请填写角色ID' }),
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
    const roleIds = String(values.roleIdsText ?? '')
      .split(',')
      .map((item) => Number(item.trim()))
      .filter((item) => !Number.isNaN(item) && item > 0);

    if (roleIds.length === 0) {
      ElMessage.warning('请填写正确的角色ID');
      return;
    }

    const payload: Record<string, any> = {
      birthDate: values.birthDate || undefined,
      deptId: values.deptId,
      email: values.email,
      gender: values.gender,
      mobile: values.mobile,
      name: values.name,
      roleIds,
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
    if (data?.id) {
      formApi.setValues({
        ...data,
        password: '',
        roleIdsText: (data.roles ?? []).map((item: any) => item.id).join(','),
      });
      // 编辑时账号不允许修改
      formApi.updateSchema([
        { disabled: true, fieldName: 'username' },
      ]);
    } else {
      formApi.updateSchema([
        { disabled: false, fieldName: 'username' },
      ]);
    }
  },
  title: '用户',
});

function openModal(row?: SysUser) {
  modalApi.setData(row ?? ({} as SysUser));
  modalApi.open();
}

async function handleDelete(row: SysUser) {
  await ElMessageBox.confirm(`确认删除用户「${row.name ?? row.username}」？`, '提示', {
    type: 'warning',
  });
  const success = await deleteUserApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    gridApi.reload();
  }
}

/* ------------------------------ 初始化 ------------------------------ */

onMounted(async () => {
  try {
    deptTree.value = await getDeptTreeApi();
  } catch {
    deptTree.value = [];
  }
  // 部门树同时用于搜索表单与新增表单
  gridApi.formApi.updateSchema([
    {
      componentProps: { treeData: deptTree.value },
      fieldName: 'deptId',
    },
  ]);
  formApi.updateSchema([
    {
      componentProps: { treeData: deptTree.value },
      fieldName: 'deptId',
    },
  ]);
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <ElButton
          v-if="hasAccessByCodes(['sys:user:add'])"
          type="primary"
          @click="openModal()"
        >
          新增用户
        </ElButton>
      </template>
      <template #operation="{ row }">
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
      </template>
    </Grid>

    <Modal class="w-[600px]">
      <Form />
    </Modal>
  </Page>
</template>
