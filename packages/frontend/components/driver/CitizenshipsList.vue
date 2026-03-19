<template>
  <div class="citizenships-list">
    <n-spin :show="loading">
      <n-alert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</n-alert>
      <n-space vertical>
        <div class="list-header">
          <n-button type="primary" size="small" @click="showAddModal = true">{{ t('driver.citizenships.add') }}</n-button>
        </div>
        <n-empty v-if="!loading && list.length === 0" :description="t('driver.citizenships.noItems')" />
        <n-list v-else bordered>
          <n-list-item v-for="c in list" :key="c.id">
            <template #prefix>
              <n-tag :type="c.status === 'active' ? 'success' : 'default'" size="small">
                {{ c.status === 'active' ? t('driver.citizenships.statusActive') : t('driver.citizenships.statusRevoked') }}
              </n-tag>
            </template>
            <n-thing>
              <template #header>{{ displayCountry(c.country) }}</template>
              <template #description>
                <span v-if="c.acquired_at">{{ t('driver.citizenships.since') }} {{ c.acquired_at }}</span>
                <span v-if="c.revoked_at"> · {{ t('driver.citizenships.revokedAt') }} {{ c.revoked_at }}</span>
              </template>
            </n-thing>
            <template #suffix>
              <UiDeleteBtn
                v-if="c.status === 'active'"
                size="tiny"
                :label="t('driver.citizenships.revoke')"
                :confirm-text="t('driver.citizenships.revokeConfirm').replace('{country}', displayCountry(c.country))"
                @confirm="doRevoke(c.id)"
              />
            </template>
          </n-list-item>
        </n-list>
      </n-space>
    </n-spin>

    <n-modal v-model:show="showAddModal" preset="card" :title="t('driver.citizenships.addModal')" style="max-width: 400px">
      <n-form :model="addForm" label-placement="top">
        <n-form-item :label="t('driver.citizenships.country')" required>
          <n-select
            v-model:value="addForm.country"
            :options="citizenshipOptions"
            filterable
            :placeholder="t('driver.citizenships.specifyCountry')"
            style="width: 100%"
          />
        </n-form-item>
        <n-form-item :label="t('driver.citizenships.acquiredAt')">
          <n-date-picker
            :value="addForm.acquired_at ? new Date(addForm.acquired_at).getTime() : null"
            type="date"
            clearable
            style="width: 100%"
            @update:value="(v: number | null) => { addForm.acquired_at = v ? new Date(v).toISOString().slice(0, 10) : null }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <UiCancelBtn @click="showAddModal = false" />
          <UiSaveBtn :loading="adding" :label="t('common.add')" @click="doAdd" />
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { citizenships } from '@tmgo/shared'

const { t } = useI18n()
const { list, loading, error, fetch, add, revoke } = useDriverCitizenships()
const message = useMessage()
const showAddModal = ref(false)
const adding = ref(false)
const addForm = reactive({ country: '', acquired_at: null as string | null })

function displayCountry(key: string) {
  // Try to translate — if key is a known i18n key, use it; otherwise show raw
  const translated = t('citizenships.' + key)
  return translated !== 'citizenships.' + key ? translated : key
}

const citizenshipOptions = computed(() => {
  const activeCountries = new Set(
    list.value.filter((c) => c.status === 'active').map((c) => c.country)
  )
  return citizenships
    .filter((c) => !activeCountries.has(c))
    .map((c) => ({ label: t('citizenships.' + c), value: c }))
})

async function doAdd() {
  if (!addForm.country?.trim()) {
    message.error(t('driver.citizenships.specifyCountry'))
    return
  }
  adding.value = true
  try {
    await add({ country: addForm.country.trim(), acquired_at: addForm.acquired_at || undefined })
    message.success(t('driver.citizenships.added'))
    showAddModal.value = false
    addForm.country = ''
    addForm.acquired_at = null
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  } finally {
    adding.value = false
  }
}

async function doRevoke(id: string) {
  try {
    await revoke(id)
    message.success(t('driver.citizenships.revokedSuccess'))
  } catch (e: any) {
    message.error(e?.data?.error || t('common.error'))
  }
}

onMounted(() => fetch())

defineExpose({ fetch })
</script>

<style scoped>
.list-header {
  margin-bottom: 16px;
}
</style>
