<template>
  <n-card class="coupling-card" embedded>
    <div class="coupling-row">
      <div class="coupling-side">
        <div class="coupling-label">🚛 {{ t('driver.couplings.tractor') }}</div>
        <div class="coupling-name">{{ coupling.tractor.brand }} {{ coupling.tractor.model }}</div>
        <n-tag size="small" style="font-family:monospace;font-weight:700;letter-spacing:1px;margin-top:4px">
          {{ coupling.tractor.plateNumber }}
        </n-tag>
      </div>

      <div class="coupling-chain">⛓</div>

      <div class="coupling-side">
        <div class="coupling-label">🚌 {{ t('driver.couplings.trailer') }}</div>
        <div class="coupling-name">{{ coupling.trailer.brand || '' }} {{ coupling.trailer.model || '' }}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
          <n-tag size="small" type="warning">{{ bodyTypeLabel }}</n-tag>
          <n-tag size="small" style="font-family:monospace;font-weight:700;letter-spacing:1px">
            {{ coupling.trailer.plateNumber }}
          </n-tag>
        </div>
      </div>
    </div>

    <div class="coupling-footer">
      <span class="coupling-date">{{ t('driver.couplings.since') }}: {{ formattedDate }}</span>
      <UiDeleteBtn
        :danger="false"
        icon="unlink"
        :label="t('driver.couplings.decouple')"
        :confirm-text="t('driver.couplings.decoupleConfirm')"
        :loading="decoupling"
        @confirm="decouple"
      />
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { TRAILER_BODY_TYPES } from '@tmgo/shared'

const props = defineProps<{ coupling: any }>()
const emit = defineEmits<{ (e: 'decoupled'): void }>()

const { t, locale } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()
const decoupling = ref(false)

const bodyTypeLabel = computed(() => {
  const found = TRAILER_BODY_TYPES.find((v) => v.id === props.coupling.trailer.bodyType)
  return found ? (locale.value === 'en' ? found.labelEn : found.label) : props.coupling.trailer.bodyType
})

const formattedDate = computed(() => {
  if (!props.coupling.coupledAt) return '—'
  return new Date(props.coupling.coupledAt).toLocaleDateString()
})

async function decouple() {
  decoupling.value = true
  try {
    await $fetch(`${API}/cabinet/driver/couplings/${props.coupling.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    message.success(t('driver.couplings.decoupled'))
    emit('decoupled')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    decoupling.value = false
  }
}
</script>

<style scoped>
.coupling-card {
  border-left: 3px solid var(--n-border-color);
}

.coupling-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.coupling-side {
  flex: 1;
  min-width: 0;
}

.coupling-label {
  font-size: 11px;
  color: #2080f0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.coupling-name {
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coupling-chain {
  font-size: 22px;
  flex-shrink: 0;
  opacity: 0.6;
}

.coupling-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--n-divider-color);
}

.coupling-date {
  font-size: 12px;
  color: var(--n-text-color-3);
}
</style>
