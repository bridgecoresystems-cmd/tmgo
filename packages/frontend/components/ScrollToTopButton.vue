<template>
  <button
    type="button"
    class="scroll-to-top"
    aria-label="Наверх"
    @click="scrollToTop"
  >
    <component :is="ChevronUpOutline" class="icon" />
  </button>
</template>

<script setup lang="ts">
import { ChevronUpOutline } from '@vicons/ionicons5'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.scroll-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 107, 74, 0.15);
  color: rgba(255, 107, 74, 0.4);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}

.scroll-to-top:hover {
  background: #ff6b4a;
  color: #fff;
}

.scroll-to-top:active {
  transform: scale(0.95);
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
