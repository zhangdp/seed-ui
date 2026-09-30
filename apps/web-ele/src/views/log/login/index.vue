<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LoginLog } from '#/types/api';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLoginLogPageApi } from '#/api';

defineOptions({ name: 'LogLogin' });

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
      componentProps: { placeholder: '请输入客户端IP' },
      fieldName: 'clientIp',
      label: '客户端IP',
    },
    {
      component: 'DatePicker',
      componentProps: {
        placeholder: ['开始时间', '结束时间'],
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
      },
      fieldName: 'timeRange',
      label: '登录时间',
    },
  ],
  showCollapseButton: true,
  submitButtonOptions: { content: '查询' },
};

const gridOptions: VxeGridProps<LoginLog> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'username', minWidth: 120, title: '账号' },
    { field: 'userId', minWidth: 100, title: '用户ID' },
    { field: 'type', minWidth: 100, title: '登录方式' },
    {
      field: 'resultCode',
      formatter: ({ cellValue }: { cellValue: any }) =>
        cellValue === 0 ? '成功' : '失败',
      minWidth: 90,
      title: '结果',
    },
    { field: 'clientIp', minWidth: 140, title: '客户端IP' },
    { field: 'location', minWidth: 140, title: '登录地点' },
    { field: 'loginAt', formatter: 'formatDateTime', minWidth: 170, title: '登录时间' },
    {
      field: 'userAgent',
      minWidth: 260,
      showOverflow: 'tooltip',
      title: '浏览器',
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
        return await getLoginLogPageApi({
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
