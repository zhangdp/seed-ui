<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { OperationLog } from '#/types/api';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOperationLogPageApi } from '#/api';
import { useCursorPager } from '#/utils/cursor-pager';

defineOptions({ name: 'LogOperation' });

const cursorPager = useCursorPager();

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
  align: 'left',
  columns: [
    { field: 'description', minWidth: 180, title: '操作描述' },
    {
      field: 'type',
      minWidth: 100,
      slots: { default: 'type' },
      title: '操作类型',
    },
    {
      field: 'refModule',
      minWidth: 120,
      slots: { default: 'module' },
      title: '模块',
    },
    {
      field: 'requestUri',
      minWidth: 200,
      showOverflow: 'tooltip',
      title: '请求地址',
    },
    {
      field: 'httpMethod',
      minWidth: 90,
      slots: { default: 'method' },
      title: '方法',
    },
    { field: 'clientIp', minWidth: 130, title: '客户端IP' },
    {
      field: 'costTime',
      minWidth: 100,
      slots: { default: 'cost' },
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
        const currentPage = page.currentPage as number;
        const size = page.pageSize as number;
        // 后端为游标分页：首页不传游标，之后每页传上一页最后一条的 id
        const data = await getOperationLogPageApi({
          countTotal: true,
          cursor: cursorPager.cursorOf(currentPage),
          desc: true,
          page: currentPage,
          params: {
            ...rest,
            endTime: timeRange?.[1],
            startTime: timeRange?.[0],
          },
          size,
        });
        cursorPager.remember(currentPage, data?.list ?? []);
        return data;
      },
    },
    response: { list: 'list', result: 'list', total: 'total' },
  },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

/** 操作类型中文名 */
const TYPE_TEXT: Record<string, string> = {
  create: '新增',
  delete: '删除',
  read: '查询',
  update: '修改',
};

const TYPE_CLASS: Record<string, string> = {
  create: 'seed-chip--success',
  delete: 'seed-chip--danger',
  read: 'seed-chip--primary',
  update: 'seed-chip--warning',
};
</script>

<template>
  <Page
    auto-content-height
    description="记录关键业务操作，包含请求地址、耗时与结果"
    title="操作日志"
  >
    <Grid :separator="false" class="seed-table seed-cursor-pager">
      <template #type="{ row }">
        <span :class="TYPE_CLASS[row.type ?? ''] ?? ''" class="seed-chip">
          {{ TYPE_TEXT[row.type ?? ''] ?? row.type ?? '-' }}
        </span>
      </template>
      <template #module="{ row }">
        <span v-if="row.refModule" class="seed-mono">{{ row.refModule }}</span>
        <span v-else class="seed-muted">-</span>
      </template>
      <template #method="{ row }">
        <span class="seed-chip">{{ row.httpMethod ?? '-' }}</span>
      </template>
      <template #cost="{ row }">
        <span
          v-if="row.costTime !== undefined && row.costTime !== null"
          :class="row.costTime > 1000 ? 'seed-chip--danger' : ''"
          class="seed-chip"
        >
          {{ row.costTime }}ms
        </span>
        <span v-else class="seed-muted">-</span>
      </template>
    </Grid>
  </Page>
</template>
