<template>
  <div>
    <n-page-header :title="t('layout.admin.map')" style="margin-bottom: 12px;">
      <template #extra>
        <n-space align="center">
          <n-text depth="3">{{ t('admin.map.staleMinutes') }}</n-text>
          <n-input-number
            v-model:value="staleMinutes"
            :min="1"
            :max="1440"
            size="small"
            style="width: 100px;"
            @update:value="loadDrivers"
          />
          <n-button size="small" :loading="loading" @click="loadDrivers">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            {{ t('common.refresh') }}
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-alert v-if="!loading && drivers.length === 0" type="info" :show-icon="true" style="margin-bottom: 12px;">
      {{ t('admin.map.empty') }}
    </n-alert>

    <div class="map-wrap">
      <div ref="mapEl" class="map" />
      <div class="legend">
        <span class="dot dot-verified" /> {{ t('admin.map.legendVerified') }}
        <span class="dot dot-pending" /> {{ t('admin.map.legendPending') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshOutline } from '@vicons/ionicons5'

definePageMeta({ layout: 'admin' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()

type Driver = {
  id: string
  user_id: string
  name: string
  lat: number
  lng: number
  last_location_at: string | null
  is_online: boolean
  verification_status: string
}

const mapEl = ref<HTMLElement>()
const drivers = ref<Driver[]>([])
const loading = ref(false)
const staleMinutes = ref(30)

// Leaflet импортится только в браузере: SSR в этом проекте отключён,
// но `L` ссылается на window — onMounted страхует от любых проблем.
let leaflet: typeof import('leaflet') | null = null
let map: import('leaflet').Map | null = null
let markersLayer: import('leaflet').LayerGroup | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

async function loadDrivers() {
  loading.value = true
  try {
    drivers.value = await $fetch<Driver[]>(`${API}/admin/drivers/online-locations`, {
      credentials: 'include',
      query: { stale_minutes: staleMinutes.value },
    })
    renderMarkers()
  } catch {
    drivers.value = []
  } finally {
    loading.value = false
  }
}

function renderMarkers() {
  if (!map || !leaflet || !markersLayer) return
  markersLayer.clearLayers()

  for (const d of drivers.value) {
    const color = d.verification_status === 'verified' ? '#22c55e' : '#f59e0b'
    const icon = leaflet.divIcon({
      className: 'driver-marker',
      html: `<div class="driver-pin" style="background:${color}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    })
    const lastSeen = d.last_location_at ? new Date(d.last_location_at).toLocaleString() : '—'
    const popup = `
      <div style="font-size: 13px; line-height: 1.5;">
        <b>${escape(d.name)}</b><br>
        ${d.verification_status}<br>
        <span style="color:#888">${lastSeen}</span><br>
        <a href="/admin/users/${d.user_id}" target="_blank">/admin/users/${d.user_id.slice(0, 8)}…</a>
      </div>
    `
    leaflet.marker([d.lat, d.lng], { icon }).bindPopup(popup).addTo(markersLayer)
  }

  // Если есть маркеры — авто-зум на bounds, иначе центр по умолчанию.
  if (drivers.value.length > 0) {
    const bounds = leaflet.latLngBounds(drivers.value.map(d => [d.lat, d.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.2), { maxZoom: 12 })
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

onMounted(async () => {
  await import('leaflet/dist/leaflet.css')
  leaflet = await import('leaflet')

  map = leaflet.map(mapEl.value!).setView([37.95, 58.38], 6) // Ашхабад по умолчанию
  leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)
  markersLayer = leaflet.layerGroup().addTo(map)

  await loadDrivers()
  // Автообновление каждые 30 сек — позиции водителей живые.
  refreshTimer = setInterval(loadDrivers, 30_000)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  map?.remove()
  map = null
})
</script>

<style scoped>
.map-wrap {
  position: relative;
  height: calc(100vh - 200px);
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.map {
  width: 100%;
  height: 100%;
}
.legend {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 500;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  display: flex;
  gap: 12px;
  align-items: center;
}
.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}
.dot-verified { background: #22c55e; }
.dot-pending { background: #f59e0b; }
</style>

<style>
/* Стили маркера — без scoped, чтобы L.divIcon видел классы. */
.driver-marker { background: transparent !important; border: none !important; }
.driver-pin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}
</style>
