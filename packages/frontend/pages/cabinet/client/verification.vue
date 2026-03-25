<template>
  <div style="max-width: 860px; margin: 0 auto;">
    <UiBackBtn to="/cabinet/client" :label="t('common.backToDashboard')" />

    <n-card :title="t('verification.title')" style="margin-top: 16px;">
      <n-steps :current="step" :status="stepStatus" style="margin-bottom: 32px;">
        <n-step :title="t('verification.step1Title')" />
        <n-step :title="t('verification.step2Title')" />
        <n-step :title="t('verification.step3Title')" />
      </n-steps>

      <!-- Step 1: Type -->
      <div v-if="step === 1">
        <p style="color: #666; margin-bottom: 24px;">{{ t('verification.step1Desc') }}</p>
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <div
              class="type-card"
              :class="{ selected: selectedType === 'individual' }"
              @click="selectedType = 'individual'"
            >
              <n-icon size="40" style="margin-bottom: 12px;" color="#ff6b4a">
                <PersonOutline />
              </n-icon>
              <div class="type-card-title">{{ t('verification.individual') }}</div>
              <div class="type-card-desc">{{ t('verification.individualDesc') }}</div>
            </div>
          </n-gi>
          <n-gi>
            <div
              class="type-card"
              :class="{ selected: selectedType === 'company' }"
              @click="selectedType = 'company'"
            >
              <n-icon size="40" style="margin-bottom: 12px;" color="#ff6b4a">
                <BusinessOutline />
              </n-icon>
              <div class="type-card-title">{{ t('verification.company') }}</div>
              <div class="type-card-desc">{{ t('verification.companyDesc') }}</div>
            </div>
          </n-gi>
        </n-grid>
        <div style="margin-top: 24px; text-align: right;">
          <n-button type="primary" :disabled="!selectedType" @click="step = 2">
            {{ t('common.next') }}
          </n-button>
        </div>
      </div>

      <!-- Step 2: Country -->
      <div v-if="step === 2">
        <p style="color: #666; margin-bottom: 24px;">{{ t('verification.step2Desc') }}</p>
        <n-grid :cols="5" :x-gap="12" :y-gap="12">
          <n-gi v-for="c in COUNTRY_LIST" :key="c.code">
            <div
              class="country-card"
              :class="{ selected: selectedCountry === c.code }"
              @click="selectedCountry = c.code"
            >
              <div class="country-flag">{{ c.flag }}</div>
              <div class="country-name">{{ c.name }}</div>
            </div>
          </n-gi>
        </n-grid>
        <div style="margin-top: 24px; display: flex; justify-content: space-between;">
          <n-button @click="step = 1">{{ t('common.back') }}</n-button>
          <n-button type="primary" :disabled="!selectedCountry" @click="step = 3">
            {{ t('common.next') }}
          </n-button>
        </div>
      </div>

      <!-- Step 3: Form -->
      <div v-if="step === 3 && countryConfig">
        <n-form ref="formRef" :model="form" label-placement="top">

          <!-- INDIVIDUAL form -->
          <template v-if="selectedType === 'individual'">
            <!-- Personal info -->
            <n-divider title-placement="left">{{ t('verification.sectionPersonal') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 3" :x-gap="16">
              <n-gi>
                <n-form-item :label="t('verification.lastName')" path="lastName" required>
                  <n-input v-model:value="form.lastName" :placeholder="t('verification.lastNamePlaceholder')" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.firstName')" path="firstName" required>
                  <n-input v-model:value="form.firstName" :placeholder="t('verification.firstNamePlaceholder')" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="countryConfig.hasPatronymic">
                <n-form-item :label="t('verification.patronymic')">
                  <n-input v-model:value="form.middleName" :placeholder="t('verification.patronymicPlaceholder')" />
                </n-form-item>
              </n-gi>
            </n-grid>

            <!-- Document -->
            <n-divider title-placement="left">{{ t('verification.sectionDocument') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 2" :x-gap="16">
              <n-gi>
                <n-form-item :label="countryConfig.individual.docLabel" path="docNumber" required>
                  <n-input
                    v-model:value="form.docNumber"
                    :placeholder="countryConfig.individual.docPlaceholder ?? ''"
                    :maxlength="countryConfig.individual.docMaxLen"
                    show-count
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.phone')">
                  <n-input v-model:value="form.phone" :placeholder="t('verification.phonePlaceholder')" />
                </n-form-item>
              </n-gi>
            </n-grid>

            <!-- Address -->
            <n-divider title-placement="left">{{ t('verification.sectionAddress') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 3" :x-gap="16">
              <n-gi>
                <n-form-item :label="t('verification.addressPostal')">
                  <n-input v-model:value="form.addressPostal" placeholder="000000" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressRegion')">
                  <n-input v-model:value="form.addressRegion" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressCity')">
                  <n-input v-model:value="form.addressCity" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressDistrict')">
                  <n-input v-model:value="form.addressDistrict" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressStreet')">
                  <n-input v-model:value="form.addressStreet" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressHouse')">
                  <n-input v-model:value="form.addressHouse" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </template>

          <!-- COMPANY form -->
          <template v-if="selectedType === 'company'">
            <!-- Company info -->
            <n-divider title-placement="left">{{ t('verification.sectionCompany') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 2" :x-gap="16">
              <n-gi :span="isMobile ? 1 : 2">
                <n-form-item :label="t('verification.companyName')" path="companyName" required>
                  <n-input v-model:value="form.companyName" :placeholder="t('verification.companyNamePlaceholder')" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.shortName')">
                  <n-input v-model:value="form.shortName" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.legalForm')" path="legalForm" required>
                  <n-select
                    v-model:value="form.legalForm"
                    :options="legalFormOptions"
                    :placeholder="t('verification.legalFormPlaceholder')"
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="countryConfig.company.taxIdLabel" path="taxId" required>
                  <n-input
                    v-model:value="form.taxId"
                    :maxlength="countryConfig.company.taxIdMaxLen"
                    show-count
                  />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.regNumber')">
                  <n-input v-model:value="form.regNumber" />
                </n-form-item>
              </n-gi>
            </n-grid>

            <!-- Contacts -->
            <n-divider title-placement="left">{{ t('verification.sectionContacts') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 3" :x-gap="16">
              <n-gi>
                <n-form-item :label="t('verification.phone')">
                  <n-input v-model:value="form.phone" :placeholder="t('verification.phonePlaceholder')" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.website')">
                  <n-input v-model:value="form.website" placeholder="https://" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.additionalEmail')">
                  <n-input v-model:value="form.additionalEmail" placeholder="info@company.com" />
                </n-form-item>
              </n-gi>
            </n-grid>

            <!-- Address -->
            <n-divider title-placement="left">{{ t('verification.sectionAddress') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 3" :x-gap="16">
              <n-gi>
                <n-form-item :label="t('verification.addressPostal')">
                  <n-input v-model:value="form.addressPostal" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressRegion')">
                  <n-input v-model:value="form.addressRegion" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressCity')">
                  <n-input v-model:value="form.addressCity" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressDistrict')">
                  <n-input v-model:value="form.addressDistrict" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressStreet')">
                  <n-input v-model:value="form.addressStreet" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="t('verification.addressHouse')">
                  <n-input v-model:value="form.addressHouse" />
                </n-form-item>
              </n-gi>
            </n-grid>

            <!-- Banking -->
            <n-divider title-placement="left">{{ t('verification.sectionBanking') }}</n-divider>
            <n-grid :cols="isMobile ? 1 : 2" :x-gap="16">
              <n-gi :span="isMobile ? 1 : 2">
                <n-form-item :label="t('verification.bankName')">
                  <n-input v-model:value="form.bankName" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="countryConfig.company.banking.iban ? `IBAN (${countryConfig.company.banking.ibanPrefix}...)` : t('verification.bankAccount')">
                  <n-input v-model:value="form.bankAccount" :placeholder="countryConfig.company.banking.ibanPrefix ? `${countryConfig.company.banking.ibanPrefix}...` : ''" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item :label="countryConfig.company.banking.codeLabel">
                  <n-input v-model:value="form.bankCode" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="countryConfig.company.banking.swift">
                <n-form-item :label="t('verification.bankSwift')">
                  <n-input v-model:value="form.bankSwift" placeholder="AAAABBCCXXX" />
                </n-form-item>
              </n-gi>
              <n-gi v-if="countryConfig.company.banking.hasCorrAccount">
                <n-form-item :label="t('verification.bankCorrAccount')">
                  <n-input v-model:value="form.bankCorrAccount" placeholder="30101..." />
                </n-form-item>
              </n-gi>
            </n-grid>
          </template>

        </n-form>

        <div style="margin-top: 24px; display: flex; justify-content: space-between;">
          <n-button @click="step = 2">{{ t('common.back') }}</n-button>
          <UiSaveBtn :loading="saving" :label="t('verification.submit')" @click="handleSubmit" />
        </div>
      </div>

    </n-card>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { PersonOutline, BusinessOutline } from '@vicons/ionicons5'

definePageMeta({ layout: 'cabinet-client' })

const { t } = useI18n()
const { apiBase: API } = useApiBase()
const { getConfig, getLegalFormOptions, COUNTRY_LIST } = useCountryConfig()
const message = useMessage()

const step = ref(1)
const stepStatus = ref<'process' | 'finish' | 'error'>('process')
const selectedType = ref<'individual' | 'company' | null>(null)
const selectedCountry = ref<string | null>(null)
const saving = ref(false)
const formRef = ref()
const isMobile = ref(false)

const countryConfig = computed(() =>
  selectedCountry.value ? getConfig(selectedCountry.value) : null
)

const legalFormOptions = computed(() =>
  selectedCountry.value ? getLegalFormOptions(selectedCountry.value) : []
)

const form = reactive({
  // individual
  firstName: '', lastName: '', middleName: '',
  docNumber: '', phone: '',
  // company
  companyName: '', shortName: '', legalForm: null as string | null,
  taxId: '', regNumber: '', website: '', additionalEmail: '',
  bankName: '', bankAccount: '', bankCode: '', bankSwift: '', bankCorrAccount: '',
  // shared address
  addressPostal: '', addressRegion: '', addressCity: '',
  addressDistrict: '', addressStreet: '', addressHouse: '',
})

async function handleSubmit() {
  const cfg = countryConfig.value
  if (!cfg || !selectedType.value || !selectedCountry.value) return

  saving.value = true
  try {
    const body: Record<string, unknown> = {
      clientType: selectedType.value,
      countryCode: selectedCountry.value,
    }

    if (selectedType.value === 'individual') {
      body.individual = {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        middleName: cfg.hasPatronymic && form.middleName ? form.middleName : undefined,
        docType: cfg.individual.docType,
        docNumber: form.docNumber || undefined,
        phone: form.phone || undefined,
        addressPostal: form.addressPostal || undefined,
        addressRegion: form.addressRegion || undefined,
        addressCity: form.addressCity || undefined,
        addressDistrict: form.addressDistrict || undefined,
        addressStreet: form.addressStreet || undefined,
        addressHouse: form.addressHouse || undefined,
      }
    } else {
      body.company = {
        companyName: form.companyName,
        shortName: form.shortName || undefined,
        legalForm: form.legalForm || undefined,
        taxId: form.taxId || undefined,
        regNumber: form.regNumber || undefined,
        website: form.website || undefined,
        phone: form.phone || undefined,
        additionalEmail: form.additionalEmail || undefined,
        bankName: form.bankName || undefined,
        bankAccount: form.bankAccount || undefined,
        bankCode: form.bankCode || undefined,
        bankSwift: cfg.company.banking.swift ? (form.bankSwift || undefined) : undefined,
        bankCorrAccount: cfg.company.banking.hasCorrAccount ? (form.bankCorrAccount || undefined) : undefined,
        addressPostal: form.addressPostal || undefined,
        addressRegion: form.addressRegion || undefined,
        addressCity: form.addressCity || undefined,
        addressDistrict: form.addressDistrict || undefined,
        addressStreet: form.addressStreet || undefined,
        addressHouse: form.addressHouse || undefined,
      }
    }

    await $fetch(`${API}/cabinet/client/profile`, {
      method: 'POST',
      credentials: 'include',
      body,
    })

    message.success(t('verification.submitSuccess'))
    navigateTo('/cabinet/client?profile_created=true')
  } catch (e: any) {
    if (e?.data?.error === 'profile_already_exists') {
      message.warning(t('verification.profileExists'))
      navigateTo('/cabinet/client')
    } else {
      message.error(e?.data?.message ?? t('common.error'))
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.type-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.type-card:hover {
  border-color: #ff8e71;
  background: #fff8f6;
}
.type-card.selected {
  border-color: #ff6b4a;
  background: #fff3f0;
  box-shadow: 0 0 0 3px rgba(255,107,74,0.15);
}
.type-card-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 6px;
}
.type-card-desc {
  font-size: 13px;
  color: #888;
}

.country-card {
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.country-card:hover {
  border-color: #ff8e71;
  background: #fff8f6;
}
.country-card.selected {
  border-color: #ff6b4a;
  background: #fff3f0;
}
.country-flag {
  font-size: 28px;
  margin-bottom: 6px;
}
.country-name {
  font-size: 12px;
  color: #555;
  line-height: 1.3;
}
</style>
