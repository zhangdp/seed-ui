<script lang="ts" setup>
import type { SysConfig } from '#/types/api';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';

import {
  ElButton,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
} from 'element-plus';

import {
  addConfigApi,
  deleteConfigApi,
  getConfigPageApi,
  updateConfigApi,
} from '#/api';

defineOptions({ name: 'SystemConfig' });

const { hasAccessByCodes } = useAccess();

const list = ref<SysConfig[]>([]);
const loading = ref(false);
const keyword = ref('');

async function loadList() {
  loading.value = true;
  try {
    const data = await getConfigPageApi({
      page: 1,
      params: { query: keyword.value || undefined },
      size: 200,
    });
    list.value = data.list ?? [];
  } finally {
    loading.value = false;
  }
}

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
      loadList();
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
      // 参数键不允许修改
      formApi.updateSchema([{ disabled: true, fieldName: 'configKey' }]);
    } else {
      formApi.updateSchema([{ disabled: false, fieldName: 'configKey' }]);
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
    loadList();
  }
}

onMounted(loadList);
</script>

<template>
  <Page
    auto-content-height
    description="系统运行参数的集中配置，修改后即时生效"
    title="参数管理"
  >
    <div class="seed-page">
      <!-- 工具条 -->
      <div class="seed-card seed-card-pad flex items-center justify-between">
        <div>
          <div class="seed-section-title">参数列表</div>
          <div class="seed-section-desc">
            共 {{ list.length }} 项配置，键名不区分大小写
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ElInput
            v-model="keyword"
            clearable
            placeholder="搜索参数键"
            style="width: 220px"
            @keyup.enter="loadList"
            @clear="loadList"
          />
          <ElButton @click="loadList">查询</ElButton>
          <ElButton
            v-if="hasAccessByCodes(['sys:config:create'])"
            type="primary"
            @click="openModal()"
          >
            新增参数
          </ElButton>
        </div>
      </div>

      <!-- 卡片列表 -->
      <div v-loading="loading" class="seed-grid-cards">
        <div v-for="item in list" :key="item.id" class="seed-tile">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="seed-mono seed-cell-main truncate">
                {{ item.configKey }}
              </div>
              <div class="seed-cell-sub mt-1 break-all">
                {{ item.description || '暂无描述' }}
              </div>
            </div>
            <span
              v-if="item.isSystem === 1"
              class="seed-chip seed-chip--warning"
            >
              系统内置
            </span>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <div class="seed-mono truncate pr-2 text-[13px] text-[#374151]">
              {{ item.configValue }}
            </div>
            <div class="seed-row-actions shrink-0">
              <ElButton
                v-if="hasAccessByCodes(['sys:config:update'])"
                link
                type="primary"
                @click="openModal(item)"
              >
                编辑
              </ElButton>
              <ElButton
                v-if="
                  hasAccessByCodes(['sys:config:delete']) && item.isSystem !== 1
                "
                link
                type="danger"
                @click="handleDelete(item)"
              >
                删除
              </ElButton>
            </div>
          </div>
        </div>

        <div
          v-if="!list.length && !loading"
          class="seed-card seed-card-pad seed-empty"
        >
          <ElEmpty description="还没有配置项" />
        </div>
      </div>
    </div>

    <Modal class="w-[520px]">
      <Form />
    </Modal>
  </Page>
</template>
