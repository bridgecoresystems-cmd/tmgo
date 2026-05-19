<template>
  <div class="star-rating" :class="{ 'is-readonly': readonly }" role="img" :aria-label="ariaLabel">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      class="star-btn"
      :disabled="readonly"
      :tabindex="readonly ? -1 : 0"
      @click="select(i)"
      @mouseenter="hover = i"
      @mouseleave="hover = 0"
    >
      <component
        :is="iconFor(i)"
        class="star-ico"
        :style="{ width: size + 'px', height: size + 'px', color: colorFor(i) }"
      />
    </button>
    <span v-if="showValue" class="star-value">{{ display.toFixed(1) }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star, StarHalf, StarOutline } from '@vicons/ionicons5'

const props = withDefaults(defineProps<{
  modelValue?: number
  readonly?: boolean
  size?: number
  showValue?: boolean
}>(), {
  modelValue: 0,
  readonly: false,
  size: 28,
  showValue: false,
})

const emit = defineEmits<{ 'update:modelValue': [v: number] }>()

const hover = ref(0)

const display = computed(() => props.modelValue || 0)
const active = computed(() => (props.readonly ? display.value : hover.value || display.value))

const ariaLabel = computed(() => `${display.value} / 5`)

function iconFor(i: number) {
  const v = active.value
  if (v >= i) return Star
  if (v >= i - 0.5) return StarHalf
  return StarOutline
}

function colorFor(i: number) {
  return active.value >= i - 0.5 ? '#f5a623' : '#d8d8d8'
}

function select(i: number) {
  if (props.readonly) return
  emit('update:modelValue', i)
}
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.star-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  line-height: 0;
  transition: transform 0.12s ease;
}
.star-rating:not(.is-readonly) .star-btn:hover {
  transform: scale(1.18);
}
.star-rating:not(.is-readonly) .star-btn:active {
  transform: scale(0.92);
}
.is-readonly .star-btn {
  cursor: default;
}
.star-ico {
  transition: color 0.12s ease;
  display: block;
}
.star-value {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}
</style>
