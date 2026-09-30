<script lang="ts" setup>
import type { PermissionTreeNode, Role } from '#/types/api';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, useVbenForm, useVbenModal, z } from '@vben/common-ui';

import {
  ElButton,
  ElDrawer,
  ElEmpty,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElTree,
} from 'element-plus';

import {
  addRoleApi,
  deleteRoleApi,
  getPermissionTreeApi,
  getRoleListApi,
  getRolePermissionIdsApi,
  saveRolePermissionsApi,
  updateRoleApi,
} from '#/api';

defineOptions({ name: 'SystemRole' });

const { hasAccessByCodes } = useAccess();

const roles = ref<Role[]>([]);
const loading = ref(false);
const keyword = ref('');
/** 角色id -> 已授权数量 */
const permissionCount = ref<Record<number, number>>({});

/* ------------------------------ 权限树 ------------------------------ */

interface TreeItem {
  children?: TreeItem[];
  id: number;
  label: string;
}

const permissionTree = ref<TreeItem[]>([]);

function toTree(nodes: PermissionTreeNode[]): TreeItem[] {
  return (nodes ?? []).map((node) => ({
    id: Number(node.value),
    label: node.label ?? '',
    ...(node.children?.length ? { children: toTree(node.children) } : {}),
  }));
}

const allPermissionIds = computed(() => {
  const ids: number[] = [];
  const walk = (nodes: TreeItem[]) => {
    for (const node of nodes) {
      ids.push(node.id);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };
  walk(permissionTree.value);
  return ids;
});

/* ------------------------------ 列表 ------------------------------ */

async function loadRoles() {
  loading.value = true;
  try {
    const data = await getRoleListApi();
    const kw = keyword.value.trim().toLowerCase();
    roles.value = (data ?? []).filter(
      (item) =>
        !kw ||
        (item.name ?? '').toLowerCase().includes(kw) ||
        (item.code ?? '').toLowerCase().includes(kw),
    );
    // 拉取各角色已授权数量
    const entries = await Promise.all(
      roles.value.map(async (role) => {
        const ids = await getRolePermissionIdsApi(role.id as number).catch(
          () => [],
        );
        return [role.id as number, ids?.length ?? 0] as const;
      }),
    );
    permissionCount.value = Object.fromEntries(entries);
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
      componentProps: { placeholder: '如 ROLE_OPERATOR' },
      fieldName: 'code',
      label: '角色标识',
      rules: z.string().min(1, { message: '请输入角色标识' }),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 运营人员' },
      fieldName: 'name',
      label: '角色名称',
      rules: z.string().min(1, { message: '请输入角色名称' }),
    },
    {
      component: 'Textarea',
      componentProps: { placeholder: '这个角色负责什么？', rows: 3 },
      fieldName: 'description',
      label: '描述',
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
    const values = (await formApi.getValues()) as Role;
    const id = (modalApi.getData() as Role | undefined)?.id;
    const success = id
      ? await updateRoleApi({ ...values, id })
      : await addRoleApi(values);
    if (success) {
      ElMessage.success(id ? '修改成功' : '新增成功');
      modalApi.close();
      loadRoles();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as Role | undefined;
    formApi.resetForm();
    if (data?.id) {
      formApi.setValues(data);
      // 标识不允许修改
      formApi.updateSchema([{ disabled: true, fieldName: 'code' }]);
    } else {
      formApi.updateSchema([{ disabled: false, fieldName: 'code' }]);
    }
  },
  title: '角色',
});

function openModal(row?: Role) {
  modalApi.setData(row ?? ({} as Role));
  modalApi.open();
}

async function handleDelete(row: Role) {
  await ElMessageBox.confirm(
    `确认删除角色「${row.name}」？该角色下的用户将失去对应权限。`,
    '提示',
    { type: 'warning' },
  );
  const success = await deleteRoleApi(row.id as number);
  if (success) {
    ElMessage.success('删除成功');
    loadRoles();
  }
}

/* ------------------------------ 分配权限 ------------------------------ */

const drawerVisible = ref(false);
const currentRole = ref<null | Role>(null);
const checkedKeys = ref<number[]>([]);
const treeRef = ref<InstanceType<typeof ElTree>>();
const saving = ref(false);

async function openPermission(row: Role) {
  currentRole.value = row;
  if (permissionTree.value.length === 0) {
    const tree = await getPermissionTreeApi().catch(() => []);
    permissionTree.value = toTree(tree);
  }
  checkedKeys.value = await getRolePermissionIdsApi(row.id as number);
  drawerVisible.value = true;
}

async function handleSavePermission() {
  if (!currentRole.value?.id) {
    return;
  }
  saving.value = true;
  try {
    const keys = treeRef.value?.getCheckedKeys() ?? checkedKeys.value;
    const success = await saveRolePermissionsApi(
      currentRole.value.id,
      keys as number[],
    );
    if (success) {
      ElMessage.success('权限已更新，重新登录后生效');
      drawerVisible.value = false;
      loadRoles();
    }
  } finally {
    saving.value = false;
  }
}

function toggleAll(checked: boolean) {
  treeRef.value?.setCheckedKeys(checked ? allPermissionIds.value : []);
}

onMounted(async () => {
  const tree = await getPermissionTreeApi().catch(() => []);
  permissionTree.value = toTree(tree);
  loadRoles();
});
</script>

<template>
  <Page
    auto-content-height
    description="角色是一组权限的集合，把角色赋予用户即可完成授权"
    title="角色管理"
  >
    <div class="seed-page">
      <div class="seed-card seed-card-pad flex items-center justify-between">
        <div>
          <div class="seed-section-title">角色列表</div>
          <div class="seed-section-desc">
            共 {{ roles.length }} 个角色，分配权限后即时生效
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ElInput
            v-model="keyword"
            clearable
            placeholder="搜索角色名称/标识"
            style="width: 220px"
            @keyup.enter="loadRoles"
            @clear="loadRoles"
          />
          <ElButton
            v-if="hasAccessByCodes(['sys:role:add'])"
            type="primary"
            @click="openModal()"
          >
            新增角色
          </ElButton>
        </div>
      </div>

      <div v-loading="loading" class="seed-grid-cards">
        <div v-for="role in roles" :key="role.id" class="seed-tile">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="seed-avatar seed-chip--primary">
                {{ (role.name ?? '?').slice(0, 1) }}
              </span>
              <div class="min-w-0">
                <div class="seed-cell-main truncate">{{ role.name }}</div>
                <div class="seed-mono seed-cell-sub truncate">
                  {{ role.code }}
                </div>
              </div>
            </div>
            <span
              v-if="role.code === 'ROLE_ADMIN'"
              class="seed-chip seed-chip--warning"
            >
              超级管理员
            </span>
          </div>

          <p class="seed-cell-sub mt-3 line-clamp-2 min-h-[32px]">
            {{ role.description || '暂无描述' }}
          </p>

          <div class="mt-4 flex items-center justify-between">
            <span class="seed-chip seed-chip--primary">
              已授权 {{ permissionCount[role.id as number] ?? 0 }} 项
            </span>
            <div class="seed-row-actions">
              <ElButton
                v-if="hasAccessByCodes(['sys:role:permission'])"
                link
                type="primary"
                @click="openPermission(role)"
              >
                分配权限
              </ElButton>
              <ElButton
                v-if="hasAccessByCodes(['sys:role:update'])"
                link
                type="primary"
                @click="openModal(role)"
              >
                编辑
              </ElButton>
              <ElButton
                v-if="
                  hasAccessByCodes(['sys:role:delete']) &&
                  role.code !== 'ROLE_ADMIN'
                "
                link
                type="danger"
                @click="handleDelete(role)"
              >
                删除
              </ElButton>
            </div>
          </div>
        </div>

        <div
          v-if="!roles.length && !loading"
          class="seed-card seed-card-pad seed-empty"
        >
          <ElEmpty description="还没有角色" />
        </div>
      </div>
    </div>

    <Modal class="w-[520px]">
      <Form />
    </Modal>

    <ElDrawer
      v-model="drawerVisible"
      :title="`分配权限 · ${currentRole?.name ?? ''}`"
      size="440px"
    >
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between pb-3">
          <span class="seed-cell-sub"> 勾选该角色可访问的菜单与按钮 </span>
          <div class="flex gap-2">
            <ElButton link type="primary" @click="toggleAll(true)">
              全选
            </ElButton>
            <ElButton link @click="toggleAll(false)">清空</ElButton>
          </div>
        </div>
        <div class="min-h-0 flex-1 overflow-auto">
          <ElTree
            ref="treeRef"
            :check-strictly="true"
            :data="permissionTree"
            :default-checked-keys="checkedKeys"
            :default-expand-all="true"
            :props="{ children: 'children', label: 'label' }"
            node-key="id"
            show-checkbox
          />
        </div>
        <div class="flex justify-end gap-2 pt-4">
          <ElButton @click="drawerVisible = false">取消</ElButton>
          <ElButton
            :loading="saving"
            type="primary"
            @click="handleSavePermission"
          >
            保存
          </ElButton>
        </div>
      </div>
    </ElDrawer>
  </Page>
</template>
