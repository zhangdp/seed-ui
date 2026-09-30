<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { ElButton, ElEmpty } from 'element-plus';

defineOptions({ name: 'SystemFile' });
</script>

<template>
  <Page
    auto-content-height
    description="统一查看上传到对象存储的图片与附件"
    title="文件管理"
  >
    <div class="seed-card seed-card-pad seed-empty">
      <ElEmpty description="文件管理还在路上，后端列表接口接入后即可启用">
        <template #image>
          <div class="seed-avatar seed-chip--primary h-16 w-16 text-[22px]">
            <span>📁</span>
          </div>
        </template>
      </ElEmpty>
      <div class="seed-cell-sub">可先在「参数管理」中查看对象存储相关配置</div>
      <ElButton class="mt-2" plain type="primary">敬请期待</ElButton>
    </div>
  </Page>
</template>
