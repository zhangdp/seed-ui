<script lang="ts" setup>
import type { Dict, DictData } from '#/types/api';

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
  addDictApi,
  addDictDataApi,
  deleteDictApi,
  deleteDictDataApi,
  getDictDataListApi,
  getDictListApi,
  updateDictApi,
  updateDictDataApi,
} from '#/api';

defineOptions({ name: 'SystemDict' });

const { hasAccessByCodes } = useAccess();

const dicts = ref<Dict[]>([]);
const dictKeyword = ref('');
const loading = ref(false);

const activeDictId = ref<null | number>(null);
const activeDict = ref<Dict | null>(null);
const dataList = ref<DictData[]>([]);
const dataLoading = ref(false);

/* ------------------------------ 字典类型 ------------------------------ */

async function loadDicts() {
  loading.value = true;
  try {
    const data = await getDictListApi();
    const kw = dictKeyword.value.trim().toLowerCase();
    dicts.value = (data ?? []).filter(
      (item) =>
        !kw ||
        (item.name ?? '').toLowerCase().includes(kw) ||
        (item.type ?? '').toLowerCase().includes(kw),
    );
    if (!activeDictId.value && dicts.value.length > 0) {
      selectDict(dicts.value[0] as Dict);
    }
  } finally {
    loading.value = false;
  }
}

async function selectDict(dict: Dict) {
  activeDictId.value = dict.id ?? null;
  activeDict.value = dict;
  await loadData();
}

async function loadData() {
  if (!activeDictId.value) {
    dataList.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    dataList.value = await getDictDataListApi(activeDictId.value);
  } finally {
    dataLoading.value = false;
  }
}

/* ------------------------------ 字典类型表单 ------------------------------ */

const [DictForm, dictFormApi] = useVbenForm({
  commonConfig: { labelWidth: 90 },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '如 user_gender' },
      fieldName: 'type',
      label: '字典类型',
      rules: z.string().min(1, { message: '请输入字典类型' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 用户性别' },
      fieldName: 'name',
      label: '字典名称',
      rules: z.string().min(1, { message: '请输入字典名称' }),
    },
    {
      component: 'Textarea',
      componentProps: { placeholder: '这个字典用于什么场景？', rows: 3 },
      fieldName: 'description',
      label: '描述',
    },
  ],
  showDefaultActions: false,
});

const [DictModal, dictModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await dictFormApi.validate();
    if (!valid) {
      return;
    }
    const values = (await dictFormApi.getValues()) as Dict;
    const id = (dictModalApi.getData() as Dict | undefined)?.id;
    const success = id
      ? await updateDictApi({ ...values, id })
      : await addDictApi(values);
    if (success) {
      ElMessage.success(id ? '修改成功' : '新增成功');
      dictModalApi.close();
      loadDicts();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = dictModalApi.getData() as Dict | undefined;
    dictFormApi.resetForm();
    if (data?.id) {
      dictFormApi.setValues(data);
      // 类型不允许修改
      dictFormApi.updateSchema([{ disabled: true, fieldName: 'type' }]);
    } else {
      dictFormApi.updateSchema([{ disabled: false, fieldName: 'type' }]);
    }
  },
  title: '字典',
});

function openDictModal(row?: Dict) {
  dictModalApi.setData(row ?? ({} as Dict));
  dictModalApi.open();
}

async function handleDeleteDict(row: Dict) {
  await ElMessageBox.confirm(
    `确认删除字典「${row.name}」？其下所有字典项会一并删除。`,
    '提示',
    { type: 'warning' },
  );
  const success = await deleteDictApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    activeDictId.value = null;
    activeDict.value = null;
    dataList.value = [];
    loadDicts();
  }
}

/* ------------------------------ 字典项表单 ------------------------------ */

const [DataForm, dataFormApi] = useVbenForm({
  commonConfig: { labelWidth: 90 },
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '如 M' },
      fieldName: 'value',
      label: '数据值',
      rules: z.string().min(1, { message: '请输入数据值' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 男' },
      fieldName: 'label',
      label: '显示名',
      rules: z.string().min(1, { message: '请输入显示名' }),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0 },
      defaultValue: 1,
      fieldName: 'sorts',
      label: '排序',
    },
    {
      component: 'Textarea',
      componentProps: { placeholder: '补充说明', rows: 2 },
      fieldName: 'description',
      label: '描述',
    },
  ],
  showDefaultActions: false,
});

const [DataModal, dataModalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await dataFormApi.validate();
    if (!valid) {
      return;
    }
    const values = (await dataFormApi.getValues()) as DictData;
    const id = (dataModalApi.getData() as DictData | undefined)?.id;
    const success = id
      ? await updateDictDataApi({ ...values, id })
      : await addDictDataApi({ ...values, dictId: activeDictId.value ?? 0 });
    if (success) {
      ElMessage.success(id ? '修改成功' : '新增成功');
      dataModalApi.close();
      loadData();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = dataModalApi.getData() as DictData | undefined;
    dataFormApi.resetForm();
    if (data?.id) {
      dataFormApi.setValues(data);
    }
  },
  title: '字典项',
});

function openDataModal(row?: DictData) {
  if (!activeDictId.value) {
    ElMessage.warning('请先选择左侧的字典');
    return;
  }
  dataModalApi.setData(row ?? ({} as DictData));
  dataModalApi.open();
}

async function handleDeleteData(row: DictData) {
  await ElMessageBox.confirm(`确认删除字典项「${row.label}」？`, '提示', {
    type: 'warning',
  });
  const success = await deleteDictDataApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    loadData();
  }
}

onMounted(loadDicts);
</script>

<template>
  <Page
    auto-content-height
    description="集中维护下拉选项、状态枚举等可复用数据"
    title="字典管理"
  >
    <div class="seed-split">
      <!-- 左：字典类型 -->
      <div v-loading="loading" class="seed-card seed-card-pad">
        <div class="flex items-center justify-between">
          <div class="seed-section-title">字典分类</div>
          <ElButton
            v-if="hasAccessByCodes(['sys:dict:add'])"
            link
            type="primary"
            @click="openDictModal()"
          >
            新增
          </ElButton>
        </div>
        <div class="mt-3">
          <ElInput
            v-model="dictKeyword"
            clearable
            placeholder="搜索分类"
            @keyup.enter="loadDicts"
            @clear="loadDicts"
          />
        </div>
        <div class="seed-list mt-3">
          <div
            v-for="dict in dicts"
            :key="dict.id"
            :class="{
              'seed-list-item--active': dict.id === activeDictId,
            }"
            class="seed-list-item"
            @click="selectDict(dict)"
          >
            <div class="min-w-0">
              <div class="truncate text-[13.5px]">{{ dict.name }}</div>
              <div class="seed-mono seed-cell-sub truncate">
                {{ dict.type }}
              </div>
            </div>
            <div class="seed-row-actions shrink-0">
              <ElButton
                v-if="hasAccessByCodes(['sys:dict:update'])"
                link
                type="primary"
                @click.stop="openDictModal(dict)"
              >
                编辑
              </ElButton>
              <ElButton
                v-if="
                  hasAccessByCodes(['sys:dict:delete']) && dict.isSystem !== 1
                "
                link
                type="danger"
                @click.stop="handleDeleteDict(dict)"
              >
                删除
              </ElButton>
            </div>
          </div>
          <div
            v-if="!dicts.length && !loading"
            class="seed-cell-sub py-6 text-center"
          >
            暂无字典
          </div>
        </div>
      </div>

      <!-- 右：字典项 -->
      <div class="seed-card seed-card-pad">
        <div class="flex items-center justify-between">
          <div>
            <div class="seed-section-title">
              {{ activeDict?.name ?? '字典项' }}
            </div>
            <div class="seed-section-desc">
              <template v-if="activeDict">
                <span class="seed-mono">{{ activeDict.type }}</span>
                · 共 {{ dataList.length }} 项
              </template>
              <template v-else>请先从左侧选择一个字典分类</template>
            </div>
          </div>
          <ElButton
            v-if="hasAccessByCodes(['sys:dict:add'])"
            type="primary"
            @click="openDataModal()"
          >
            新增字典项
          </ElButton>
        </div>

        <div v-loading="dataLoading" class="seed-grid-cards mt-4">
          <div v-for="item in dataList" :key="item.id" class="seed-tile">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="seed-cell-main">{{ item.label }}</div>
                <div class="seed-mono seed-cell-sub mt-1">
                  {{ item.value }}
                </div>
              </div>
              <span class="seed-chip">#{{ item.sorts ?? 0 }}</span>
            </div>
            <p class="seed-cell-sub mt-3 min-h-[24px]">
              {{ item.description || '—' }}
            </p>
            <div class="mt-3 flex justify-end">
              <div class="seed-row-actions">
                <ElButton
                  v-if="hasAccessByCodes(['sys:dict:update'])"
                  link
                  type="primary"
                  @click="openDataModal(item)"
                >
                  编辑
                </ElButton>
                <ElButton
                  v-if="hasAccessByCodes(['sys:dict:delete'])"
                  link
                  type="danger"
                  @click="handleDeleteData(item)"
                >
                  删除
                </ElButton>
              </div>
            </div>
          </div>

          <div
            v-if="!dataList.length && !dataLoading"
            class="seed-empty col-span-full"
          >
            <ElEmpty description="该字典下还没有数据项" />
          </div>
        </div>
      </div>
    </div>

    <DictModal class="w-[520px]">
      <DictForm />
    </DictModal>

    <DataModal class="w-[520px]">
      <DataForm />
    </DataModal>
  </Page>
</template>
