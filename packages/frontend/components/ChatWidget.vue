<!--
  ChatWidget — плавающая панель чата (внизу справа)
  Props: modelValue, orderId, title, currentUserId
  При клике вне виджета — закрывается
-->
<template>
  <Teleport to="body">
    <!-- Оверлей — клик закрывает чат -->
    <div
      v-if="modelValue"
      class="cw-backdrop"
      @click="$emit('update:modelValue', false)"
    />

    <div class="cw-panel" :class="{ 'cw-panel--open': modelValue }">
      <div class="cw-header" @click="togglePanel">
        <div class="cw-header__left">
          <span class="cw-status" :class="{ 'cw-status--online': wsConnected }" />
          <span class="cw-header__title">{{ title || 'Чат' }}</span>
          <NIcon v-if="typingName" size="14" class="cw-typing-icon">
            <component :is="PencilIcon" />
          </NIcon>
        </div>
        <div class="cw-header__right">
          <NIcon size="18" class="cw-close-btn" @click.stop="$emit('update:modelValue', false)">
            <component :is="CloseIcon" />
          </NIcon>
        </div>
      </div>

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
              round
              :size="28"
              class="cw-msg__ava"
              :style="{ backgroundColor: '#ff6b4a' }"
            >
              {{ (msg.user?.name || '?').charAt(0) }}
            </NAvatar>
            <div class="cw-msg__body">
              <div v-if="msg.userId !== currentUserId" class="cw-msg__name">
                {{ msg.user?.name }}
              </div>
              <div class="cw-msg__bubble">
                <template v-if="msg.content && msg.content !== '[Фото]'">{{ msg.content }}</template>
                <div v-if="msg.attachments?.length" class="cw-msg__imgs">
                  <div
                    v-for="(url, i) in msg.attachments"
                    :key="i"
                    class="cw-msg__img-link"
                    @click="previewImage = imageUrl(url)"
                  >
                    <img :src="imageUrl(url)" alt="Фото" class="cw-msg__img" />
                  </div>
                </div>
              </div>
              <div class="cw-msg__time">{{ fmtTime(msg.createdAt) }}</div>
            </div>
          </div>

          <div v-if="typingName" class="cw-typing">
            <span>{{ typingName }} печатает</span>
            <span class="cw-dots"><span>.</span><span>.</span><span>.</span></span>
          </div>
        </template>
      </div>

      <div class="cw-footer">
        <div class="cw-footer-row">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="cw-file-input"
            @change="handleFileSelect"
          />
          <NButton
            quaternary
            circle
            size="small"
            class="cw-photo-btn"
            @click="fileInputRef?.click()"
          >
            <template #icon>
              <NIcon size="20"><component :is="ImageIcon" /></NIcon>
            </template>
          </NButton>
          <textarea
            v-model="inputText"
            class="cw-input"
            placeholder="Написать сообщение..."
            rows="2"
            :disabled="!wsConnected"
            @keydown="handleKey"
            @input="handleTyping"
          />
          <NButton
            type="primary"
            size="small"
            circle
            :disabled="(!inputText.trim() && !pendingPhotos.length) || !wsConnected"
            :loading="uploading"
            @click="sendMsg"
          >
            <template #icon>
              <NIcon><component :is="SendIcon" /></NIcon>
            </template>
          </NButton>
        </div>
        <div v-if="pendingPhotos.length" class="cw-pending-photos">
          <div v-for="(p, i) in pendingPhotos" :key="i" class="cw-pending-item">
            <img :src="p.preview" alt="" class="cw-pending-preview" />
            <NButton text size="tiny" type="error" @click="removePendingPhoto(i)">×</NButton>
          </div>
        </div>
      </div>
    </div>

    <NModal v-model:show="imageModalShow" preset="card" title="Фото" style="width: 90vw; max-width: 900px">
      <img v-if="previewImage" :src="previewImage" alt="Фото" style="width: 100%; height: auto; display: block" />
    </NModal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { NButton, NIcon, NAvatar, NSpin } from 'naive-ui'
import {
  ChatbubbleEllipsesOutline as ChatIcon,
  CloseOutline as CloseIcon,
  SendOutline as SendIcon,
  PencilOutline as PencilIcon,
  ImageOutline as ImageIcon,
} from '@vicons/ionicons5'

const props = defineProps<{
  modelValue: boolean
  orderId: string | null
  title?: string
  currentUserId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const { apiBase: API, wsUrl: WS_BASE } = useApiBase()

const messages = ref<any[]>([])
const loading = ref(false)
const inputText = ref('')
const typingName = ref('')
const wsConnected = ref(false)
const bodyEl = ref<HTMLElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const pendingPhotos = ref<{ file: File; preview: string }[]>([])
const previewImage = ref('')
const imageModalShow = computed({
  get: () => !!previewImage.value,
  set: (v) => { if (!v) previewImage.value = '' },
})

let ws: WebSocket | null = null
let typingTimer: ReturnType<typeof setTimeout> | null = null
let typingOutTimer: ReturnType<typeof setTimeout> | null = null

function imageUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = API.replace(/\/$/, '')
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`
}

async function loadMessages(orderId: string) {
  loading.value = true
  try {
    const data = await $fetch<any[]>(`${API}/cabinet/chat/messages/${orderId}`, {
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

function openWs(orderId: string) {
  closeWs()
  const url = `${WS_BASE}/cabinet/chat/ws/${orderId}`
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
  if (ws) {
    ws.onclose = null
    ws.close()
    ws = null
  }
  wsConnected.value = false
}

watch(
  () => props.orderId,
  (newId) => {
    closeWs()
    messages.value = []
    typingName.value = ''
    if (newId) {
      loadMessages(newId)
      openWs(newId)
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (open) => {
    if (open) scrollBottom()
  }
)

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!f.type.startsWith('image/')) continue
    if (f.size > 5 * 1024 * 1024) continue
    const preview = URL.createObjectURL(f)
    pendingPhotos.value.push({ file: f, preview })
  }
  input.value = ''
}

function removePendingPhoto(i: number) {
  URL.revokeObjectURL(pendingPhotos.value[i].preview)
  pendingPhotos.value.splice(i, 1)
}

async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file, file.name)
  const res = await $fetch<{ url: string }>(`${API}/cabinet/chat/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  return res.url
}

async function sendMsg() {
  if (!ws || !wsConnected.value) return
  const hasText = !!inputText.value.trim()
  const hasPhotos = pendingPhotos.value.length > 0
  if (!hasText && !hasPhotos) return

  const attachments: string[] = []
  if (hasPhotos) {
    uploading.value = true
    try {
      for (const p of pendingPhotos.value) {
        const url = await uploadPhoto(p.file)
        attachments.push(url)
        URL.revokeObjectURL(p.preview)
      }
      pendingPhotos.value = []
    } catch (e) {
      console.error('Upload failed', e)
      uploading.value = false
      return
    }
    uploading.value = false
  }

  ws.send(JSON.stringify({
    type: 'message',
    content: inputText.value.trim(),
    attachments,
  }))
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

function togglePanel() {
  emit('update:modelValue', !props.modelValue)
}

function scrollBottom() {
  nextTick(() => {
    if (bodyEl.value) bodyEl.value.scrollTop = bodyEl.value.scrollHeight
  })
}

function fmtTime(iso: string | undefined) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
}

onUnmounted(() => {
  closeWs()
  if (typingTimer) clearTimeout(typingTimer)
  if (typingOutTimer) clearTimeout(typingOutTimer)
  pendingPhotos.value.forEach((p) => URL.revokeObjectURL(p.preview))
})
</script>

<style scoped>
.cw-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  z-index: 1099;
}

.cw-panel {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 360px;
  height: 480px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  z-index: 1100;
  transform: translateY(calc(100% + 24px));
  opacity: 0;
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease;
  pointer-events: none;
  overflow: hidden;
}

.cw-panel--open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: all;
}

.cw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: linear-gradient(135deg, #ff6b4a 0%, #e55a3a 100%);
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
}

.cw-header__right { flex-shrink: 0; }

.cw-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.cw-status--online {
  background: #4ade80;
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.6);
}

.cw-typing-icon {
  color: rgba(255, 255, 255, 0.85);
  animation: pulse 1.4s ease-in-out infinite;
}

.cw-close-btn {
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}
.cw-close-btn:hover { background: rgba(255, 255, 255, 0.2); }

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

.cw-msg {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: 85%;
}

.cw-msg--own {
  flex-direction: row-reverse;
  align-self: flex-end;
  margin-left: auto;
}

.cw-msg__ava { flex-shrink: 0; margin-bottom: 18px; }

.cw-msg__body { display: flex; flex-direction: column; gap: 2px; }
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
  background: linear-gradient(135deg, #ff6b4a 0%, #e55a3a 100%);
  color: white;
  border-radius: 14px 14px 3px 14px;
}

.cw-msg__imgs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.cw-msg__img-link { display: block; cursor: pointer; }
.cw-msg__img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  object-fit: cover;
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
}

.cw-dots span { animation: blink 1.4s infinite; font-size: 14px; }
.cw-dots span:nth-child(2) { animation-delay: 0.2s; }
.cw-dots span:nth-child(3) { animation-delay: 0.4s; }

.cw-footer {
  border-top: 1px solid #e5e7eb;
  padding: 8px 10px;
  background: #fafafa;
  flex-shrink: 0;
}

.cw-footer-row {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.cw-file-input { display: none; }

.cw-photo-btn { flex-shrink: 0; }

.cw-input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  outline: none;
  font-family: inherit;
  background: white;
  color: #111827;
  min-height: 36px;
  box-sizing: border-box;
}

.cw-input:focus { border-color: #ff6b4a; }
.cw-input:disabled { background: #f3f4f6; cursor: not-allowed; }

.cw-pending-photos {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.cw-pending-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.cw-pending-preview {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

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
