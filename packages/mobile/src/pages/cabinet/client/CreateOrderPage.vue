<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { createOrder } from '@/api/cabinet'

const router = useRouter()

const step    = ref<1 | 2>(1)
const saving  = ref(false)
const error   = ref('')

const COUNTRIES = [
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'UZ', name: 'Узбекистан',   flag: '🇺🇿' },
  { code: 'KZ', name: 'Казахстан',    flag: '🇰🇿' },
  { code: 'KG', name: 'Кыргызстан',   flag: '🇰🇬' },
  { code: 'TJ', name: 'Таджикистан',  flag: '🇹🇯' },
  { code: 'IR', name: 'Иран',         flag: '🇮🇷' },
  { code: 'TR', name: 'Турция',       flag: '🇹🇷' },
  { code: 'AE', name: 'ОАЭ',          flag: '🇦🇪' },
  { code: 'RU', name: 'Россия',       flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь',     flag: '🇧🇾' },
]

const PACKAGING = [
  { value: 'bulk',      label: 'Навалом'   },
  { value: 'boxes',     label: 'Коробки'   },
  { value: 'pallets',   label: 'Паллеты'   },
  { value: 'container', label: 'Контейнер' },
  { value: 'other',     label: 'Другое'    },
]

const form = reactive({
  title:       '',
  fromCountry: '',
  fromCity:    '',
  toCountry:   '',
  toCity:      '',
  readyDate:   '',
  deadlineDate:'',
  price:       '',
  currency:    'USD',
  cargo: {
    cargoType:    '',
    weightKg:     '',
    volumeM3:     '',
    packaging:    '',
    tempControlled: false,
    notes:        '',
  },
})

// City autocomplete
const fromSugg  = ref<string[]>([])
const toSugg    = ref<string[]>([])
const fromLoad  = ref(false)
const toLoad    = ref(false)
let fromTimer: any = null
let toTimer:   any = null

async function fetchCities(q: string, cc: string): Promise<string[]> {
  if (!q || q.length < 2) return []
  const p = new URLSearchParams({ q, format:'json', limit:'6', 'accept-language':'ru', featuretype:'city' })
  if (cc) p.set('countrycodes', cc.toLowerCase())
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?${p}`, { headers: {'User-Agent':'TMGO/1.0'} })
    const items = await r.json()
    return [...new Set(items.map((i: any) => i.display_name.split(',')[0].trim()))] as string[]
  } catch { return [] }
}

function onFromCity(e: Event) {
  const v = (e.target as HTMLInputElement).value
  form.fromCity = v
  clearTimeout(fromTimer)
  fromTimer = setTimeout(async () => {
    fromLoad.value = true
    fromSugg.value = await fetchCities(v, form.fromCountry)
    fromLoad.value = false
  }, 350)
}

function onToCity(e: Event) {
  const v = (e.target as HTMLInputElement).value
  form.toCity = v
  clearTimeout(toTimer)
  toTimer = setTimeout(async () => {
    toLoad.value = true
    toSugg.value = await fetchCities(v, form.toCountry)
    toLoad.value = false
  }, 350)
}

watch(() => form.fromCountry, () => { form.fromCity = ''; fromSugg.value = [] })
watch(() => form.toCountry,   () => { form.toCity   = ''; toSugg.value   = [] })

function clearFromSugg() { setTimeout(() => fromSugg.value = [], 200) }
function clearToSugg()   { setTimeout(() => toSugg.value   = [], 200) }

const canStep2 = computed(() =>
  form.title && form.fromCountry && form.fromCity && form.toCountry && form.toCity && form.readyDate
)

async function submit() {
  if (!form.cargo.cargoType) { error.value = 'Укажите тип груза'; return }
  error.value = ''
  saving.value = true
  try {
    const body = {
      title:       form.title,
      fromCountry: form.fromCountry,
      fromCity:    form.fromCity,
      toCountry:   form.toCountry,
      toCity:      form.toCity,
      readyDate:   form.readyDate,
      deadlineDate: form.deadlineDate || undefined,
      price:  form.price ? parseFloat(form.price) : undefined,
      currency: form.currency,
      cargo: {
        cargoType:  form.cargo.cargoType,
        weightKg:   form.cargo.weightKg ? parseFloat(form.cargo.weightKg) : undefined,
        volumeM3:   form.cargo.volumeM3 ? parseFloat(form.cargo.volumeM3) : undefined,
        packaging:  form.cargo.packaging || undefined,
        tempControlled: form.cargo.tempControlled,
        notes:      form.cargo.notes || undefined,
      },
    }
    const res = await createOrder(body)
    router.replace(`/cabinet/client/orders/${res.order.id}`)
  } catch (e: any) {
    if (e.message?.includes('profile_required')) {
      error.value = 'Заполните профиль компании перед созданием заказа'
    } else {
      error.value = e.message
    }
  } finally {
    saving.value = false
  }
}

const today = new Date().toISOString().split('T')[0]
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <button class="icon-btn" @click="step === 2 ? step = 1 : router.back()">
        <ArrowLeft :size="22" />
      </button>
      <div class="header-info">
        <h1 class="title">Новый заказ</h1>
        <span class="step-hint">Шаг {{ step }} из 2</span>
      </div>
      <div class="step-dots">
        <span :class="['dot', { active: step >= 1 }]" />
        <span :class="['dot', { active: step >= 2 }]" />
      </div>
    </header>

    <div v-if="error" class="error-box">{{ error }}</div>

    <!-- Step 1: Route + Dates + Price -->
    <div v-if="step === 1" class="form">

      <div class="field-group">
        <div class="group-label">Название заказа</div>
        <div class="card">
          <input v-model="form.title" class="field-input" placeholder="Например: Хлопок Мары → Стамбул" />
        </div>
      </div>

      <div class="field-group">
        <div class="group-label">Откуда</div>
        <div class="card">
          <div class="field-row">
            <span class="fl">🌍</span>
            <div class="field-content">
              <span class="fl-label">Страна</span>
              <select v-model="form.fromCountry" class="sel">
                <option value="">Выберите страну</option>
                <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="sep" />
          <div class="field-row suggest-wrap">
            <span class="fl">📍</span>
            <div class="field-content">
              <span class="fl-label">Город <span v-if="fromLoad" class="loading-dot">...</span></span>
              <div class="inp-clear">
                <input :value="form.fromCity" class="field-input" placeholder="Начните вводить..."
                  autocomplete="off" @input="onFromCity"
                  @blur="clearFromSugg" />
                <button v-if="form.fromCity" class="clear-x" @click="form.fromCity = ''">×</button>
              </div>
            </div>
            <div v-if="fromSugg.length" class="sugg-list">
              <button v-for="s in fromSugg" :key="s" class="sugg-item" @mousedown.prevent="form.fromCity = s; fromSugg = []">{{ s }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="field-group">
        <div class="group-label">Куда</div>
        <div class="card">
          <div class="field-row">
            <span class="fl">🌍</span>
            <div class="field-content">
              <span class="fl-label">Страна</span>
              <select v-model="form.toCountry" class="sel">
                <option value="">Выберите страну</option>
                <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
              </select>
            </div>
          </div>
          <div class="sep" />
          <div class="field-row suggest-wrap">
            <span class="fl">🏁</span>
            <div class="field-content">
              <span class="fl-label">Город <span v-if="toLoad" class="loading-dot">...</span></span>
              <div class="inp-clear">
                <input :value="form.toCity" class="field-input" placeholder="Начните вводить..."
                  autocomplete="off" @input="onToCity"
                  @blur="clearToSugg" />
                <button v-if="form.toCity" class="clear-x" @click="form.toCity = ''">×</button>
              </div>
            </div>
            <div v-if="toSugg.length" class="sugg-list">
              <button v-for="s in toSugg" :key="s" class="sugg-item" @mousedown.prevent="form.toCity = s; toSugg = []">{{ s }}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="field-group">
        <div class="group-label">Даты</div>
        <div class="card">
          <div class="field-row">
            <span class="fl">📅</span>
            <div class="field-content">
              <span class="fl-label">Готов к погрузке</span>
              <input v-model="form.readyDate" type="date" class="field-input date-input" :min="today" />
            </div>
          </div>
          <div class="sep" />
          <div class="field-row">
            <span class="fl">🏁</span>
            <div class="field-content">
              <span class="fl-label">Срок доставки (необяз.)</span>
              <input v-model="form.deadlineDate" type="date" class="field-input date-input" :min="form.readyDate || today" />
            </div>
          </div>
        </div>
      </div>

      <div class="field-group">
        <div class="group-label">Стоимость (необязательно)</div>
        <div class="card two-col">
          <div class="half">
            <span class="fl-label">Цена</span>
            <input v-model="form.price" type="number" class="field-input" placeholder="0" min="0" />
          </div>
          <div class="col-sep" />
          <div class="half">
            <span class="fl-label">Валюта</span>
            <select v-model="form.currency" class="sel">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="TMT">TMT</option>
              <option value="RUB">RUB</option>
            </select>
          </div>
        </div>
      </div>

      <div class="footer-btn">
        <button class="btn-next" :disabled="!canStep2" @click="step = 2">
          Далее → Груз
        </button>
      </div>
    </div>

    <!-- Step 2: Cargo -->
    <div v-else class="form">

      <div class="field-group">
        <div class="group-label">Тип груза</div>
        <div class="card">
          <div class="field-row">
            <span class="fl">📦</span>
            <div class="field-content">
              <span class="fl-label">Наименование</span>
              <input v-model="form.cargo.cargoType" class="field-input" placeholder="Хлопок, металл, продукты..." />
            </div>
          </div>
        </div>
      </div>

      <div class="field-group">
        <div class="group-label">Параметры</div>
        <div class="card">
          <div class="field-row two-col">
            <div class="half">
              <span class="fl-label">Вес, кг</span>
              <input v-model="form.cargo.weightKg" type="number" class="field-input" placeholder="0" min="0" />
            </div>
            <div class="col-sep" />
            <div class="half">
              <span class="fl-label">Объём, м³</span>
              <input v-model="form.cargo.volumeM3" type="number" class="field-input" placeholder="0" min="0" />
            </div>
          </div>
          <div class="sep" />
          <div class="field-row">
            <span class="fl">🗃️</span>
            <div class="field-content">
              <span class="fl-label">Упаковка</span>
              <select v-model="form.cargo.packaging" class="sel">
                <option value="">Не указана</option>
                <option v-for="p in PACKAGING" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>
          </div>
          <div class="sep" />
          <div class="field-row">
            <span class="fl">🌡️</span>
            <div class="field-content">
              <span class="fl-label">Температурный режим</span>
              <label class="toggle-wrap">
                <input type="checkbox" v-model="form.cargo.tempControlled" class="toggle-cb" />
                <span class="toggle-track" :class="{ on: form.cargo.tempControlled }">
                  <span class="toggle-thumb" />
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="field-group">
        <div class="group-label">Примечание (необязательно)</div>
        <div class="card">
          <textarea
            v-model="form.cargo.notes"
            class="field-input textarea"
            placeholder="Особые условия, требования к транспорту..."
            rows="3"
          />
        </div>
      </div>

      <div class="footer-btn">
        <button class="btn-next" :disabled="saving || !form.cargo.cargoType" @click="submit">
          <span v-if="saving" class="spinner" />
          {{ saving ? 'Создаём...' : 'Создать заказ' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { background: #f2f4f7; min-height: 100%; padding-bottom: 40px; }

.header {
  background: white; display: flex; align-items: center;
  padding: 10px 14px; padding-top: calc(10px + var(--safe-area-top));
  border-bottom: 1px solid #eee; gap: 10px;
  position: sticky; top: 0; z-index: 10;
}
.icon-btn { background: none; border: none; color: #555; padding: 6px; cursor: pointer; display: flex; align-items: center; flex-shrink: 0; }
.header-info { flex: 1; }
.title { font-size: 1rem; font-weight: 700; color: #1a1a1a; margin: 0; }
.step-hint { font-size: 0.72rem; color: #999; }
.step-dots { display: flex; gap: 5px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #e0e0e0; transition: background .2s; }
.dot.active { background: var(--primary); }

.error-box { background: #fff0f0; border-left: 3px solid #e53935; margin: 12px 16px; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; color: #c62828; }

.form { padding: 12px 16px; display: flex; flex-direction: column; gap: 14px; }

.field-group {}
.group-label { font-size: 0.7rem; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding-left: 2px; }

.card { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.06); overflow: visible; }

.field-row { display: flex; align-items: flex-start; padding: 12px 14px; gap: 10px; min-height: 50px; }
.field-row.two-col { padding: 12px 0; gap: 0; }

.fl { font-size: 1rem; flex-shrink: 0; padding-top: 16px; width: 22px; text-align: center; }
.field-content { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.fl-label { font-size: 0.68rem; color: #aaa; font-weight: 400; display: flex; align-items: center; gap: 4px; }
.loading-dot { color: var(--primary); font-weight: 700; }

.field-input { border: none; outline: none; font-size: 0.95rem; font-weight: 500; color: #222; background: transparent; width: 100%; padding: 2px 0; }
.field-input::placeholder { color: #ccc; font-weight: 400; }
.date-input { color: #222; }
.textarea { resize: none; padding: 12px 14px; width: 100%; box-sizing: border-box; font-size: 0.9rem; line-height: 1.5; }

.sel { border: none; outline: none; font-size: 0.95rem; font-weight: 500; color: #222; background: transparent; width: 100%; padding: 2px 0; -webkit-appearance: none; appearance: none; cursor: pointer; }

.sep { height: 1px; background: #eee; margin: 0 14px; }

.half { flex: 1; padding: 8px 16px; display: flex; flex-direction: column; gap: 2px; }
.col-sep { width: 1px; background: #eee; align-self: stretch; }

.inp-clear { display: flex; align-items: center; gap: 4px; }
.inp-clear .field-input { flex: 1; }
.clear-x { background: none; border: none; color: #aaa; font-size: 1.1rem; padding: 0 2px; cursor: pointer; line-height: 1; }

.suggest-wrap { position: relative; }
.sugg-list {
  position: absolute; top: 100%; left: 0; right: 0;
  background: #fff; border: 1px solid #e0e0e0;
  border-radius: 0 0 10px 10px; box-shadow: 0 4px 16px rgba(0,0,0,.1);
  z-index: 50; overflow: hidden;
}
.sugg-item { display: block; width: 100%; text-align: left; background: none; border: none; border-bottom: 1px solid #f0f0f0; padding: 10px 16px; font-size: 0.9rem; color: #222; cursor: pointer; }
.sugg-item:last-child { border-bottom: none; }
.sugg-item:active { background: #f0f4ff; }

/* Toggle */
.toggle-wrap { display: flex; align-items: center; padding: 2px 0; cursor: pointer; }
.toggle-cb { display: none; }
.toggle-track {
  width: 44px; height: 24px; border-radius: 12px; background: #e0e0e0;
  position: relative; transition: background .2s; flex-shrink: 0;
}
.toggle-track.on { background: var(--primary); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%; background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: transform .2s;
}
.toggle-track.on .toggle-thumb { transform: translateX(20px); }

.footer-btn { padding: 8px 0 0; }
.btn-next {
  width: 100%; height: 52px; background: var(--primary); color: white;
  border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700;
  letter-spacing: 0.5px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 10px; transition: background .2s;
}
.btn-next:active:not(:disabled) { background: var(--primary-dark); }
.btn-next:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
