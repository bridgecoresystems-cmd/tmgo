<!--
  ChatWidget — floating sliding chat panel (bottom-right)
  Props:
    modelValue (v-model)  boolean  — open/close
    roomId                number   — chat room id
    title                 string   — header title (student name)
    readonly              boolean  — disable input (finished course)
    currentUserId         string   — logged-in user id
-->
<template>
  <Teleport to="body">
    <!-- Backdrop for mobile -->
    <div
      v-if="modelValue"
      class="cw-backdrop"
      @click="$emit('update:modelValue', false)"
    />

    <div class="cw-panel" :class="{ 'cw-panel--open': modelValue }">
      <!-- Header -->
      <div class="cw-header">
        <div class="cw-header__left" @click="togglePanel">
          <NIcon
            v-if="showBack"
            size="18"
            class="cw-back-btn"
            @click.stop="$emit('back')"
          >
            <component :is="BackIcon" />
          </NIcon>
          <span class="cw-status" :class="{ 'cw-status--online': wsConnected }" />
          <span class="cw-header__title">{{ title || 'Чат' }}</span>
          <NIcon
            v-if="typingName"
            size="14"
            class="cw-typing-icon"
          >
            <component :is="PencilIcon" />
          </NIcon>
        </div>
        <div class="cw-header__right">
          <NBadge
            v-if="unreadCount > 0 && !modelValue"
            :value="unreadCount"
            :max="99"
            type="error"
          />
          <NIcon size="18" class="cw-close-btn" @click.stop="$emit('update:modelValue', false)">
            <component :is="CloseIcon" />
          </NIcon>
        </div>
      </div>

      <!-- Messages -->
      <div class="cw-body" ref="bodyEl">
        <div v-if="loading" class="cw-center">
          <NSpin size="small" />
        </div>

        <div v-else-if="messages.length === 0" class="cw-center cw-empty">
          <NIcon size="32" color="#d1d5db"><component :is="ChatIcon" /></NIcon>
          <span>Нет сообщений</span>
        </div>

        <template v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="cw-msg"
            :class="{ 'cw-msg--own': msg.userId === currentUserId }"
          >
            <NAvatar
              v-if="msg.userId !== currentUserId"
              :src="msg.user?.avatar || undefined"
              :fallback-src="avatarFallback(msg.user)"
              round
              :size="28"
              class="cw-msg__ava"
            />
            <div class="cw-msg__body">
              <div v-if="msg.userId !== currentUserId" class="cw-msg__name">
                {{ msg.user?.name }}
              </div>
              <div class="cw-msg__bubble">{{ msg.content }}</div>
              <div class="cw-msg__time">{{ fmtTime(msg.createdAt) }}</div>
            </div>
          </div>

          <div v-if="typingName" class="cw-typing">
            <span>{{ typingName }} печатает</span>
            <span class="cw-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="cw-footer">
        <template v-if="!readonly">
          <textarea
            v-model="inputText"
            class="cw-input"
            placeholder="Написать сообщение..."
            rows="2"
            :disabled="!wsConnected"
            @keydown="handleKey"
            @input="handleTyping"
          />
          <div class="cw-actions">
            <NButton
              type="primary"
              size="small"
              circle
              :disabled="!inputText.trim() || !wsConnected"
              @click="sendMsg"
            >
              <template #icon>
                <NIcon><component :is="SendIcon" /></NIcon>
              </template>
            </NButton>
          </div>
        </template>
        <div v-else class="cw-readonly">
          <NIcon size="14"><component :is="LockIcon" /></NIcon>
          Курс завершён
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick, watchEffect } from 'vue'
import { NBadge, NButton, NIcon, NAvatar, NSpin } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline as ChatIcon,
  CloseOutline as CloseIcon,
  SendOutline as SendIcon,
  LockClosedOutline as LockIcon,
  PencilOutline as PencilIcon,
  ArrowBackOutline as BackIcon,
} from '@vicons/ionicons5'

const props = defineProps<{
  modelValue: boolean
  roomId: number | null
  title?: string
  readonly?: boolean
  currentUserId?: string
  showBack?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'back': []
  'update:unread': [count: number]
}>()

const config = useRuntimeConfig()
const API = config.public.apiBase as string
const WS_BASE = (config.public.wsUrl as string) || 'ws://localhost:8010'

const messages = ref<any[]>([])
const loading = ref(false)
const inputText = ref('')
const typingName = ref('')
const unreadCount = ref(0)
const wsConnected = ref(false)
const bodyEl = ref<HTMLElement | null>(null)
let ws: WebSocket | null = null
let typingTimer: ReturnType<typeof setTimeout> | null = null
let typingOutTimer: ReturnType<typeof setTimeout> | null = null

// ── Load messages ────────────────────────────────────────────────────────────
async function loadMessages(roomId: number) {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/chat/messages/${roomId}`, {
      credentials: 'include',
    })
    messages.value = Array.isArray(data) ? data : []
    scrollBottom()
  } catch (e) {
    console.error('ChatWidget: load messages failed', e)
  } finally {
    loading.value = false
  }
}

// ── WebSocket ────────────────────────────────────────────────────────────────
function openWs(roomId: number) {
  closeWs()
  const url = `${WS_BASE}/api/v1/cabinet/chat/ws/${roomId}`
  ws = new WebSocket(url)

  ws.onopen = () => {
    wsConnected.value = true
  }

  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data)
      if (data.type === 'message') {
        messages.value.push(data.message)
        scrollBottom()
        if (!props.modelValue) unreadCount.value++
      }
      if (data.type === 'typing' && data.userId !== props.currentUserId) {
        typingName.value = data.name
        if (typingTimer) clearTimeout(typingTimer)
        typingTimer = setTimeout(() => { typingName.value = '' }, 3000)
      }
      if (data.type === 'stop_typing' && data.userId !== props.currentUserId) {
        typingName.value = ''
        if (typingTimer) clearTimeout(typingTimer)
      }
    } catch {}
  }

  ws.onclose = () => {
    wsConnected.value = false
  }

  ws.onerror = () => {
    wsConnected.value = false
  }
}

function closeWs() {
  if (ws) { ws.onclose = null; ws.close(); ws = null }
  wsConnected.value = false
}

// ── Watchers ─────────────────────────────────────────────────────────────────
watch(
  () => props.roomId,
  (newId) => {
    closeWs()
    messages.value = []
    typingName.value = ''
    if (newId) {
      loadMessages(newId)
      if (!props.readonly) openWs(newId)
    }
  },
  { immediate: true }
)

watchEffect(() => emit('update:unread', unreadCount.value))

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      unreadCount.value = 0
      scrollBottom()
      // CSS transition takes 280ms — scroll again after it settles
      setTimeout(() => {
        if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
      }, 300)
    }
  }
)

// ── Send ─────────────────────────────────────────────────────────────────────
function sendMsg() {
  if (!inputText.value.trim() || !ws || !wsConnected.value) return
  ws.send(JSON.stringify({ type: 'message', content: inputText.value.trim() }))
  inputText.value = ''
  if (ws && wsConnected.value) ws.send(JSON.stringify({ type: 'stop_typing' }))
  if (typingOutTimer) clearTimeout(typingOutTimer)
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMsg()
  }
}

function handleTyping() {
  if (!ws || !wsConnected.value) return
  ws.send(JSON.stringify({ type: 'typing' }))
  if (typingOutTimer) clearTimeout(typingOutTimer)
  typingOutTimer = setTimeout(() => {
    if (ws && wsConnected.value) ws.send(JSON.stringify({ type: 'stop_typing' }))
  }, 1500)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function togglePanel() {
  emit('update:modelValue', !props.modelValue)
}

function scrollBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
    })
  })
}

function fmtTime(iso: string | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

function avatarFallback(user: any) {
  const l = ((user?.name || 'U').charAt(0)).toUpperCase()
  return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect fill='%234f46e5' width='32' height='32'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' fill='white' font-size='14'>${l}</text></svg>`
}

onUnmounted(() => {
  closeWs()
  if (typingTimer) clearTimeout(typingTimer)
  if (typingOutTimer) clearTimeout(typingOutTimer)
})
</script>

<style scoped>
/* ── Backdrop ─────────────────────────────────────────────────────────────── */
.cw-backdrop {
  display: none;
}
@media (max-width: 480px) {
  .cw-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.3);
    z-index: 1099;
  }
}

/* ── Panel ────────────────────────────────────────────────────────────────── */
.cw-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  height: 480px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  z-index: 1100;
  transform: translateY(calc(100% + 24px));
  opacity: 0;
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.22s ease;
  pointer-events: none;
  overflow: hidden;
}

.cw-panel--open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: all;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.cw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 14px 14px 0 0;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.cw-header__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.cw-header__title {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
}

.cw-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cw-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  flex-shrink: 0;
}

.cw-status--online {
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
}

.cw-typing-icon {
  color: rgba(255,255,255,0.85);
  animation: pulse 1.4s ease-in-out infinite;
}

.cw-back-btn {
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.cw-back-btn:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

.cw-close-btn {
  color: rgba(255,255,255,0.85);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: background 0.15s;
}
.cw-close-btn:hover {
  background: rgba(255,255,255,0.2);
  color: white;
}

/* ── Body ─────────────────────────────────────────────────────────────────── */
.cw-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cw-body::-webkit-scrollbar { width: 5px; }
.cw-body::-webkit-scrollbar-track { background: #f8f8f8; }
.cw-body::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }

.cw-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: #9ca3af;
  font-size: 13px;
  height: 100%;
}

/* ── Messages ─────────────────────────────────────────────────────────────── */
.cw-msg {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: 80%;
}

.cw-msg--own {
  flex-direction: row-reverse;
  align-self: flex-end;
  margin-left: auto;
}

.cw-msg__ava {
  flex-shrink: 0;
  margin-bottom: 18px;
}

.cw-msg__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cw-msg--own .cw-msg__body { align-items: flex-end; }

.cw-msg__name {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  padding: 0 4px;
}

.cw-msg__bubble {
  background: #f3f4f6;
  border-radius: 14px 14px 14px 3px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  color: #111827;
}

.cw-msg--own .cw-msg__bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 14px 14px 3px 14px;
}

.cw-msg__time {
  font-size: 10px;
  color: #9ca3af;
  padding: 0 4px;
}

.cw-typing {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
  padding: 2px 4px;
}

.cw-dots span {
  animation: blink 1.4s infinite;
  font-size: 14px;
  line-height: 1;
}
.cw-dots span:nth-child(2) { animation-delay: 0.2s; }
.cw-dots span:nth-child(3) { animation-delay: 0.4s; }

/* ── Footer ───────────────────────────────────────────────────────────────── */
.cw-footer {
  border-top: 1px solid #e5e7eb;
  padding: 8px 10px;
  background: #fafafa;
  flex-shrink: 0;
}

.cw-input {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  outline: none;
  font-family: inherit;
  background: white;
  color: #111827;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.cw-input:focus { border-color: #667eea; }
.cw-input:disabled { background: #f3f4f6; cursor: not-allowed; }

.cw-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.cw-readonly {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #92400e;
  justify-content: center;
  padding: 4px 0;
}

/* ── Animations ───────────────────────────────────────────────────────────── */
@keyframes blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Mobile ───────────────────────────────────────────────────────────────── */
@media (max-width: 480px) {
  .cw-panel {
    width: calc(100vw - 24px);
    right: 12px;
    bottom: 12px;
    height: 72vh;
    max-height: 520px;
  }
}
</style>
