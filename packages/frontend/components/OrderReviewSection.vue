<template>
  <n-card v-if="status === 'completed'" :title="t('reviews.title')" style="margin-top: 16px;">
    <div v-if="loading" style="padding: 16px; text-align: center;">
      <n-spin size="small" />
    </div>

    <template v-else>
      <!-- Leave a review -->
      <div v-if="canReview" class="review-form">
        <div class="review-form__label">{{ t('reviews.yourRating') }}</div>
        <StarRating v-model="form.rating" :size="34" />
        <n-input
          v-model:value="form.comment"
          type="textarea"
          :placeholder="t('reviews.commentPlaceholder')"
          :autosize="{ minRows: 2, maxRows: 5 }"
          maxlength="1000"
          show-count
          class="review-form__comment"
        />
        <n-button
          type="primary"
          :disabled="form.rating < 1"
          :loading="submitting"
          @click="submit"
        >
          {{ t('reviews.submit') }}
        </n-button>
      </div>

      <!-- My submitted review -->
      <div v-if="mine" class="review-item review-item--mine">
        <div class="review-item__head">
          <span class="review-item__who">{{ t('reviews.yourReview') }}</span>
          <StarRating :model-value="mine.rating" readonly :size="18" />
        </div>
        <p v-if="mine.comment" class="review-item__text">{{ mine.comment }}</p>
        <span class="review-item__date">{{ fmtDate(mine.createdAt) }}</span>
      </div>

      <!-- Review received from counterparty -->
      <div v-if="received" class="review-item">
        <div class="review-item__head">
          <span class="review-item__who">{{ t('reviews.theirReview', { name: received.fromName || t('common.user') }) }}</span>
          <StarRating :model-value="received.rating" readonly :size="18" />
        </div>
        <p v-if="received.comment" class="review-item__text">{{ received.comment }}</p>
        <span class="review-item__date">{{ fmtDate(received.createdAt) }}</span>
      </div>

      <n-empty
        v-if="!canReview && !mine && !received"
        :description="t('reviews.none')"
        size="small"
      />
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'

const props = defineProps<{
  orderId: string
  status: string
}>()

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const message = useMessage()

const loading = ref(false)
const submitting = ref(false)
const canReview = ref(false)
const mine = ref<any>(null)
const received = ref<any>(null)
const form = reactive({ rating: 0, comment: '' })

function fmtDate(d: string) {
  return new Date(d).toLocaleString('ru-RU')
}

async function load() {
  if (props.status !== 'completed' || !props.orderId) return
  loading.value = true
  try {
    const data = await $fetch<any>(`${API}/cabinet/orders/${props.orderId}/reviews`, { credentials: 'include' })
    canReview.value = data.canReview
    mine.value = data.mine
    received.value = data.received
  } catch {
    canReview.value = false
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (form.rating < 1) return
  submitting.value = true
  try {
    await $fetch(`${API}/cabinet/orders/${props.orderId}/review`, {
      method: 'POST',
      credentials: 'include',
      body: { rating: form.rating, comment: form.comment || undefined },
    })
    message.success(t('reviews.thanks'))
    await load()
  } catch (e: any) {
    const code = e?.data?.error
    message.error(code === 'already_reviewed' ? t('reviews.alreadyReviewed') : t('common.error'))
  } finally {
    submitting.value = false
  }
}

watch(() => [props.orderId, props.status], load)
onMounted(load)
</script>

<style scoped>
.review-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.review-form__label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
.review-form__comment {
  width: 100%;
}
.review-item {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fafafa;
}
.review-item--mine {
  border-color: #ffd9cc;
  background: #fff6f3;
}
.review-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.review-item__who {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.review-item__text {
  margin: 8px 0 4px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  white-space: pre-wrap;
}
.review-item__date {
  font-size: 12px;
  color: #9ca3af;
}
</style>
