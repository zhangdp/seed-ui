<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { ElEmpty } from 'element-plus';

defineOptions({ name: 'SystemFile' });
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full items-center justify-center">
      <ElEmpty description="文件管理：后端暂未提供列表接口，待接入" />
    </div>
  </Page>
</template>
