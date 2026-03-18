<template>
  <div
    class="verification-badge"
    :class="`verification-badge--${status}`"
    :title="tooltip"
  >
    <div class="verification-badge__medal">
      <span class="verification-badge__icon">🏅</span>
    </div>
    <div class="verification-badge__text">
      <span class="verification-badge__line1">{{ line1 }}</span>
      <span v-if="line2" class="verification-badge__line2">{{ line2 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
type VerificationStatus = 'not_verified' | 'not_submitted' | 'draft' | 'waiting_verification' | 'submitted' | 'verified' | 'request' | 'rejected' | 'suspended'

const props = withDefaults(
  defineProps<{
    status?: VerificationStatus | null
  }>(),
  { status: 'not_verified' }
)

const { t } = useI18n()

const config = computed(() => {
  const s = props.status
  switch (s) {
    case 'verified':
      return { line1: t('verificationBadge.shortVerf'), line2: '', tooltip: t('verificationBadge.verified') }
    case 'waiting_verification':
    case 'submitted':
      return { line1: t('verificationBadge.shortWait'), line2: t('verificationBadge.shortVerf'), tooltip: t('verificationBadge.waitingVerification') }
    case 'request':
      return { line1: t('verificationBadge.shortRequest'), line2: t('verificationBadge.shortRequestLine2'), tooltip: t('verificationBadge.changeRequest') }
    case 'rejected':
      return { line1: t('verificationBadge.shortRejected'), line2: '', tooltip: t('verificationBadge.rejected') }
    case 'suspended':
      return { line1: t('verificationBadge.shortSuspended'), line2: '', tooltip: t('verificationBadge.suspended') }
    case 'draft':
    case 'not_submitted':
      return { line1: t('verificationBadge.shortDraft'), line2: '', tooltip: t('verificationBadge.draft') }
    default:
      return { line1: t('verificationBadge.shortNot'), line2: t('verificationBadge.shortVerf'), tooltip: t('verificationBadge.notVerified') }
  }
})

const line1 = computed(() => config.value.line1)
const line2 = computed(() => config.value.line2)
const tooltip = computed(() => config.value.tooltip)
</script>

<style scoped>
.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  line-height: 1.1;
}

.verification-badge__medal {
  flex-shrink: 0;
}

.verification-badge__icon {
  font-size: 18px;
  line-height: 1;
}

.verification-badge__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.verification-badge__line2 {
  font-size: 9px;
  opacity: 0.9;
}

/* not_verified — gray */
.verification-badge--not_verified {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* waiting_verification — bronze */
.verification-badge--waiting_verification {
  background: linear-gradient(135deg, #d4a574 0%, #b8860b 50%, #8b6914 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(139, 105, 20, 0.4);
}

/* request — blue */
.verification-badge--request {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(37, 99, 235, 0.4);
}

/* verified — gold */
.verification-badge--verified {
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%);
  color: #1f2937;
  box-shadow: 0 1px 4px rgba(217, 119, 6, 0.4);
}

/* submitted — same as waiting */
.verification-badge--submitted {
  background: linear-gradient(135deg, #d4a574 0%, #b8860b 50%, #8b6914 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(139, 105, 20, 0.4);
}

/* rejected — red */
.verification-badge--rejected {
  background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(220, 38, 38, 0.4);
}

/* suspended — orange */
.verification-badge--suspended {
  background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
  color: #fff;
  box-shadow: 0 1px 4px rgba(234, 88, 12, 0.4);
}
</style>
