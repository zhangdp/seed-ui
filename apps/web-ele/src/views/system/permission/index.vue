<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { Permission, PermissionTreeNode } from '#/types/api';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addPermissionApi,
  deletePermissionApi,
  getPermissionTreeApi,
  updatePermissionApi,
} from '#/api';

defineOptions({ name: 'SystemPermission' });

const { hasAccessByCodes } = useAccess();

const treeData = ref<any[]>([]);

const TYPE_OPTIONS = [
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
];

/** 后端权限树节点转为表格行 */
function toRows(nodes: PermissionTreeNode[]): Permission[] {
  return (nodes ?? []).map((node) => ({
    code: node.permission,
    component: node.component,
    icon: node.icon,
    id: node.value,
    keepAlive: node.isKeepAlive,
    name: node.label ?? '',
    parentId: node.parent && node.parent !== 0 ? node.parent : null,
    path: node.path,
    sorts: node.sorts,
    visible: node.isVisible,
    children: node.children ? toRows(node.children) : undefined,
  }));
}

const gridOptions: VxeGridProps<Permission> = {
  columns: [
    { field: 'name', minWidth: 180, title: '名称', treeNode: true },
    { field: 'code', minWidth: 180, title: '权限标识' },
    {
      field: 'type',
      minWidth: 90,
      slots: { default: 'type' },
      title: '类型',
    },
    { field: 'path', minWidth: 160, title: '路由地址' },
    { field: 'component', minWidth: 160, title: '组件路径' },
    { field: 'sorts', title: '排序', width: 80 },
    {
      field: 'visible',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue === 0 ? '隐藏' : '显示',
      title: '显示',
      width: 90,
    },
    {
      field: 'operation',
      fixed: 'right',
      slots: { default: 'operation' },
      title: '操作',
      width: 180,
    },
  ],
  pagerConfig: { enabled: false },
  proxyConfig: {
    ajax: {
      query: async () => {
        const tree = await getPermissionTreeApi();
        return { list: toRows(tree), total: 0 };
      },
    },
    response: { list: 'list', result: 'list', total: 'total' },
  },
  toolbarConfig: { refresh: true },
  treeConfig: { parentField: 'parentId', rowField: 'id', transform: false },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

/* ------------------------------ 新增/编辑 ------------------------------ */

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 100 },
  schema: [
    {
      component: 'RadioGroup',
      componentProps: { options: TYPE_OPTIONS },
      defaultValue: 'menu',
      fieldName: 'type',
      label: '类型',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入名称' },
      fieldName: 'name',
      label: '名称',
      rules: z.string().min(1, { message: '请输入名称' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 sys:user:add' },
      fieldName: 'code',
      label: '权限标识',
      rules: z.string().min(1, { message: '请输入权限标识' }),
    },
    {
      component: 'TreeSelect',
      componentProps: { checkStrictly: true, placeholder: '请选择上级' },
      defaultValue: 0,
      fieldName: 'parentId',
      label: '上级',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '菜单路由地址，如 /system/user' },
      fieldName: 'path',
      label: '路由地址',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '前端组件，如 system/user/index' },
      fieldName: 'component',
      label: '组件路径',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '图标名称' },
      fieldName: 'icon',
      label: '图标',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0 },
      defaultValue: 1,
      fieldName: 'sorts',
      label: '排序',
    },
    {
      component: 'Switch',
      defaultValue: 1,
      fieldName: 'visible',
      label: '是否显示',
    },
    {
      component: 'Switch',
      defaultValue: 0,
      fieldName: 'keepAlive',
      label: '路由缓存',
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
    const values = (await formApi.getValues()) as Permission;
    const id = (modalApi.getData() as Permission | undefined)?.id;
    const success = id
      ? await updatePermissionApi({ ...values, id })
      : await addPermissionApi(values);
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
    const data = modalApi.getData() as Permission | undefined;
    formApi.resetForm();
    if (data?.id) {
      formApi.setValues({ ...data, parentId: data.parentId ?? 0 });
    }
  },
  title: '权限',
});

async function loadTree() {
  try {
    const tree = await getPermissionTreeApi();
    treeData.value = [
      { children: toRows(tree), label: '根节点', value: 0 },
    ];
  } catch {
    treeData.value = [{ children: [], label: '根节点', value: 0 }];
  }
  formApi.updateSchema([
    { componentProps: { treeData: treeData.value }, fieldName: 'parentId' },
  ]);
}

async function openModal(row?: Permission) {
  await loadTree();
  modalApi.setData(row ?? ({} as Permission));
  modalApi.open();
}

async function handleDelete(row: Permission) {
  await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', {
    type: 'warning',
  });
  const success = await deletePermissionApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    gridApi.reload();
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <ElButton
          v-if="hasAccessByCodes(['sys:permission:create'])"
          type="primary"
          @click="openModal()"
        >
          新增权限
        </ElButton>
      </template>
      <template #type="{ row }">
        <ElTag :type="row.type === 'menu' ? 'primary' : 'info'" size="small">
          {{ row.type === 'menu' ? '菜单' : '按钮' }}
        </ElTag>
      </template>
      <template #operation="{ row }">
        <ElButton
          v-if="hasAccessByCodes(['sys:permission:create'])"
          link
          type="primary"
          @click="openModal({ name: '', parentId: row.id, sorts: 1 } as any)"
        >
          新增下级
        </ElButton>
        <ElButton
          v-if="hasAccessByCodes(['sys:permission:update'])"
          link
          type="primary"
          @click="openModal(row)"
        >
          编辑
        </ElButton>
        <ElButton
          v-if="hasAccessByCodes(['sys:permission:delete'])"
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
