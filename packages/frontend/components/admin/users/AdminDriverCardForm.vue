<template>
  <div class="admin-driver-card-form">
    <n-alert v-if="loadError" type="error" class="mb-16">
      {{ loadError }}
      <n-button size="small" style="margin-top: 8px" @click="loadProfile">{{ t('common.retry') }}</n-button>
    </n-alert>

    <n-spin v-else :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-form
          v-if="!loadError"
          ref="formRef"
          :model="form"
          label-placement="left"
          label-width="240"
          label-align="left"
          class="v2-form"
        >
          <!-- 1. Основная информация -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section1') }}</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <n-form-item>
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:driver_id')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:driver_id') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:driver_id') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.driverId') }}</span>
                  </n-space>
                </template>
                <n-text depth="3">{{ form.id || t('driver.card.generatedBySystem') }}</n-text>
              </n-form-item>

              <n-form-item required path="surname">
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:surname')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:surname') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:surname') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.changeRequests.fieldSurname') }}</span>
                  </n-space>
                </template>
                <n-input v-model:value="form.surname" :placeholder="t('admin.driverCardForm.placeholderSurname')" />
              </n-form-item>

              <n-form-item required path="given_name">
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:given_name')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:given_name') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:given_name') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.changeRequests.fieldGivenName') }}</span>
                  </n-space>
                </template>
                <n-input v-model:value="form.given_name" :placeholder="t('admin.driverCardForm.placeholderGivenName')" />
              </n-form-item>

              <n-form-item path="patronymic">
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:patronymic')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:patronymic') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:patronymic') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.changeRequests.fieldPatronymic') }}</span>
                  </n-space>
                </template>
                <n-input v-model:value="form.patronymic" :placeholder="t('admin.driverCardForm.placeholderPatronymic')" />
              </n-form-item>

              <n-form-item required path="date_of_birth">
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:date_of_birth')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:date_of_birth') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:date_of_birth') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.changeRequests.fieldDateOfBirth') }}</span>
                  </n-space>
                </template>
                <n-date-picker
                  :value="dateOnlyToPickerMs(form.date_of_birth)"
                  type="date"
                  clearable
                  @update:value="(v) => { form.date_of_birth = v ? formatDateOnlyFromMs(v) : null }"
                />
              </n-form-item>

              <n-form-item required>
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:citizenships')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:citizenships') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:citizenships') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.citizenship') }}</span>
                  </n-space>
                </template>
                <n-space vertical style="width: 100%">
                  <n-space v-for="(c, i) in form.citizenships" :key="i" align="center">
                    <n-select
                      v-model:value="form.citizenships[i]"
                      :options="citizenshipOptions"
                      filterable
                      tag
                      style="width: 200px"
                    />
                    <n-button v-if="i > 0" quaternary circle type="error" @click="form.citizenships.splice(i, 1)">×</n-button>
                  </n-space>
                  <n-button quaternary size="small" type="primary" @click="form.citizenships.push('')">{{ t('admin.driverCardForm.add') }}</n-button>
                </n-space>
              </n-form-item>

              <n-form-item required path="gender">
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:gender')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:gender') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:gender') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.gender') }}</span>
                  </n-space>
                </template>
                <n-radio-group v-model:value="form.gender">
                  <n-space>
                    <n-radio value="male">{{ t('driver.card.male') }}</n-radio>
                    <n-radio value="female">{{ t('driver.card.female') }}</n-radio>
                  </n-space>
                </n-radio-group>
              </n-form-item>

              <n-form-item required>
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:phones')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:phones') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:phones') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.contactPhone') }}</span>
                  </n-space>
                </template>
                <n-space vertical style="width: 100%">
                  <n-space v-for="(p, i) in form.phones" :key="i" align="center">
                    <n-input v-model:value="form.phones[i]" :placeholder="t('admin.driverCardForm.placeholderPhone')" style="width: 200px" />
                    <n-button v-if="i > 0" quaternary circle type="error" @click="form.phones.splice(i, 1)">×</n-button>
                  </n-space>
                  <n-button quaternary size="small" type="primary" @click="form.phones.push('')">{{ t('admin.driverCardForm.add') }}</n-button>
                </n-space>
              </n-form-item>

              <n-form-item required>
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:emails')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:emails') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:emails') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.emailLogin') }}</span>
                  </n-space>
                </template>
                <n-space vertical style="width: 100%">
                  <n-input :value="form.email" disabled style="width: 300px" />
                  <n-space v-for="(e, i) in form.extra_emails" :key="i" align="center">
                    <n-input v-model:value="form.extra_emails[i]" :placeholder="t('admin.driverCardForm.placeholderEmail')" style="width: 200px" />
                    <n-button quaternary circle type="error" @click="form.extra_emails.splice(i, 1)">×</n-button>
                  </n-space>
                  <n-button quaternary size="small" type="primary" @click="form.extra_emails.push('')">{{ t('admin.driverCardForm.add') }}</n-button>
                </n-space>
              </n-form-item>

              <n-form-item>
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:status')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:status') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:status') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.statusDispatcher') }}</span>
                  </n-space>
                </template>
                <n-select v-model:value="form.status" :options="statusOptions" style="width: 200px" />
              </n-form-item>

              <n-form-item>
                <template #label>
                  <n-space align="center">
                    <n-tooltip>
                      <template #trigger>
                        <n-button quaternary circle size="tiny" @click="toggleHidden('main:employment_category')">
                          <template #icon>
                            <n-icon><component :is="isHidden('main:employment_category') ? EyeOffOutline : EyeOutline" /></n-icon>
                          </template>
                        </n-button>
                      </template>
                      {{ isHidden('main:employment_category') ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                    </n-tooltip>
                    <span>{{ t('driver.card.employmentCategory') }}</span>
                  </n-space>
                </template>
                <n-select v-model:value="form.employment_category" :options="employmentOptions" style="width: 200px" />
              </n-form-item>

              <n-form-item :label="t('admin.company')">
                <n-input v-model:value="form.company_name" :placeholder="t('admin.driverCardForm.placeholderCompany')" />
              </n-form-item>

              <n-form-item :label="t('admin.inn')">
                <n-input v-model:value="form.inn" :placeholder="t('admin.driverCardForm.placeholderInn')" />
              </n-form-item>

              <n-form-item :label="t('admin.address')">
                <n-input v-model:value="form.address" type="textarea" :placeholder="t('admin.driverCardForm.placeholderAddress')" />
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 2. Паспортные данные -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section2') }}</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <template v-for="(p, pi) in passportsList" :key="p._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`passport:${pi}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`passport:${pi}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`passport:${pi}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.passportN', { n: pi + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.card.passportSeriesNumber')}${pi > 0 ? ` (${pi + 1})` : ''}`" :required="pi === 0">
                  <n-space align="center">
                    <n-input v-model:value="p.series" placeholder="AB" style="width: 80px" />
                    <n-input v-model:value="p.number" placeholder="123456" style="width: 160px" />
                    <n-button v-if="pi > 0" quaternary circle type="error" @click="removePassport(pi)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.validityDates')" :required="pi === 0">
                  <n-space align="center">
                    <n-date-picker
                      :value="dateOnlyToPickerMs(p.issued_at)"
                      type="date"
                      :placeholder="t('driver.documents.issueDate')"
                      @update:value="(v) => { p.issued_at = v ? formatDateOnlyFromMs(v) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="dateOnlyToPickerMs(p.expires_at)"
                      type="date"
                      :placeholder="t('driver.documents.expiryDate')"
                      @update:value="(v) => { p.expires_at = v ? formatDateOnlyFromMs(v) : null }"
                    />
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.passportIssuedBy')" :required="pi === 0">
                  <n-input v-model:value="p.issued_by" :placeholder="t('admin.driverCardForm.placeholderIssuedBy')" />
                </n-form-item>
                <n-form-item :label="t('driver.card.placeOfBirth')" :required="pi === 0">
                  <n-input v-model:value="p.place_of_birth" :placeholder="t('admin.driverCardForm.placeholderPlaceOfBirth')" />
                </n-form-item>
                <n-form-item :label="t('driver.card.residentialAddress')" :required="pi === 0">
                  <n-input v-model:value="p.residential_address" :placeholder="t('admin.driverCardForm.placeholderResidentialAddress')" />
                </n-form-item>
                <n-form-item :label="t('driver.card.passportScan')" :required="pi === 0">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handlePassportScanUpload(o, p)" :show-file-list="false">
                      <n-button size="small">{{ p.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="p.scan_url" text type="primary" size="small" @click="openScan(p.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addPassport">{{ t('admin.driverCardForm.addPassport') }}</n-button>
            </n-space>
          </n-card>

          <!-- 3. Водительское удостоверение -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section3') }}</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <template v-for="(lic, li) in licensesList" :key="lic._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`license:${li}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`license:${li}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`license:${li}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.licenseN', { n: li + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.card.licenseNumber')}${li > 0 ? ` (${li + 1})` : ''}`" :required="li === 0">
                  <n-space align="center">
                    <n-input v-model:value="lic.number" placeholder="tm-123456" style="width: 240px" />
                    <n-button v-if="li > 0" quaternary circle type="error" @click="removeLicense(li)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.licenseCategories')" :required="li === 0">
                  <n-checkbox-group v-model:value="lic.license_categories_arr">
                    <n-space>
                      <n-checkbox v-for="c in licenseCategories" :key="c.value" :value="c.value" :label="c.label" />
                    </n-space>
                  </n-checkbox-group>
                </n-form-item>
                <n-form-item :label="t('driver.card.licenseValidityDates')" :required="li === 0">
                  <n-space align="center">
                    <n-date-picker
                      :value="dateOnlyToPickerMs(lic.issued_at)"
                      type="date"
                      :placeholder="t('driver.documents.issueDate')"
                      @update:value="(v) => { lic.issued_at = v ? formatDateOnlyFromMs(v) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="dateOnlyToPickerMs(lic.expires_at)"
                      type="date"
                      :placeholder="t('driver.documents.expiryDate')"
                      @update:value="(v) => { lic.expires_at = v ? formatDateOnlyFromMs(v) : null }"
                    />
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.adrIssuedBy')">
                  <n-input v-model:value="lic.issued_by" :placeholder="t('admin.driverCardForm.placeholderLicenseIssuedBy')" />
                </n-form-item>
                <n-form-item :label="t('driver.card.licenseScan')" :required="li === 0">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleLicenseScanUpload(o, lic)" :show-file-list="false">
                      <n-button size="small">{{ lic.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="lic.scan_url" text type="primary" size="small" @click="openScan(lic.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addLicense">{{ t('admin.driverCardForm.addLicense') }}</n-button>

              <n-form-item :label="t('driver.card.internationalLicense')" class="mt-16">
                <n-space vertical style="width: 100%">
                  <n-radio-group v-model:value="form.has_international_license">
                    <n-space>
                      <n-radio :value="true">{{ t('common.yes') }}</n-radio>
                      <n-radio :value="false">{{ t('common.no') }}</n-radio>
                    </n-space>
                  </n-radio-group>
                  <template v-if="form.has_international_license">
                    <n-space vertical size="small" class="mt-8">
                      <n-form-item :label="t('driver.card.intlLicenseNumber')" label-placement="left" label-width="120">
                        <n-input v-model:value="form.international_license_number" placeholder="INT-789456" />
                      </n-form-item>
                      <n-form-item :label="t('driver.card.intlLicenseValidity')" label-placement="left" label-width="120">
                        <n-input v-model:value="form.international_license_validity" placeholder="2022-2027" />
                      </n-form-item>
                    </n-space>
                  </template>
                </n-space>
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 4. Разрешительные документы (виза, медсправка, техминимум, тахограф, ADR) -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section4') }}</n-h3>
          <n-card embedded :bordered="false" class="mb-24">
            <n-space vertical size="large">
              <template v-for="(v, vi) in visasList" :key="v._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`visa:${vi}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`visa:${vi}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`visa:${vi}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.visaN', { n: vi + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.card.visaIssueCountry')}${vi > 0 ? ` (${vi + 1})` : ''}`">
                  <n-space align="center">
                    <n-select
                      v-model:value="v.country"
                      :options="visaCountryOptions"
                      filterable
                      :placeholder="t('driver.card.selectCountry')"
                      style="width: 240px"
                    />
                    <n-button v-if="vi > 0" quaternary circle type="error" @click="removeVisa(vi)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.visaNumber')">
                  <n-input v-model:value="v.number" placeholder="1234567" style="width: 200px" />
                </n-form-item>
                <n-form-item :label="t('driver.card.visaDateRange')">
                  <n-space align="center">
                    <n-date-picker
                      :value="dateOnlyToPickerMs(v.issued_at)"
                      type="date"
                      :placeholder="t('driver.documents.startDate')"
                      @update:value="(val) => { v.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                    />
                    <n-text depth="3">—</n-text>
                    <n-date-picker
                      :value="dateOnlyToPickerMs(v.expires_at)"
                      type="date"
                      :placeholder="t('driver.documents.expiryDate')"
                      @update:value="(val) => { v.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                    />
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.scanVisa')">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleVisaScanUpload(o, v)" :show-file-list="false">
                      <n-button size="small">{{ v.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="v.scan_url" text type="primary" size="small" @click="openScan(v.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addVisa">{{ t('admin.driverCardForm.addVisa') }}</n-button>

              <template v-for="(m, mi) in medicalCertificatesList" :key="m._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`medical:${mi}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`medical:${mi}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`medical:${mi}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.medicalCertN', { n: mi + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.documents.medicalNum')}${mi > 0 ? ` (${mi + 1})` : ''}`">
                  <n-space align="center">
                    <n-input v-model:value="m.number" placeholder="№ 12345" style="width: 200px" />
                    <n-button v-if="mi > 0" quaternary circle type="error" @click="removeMedicalCertificate(mi)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.documents.issueDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(m.issued_at)"
                    type="date"
                    :placeholder="t('driver.documents.issueDate')"
                    @update:value="(val) => { m.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.expiryDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(m.expires_at)"
                    type="date"
                    :placeholder="t('driver.documents.expiryDate')"
                    @update:value="(val) => { m.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.card.scanMedical')">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleMedicalCertificateScanUpload(o, m)" :show-file-list="false">
                      <n-button size="small">{{ m.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="m.scan_url" text type="primary" size="small" @click="openScan(m.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addMedicalCertificate">{{ t('admin.driverCardForm.addMedicalCert') }}</n-button>

              <template v-for="(tm, tmi) in technicalMinimumCertsList" :key="tm._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`tech_min:${tmi}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`tech_min:${tmi}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`tech_min:${tmi}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.techMinCertN', { n: tmi + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.card.techMinInstitution')}${tmi > 0 ? ` (${tmi + 1})` : ''}`">
                  <n-space align="center">
                    <n-input v-model:value="tm.issued_by" :placeholder="t('driver.documents.techMinInstitution')" style="width: 280px" />
                    <n-button v-if="tmi > 0" quaternary circle type="error" @click="removeTechnicalMinimumCert(tmi)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.certNumber')">
                  <n-input v-model:value="tm.number" placeholder="№ TM-2025-0098" style="width: 200px" />
                </n-form-item>
                <n-form-item :label="t('driver.documents.receiptDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(tm.issued_at)"
                    type="date"
                    :placeholder="t('driver.documents.receiptDate')"
                    @update:value="(val) => { tm.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.expiryDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(tm.expires_at)"
                    type="date"
                    :placeholder="t('driver.documents.expiryDate')"
                    @update:value="(val) => { tm.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.docScan')">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleTechnicalMinimumCertScanUpload(o, tm)" :show-file-list="false">
                      <n-button size="small">{{ tm.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="tm.scan_url" text type="primary" size="small" @click="openScan(tm.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addTechnicalMinimumCert">{{ t('admin.driverCardForm.addTechMinCert') }}</n-button>

              <template v-for="(tc, ti) in tachographCardsList" :key="tc._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`tachograph:${ti}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`tachograph:${ti}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`tachograph:${ti}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.tachographCardN', { n: ti + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.card.tachographNumber')}${ti > 0 ? ` (${ti + 1})` : ''}`">
                  <n-space align="center">
                    <n-input v-model:value="tc.number" placeholder="№ TK-567890" style="width: 200px" />
                    <n-button v-if="ti > 0" quaternary circle type="error" @click="removeTachographCard(ti)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.visaIssueCountry')">
                  <n-select v-model:value="tc.country" :options="visaCountryOptions" filterable :placeholder="t('driver.card.selectCountry')" style="width: 240px" />
                </n-form-item>
                <n-form-item :label="t('driver.documents.issueDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(tc.issued_at)"
                    type="date"
                    :placeholder="t('driver.documents.issueDate')"
                    @update:value="(val) => { tc.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.expiryDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(tc.expires_at)"
                    type="date"
                    :placeholder="t('driver.documents.expiryDate')"
                    @update:value="(val) => { tc.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.docScan')">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleTachographCardScanUpload(o, tc)" :show-file-list="false">
                      <n-button size="small">{{ tc.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="tc.scan_url" text type="primary" size="small" @click="openScan(tc.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addTachographCard">{{ t('admin.driverCardForm.addTachographCard') }}</n-button>

              <template v-for="(a, ai) in adrCertsList" :key="a._key">
                <div class="section-header">
                  <n-tooltip>
                    <template #trigger>
                      <n-button quaternary circle size="tiny" @click="toggleHidden(`adr:${ai}`)">
                        <template #icon>
                          <n-icon><component :is="isHidden(`adr:${ai}`) ? EyeOffOutline : EyeOutline" /></n-icon>
                        </template>
                      </n-button>
                    </template>
                    {{ isHidden(`adr:${ai}`) ? t('admin.driverCardForm.showInCard') : t('admin.driverCardForm.hideInCard') }}
                  </n-tooltip>
                  <span>{{ t('admin.driverCardForm.adrCertN', { n: ai + 1 }) }}</span>
                </div>
                <n-form-item :label="`${t('driver.card.adrIssuedBy')}${ai > 0 ? ` (${ai + 1})` : ''}`">
                  <n-space align="center">
                    <n-input v-model:value="a.issued_by" :placeholder="t('admin.driverCardForm.placeholderAdrIssuedBy')" style="width: 280px" />
                    <n-button v-if="ai > 0" quaternary circle type="error" @click="removeAdrCert(ai)">×</n-button>
                  </n-space>
                </n-form-item>
                <n-form-item :label="t('driver.card.adrCertNumber')">
                  <n-input v-model:value="a.number" placeholder="№ ADR-2025-001" style="width: 200px" />
                </n-form-item>
                <n-form-item :label="t('driver.card.adrAllowedClasses')">
                  <n-checkbox-group v-model:value="a.allowed_classes">
                    <n-space vertical size="small">
                      <n-checkbox v-for="c in adrClasses" :key="c.value" :value="c.value" :label="t('adrClasses.' + c.value)" />
                    </n-space>
                  </n-checkbox-group>
                </n-form-item>
                <n-form-item :label="t('driver.documents.issueDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(a.issued_at)"
                    type="date"
                    :placeholder="t('driver.documents.issueDate')"
                    @update:value="(val) => { a.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.expiryDate')">
                  <n-date-picker
                    :value="dateOnlyToPickerMs(a.expires_at)"
                    type="date"
                    :placeholder="t('driver.documents.expiryDate')"
                    @update:value="(val) => { a.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-form-item>
                <n-form-item :label="t('driver.documents.docScan')">
                  <n-space align="center">
                    <n-upload :max="1" :custom-request="(o) => handleAdrCertScanUpload(o, a)" :show-file-list="false">
                      <n-button size="small">{{ a.scan_url ? t('admin.driverCardForm.replaceFile') : t('admin.driverCardForm.uploadFile') }}</n-button>
                    </n-upload>
                    <n-button v-if="a.scan_url" text type="primary" size="small" @click="openScan(a.scan_url)">
                      {{ t('admin.driverCardForm.viewScan') }}
                    </n-button>
                  </n-space>
                </n-form-item>
              </template>
              <n-button quaternary type="primary" size="small" @click="addAdrCert">{{ t('admin.driverCardForm.addAdrCert') }}</n-button>

              <n-divider style="margin: 24px 0 16px;">{{ t('admin.driverCardForm.otherDocuments') }}</n-divider>
              <n-form-item :label="t('driver.card.otherPermits')">
                <n-input v-model:value="form.other_permits" type="textarea" :placeholder="t('admin.driverCardForm.placeholderOtherPermits')" />
              </n-form-item>

              <n-form-item :label="t('driver.card.hireSource')">
                <n-select v-model:value="form.hire_source" :options="hireSourceOptions" style="width: 240px" />
              </n-form-item>

              <n-form-item :label="t('admin.driverCardForm.bankDetails')">
                <n-space vertical style="width: 100%">
                  <n-input v-model:value="form.bank_name" :placeholder="t('admin.driverCardForm.bankName')" />
                  <n-input v-model:value="form.bank_account" :placeholder="t('admin.driverCardForm.bankAccount')" />
                  <n-input v-model:value="form.bank_bik" :placeholder="t('admin.driverCardForm.bankBik')" />
                </n-space>
              </n-form-item>

              <n-form-item :label="t('admin.lastUpdateDate')">
                <n-text depth="3">{{ form.updated_at || t('admin.autoBySystem') }}</n-text>
              </n-form-item>
            </n-space>
          </n-card>

          <!-- Actions -->
          <div class="form-actions mt-24">
            <n-space justify="end">
              <UiSaveBtn :loading="saving" @click="handleSave" />
            </n-space>
          </div>
        </n-form>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import {
  NForm, NFormItem, NInput, NCard, NSpace, NButton, NSelect, NDatePicker,
  NUpload, NTag, NText, NRadioGroup, NRadio, NCheckboxGroup, NCheckbox,
  NSpin, NH3, NDivider, NSwitch, useMessage, NIcon, NTooltip
} from 'naive-ui'

const { t } = useI18n()
import { EyeOutline, EyeOffOutline } from '@vicons/ionicons5'
import { citizenships, visaCountries, adrClasses, licenseCategories } from '@tmgo/shared'

const route = useRoute()
const props = defineProps<{
  loadUrl: string
  saveUrl: string
  apiBase: string
  initialProfile?: any
}>()

const userId = computed(() => String(route.params.id || ''))
const documentsBaseUrl = computed(() => `${props.apiBase}/admin/users/${userId.value}/documents`)

const emit = defineEmits<{ saved: [] }>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const loadError = ref<string | null>(null)
const formRef = ref<InstanceType<typeof NForm> | null>(null)

const citizenshipOptions = computed(() =>
  citizenships.map(c => ({ label: c, value: c }))
)

const visaCountryOptions = computed(() =>
  visaCountries.map(c => ({ label: c, value: c }))
)


const statusOptions = computed(() => [
  { label: t('driver.card.statusActive'), value: 'active' },
  { label: t('driver.card.statusOnLeave'), value: 'on_leave' },
  { label: t('driver.card.statusFired'), value: 'fired' }
])

const employmentOptions = computed(() => [
  { label: t('driver.card.employmentFullTime'), value: 'full_time' },
  { label: t('driver.card.employmentFreelance'), value: 'freelance' },
  { label: t('driver.card.employmentLeased'), value: 'leased' }
])

const hireSourceOptions = computed(() => [
  { label: t('driver.card.hireSourceRecommendation'), value: 'recommendation' },
  { label: t('driver.card.hireSourceAdvertisement'), value: 'advertisement' },
  { label: t('driver.card.hireSourceAgency'), value: 'agency' }
])

const uploadBaseUrl = computed(() => props.saveUrl)

const form = reactive({
  id: '',
  surname: '',
  given_name: '',
  patronymic: '',
  date_of_birth: null as string | null,
  citizenships: [''] as string[],
  gender: 'male' as 'male' | 'female',
  phones: [''] as string[],
  email: '',
  extra_emails: [] as string[],
  status: 'active',
  employment_category: 'freelance',
  company_name: '',
  inn: '',
  address: '',

  passport_series: '',
  passport_number: '',
  passport_issue_date: null as string | null,
  passport_expiry_date: null as string | null,
  passport_issued_by: '',
  place_of_birth: '',
  residential_address: '',
  passport_scan_url: '',
  passport_is_active: true,
  extra_passports: [] as Array<{
    passport_series?: string
    passport_number?: string
    passport_issue_date?: string | null
    passport_expiry_date?: string | null
    passport_issued_by?: string
    place_of_birth?: string
    residential_address?: string
    passport_scan_url?: string
    is_active?: boolean
  }>,

  license_number: '',
  license_categories_arr: [] as string[],
  license_issue_date: null as string | null,
  license_expiry: null as string | null,
  license_issued_by: '',
  license_scan_url: '',
  has_international_license: false,
  international_license_number: '',
  international_license_validity: '',

  permission_entry_zone: '',
  permission_issue_date: null as string | null,
  permission_validity_date: null as string | null,
  medical_certificate: '',
  last_medical_examination_date: null as string | null,
  technical_minimum_certificate: '',
  tachograph_card_number: '',
  other_permits: '',
  hire_source: 'recommendation',
  medical_certificate_scan_url: '',
  bank_name: '',
  bank_account: '',
  bank_bik: '',
  updated_at: '',
  hidden_fields: [] as string[]
})

const profileData = ref<Record<string, any> | null>(null)

function isHidden(key: string) {
  return (form.hidden_fields || []).includes(key)
}
function toggleHidden(key: string) {
  const arr = [...(form.hidden_fields || [])]
  const i = arr.indexOf(key)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(key)
  form.hidden_fields = arr
}

type PassportItem = {
  _key: string
  _source: 'main' | 'extra' | 'doc' | 'new'
  _docId?: string
  series: string
  number: string
  issued_at: string | null
  expires_at: string | null
  issued_by: string
  place_of_birth: string
  residential_address: string
  scan_url: string
}

type LicenseItem = {
  _key: string
  _source: 'main' | 'doc' | 'new'
  _docId?: string
  number: string
  license_categories: string
  license_categories_arr: string[]
  issued_at: string | null
  expires_at: string | null
  issued_by: string
  scan_url: string
}

type VisaItem = {
  _key: string
  _source: 'doc' | 'new'
  _docId?: string
  country: string
  number: string
  issued_at: string | null
  expires_at: string | null
  scan_url: string
}

type MedicalCertificateItem = {
  _key: string
  _source: 'doc' | 'new'
  _docId?: string
  number: string
  issued_at: string | null
  expires_at: string | null
  scan_url: string
}

type TachographCardItem = {
  _key: string
  _source: 'doc' | 'new'
  _docId?: string
  number: string
  country: string
  issued_at: string | null
  expires_at: string | null
  scan_url: string
}

type TechnicalMinimumCertItem = {
  _key: string
  _source: 'doc' | 'new'
  _docId?: string
  issued_by: string
  number: string
  issued_at: string | null
  expires_at: string | null
  scan_url: string
}

type AdrCertItem = {
  _key: string
  _source: 'doc' | 'new'
  _docId?: string
  issued_by: string
  number: string
  allowed_classes: string[]
  issued_at: string | null
  expires_at: string | null
  scan_url: string
}

const passportsList = ref<PassportItem[]>([])
const licensesList = ref<LicenseItem[]>([])
const visasList = ref<VisaItem[]>([])
const medicalCertificatesList = ref<MedicalCertificateItem[]>([])
const tachographCardsList = ref<TachographCardItem[]>([])
const technicalMinimumCertsList = ref<TechnicalMinimumCertItem[]>([])
const adrCertsList = ref<AdrCertItem[]>([])

function addPassport() {
  passportsList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    series: '',
    number: '',
    issued_at: null,
    expires_at: null,
    issued_by: '',
    place_of_birth: '',
    residential_address: '',
    scan_url: ''
  })
}

async function removePassport(idx: number) {
  const p = passportsList.value[idx]
  if (p._source === 'doc' && p._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${p._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  passportsList.value.splice(idx, 1)
}

function addLicense() {
  licensesList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    number: '',
    license_categories: '',
    license_categories_arr: [],
    issued_at: null,
    expires_at: null,
    issued_by: '',
    scan_url: ''
  })
}

async function removeLicense(idx: number) {
  const lic = licensesList.value[idx]
  if (lic._source === 'doc' && lic._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${lic._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  licensesList.value.splice(idx, 1)
}

function addVisa() {
  visasList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    country: '',
    number: '',
    issued_at: null,
    expires_at: null,
    scan_url: ''
  })
}

async function removeVisa(idx: number) {
  const v = visasList.value[idx]
  if (v._source === 'doc' && v._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${v._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  visasList.value.splice(idx, 1)
}

function addMedicalCertificate() {
  medicalCertificatesList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    number: '',
    issued_at: null,
    expires_at: null,
    scan_url: ''
  })
}

async function removeMedicalCertificate(idx: number) {
  const m = medicalCertificatesList.value[idx]
  if (m._source === 'doc' && m._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${m._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  medicalCertificatesList.value.splice(idx, 1)
}

function addTachographCard() {
  tachographCardsList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    number: '',
    country: '',
    issued_at: null,
    expires_at: null,
    scan_url: ''
  })
}

function addTechnicalMinimumCert() {
  technicalMinimumCertsList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    issued_by: '',
    number: '',
    issued_at: null,
    expires_at: null,
    scan_url: ''
  })
}

async function removeTechnicalMinimumCert(idx: number) {
  const tm = technicalMinimumCertsList.value[idx]
  if (tm._source === 'doc' && tm._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${tm._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  technicalMinimumCertsList.value.splice(idx, 1)
}

function addAdrCert() {
  adrCertsList.value.push({
    _key: `new-${Date.now()}`,
    _source: 'new',
    issued_by: '',
    number: '',
    allowed_classes: [],
    issued_at: null,
    expires_at: null,
    scan_url: ''
  })
}

async function removeAdrCert(idx: number) {
  const a = adrCertsList.value[idx]
  if (a._source === 'doc' && a._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${a._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  adrCertsList.value.splice(idx, 1)
}

async function removeTachographCard(idx: number) {
  const t = tachographCardsList.value[idx]
  if (t._source === 'doc' && t._docId) {
    try {
      await $fetch(`${documentsBaseUrl.value}/${t._docId}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: any) {
      message.error(e?.data?.error || t('admin.driverCardForm.deleteError'))
      return
    }
  }
  tachographCardsList.value.splice(idx, 1)
}

function openScan(url: string) {
  const fullUrl = url.startsWith('http') ? url : `${props.apiBase}${url}`
  window.open(fullUrl, '_blank')
}

function buildPassportsList(data: Record<string, any>): PassportItem[] {
  const seen = new Set<string>()
  const key = (s: string, n: string) => `${(s || '').trim().toUpperCase()}_${(n || '').trim()}`
  const list: PassportItem[] = []

  const main: PassportItem = {
    _key: 'main',
    _source: 'main',
    series: data.passport_series ?? '',
    number: data.passport_number ?? '',
    issued_at: data.passport_issue_date ?? null,
    expires_at: data.passport_expiry_date ?? null,
    issued_by: data.passport_issued_by ?? '',
    place_of_birth: data.place_of_birth ?? '',
    residential_address: data.residential_address ?? '',
    scan_url: data.passport_scan_url ?? ''
  }
  list.push(main)
  seen.add(key(main.series, main.number))

  const extra = Array.isArray(data.extra_passports) ? data.extra_passports : []
  for (let i = 0; i < extra.length; i++) {
    const p = extra[i]
    const s = p.passport_series ?? p.passportSeries ?? ''
    const n = p.passport_number ?? p.passportNumber ?? ''
    if (seen.has(key(s, n))) continue
    seen.add(key(s, n))
    list.push({
      _key: `extra-${i}`,
      _source: 'extra',
      series: s,
      number: n,
      issued_at: p.passport_issue_date ?? p.passportIssueDate ?? null,
      expires_at: p.passport_expiry_date ?? p.passportExpiryDate ?? null,
      issued_by: p.passport_issued_by ?? p.passportIssuedBy ?? '',
      place_of_birth: p.place_of_birth ?? p.placeOfBirth ?? '',
      residential_address: p.residential_address ?? p.residentialAddress ?? '',
      scan_url: p.passport_scan_url ?? p.passportScanUrl ?? ''
    })
  }

  const docs = Array.isArray(data.passports_from_documents) ? data.passports_from_documents : []
  for (const d of docs) {
    const s = d.series ?? ''
    const n = d.number ?? ''
    if (seen.has(key(s, n))) continue
    seen.add(key(s, n))
    list.push({
      _key: `doc-${d.id}`,
      _source: 'doc',
      _docId: d.id,
      series: s,
      number: n,
      issued_at: d.issued_at ?? null,
      expires_at: d.expires_at ?? null,
      issued_by: d.issued_by ?? '',
      place_of_birth: d.place_of_birth ?? '',
      residential_address: d.residential_address ?? '',
      scan_url: d.scan_url ?? ''
    })
  }
  return list
}

function buildLicensesList(data: Record<string, any>): LicenseItem[] {
  const seen = new Set<string>()
  const list: LicenseItem[] = []

  const mainCat = data.license_categories ?? ''
  const mainArr = mainCat ? mainCat.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  const main: LicenseItem = {
    _key: 'main',
    _source: 'main',
    number: data.license_number ?? '',
    license_categories: mainCat,
    license_categories_arr: mainArr,
    issued_at: data.license_issue_date ?? null,
    expires_at: data.license_expiry ?? null,
    issued_by: data.license_issued_by ?? '',
    scan_url: data.license_scan_url ?? ''
  }
  list.push(main)
  if (main.number) seen.add((main.number || '').trim())

  const docs = Array.isArray(data.licenses_from_documents) ? data.licenses_from_documents : []
  for (const d of docs) {
    const n = (d.number ?? '').trim()
    if (n && seen.has(n)) continue
    if (n) seen.add(n)
    const cat = d.license_categories ?? ''
    const arr = cat ? cat.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    list.push({
      _key: `doc-${d.id}`,
      _source: 'doc',
      _docId: d.id,
      number: d.number ?? '',
      license_categories: cat,
      license_categories_arr: arr,
      issued_at: d.issued_at ?? null,
      expires_at: d.expires_at ?? null,
      issued_by: d.issued_by ?? '',
      scan_url: d.scan_url ?? ''
    })
  }
  return list
}

function buildVisasList(data: Record<string, any>): VisaItem[] {
  const docs = Array.isArray(data.visas_from_documents) ? data.visas_from_documents : []
  if (docs.length === 0) {
    return [{
      _key: 'new-0',
      _source: 'new',
      country: '',
      number: '',
      issued_at: null,
      expires_at: null,
      scan_url: ''
    }]
  }
  return docs.map((d: any) => ({
    _key: `doc-${d.id}`,
    _source: 'doc' as const,
    _docId: d.id,
    country: d.country ?? '',
    number: d.number ?? '',
    issued_at: d.issued_at ?? null,
    expires_at: d.expires_at ?? null,
    scan_url: d.scan_url ?? ''
  }))
}

function buildMedicalCertificatesList(data: Record<string, any>): MedicalCertificateItem[] {
  const docs = Array.isArray(data.medical_certificates_from_documents) ? data.medical_certificates_from_documents : []
  if (docs.length === 0) {
    return [{
      _key: 'new-0',
      _source: 'new',
      number: '',
      issued_at: null,
      expires_at: null,
      scan_url: ''
    }]
  }
  return docs.map((d: any) => ({
    _key: `doc-${d.id}`,
    _source: 'doc' as const,
    _docId: d.id,
    number: d.number ?? '',
    issued_at: d.issued_at ?? null,
    expires_at: d.expires_at ?? null,
    scan_url: d.scan_url ?? ''
  }))
}

function buildTachographCardsList(data: Record<string, any>): TachographCardItem[] {
  const docs = Array.isArray(data.tachograph_cards_from_documents) ? data.tachograph_cards_from_documents : []
  if (docs.length === 0) {
    return [{ _key: 'new-0', _source: 'new', number: '', country: '', issued_at: null, expires_at: null, scan_url: '' }]
  }
  return docs.map((d: any) => ({
    _key: `doc-${d.id}`,
    _source: 'doc' as const,
    _docId: d.id,
    number: d.number ?? '',
    country: d.country ?? '',
    issued_at: d.issued_at ?? null,
    expires_at: d.expires_at ?? null,
    scan_url: d.scan_url ?? ''
  }))
}

function buildTechnicalMinimumCertsList(data: Record<string, any>): TechnicalMinimumCertItem[] {
  const docs = Array.isArray(data.technical_minimum_certs_from_documents) ? data.technical_minimum_certs_from_documents : []
  if (docs.length === 0) {
    return [{
      _key: 'new-0',
      _source: 'new',
      issued_by: '',
      number: '',
      issued_at: null,
      expires_at: null,
      scan_url: ''
    }]
  }
  return docs.map((d: any) => ({
    _key: `doc-${d.id}`,
    _source: 'doc' as const,
    _docId: d.id,
    issued_by: d.issued_by ?? '',
    number: d.number ?? '',
    issued_at: d.issued_at ?? null,
    expires_at: d.expires_at ?? null,
    scan_url: d.scan_url ?? ''
  }))
}

function buildAdrCertsList(data: Record<string, any>): AdrCertItem[] {
  const docs = Array.isArray(data.adr_certs_from_documents) ? data.adr_certs_from_documents : []
  if (docs.length === 0) {
    return [{
      _key: 'new-0',
      _source: 'new',
      issued_by: '',
      number: '',
      allowed_classes: [],
      issued_at: null,
      expires_at: null,
      scan_url: ''
    }]
  }
  return docs.map((d: any) => ({
    _key: `doc-${d.id}`,
    _source: 'doc' as const,
    _docId: d.id,
    issued_by: d.issued_by ?? '',
    number: d.number ?? '',
    allowed_classes: Array.isArray(d.allowed_classes) ? d.allowed_classes : (d.license_categories ? d.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    issued_at: d.issued_at ?? null,
    expires_at: d.expires_at ?? null,
    scan_url: d.scan_url ?? ''
  }))
}

function applyProfileToForm(data: Record<string, any>) {
  if (!data || data.error) return
  profileData.value = data
  Object.assign(form, data)
  form.hidden_fields = Array.isArray(data.hidden_fields) ? data.hidden_fields : []

  if (data.citizenship) form.citizenships = data.citizenship.split(',').map((s: string) => s.trim()).filter(Boolean)
  if (data.phone) form.phones = data.phone.split(',').map((s: string) => s.trim()).filter(Boolean)
  if (data.additional_emails) form.extra_emails = (data.additional_emails || '').split(',').map((s: string) => s.trim()).filter(Boolean)
  if (data.license_categories) form.license_categories_arr = data.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean)

  if (!form.citizenships?.length) form.citizenships = ['']
  if (!form.phones?.length) form.phones = ['']

  const hireSourceMap: Record<string, string> = {
    'По рекомендации': 'recommendation',
    'Объявление': 'advertisement',
    'Агентство': 'agency'
  }
  if (data.hire_source && hireSourceMap[data.hire_source]) {
    form.hire_source = hireSourceMap[data.hire_source]
  } else if (['recommendation', 'advertisement', 'agency'].includes(data.hire_source)) {
    form.hire_source = data.hire_source
  }

  passportsList.value = buildPassportsList(data)
  licensesList.value = buildLicensesList(data)
  visasList.value = buildVisasList(data)
  medicalCertificatesList.value = buildMedicalCertificatesList(data)
  tachographCardsList.value = buildTachographCardsList(data)
  technicalMinimumCertsList.value = buildTechnicalMinimumCertsList(data)
  adrCertsList.value = buildAdrCertsList(data)
}

async function loadProfile() {
  if (props.initialProfile && Object.keys(props.initialProfile).length > 0) {
    applyProfileToForm(props.initialProfile)
    loading.value = false
    return
  }

  if (!props.loadUrl) {
    loadError.value = t('admin.driverCardForm.urlNotSet')
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = null
  try {
    const data = await $fetch<any>(props.loadUrl, { credentials: 'include' })
    applyProfileToForm(data)
  } catch (e: any) {
    loadError.value = e?.data?.error || t('admin.driverCardForm.loadProfileError')
  } finally {
    loading.value = false
  }
}

function buildSaveBody() {
  const mainPassport = passportsList.value[0]
  const extraPassports = passportsList.value.slice(1).filter(p => p._source === 'extra')
  const mainLicense = licensesList.value[0]

  const body: Record<string, unknown> = {
    surname: form.surname,
    given_name: form.given_name,
    patronymic: form.patronymic,
    date_of_birth: form.date_of_birth,
    citizenship: form.citizenships.filter(Boolean).join(', '),
    gender: form.gender,
    phone: form.phones.filter(Boolean).join(', '),
    additional_emails: form.extra_emails.filter(Boolean).join(', '),
    status: form.status,
    employment_category: form.employment_category,
    company_name: form.company_name,
    inn: form.inn,
    address: form.address,

    passport_series: mainPassport?.series ?? form.passport_series,
    passport_number: mainPassport?.number ?? form.passport_number,
    passport_issue_date: mainPassport?.issued_at ?? form.passport_issue_date,
    passport_expiry_date: mainPassport?.expires_at ?? form.passport_expiry_date,
    passport_issued_by: mainPassport?.issued_by ?? form.passport_issued_by,
    place_of_birth: mainPassport?.place_of_birth ?? form.place_of_birth,
    residential_address: mainPassport?.residential_address ?? form.residential_address,
    passport_scan_url: mainPassport?.scan_url ?? form.passport_scan_url,
    passport_is_active: true,
    extra_passports: extraPassports.map(p => ({
      passport_series: p.series || null,
      passport_number: p.number || null,
      passport_issue_date: p.issued_at || null,
      passport_expiry_date: p.expires_at || null,
      passport_issued_by: p.issued_by || null,
      place_of_birth: p.place_of_birth || null,
      residential_address: p.residential_address || null,
      passport_scan_url: p.scan_url || null,
      is_active: true
    })),

    license_number: mainLicense?.number ?? form.license_number,
    license_categories: (mainLicense?.license_categories_arr?.length ? mainLicense.license_categories_arr.join(', ') : mainLicense?.license_categories) ?? form.license_categories_arr.join(', '),
    license_issue_date: mainLicense?.issued_at ?? form.license_issue_date,
    license_expiry: mainLicense?.expires_at ?? form.license_expiry,
    license_issued_by: mainLicense?.issued_by ?? form.license_issued_by,
    license_scan_url: mainLicense?.scan_url ?? form.license_scan_url,
    has_international_license: form.has_international_license,
    international_license_number: form.international_license_number,
    international_license_validity: form.international_license_validity,

    permission_entry_zone: form.permission_entry_zone,
    permission_issue_date: form.permission_issue_date,
    permission_validity_date: form.permission_validity_date,
    medical_certificate: form.medical_certificate,
    last_medical_examination_date: form.last_medical_examination_date,
    medical_certificate_scan_url: form.medical_certificate_scan_url,
    tachograph_card_number: form.tachograph_card_number,
    other_permits: form.other_permits,
    hire_source: form.hire_source,
    bank_name: form.bank_name,
    bank_account: form.bank_account,
    bank_bik: form.bank_bik,
    hidden_fields: form.hidden_fields || []
  }
  return body
}

async function handleSave() {
  saving.value = true
  try {
    await $fetch(props.saveUrl, {
      method: 'PATCH',
      credentials: 'include',
      body: buildSaveBody()
    })

    const base = documentsBaseUrl.value
    for (const p of passportsList.value) {
      if (p._source === 'doc' && p._docId) {
        await $fetch(`${base}/${p._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            series: p.series || null,
            number: p.number || null,
            issued_by: p.issued_by || null,
            issued_at: p.issued_at || null,
            expires_at: p.expires_at || null,
            place_of_birth: p.place_of_birth || null,
            residential_address: p.residential_address || null,
            scan_url: p.scan_url || null
          }
        })
      } else if (p._source === 'new') {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'passport',
            series: p.series || null,
            number: p.number || null,
            issued_by: p.issued_by || null,
            issued_at: p.issued_at || null,
            expires_at: p.expires_at || null,
            place_of_birth: p.place_of_birth || null,
            residential_address: p.residential_address || null,
            scan_url: p.scan_url || null
          }
        })
      }
    }
    for (const lic of licensesList.value) {
      const licCat = lic.license_categories_arr?.length ? lic.license_categories_arr.join(', ') : (lic.license_categories || null)
      if (lic._source === 'doc' && lic._docId) {
        await $fetch(`${base}/${lic._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            number: lic.number || null,
            issued_by: lic.issued_by || null,
            issued_at: lic.issued_at || null,
            expires_at: lic.expires_at || null,
            license_categories: licCat,
            scan_url: lic.scan_url || null
          }
        })
      } else if (lic._source === 'new') {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'drivers_license',
            number: lic.number || null,
            issued_by: lic.issued_by || null,
            issued_at: lic.issued_at || null,
            expires_at: lic.expires_at || null,
            license_categories: licCat,
            scan_url: lic.scan_url || null
          }
        })
      }
    }

    for (const v of visasList.value) {
      if (v._source === 'doc' && v._docId) {
        await $fetch(`${base}/${v._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            country: v.country || null,
            number: v.number || null,
            issued_at: v.issued_at || null,
            expires_at: v.expires_at || null,
            scan_url: v.scan_url || null
          }
        })
      } else if (v._source === 'new' && (v.country || v.number || v.scan_url)) {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'visa',
            country: v.country || null,
            number: v.number || null,
            issued_at: v.issued_at || null,
            expires_at: v.expires_at || null,
            scan_url: v.scan_url || null
          }
        })
      }
    }

    for (const m of medicalCertificatesList.value) {
      if (m._source === 'doc' && m._docId) {
        await $fetch(`${base}/${m._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            number: m.number || null,
            issued_at: m.issued_at || null,
            expires_at: m.expires_at || null,
            scan_url: m.scan_url || null
          }
        })
      } else if (m._source === 'new' && (m.number || m.scan_url)) {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'medical_certificate',
            number: m.number || null,
            issued_at: m.issued_at || null,
            expires_at: m.expires_at || null,
            scan_url: m.scan_url || null
          }
        })
      }
    }

    for (const t of tachographCardsList.value) {
      if (t._source === 'doc' && t._docId) {
        await $fetch(`${base}/${t._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            number: t.number || null,
            country: t.country || null,
            issued_at: t.issued_at || null,
            expires_at: t.expires_at || null,
            scan_url: t.scan_url || null
          }
        })
      } else if (t._source === 'new' && (t.number || t.country || t.scan_url)) {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'tachograph_card',
            number: t.number || null,
            country: t.country || null,
            issued_at: t.issued_at || null,
            expires_at: t.expires_at || null,
            scan_url: t.scan_url || null
          }
        })
      }
    }

    for (const tm of technicalMinimumCertsList.value) {
      if (tm._source === 'doc' && tm._docId) {
        await $fetch(`${base}/${tm._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            issued_by: tm.issued_by || null,
            number: tm.number || null,
            issued_at: tm.issued_at || null,
            expires_at: tm.expires_at || null,
            scan_url: tm.scan_url || null
          }
        })
      } else if (tm._source === 'new' && (tm.issued_by || tm.number || tm.scan_url)) {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'technical_minimum_cert',
            issued_by: tm.issued_by || null,
            number: tm.number || null,
            issued_at: tm.issued_at || null,
            expires_at: tm.expires_at || null,
            scan_url: tm.scan_url || null
          }
        })
      }
    }

    for (const a of adrCertsList.value) {
      if (a._source === 'doc' && a._docId) {
        await $fetch(`${base}/${a._docId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: {
            issued_by: a.issued_by || null,
            number: a.number || null,
            allowed_classes: a.allowed_classes?.length ? a.allowed_classes : null,
            issued_at: a.issued_at || null,
            expires_at: a.expires_at || null,
            scan_url: a.scan_url || null
          }
        })
      } else if (a._source === 'new' && (a.issued_by || a.number || a.allowed_classes?.length || a.scan_url)) {
        await $fetch(base, {
          method: 'POST',
          credentials: 'include',
          body: {
            doc_type: 'adr_certificate',
            issued_by: a.issued_by || null,
            number: a.number || null,
            allowed_classes: a.allowed_classes?.length ? a.allowed_classes : null,
            issued_at: a.issued_at || null,
            expires_at: a.expires_at || null,
            scan_url: a.scan_url || null
          }
        })
      }
    }

    message.success(t('admin.driverCardForm.profileSaved'))
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    saving.value = false
  }
}

async function handlePassportScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  p: PassportItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    let url: string
    if (p._source === 'main') {
      const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-passport`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    } else {
      fd.append('doc_type', 'passport')
      const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    }
    p.scan_url = url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleLicenseScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  lic: LicenseItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    let url: string
    if (lic._source === 'main') {
      const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-license`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    } else {
      fd.append('doc_type', 'drivers_license')
      const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      url = res.url
    }
    lic.scan_url = url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleVisaScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  v: VisaItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', 'visa')
    const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    v.scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleTachographCardScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  card: TachographCardItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', 'tachograph_card')
    const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    card.scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleMedicalCertificateScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  m: MedicalCertificateItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', 'medical_certificate')
    const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    m.scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleTechnicalMinimumCertScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  tm: TechnicalMinimumCertItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', 'technical_minimum_cert')
    const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    tm.scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

async function handleAdrCertScanUpload(
  { file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void },
  a: AdrCertItem
) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', 'adr_certificate')
    const res = await $fetch<{ url: string }>(`${documentsBaseUrl.value}/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    a.scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

watch(() => props.initialProfile, (p) => {
  if (p && Object.keys(p).length > 0) {
    applyProfileToForm(p)
  }
}, { immediate: false })

onMounted(() => {
  loadProfile()
})

defineExpose({ loadProfile, handleSave })
</script>

<style scoped>
.admin-driver-card-form {
  max-width: 900px;
  margin: 0 auto;
}
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--n-border-color);
}
.mt-8 { margin-top: 8px; }
.mt-24 { margin-top: 24px; }
.ml-8 { margin-left: 8px; }

:deep(.n-form-item-label) {
  font-weight: 600;
}
</style>
