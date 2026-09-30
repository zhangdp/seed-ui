<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { Dept, DeptTreeNode } from '#/types/api';

import { ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { addDeptApi, deleteDeptApi, getDeptTreeApi, updateDeptApi } from '#/api';

defineOptions({ name: 'SystemDept' });

const { hasAccessByCodes } = useAccess();

const treeData = ref<any[]>([]);

/** 后端部门树节点转为表格行（parentId 为 0 表示根节点） */
function toRows(nodes: DeptTreeNode[]): Dept[] {
  return (nodes ?? []).map((node) => ({
    id: node.value,
    name: node.label ?? '',
    parentId: node.parent && node.parent !== 0 ? node.parent : null,
    sorts: node.sorts,
    children: node.children ? toRows(node.children) : undefined,
  }));
}

const gridOptions: VxeGridProps<Dept> = {
  columns: [
    { field: 'name', minWidth: 220, title: '部门名称', treeNode: true },
    { field: 'sorts', title: '排序', width: 100 },
    { field: 'id', title: 'ID', width: 120 },
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
        const tree = await getDeptTreeApi();
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
  commonConfig: { labelWidth: 90 },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入部门名称' },
      fieldName: 'name',
      label: '部门名称',
      rules: z.string().min(1, { message: '请输入部门名称' }),
    },
    {
      component: 'TreeSelect',
      componentProps: { checkStrictly: true, placeholder: '请选择上级部门' },
      defaultValue: 0,
      fieldName: 'parentId',
      label: '上级部门',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, placeholder: '升序' },
      defaultValue: 1,
      fieldName: 'sorts',
      label: '排序',
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
    const values = (await formApi.getValues()) as Dept;
    const id = (modalApi.getData() as Dept | undefined)?.id;
    const success = id
      ? await updateDeptApi({ ...values, id })
      : await addDeptApi(values);
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
    const data = modalApi.getData() as Dept | undefined;
    formApi.resetForm();
    if (data?.id) {
      formApi.setValues({ ...data, parentId: data.parentId ?? 0 });
    }
  },
  title: '部门',
});

async function openModal(row?: Dept) {
  await loadTree();
  modalApi.setData(row ?? ({} as Dept));
  modalApi.open();
}

async function handleDelete(row: Dept) {
  await ElMessageBox.confirm(`确认删除部门「${row.name}」？`, '提示', {
    type: 'warning',
  });
  const success = await deleteDeptApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    gridApi.reload();
  }
}

async function loadTree() {
  try {
    const tree = await getDeptTreeApi();
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
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <ElButton
          v-if="hasAccessByCodes(['sys:dept:create'])"
          type="primary"
          @click="openModal()"
        >
          新增部门
        </ElButton>
      </template>
      <template #operation="{ row }">
        <ElButton
          v-if="hasAccessByCodes(['sys:dept:create'])"
          link
          type="primary"
          @click="openModal({ name: '', parentId: row.id, sorts: 1 })"
        >
          新增下级
        </ElButton>
        <ElButton
          v-if="hasAccessByCodes(['sys:dept:update'])"
          link
          type="primary"
          @click="openModal(row)"
        >
          编辑
        </ElButton>
        <ElButton
          v-if="hasAccessByCodes(['sys:dept:delete'])"
          link
          type="danger"
          @click="handleDelete(row)"
        >
          删除
        </ElButton>
      </template>
    </Grid>

    <Modal class="w-[520px]">
      <Form />
    </Modal>
  </Page>
</template>
