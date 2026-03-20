<template>
  <div class="roadmap-admin">
    <div class="roadmap-sticky">
      <div class="roadmap-stats">
        <div class="stat-block">
          <n-progress
            type="line"
            :percentage="progressPercent"
            :height="10"
            :border-radius="6"
            :fill-border-radius="6"
            indicator-placement="inside"
          />
        </div>
        <n-space align="center" :size="16" wrap>
          <n-tag type="success" round size="medium" :bordered="false">
            {{ doneCount }} / {{ totalTasks }} {{ t('roadmap.tasksDone') }}
          </n-tag>
          <n-text v-if="todayPlanDay !== null" depth="2" class="today-hint">
            {{ t('roadmap.todayPlan') }}: <strong>{{ t('roadmap.dayN', { n: todayPlanDay }) }}</strong>
            — {{ todayPlanLabel }}
          </n-text>
          <n-text v-if="saveState === 'saving'" depth="2">{{ t('roadmap.saving') }}</n-text>
          <n-text v-else-if="saveState === 'saved'" type="success">{{ t('roadmap.saved') }}</n-text>
          <n-text v-else-if="saveState === 'error'" type="error">{{ t('roadmap.saveError') }}</n-text>
        </n-space>
        <n-text depth="3" class="anchor-hint">{{ t('roadmap.anchorHint') }}</n-text>
      </div>
    </div>

    <n-spin :show="loading">
      <n-collapse :default-expanded-names="defaultExpanded" display-directive="show">
        <n-collapse-item
          v-for="phase in MVP_ROADMAP_PHASES"
          :key="phase.id"
          :title="phase.title"
          :name="phase.id"
        >
          <template #header-extra>
            <n-tag :bordered="false" round size="small" :class="['phase-badge', `phase-${phase.id}`]">
              {{ phase.badge }}
            </n-tag>
          </template>

          <div v-for="week in phase.weeks" :key="`${phase.id}-${week.label}`" class="week-block">
            <n-text class="week-label">{{ week.label }}</n-text>

            <div v-for="day in week.days" :key="day.day" class="day-card">
              <div v-if="firstDayMonthLabel[day.day]" class="month-banner">
                {{ firstDayMonthLabel[day.day] }}
              </div>
              <div class="day-row" :class="{ 'is-today': day.day === todayPlanDay }">
                <div class="day-label">
                  <span class="day-name">{{ day.weekdayRu }}</span>
                  <span class="day-num">{{ t('roadmap.dayN', { n: day.day }) }}</span>
                  <span class="day-cal">{{ formatDayCal(day.day) }}</span>
                </div>
                <div class="tasks-col">
                  <div
                    v-for="task in day.tasks"
                    :key="task.id"
                    class="task-row"
                  >
                    <span
                      class="task-dot"
                      :class="`phase-dot-${phase.id}`"
                      aria-hidden="true"
                    />
                    <n-checkbox
                      :checked="state[task.id]?.isDone ?? false"
                      class="task-check"
                      @update:checked="(v: boolean) => onToggle(task.id, v)"
                    >
                      <span class="task-title">{{ task.title }}</span>
                    </n-checkbox>
                    <n-input
                      :value="state[task.id]?.notes ?? ''"
                      type="textarea"
                      :placeholder="t('roadmap.notesPlaceholder')"
                      :autosize="{ minRows: 1, maxRows: 4 }"
                      size="small"
                      class="task-notes"
                      :maxlength="2000"
                      show-count
                      @update:value="(v: string) => onNotes(task.id, v)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import {
  MVP_ROADMAP_PHASES,
  MVP_ROADMAP_TOTAL_TASKS,
  calendarDateForRoadmapDay,
  allMvpRoadmapTaskIds,
} from '@tmgo/shared'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })

const { t, locale } = useI18n()
const { apiBase } = useApiBase()
const message = useMessage()

useSeoMeta({
  title: () => `${t('roadmap.pageTitle')} — TMGO`,
})

const totalTasks = MVP_ROADMAP_TOTAL_TASKS
const loading = ref(true)
const state = ref<Record<string, { isDone: boolean; notes: string }>>({})
const dirty = ref<Set<string>>(new Set())
const saveState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let saveTimer: ReturnType<typeof setTimeout> | null = null

const defaultExpanded = ['p1', 'p2', 'p3', 'p4']
const allIds = allMvpRoadmapTaskIds(MVP_ROADMAP_PHASES)

function localeForDate(): string {
  const l = locale.value
  if (l === 'ru') return 'ru-RU'
  if (l === 'tk') return 'tk-TM'
  return 'en-US'
}

function formatDayCal(dayNum: number): string {
  const d = calendarDateForRoadmapDay(dayNum)
  return d.toLocaleDateString(localeForDate(), {
    day: 'numeric',
    month: 'short',
  })
}

const firstDayMonthLabel = computed(() => {
  const rec: Record<number, string> = {}
  let prevKey = ''
  for (const phase of MVP_ROADMAP_PHASES) {
    for (const week of phase.weeks) {
      for (const day of week.days) {
        const d = calendarDateForRoadmapDay(day.day)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        if (key !== prevKey) {
          rec[day.day] = d.toLocaleDateString(localeForDate(), {
            month: 'long',
            year: 'numeric',
          })
          prevKey = key
        }
      }
    }
  }
  return rec
})

function todayYmd(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

function ymdForRoadmapDay(dayNum: number): string {
  const d = calendarDateForRoadmapDay(dayNum)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayPlanDay = computed(() => {
  const ty = todayYmd()
  for (let d = 1; d <= 50; d++) {
    if (ymdForRoadmapDay(d) === ty) return d
  }
  return null
})

const todayPlanLabel = computed(() => {
  if (todayPlanDay.value === null) return ''
  const d = calendarDateForRoadmapDay(todayPlanDay.value)
  return d.toLocaleDateString(localeForDate(), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
})

const doneCount = computed(() =>
  allIds.reduce((n, id) => n + (state.value[id]?.isDone ? 1 : 0), 0),
)

const progressPercent = computed(() =>
  totalTasks ? Math.round((doneCount.value / totalTasks) * 100) : 0,
)

function initEmptyState() {
  const m: Record<string, { isDone: boolean; notes: string }> = {}
  for (const id of allIds) {
    m[id] = { isDone: false, notes: '' }
  }
  state.value = m
}

async function loadProgress() {
  loading.value = true
  initEmptyState()
  try {
    const res = await $fetch<{ tasks: { taskId: string; isDone: boolean; notes: string | null }[] }>(
      `${apiBase}/admin/mvp-roadmap/progress`,
      { credentials: 'include' },
    )
    const list = Array.isArray(res.tasks) ? res.tasks : []
    for (const row of list) {
      if (!state.value[row.taskId]) continue
      state.value[row.taskId] = {
        isDone: !!row.isDone,
        notes: row.notes ?? '',
      }
    }
  } catch {
    message.error(t('roadmap.loadError'))
  } finally {
    loading.value = false
  }
}

function markDirty(taskId: string) {
  dirty.value.add(taskId)
  scheduleSave()
}

function onToggle(taskId: string, v: boolean) {
  if (!state.value[taskId]) return
  state.value[taskId] = { ...state.value[taskId]!, isDone: v }
  markDirty(taskId)
}

function onNotes(taskId: string, v: string) {
  if (!state.value[taskId]) return
  state.value[taskId] = { ...state.value[taskId]!, notes: v }
  markDirty(taskId)
}

function scheduleSave() {
  saveState.value = 'idle'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void flushSave(), 500)
}

async function flushSave() {
  if (dirty.value.size === 0) return
  const ids = [...dirty.value]
  dirty.value = new Set()
  saveState.value = 'saving'
  const tasks = ids.map((taskId) => ({
    taskId,
    isDone: state.value[taskId]?.isDone ?? false,
    notes: state.value[taskId]?.notes ?? '',
  }))
  const chunkSize = 160
  try {
    for (let i = 0; i < tasks.length; i += chunkSize) {
      const chunk = tasks.slice(i, i + chunkSize)
      await $fetch(`${apiBase}/admin/mvp-roadmap/progress`, {
        method: 'PATCH',
        credentials: 'include',
        body: { tasks: chunk },
      })
    }
    saveState.value = 'saved'
    setTimeout(() => {
      if (saveState.value === 'saved') saveState.value = 'idle'
    }, 2000)
  } catch {
    saveState.value = 'error'
    message.error(t('roadmap.saveError'))
    for (const id of ids) dirty.value.add(id)
  }
}

onMounted(() => void loadProgress())
</script>

<style scoped>
.roadmap-admin {
  max-width: 1100px;
  margin: 0 auto;
}

.roadmap-sticky {
  position: sticky;
  top: 0;
  z-index: 5;
  background: linear-gradient(180deg, #f8f9fa 85%, transparent);
  padding-bottom: 12px;
  margin: -8px 0 20px;
}

.roadmap-stats {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.stat-block {
  margin-bottom: 12px;
}

.anchor-hint {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.4;
}

.today-hint {
  font-size: 13px;
}

.week-block {
  margin-bottom: 20px;
}

.week-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #888;
  margin-bottom: 10px;
}

.month-banner {
  font-size: 13px;
  font-weight: 600;
  color: #ff6b4a;
  margin: 14px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #ffd4c9;
}

.day-card {
  margin-bottom: 8px;
}

.day-row {
  display: flex;
  gap: 0;
  border: 1px solid #ececec;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s;
}

.day-row.is-today {
  border-color: #ff6b4a;
  box-shadow: 0 0 0 2px rgba(255, 107, 74, 0.2);
}

.day-label {
  flex-shrink: 0;
  width: 92px;
  padding: 12px 10px;
  background: #f6f7f9;
  border-right: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-name {
  font-size: 11px;
  color: #888;
}

.day-num {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.day-cal {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.tasks-col {
  flex: 1;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-row {
  display: grid;
  grid-template-columns: 8px 1fr;
  grid-template-rows: auto auto;
  column-gap: 8px;
  row-gap: 6px;
  align-items: start;
}

.task-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 8px;
  grid-row: 1 / 2;
}

.phase-dot-p1 {
  background: #185fa5;
}
.phase-dot-p2 {
  background: #0f6e56;
}
.phase-dot-p3 {
  background: #534ab7;
}
.phase-dot-p4 {
  background: #854f0b;
}

.task-check {
  grid-column: 2;
}

.task-check :deep(.n-checkbox__label) {
  white-space: normal;
  line-height: 1.45;
  font-size: 13px;
}

.task-title {
  color: #1a1a1a;
}

.task-notes {
  grid-column: 2;
  max-width: 100%;
}

.phase-badge.phase-p1 {
  background: #e6f1fb;
  color: #185fa5;
}
.phase-badge.phase-p2 {
  background: #e1f5ee;
  color: #0f6e56;
}
.phase-badge.phase-p3 {
  background: #eeedfe;
  color: #534ab7;
}
.phase-badge.phase-p4 {
  background: #faeeda;
  color: #854f0b;
}

@media (max-width: 640px) {
  .day-row {
    flex-direction: column;
  }
  .day-label {
    width: 100%;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    border-right: none;
    border-bottom: 1px solid #ececec;
  }
  .day-cal {
    margin-top: 0;
    margin-left: auto;
  }
}
</style>
