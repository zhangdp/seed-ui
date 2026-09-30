<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { ElEmpty } from 'element-plus';

defineOptions({ name: 'SystemRole' });
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full items-center justify-center">
      <ElEmpty description="角色管理：后端暂未提供接口，待接入" />
    </div>
  </Page>
</template>
