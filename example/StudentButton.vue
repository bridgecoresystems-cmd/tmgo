<!--
  ChatStudentButton — floating chat button for students
  Shows a FAB that opens ChatWidget with a group selector.
  Auto-selects if student has only one active group.
-->
<template>
  <Teleport to="body">
    <!-- Group picker popup (above FAB) -->
    <Transition name="csb-slide">
      <div v-if="showPicker" class="csb-picker">
        <div class="csb-picker__header">
          <span class="csb-picker__title">Чат с учителем</span>
          <NIcon class="csb-picker__close" @click="showPicker = false">
            <component :is="CloseIcon" />
          </NIcon>
        </div>

        <div v-if="loadingGroups" class="csb-picker__loading">
          <NSpin size="small" />
          <span>Загрузка курсов...</span>
        </div>

        <div v-else-if="groups.length === 0" class="csb-picker__empty">
          Нет доступных курсов
        </div>

        <div
          v-for="g in groups"
          :key="g.id"
          class="csb-picker__item"
          :class="{ 'csb-picker__item--selected': g.id === selectedGroupId }"
          @click="selectGroup(g)"
        >
          <div class="csb-picker__item-main">
            <div class="csb-picker__item-course">{{ g.courseName }}</div>
            <div class="csb-picker__item-info">{{ g.name }} · {{ g.teacherName }}</div>
          </div>
          <NSpin v-if="loadingRoom && pendingGroupId === g.id" size="small" />
          <NTag v-else-if="!g.isActive" size="small" type="warning" :bordered="false">Завершён</NTag>
          <NTag v-else-if="g.id === selectedGroupId" size="small" type="primary" :bordered="false">Открыт</NTag>
        </div>
      </div>
    </Transition>

    <!-- Chat widget -->
    <ChatWidget
      v-model="widgetOpen"
      :room-id="roomId"
      :title="chatTitle"
      :readonly="selectedGroup ? !selectedGroup.isActive : false"
      :current-user-id="authStore.user?.id"
      :show-back="groups.length > 1"
      @back="backToPicker"
      @update:unread="unreadCount = $event"
    />

    <!-- Floating action button (hidden while widget is open) -->
    <button
      v-show="!widgetOpen"
      class="csb-fab"
      :class="{ 'csb-fab--active': showPicker }"
      :disabled="loadingRoom && !showPicker"
      @click="handleFabClick"
    >
      <NSpin v-if="loadingRoom && !showPicker" size="small" style="color: white;" />
      <NIcon v-else size="22"><component :is="ChatIcon" /></NIcon>
      <span v-if="unreadCount > 0" class="csb-badge">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { NIcon, NTag, NSpin } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline as ChatIcon,
  CloseOutline as CloseIcon,
} from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()
const config = useRuntimeConfig()
const API = config.public.apiBase as string

const groups = ref<any[]>([])
const loadingGroups = ref(false)
const selectedGroupId = ref<number | null>(null)
const pendingGroupId = ref<number | null>(null)
const loadingRoom = ref(false)
const roomId = ref<number | null>(null)
const widgetOpen = ref(false)
const showPicker = ref(false)
const unreadCount = ref(0)

const selectedGroup = computed(() =>
  groups.value.find((g) => g.id === selectedGroupId.value) || null
)

const chatTitle = computed(() =>
  selectedGroup.value?.teacherName || 'Чат с учителем'
)

async function loadGroups() {
  if (loadingGroups.value) return
  loadingGroups.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/chat/groups`, {
      credentials: 'include',
    })
    groups.value = Array.isArray(data) ? data : []

    // Auto-load room if exactly one active group with teacher
    const activeWithTeacher = groups.value.filter((g) => g.isActive && g.hasTeacher)
    if (activeWithTeacher.length === 1) {
      await loadRoom(activeWithTeacher[0].id)
    }
  } catch (e) {
    console.error('StudentButton: load groups failed', e)
  } finally {
    loadingGroups.value = false
  }
}

async function loadRoom(gid: number) {
  loadingRoom.value = true
  pendingGroupId.value = gid
  try {
    const room = await $fetch<any>(`${API}/cabinet/chat/rooms/${gid}`, {
      credentials: 'include',
    })
    roomId.value = room.id
    selectedGroupId.value = gid
  } catch (e) {
    console.error('StudentButton: load room failed', e)
  } finally {
    loadingRoom.value = false
    pendingGroupId.value = null
  }
}

async function selectGroup(g: any) {
  // Already selected → just open widget
  if (g.id === selectedGroupId.value && roomId.value) {
    showPicker.value = false
    widgetOpen.value = true
    return
  }
  await loadRoom(g.id)
  showPicker.value = false
  widgetOpen.value = true
}

function handleFabClick() {
  if (showPicker.value) {
    showPicker.value = false
    return
  }

  if (roomId.value) {
    // Room already selected → open widget directly
    widgetOpen.value = true
    return
  }

  // If groups not loaded yet, load them
  if (!groups.value.length && !loadingGroups.value) {
    loadGroups()
  }

  showPicker.value = true
}

watch(widgetOpen, (open) => { if (open) unreadCount.value = 0 })

function backToPicker() {
  widgetOpen.value = false
  selectedGroupId.value = null
  roomId.value = null
  showPicker.value = true
}

onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
/* ── FAB ──────────────────────────────────────────────────────────────────── */
.csb-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1050;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(24, 160, 88, 0.4);
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
  outline: none;
}

.csb-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(24, 160, 88, 0.55);
}

.csb-fab:active {
  transform: scale(0.96);
}

.csb-fab--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.csb-fab:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.csb-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
  line-height: 1;
  pointer-events: none;
}

/* ── Picker popup ─────────────────────────────────────────────────────────── */
.csb-picker {
  position: fixed;
  bottom: 84px; /* FAB height (52) + gap (12) + bottom (20) */
  right: 20px;
  width: 300px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.16);
  z-index: 1050;
  overflow: hidden;
}

.csb-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #18a058 0%, #0c7a43 100%);
  color: white;
}

.csb-picker__title {
  font-weight: 600;
  font-size: 14px;
}

.csb-picker__close {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
}

.csb-picker__close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.csb-picker__loading,
.csb-picker__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 16px;
  font-size: 13px;
  color: #6b7280;
}

.csb-picker__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.15s;
}

.csb-picker__item:last-child {
  border-bottom: none;
}

.csb-picker__item:hover {
  background: #f9fafb;
}

.csb-picker__item--selected {
  background: #f0fdf4;
}

.csb-picker__item-main {
  flex: 1;
  min-width: 0;
}

.csb-picker__item-course {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.csb-picker__item-info {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Transition ───────────────────────────────────────────────────────────── */
.csb-slide-enter-active {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
}
.csb-slide-leave-active {
  transition: transform 0.18s ease, opacity 0.15s ease;
}
.csb-slide-enter-from,
.csb-slide-leave-to {
  transform: translateY(12px);
  opacity: 0;
}

/* ── Mobile ───────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .csb-picker {
    width: calc(100vw - 40px);
    right: 20px;
  }
}
</style>
