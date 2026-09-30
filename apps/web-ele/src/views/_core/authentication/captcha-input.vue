<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { ElInput } from 'element-plus';

import { getImageCaptchaApi } from '#/api';

defineOptions({ name: 'CaptchaInput' });

interface CaptchaValue {
  code: string;
  key: string;
}

const props = defineProps<{
  modelValue?: CaptchaValue;
  scene?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: CaptchaValue];
}>();

const code = ref('');
const image = ref('');
const key = ref('');

function emitValue() {
  emit('update:modelValue', { code: code.value, key: key.value });
}

async function refresh() {
  code.value = '';
  const res = await getImageCaptchaApi(props.scene ?? 'login');
  image.value = res.image;
  key.value = res.key;
  emitValue();
}

defineExpose({ refresh });

onMounted(refresh);
</script>

<template>
  <div class="flex w-full items-center gap-2">
    <ElInput
      v-model="code"
      :maxlength="4"
      placeholder="请输入验证码"
      @update:model-value="emitValue"
    />
    <img
      v-if="image"
      :src="image"
      alt="验证码"
      class="h-8 w-[110px] shrink-0 cursor-pointer rounded border border-border bg-background"
      title="点击刷新验证码"
      @click="refresh"
    />
    <div
      v-else
      class="h-8 w-[110px] shrink-0 animate-pulse rounded border border-border bg-muted"
    />
  </div>
</template>
