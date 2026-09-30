<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LoginLog } from '#/types/api';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLoginLogPageApi } from '#/api';
import { useCursorPager } from '#/utils/cursor-pager';

defineOptions({ name: 'LogLogin' });

const cursorPager = useCursorPager();

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
  align: 'left',
  columns: [
    {
      field: 'username',
      minWidth: 160,
      slots: { default: 'user' },
      title: '账号',
    },
    { field: 'type', minWidth: 110, title: '登录方式' },
    {
      field: 'resultCode',
      minWidth: 90,
      slots: { default: 'result' },
      title: '结果',
    },
    { field: 'clientIp', minWidth: 140, title: '客户端IP' },
    { field: 'location', minWidth: 140, title: '登录地点' },
    {
      field: 'loginAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '登录时间',
    },
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
        const currentPage = page.currentPage as number;
        const size = page.pageSize as number;
        // 后端为游标分页：首页不传游标，之后每页传上一页最后一条的 id
        const data = await getLoginLogPageApi({
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
</script>

<template>
  <Page
    auto-content-height
    description="记录每次登录的时间、地点与结果，便于排查异常登录"
    title="登录日志"
  >
    <Grid :separator="false" class="seed-table seed-cursor-pager">
      <template #user="{ row }">
        <div class="flex items-center gap-2">
          <span class="seed-avatar">
            {{ (row.username ?? '?').slice(0, 1).toUpperCase() }}
          </span>
          <div class="text-left">
            <div class="seed-cell-main">{{ row.username }}</div>
            <div class="seed-cell-sub">#{{ row.userId }}</div>
          </div>
        </div>
      </template>
      <template #result="{ row }">
        <span
          :class="
            row.resultCode === 0 ? 'seed-chip--success' : 'seed-chip--danger'
          "
          class="seed-chip"
        >
          <i
            :class="
              row.resultCode === 0 ? 'seed-dot' : 'seed-dot seed-dot--off'
            "
          ></i>
          {{ row.resultCode === 0 ? '成功' : '失败' }}
        </span>
      </template>
    </Grid>
  </Page>
</template>
