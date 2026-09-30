<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SysConfig } from '#/types/api';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addConfigApi,
  deleteConfigApi,
  getConfigPageApi,
  updateConfigApi,
} from '#/api';

defineOptions({ name: 'SystemConfig' });

const { hasAccessByCodes } = useAccess();

const gridOptions: VxeGridProps<SysConfig> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'configKey', minWidth: 180, title: '参数键' },
    { field: 'configValue', minWidth: 200, title: '参数值' },
    { field: 'description', minWidth: 200, title: '描述' },
    {
      field: 'isEncrypted',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue === 1 ? '是' : '否',
      title: '加密',
      width: 90,
    },
    {
      field: 'isSystem',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue === 1 ? '是' : '否',
      title: '系统内置',
      width: 100,
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
      query: async ({ page }) => {
        return await getConfigPageApi({
          page: page.currentPage,
          size: page.pageSize,
        });
      },
    },
    response: { list: 'list', result: 'list', total: 'total' },
  },
  toolbarConfig: { refresh: true },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

/* ------------------------------ 新增/编辑 ------------------------------ */

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 90 },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入参数键' },
      fieldName: 'configKey',
      label: '参数键',
      rules: z.string().min(1, { message: '请输入参数键' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入参数值' },
      fieldName: 'configValue',
      label: '参数值',
      rules: z.string().min(1, { message: '请输入参数值' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入描述' },
      fieldName: 'description',
      label: '描述',
    },
    {
      component: 'Switch',
      defaultValue: 0,
      fieldName: 'isEncrypted',
      label: '是否加密',
    },
    {
      component: 'Switch',
      defaultValue: 0,
      fieldName: 'isSystem',
      label: '系统内置',
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
    const values = (await formApi.getValues()) as SysConfig;
    const id = (modalApi.getData() as SysConfig | undefined)?.id;
    const success = id
      ? await updateConfigApi({ ...values, id })
      : await addConfigApi(values);
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
    const data = modalApi.getData() as SysConfig | undefined;
    formApi.resetForm();
    if (data?.id) {
      formApi.setValues(data);
    }
  },
  title: '参数配置',
});

function openModal(row?: SysConfig) {
  modalApi.setData(row ?? ({} as SysConfig));
  modalApi.open();
}

async function handleDelete(row: SysConfig) {
  await ElMessageBox.confirm(`确认删除参数「${row.configKey}」？`, '提示', {
    type: 'warning',
  });
  const success = await deleteConfigApi(row.id as number);
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
          v-if="hasAccessByCodes(['sys:config:create'])"
          type="primary"
          @click="openModal()"
        >
          新增参数
        </ElButton>
      </template>
      <template #operation="{ row }">
        <ElButton
          v-if="hasAccessByCodes(['sys:config:update'])"
          link
          type="primary"
          @click="openModal(row)"
        >
          编辑
        </ElButton>
        <ElButton
          v-if="hasAccessByCodes(['sys:config:delete'])"
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
