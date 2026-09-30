<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OperationLog } from '#/types/api';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOperationLogPageApi } from '#/api';

defineOptions({ name: 'LogOperation' });

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入操作描述关键字' },
      fieldName: 'description',
      label: '操作描述',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入请求地址' },
      fieldName: 'uri',
      label: '请求地址',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入相关模块' },
      fieldName: 'refModule',
      label: '模块',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      fieldName: 'timeRange',
      label: '操作时间',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: '查询' },
};

const gridOptions: VxeGridProps<OperationLog> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'description', minWidth: 160, title: '操作描述' },
    { field: 'type', minWidth: 100, title: '操作类型' },
    { field: 'refModule', minWidth: 120, title: '模块' },
    { field: 'requestUri', minWidth: 180, title: '请求地址' },
    { field: 'httpMethod', minWidth: 90, title: '方法' },
    { field: 'userId', minWidth: 90, title: '用户ID' },
    { field: 'clientIp', minWidth: 130, title: '客户端IP' },
    {
      field: 'costTime',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue === undefined ? '-' : `${cellValue}ms`,
      minWidth: 100,
      title: '耗时',
    },
    {
      field: 'operatedAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '操作时间',
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }: any, formValues: any) => {
        const { timeRange, ...rest } = (formValues ?? {}) as Record<
          string,
          any
        >;
        return await getOperationLogPageApi({
          countTotal: true,
          desc: true,
          page: page.currentPage,
          params: {
            ...rest,
            endTime: timeRange?.[1],
            startTime: timeRange?.[0],
          },
          size: page.pageSize,
        });
      },
    },
    response: { list: 'list', result: 'list', total: 'total' },
  },
  toolbarConfig: { search: true } as any,
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid />
  </Page>
</template>
