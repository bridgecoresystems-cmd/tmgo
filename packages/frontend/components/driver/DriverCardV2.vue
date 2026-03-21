<template>
  <div class="driver-card-v2">
    <!-- When verified — show status only -->
    <div v-if="isDriverContext && isVerified" class="verified-status-block">
      <n-alert type="success" class="verified-alert">
        <template #header>
          <n-space align="center" :size="12">
            <n-icon :component="CheckmarkCircle" size="24" color="#18a058" />
            <span class="verified-title">{{ t('driver.card.verified') }}</span>
          </n-space>
        </template>
        <p v-if="verifiedDate" class="verified-date">{{ t('driver.card.submittedAt') }} {{ verifiedDate }}</p>
      </n-alert>
    </div>

    <n-spin v-else :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-alert v-if="error" type="error" class="mb-16">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadProfile">{{ t('common.retry') }}</n-button>
          </template>
        </n-alert>

        <n-form
          v-if="!error"
          ref="formRef"
          :model="form"
          label-placement="left"
          label-width="240"
          label-align="left"
          class="v2-form"
          :disabled="isLocked"
        >
        <!-- 1. Main info -->
        <n-h3 prefix="bar" align-text>{{ t('driver.card.section1') }}</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item :label="t('driver.card.driverId')">
              <n-space align="center">
                <n-text depth="3">{{ form.id || t('driver.card.generatedBySystem') }}</n-text>
                <n-tag v-if="form.id" size="small" type="info">Auto</n-tag>
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.changeRequests.fieldSurname')" required path="surname">
              <n-input v-model:value="form.surname" :placeholder="t('driver.card.placeholderSurname')" />
            </n-form-item>

            <n-form-item :label="t('driver.changeRequests.fieldGivenName')" required path="given_name">
              <n-input v-model:value="form.given_name" :placeholder="t('driver.card.placeholderGivenName')" />
            </n-form-item>

            <n-form-item :label="t('driver.card.patronymic')" path="patronymic">
              <n-input v-model:value="form.patronymic" :placeholder="t('driver.card.placeholderPatronymic')" />
            </n-form-item>

            <n-form-item :label="t('driver.card.dateOfBirth')" required path="date_of_birth">
              <n-date-picker
                :value="dateOnlyToPickerMs(form.date_of_birth)"
                type="date"
                clearable
                @update:value="(v) => { form.date_of_birth = v ? formatDateOnlyFromMs(v) : null }"
              />
            </n-form-item>

            <n-form-item :label="t('driver.card.citizenship')" required>
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
                <n-button quaternary size="small" type="primary" @click="form.citizenships.push('')">{{ t('driver.card.addCitizenship') }}</n-button>
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.gender')" required path="gender">
              <n-radio-group v-model:value="form.gender">
                <n-space>
                  <n-radio value="male">{{ t('driver.card.male') }}</n-radio>
                  <n-radio value="female">{{ t('driver.card.female') }}</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <n-form-item :label="t('driver.card.contactPhone')" required>
              <n-space vertical style="width: 100%">
                <n-space v-for="(p, i) in form.phones" :key="i" align="center">
                  <n-input v-model:value="form.phones[i]" :placeholder="t('driver.card.placeholderPhone')" style="width: 200px" />
                  <n-button v-if="i > 0" quaternary circle type="error" @click="form.phones.splice(i, 1)">×</n-button>
                </n-space>
                <n-button quaternary size="small" type="primary" @click="form.phones.push('')">{{ t('driver.card.addPhone') }}</n-button>
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.emailLogin')" required>
              <n-space vertical style="width: 100%">
                <n-input :value="form.email" disabled style="width: 300px" />
                <n-space v-for="(e, i) in form.extra_emails" :key="i" align="center">
                  <n-input v-model:value="form.extra_emails[i]" :placeholder="t('driver.card.placeholderEmail')" style="width: 200px" />
                  <n-button quaternary circle type="error" @click="form.extra_emails.splice(i, 1)">×</n-button>
                </n-space>
                <n-button quaternary size="small" type="primary" @click="form.extra_emails.push('')">{{ t('driver.card.addEmail') }}</n-button>
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.statusDispatcher')">
              <n-select v-model:value="form.status" :options="statusOptions" :disabled="isDriverContext" style="width: 200px" />
            </n-form-item>

            <n-form-item :label="t('driver.card.employmentCategory')">
              <n-select v-model:value="form.employment_category" :options="employmentOptions" :disabled="isDriverContext" style="width: 200px" />
            </n-form-item>
          </n-space>
        </n-card>

        <!-- 2. Passport data -->
        <n-h3 prefix="bar" align-text>{{ t('driver.card.section2') }}</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item :label="t('driver.card.passportSeriesNumber')" required>
              <n-space>
                <n-input v-model:value="form.passport_series" :placeholder="t('driver.documents.placeholderSeries')" style="width: 80px" />
                <n-input v-model:value="form.passport_number" :placeholder="t('driver.documents.placeholderNumber')" style="width: 160px" />
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.validityDates')" required>
              <n-space align="center">
                <n-date-picker
                  :value="dateOnlyToPickerMs(form.passport_issue_date)"
                  type="date"
                  :placeholder="t('driver.card.passportIssueDate')"
                  @update:value="(v) => { form.passport_issue_date = v ? formatDateOnlyFromMs(v) : null }"
                />
                <n-text depth="3">—</n-text>
                <n-date-picker
                  :value="dateOnlyToPickerMs(form.passport_expiry_date)"
                  type="date"
                  :placeholder="t('driver.card.passportExpiryDate')"
                  @update:value="(v) => { form.passport_expiry_date = v ? formatDateOnlyFromMs(v) : null }"
                />
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.passportIssuedBy')" required path="passport_issued_by">
              <n-input v-model:value="form.passport_issued_by" :placeholder="t('admin.driverCardForm.placeholderIssuedBy')" />
            </n-form-item>

            <n-form-item :label="t('driver.card.placeOfBirth')" required path="place_of_birth">
              <n-input v-model:value="form.place_of_birth" :placeholder="t('admin.driverCardForm.placeholderPlaceOfBirth')" />
            </n-form-item>

            <n-form-item :label="t('driver.card.residentialAddress')" required path="residential_address">
              <n-input v-model:value="form.residential_address" :placeholder="t('admin.driverCardForm.placeholderResidentialAddress')" />
            </n-form-item>

            <n-form-item :label="t('driver.card.passportScan')" required>
              <n-space vertical>
                <n-upload
                  :max="1"
                  :custom-request="(o) => handleUpload(o, 'passport')"
                  :show-file-list="false"
                >
                  <n-button size="small">{{ form.passport_scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                </n-upload>
                <n-button v-if="form.passport_scan_url" text type="primary" size="small" @click="openScan(form.passport_scan_url)">
                  {{ t('driver.card.viewScan') }}
                </n-button>
              </n-space>
            </n-form-item>
          </n-space>
        </n-card>

        <!-- 3. Driver license -->
        <n-h3 prefix="bar" align-text>{{ t('driver.card.section3') }}</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item :label="t('driver.card.licenseNumber')" required path="license_number">
              <n-input v-model:value="form.license_number" :placeholder="t('driver.documents.placeholderLicenseNum')" style="width: 240px" />
            </n-form-item>

            <n-form-item :label="t('driver.card.licenseCategories')" required>
              <n-checkbox-group v-model:value="form.license_categories_arr">
                <n-space>
                  <n-checkbox value="A">A</n-checkbox>
                  <n-checkbox value="B">B</n-checkbox>
                  <n-checkbox value="C">C</n-checkbox>
                  <n-checkbox value="D">D</n-checkbox>
                  <n-checkbox value="E">E</n-checkbox>
                </n-space>
              </n-checkbox-group>
            </n-form-item>

            <n-form-item :label="t('driver.card.licenseValidityDates')" required>
              <n-space align="center">
                <n-date-picker
                  :value="dateOnlyToPickerMs(form.license_issue_date)"
                  type="date"
                  :placeholder="t('driver.card.passportIssueDate')"
                  @update:value="(v) => { form.license_issue_date = v ? formatDateOnlyFromMs(v) : null }"
                />
                <n-text depth="3">—</n-text>
                <n-date-picker
                  :value="dateOnlyToPickerMs(form.license_expiry)"
                  type="date"
                  :placeholder="t('driver.card.passportExpiryDate')"
                  @update:value="(v) => { form.license_expiry = v ? formatDateOnlyFromMs(v) : null }"
                />
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.licenseScan')" required>
              <n-space vertical>
                <n-upload
                  :max="1"
                  :custom-request="(o) => handleUpload(o, 'license')"
                  :show-file-list="false"
                >
                  <n-button size="small">{{ form.license_scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                </n-upload>
                <n-button v-if="form.license_scan_url" text type="primary" size="small" @click="openScan(form.license_scan_url)">
                  {{ t('driver.card.viewScan') }}
                </n-button>
              </n-space>
            </n-form-item>

            <n-form-item :label="t('driver.card.internationalLicense')">
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
                    <n-form-item :label="t('driver.card.intlLicenseScan')" label-placement="left" label-width="120">
                      <n-upload
                        :max="1"
                        :custom-request="(o) => handleUpload(o, 'intl_license')"
                        :show-file-list="false"
                      >
                        <n-button size="small">{{ t('driver.card.upload') }}</n-button>
                      </n-upload>
                    </n-form-item>
                  </n-space>
                </template>
              </n-space>
            </n-form-item>
          </n-space>
        </n-card>

        <!-- 4. Permits (visa, medical cert, tech minimum, tachograph, ADR) -->
        <n-h3 prefix="bar" align-text>{{ t('driver.card.section4') }}</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-text depth="3" style="margin-bottom: 8px;">{{ t('driver.card.visa') }}</n-text>
            <template v-for="(v, vi) in visasList" :key="v._key">
              <n-divider v-if="vi > 0" style="margin: 16px 0;">{{ t('driver.card.visa') }} {{ vi + 1 }}</n-divider>
              <n-form-item :label="`${t('driver.documents.issueCountry')}${vi > 0 ? ` (${vi + 1})` : ''}`">
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
                <n-input v-model:value="v.number" :placeholder="t('driver.documents.placeholderVisaNum')" style="width: 200px" />
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
                    :placeholder="t('driver.card.passportExpiryDate')"
                    @update:value="(val) => { v.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                  />
                </n-space>
              </n-form-item>
              <n-form-item :label="t('driver.card.scanVisa')">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleVisaUpload(o, v)" :show-file-list="false">
                    <n-button size="small">{{ v.scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                  </n-upload>
                  <n-button v-if="v.scan_url" text type="primary" size="small" @click="openScan(v.scan_url)">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addVisa">{{ t('driver.card.addVisa') }}</n-button>

            <n-divider style="margin: 24px 0 16px;">{{ t('driver.card.medicalCertificate') }}</n-divider>
            <template v-for="(m, mi) in medicalCertificatesList" :key="m._key">
              <n-divider v-if="mi > 0" style="margin: 16px 0;">{{ t('driver.card.medicalCertificate') }} {{ mi + 1 }}</n-divider>
              <n-form-item :label="`${t('driver.documents.medicalNum')}${mi > 0 ? ` (${mi + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="m.number" :placeholder="t('driver.documents.placeholderMedicalNum')" style="width: 200px" />
                  <n-button v-if="mi > 0" quaternary circle type="error" @click="removeMedicalCertificate(mi)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item :label="t('driver.documents.issueDate')">
                <n-date-picker
                  :value="dateOnlyToPickerMs(m.issued_at)"
                  type="date"
                  :placeholder="t('driver.card.passportIssueDate')"
                  @update:value="(val) => { m.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.documents.expiryDate')">
                <n-date-picker
                  :value="dateOnlyToPickerMs(m.expires_at)"
                  type="date"
                  :placeholder="t('driver.card.passportExpiryDate')"
                  @update:value="(val) => { m.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.card.scanMedical')">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleMedicalCertificateUpload(o, m)" :show-file-list="false">
                    <n-button size="small">{{ m.scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                  </n-upload>
                  <n-button v-if="m.scan_url" text type="primary" size="small" @click="openScan(m.scan_url)">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addMedicalCertificate">+ {{ t('driver.changeRequests.fieldMedicalAdd') }}</n-button>

            <n-divider style="margin: 24px 0 16px;">{{ t('driver.card.techMinCert') }}</n-divider>
            <template v-for="(tm, tmi) in technicalMinimumCertsList" :key="tm._key">
              <n-divider v-if="tmi > 0" style="margin: 16px 0;">{{ t('driver.card.techMinCert') }} {{ tmi + 1 }}</n-divider>
              <n-form-item :label="`${t('driver.documents.techMinInstitution')}${tmi > 0 ? ` (${tmi + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="tm.issued_by" :placeholder="t('driver.documents.placeholderTechMinInstitution')" style="width: 280px" />
                  <n-button v-if="tmi > 0" quaternary circle type="error" @click="removeTechnicalMinimumCert(tmi)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item :label="t('driver.card.certNumber')">
                <n-input v-model:value="tm.number" :placeholder="t('driver.documents.placeholderTechMinNum')" style="width: 200px" />
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
                  :placeholder="t('driver.card.passportExpiryDate')"
                  @update:value="(val) => { tm.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.documents.docScan')">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleTechnicalMinimumCertUpload(o, tm)" :show-file-list="false">
                    <n-button size="small">{{ tm.scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                  </n-upload>
                  <n-button v-if="tm.scan_url" text type="primary" size="small" @click="openScan(tm.scan_url)">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addTechnicalMinimumCert">+ {{ t('driver.changeRequests.fieldTechMinAdd') }}</n-button>

            <n-divider style="margin: 24px 0 16px;">{{ t('driver.card.adrCertificate') }}</n-divider>
            <template v-for="(a, ai) in adrCertsList" :key="a._key">
              <n-divider v-if="ai > 0" style="margin: 16px 0;">{{ t('driver.card.adrCertificate') }} {{ ai + 1 }}</n-divider>
              <n-form-item :label="`${t('driver.card.adrIssuedBy')}${ai > 0 ? ` (${ai + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="a.issued_by" :placeholder="t('driver.documents.placeholderAdrIssuedBy')" style="width: 280px" />
                  <n-button v-if="ai > 0" quaternary circle type="error" @click="removeAdrCert(ai)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item :label="t('driver.card.adrCertNumber')">
                <n-input v-model:value="a.number" :placeholder="t('driver.documents.placeholderAdrNum')" style="width: 200px" />
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
                  :placeholder="t('driver.card.passportIssueDate')"
                  @update:value="(val) => { a.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.documents.expiryDate')">
                <n-date-picker
                  :value="dateOnlyToPickerMs(a.expires_at)"
                  type="date"
                  :placeholder="t('driver.card.passportExpiryDate')"
                  @update:value="(val) => { a.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.documents.docScan')">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleAdrCertUpload(o, a)" :show-file-list="false">
                    <n-button size="small">{{ a.scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                  </n-upload>
                  <n-button v-if="a.scan_url" text type="primary" size="small" @click="openScan(a.scan_url)">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addAdrCert">+ {{ t('driver.changeRequests.fieldAdrAdd') }}</n-button>

            <n-divider style="margin: 24px 0 16px;">{{ t('driver.card.tachographCard') }}</n-divider>
            <template v-for="(tc, ti) in tachographCardsList" :key="tc._key">
              <n-divider v-if="ti > 0" style="margin: 16px 0;">{{ t('driver.card.tachographCard') }} {{ ti + 1 }}</n-divider>
              <n-form-item :label="`${t('driver.card.tachographNumber')}${ti > 0 ? ` (${ti + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="tc.number" :placeholder="t('driver.documents.placeholderTachographNum')" style="width: 200px" />
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
                  :placeholder="t('driver.card.passportIssueDate')"
                  @update:value="(val) => { tc.issued_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.documents.expiryDate')">
                <n-date-picker
                  :value="dateOnlyToPickerMs(tc.expires_at)"
                  type="date"
                  :placeholder="t('driver.card.passportExpiryDate')"
                  @update:value="(val) => { tc.expires_at = val ? formatDateOnlyFromMs(val) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.documents.docScan')">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleTachographCardUpload(o, tc)" :show-file-list="false">
                    <n-button size="small">{{ tc.scan_url ? t('driver.card.replaceFile') : t('driver.card.uploadFile') }}</n-button>
                  </n-upload>
                  <n-button v-if="tc.scan_url" text type="primary" size="small" @click="openScan(tc.scan_url)">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addTachographCard">+ {{ t('driver.changeRequests.fieldTachographAdd') }}</n-button>

            <n-divider style="margin: 24px 0 16px;">{{ t('driver.card.otherPermits') }}</n-divider>
            <n-form-item :label="t('driver.card.otherPermits')">
              <n-input v-model:value="form.other_permits" type="textarea" :placeholder="t('driver.card.placeholderOtherPermits')" />
            </n-form-item>

            <n-form-item :label="t('driver.card.hireSource')">
              <n-select v-model:value="form.hire_source" :options="hireSourceOptions" style="width: 240px" />
            </n-form-item>

            <n-form-item :label="t('admin.attachedDocuments')">
              <n-space>
                <n-tag v-if="form.passport_scan_url" type="success" size="small">{{ t('driver.documents.docTypePassport') }}</n-tag>
                <n-tag v-if="form.license_scan_url" type="success" size="small">{{ t('driver.documents.docTypeDriversLicense') }}</n-tag>
                <n-tag v-if="form.international_license_scan_url" type="success" size="small">{{ t('driver.documents.docTypeIntlLicense') }}</n-tag>
                <n-tag v-if="visasList.some((v: any) => v.scan_url)" type="success" size="small">{{ t('driver.card.visa') }}</n-tag>
                <n-tag v-if="medicalCertificatesList.some((m: any) => m.scan_url)" type="success" size="small">{{ t('driver.card.medicalCertificate') }}</n-tag>
                <n-tag v-if="technicalMinimumCertsList.some((tm: any) => tm.scan_url)" type="success" size="small">{{ t('driver.card.techMinCert') }}</n-tag>
                <n-tag v-if="adrCertsList.some((a: any) => a.scan_url)" type="success" size="small">{{ t('driver.card.adrCertificate') }}</n-tag>
                <n-tag v-if="tachographCardsList.some((t: any) => t.scan_url)" type="success" size="small">{{ t('driver.card.tachographCard') }}</n-tag>
                <n-text v-if="!anyScanUploaded" depth="3">{{ t('admin.noAttachedFiles') }}</n-text>
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
            <n-button :loading="saving" @click="handleSave">{{ t('admin.saveDraft') }}</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">{{ t('driver.card.submitForVerification') }}</n-button>
          </n-space>
        </div>
      </n-form>
    </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { CheckmarkCircle } from '@vicons/ionicons5'

const { t } = useI18n()
import { 
  useMessage, 
  NForm, NFormItem, NInput, NCard, NSpace, NButton, NSelect, NDatePicker, 
  NUpload, NTag, NText, NRadioGroup, NRadio, NCheckboxGroup, NCheckbox, 
  NSpin, NAlert, NH3, NIcon
} from 'naive-ui'
import { citizenships, visaCountries, adrClasses } from '@tmgo/shared'

const props = defineProps<{
  isDriverContext?: boolean
}>()

const emit = defineEmits(['saved', 'submitted'])

const { apiBase } = useApiBase()
const { data: verificationData, fetchStatus: fetchVerification } = useDriverVerificationStatus()

const isVerified = computed(() => verificationData.value?.status === 'verified')
const verifiedDate = computed(() => {
  const d = verificationData.value?.submitted_at
  if (!d) return ''
  return new Date(d).toLocaleDateString('ru-RU')
})
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

const citizenshipOptions = computed(() => 
  citizenships.map(c => ({ label: c, value: c }))
)

const visaCountryOptions = computed(() =>
  visaCountries.map(c => ({ label: c, value: c }))
)

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
  
  passport_series: '',
  passport_number: '',
  passport_issue_date: null as string | null,
  passport_expiry_date: null as string | null,
  passport_issued_by: '',
  place_of_birth: '',
  residential_address: '',
  passport_scan_url: '',

  license_number: '',
  license_categories_arr: [] as string[],
  license_issue_date: null as string | null,
  license_expiry: null as string | null,
  license_scan_url: '',
  has_international_license: false,
  international_license_number: '',
  international_license_validity: '',
  international_license_scan_url: '',

  permission_entry_zone: '',
  permission_issue_date: null as string | null,
  permission_validity_date: null as string | null,
  medical_certificate: '',
  last_medical_examination_date: null as string | null,
  technical_minimum_certificate: '',
  tachograph_card_number: '',
  other_permits: '',
  hire_source: 'По рекомендации',
  visa_scan_url: '',
  medical_certificate_scan_url: '',
  updated_at: '',
  verification_status: 'not_submitted'
})

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

const visasList = ref<VisaItem[]>([])
const medicalCertificatesList = ref<MedicalCertificateItem[]>([])
const tachographCardsList = ref<TachographCardItem[]>([])
const technicalMinimumCertsList = ref<TechnicalMinimumCertItem[]>([])
const adrCertsList = ref<AdrCertItem[]>([])


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
  { label: t('driver.card.hireSourceRecommendation'), value: 'По рекомендации' },
  { label: t('driver.card.hireSourceAdvertisement'), value: 'Объявление' },
  { label: t('driver.card.hireSourceAgency'), value: 'Агентство' }
])

const anyScanUploaded = computed(() => {
  const hasVisaScans = visasList.value.some(v => v.scan_url)
  const hasMedicalScans = medicalCertificatesList.value.some(m => m.scan_url)
  const hasTechMinScans = technicalMinimumCertsList.value.some(tm => tm.scan_url)
  const hasAdrScans = adrCertsList.value.some(a => a.scan_url)
  const hasTachographScans = tachographCardsList.value.some(t => t.scan_url)
  return !!(form.passport_scan_url || form.license_scan_url || form.international_license_scan_url || hasVisaScans || hasMedicalScans || hasTechMinScans || hasAdrScans || hasTachographScans)
})

const isLocked = computed(() => 
  props.isDriverContext && ['submitted', 'verified', 'waiting_verification', 'request'].includes(form.verification_status)
)

async function loadProfile() {
  loading.value = true
  error.value = null
  try {
    const url = props.isDriverContext 
      ? `${apiBase}/cabinet/driver/profile`
      : `${apiBase}/admin/users/${useRoute().params.id}/driver-profile`
    
    const data = await $fetch<any>(url, { credentials: 'include' })
    
    // Map data to form
    Object.assign(form, data)
    
    // Handle special mappings
    if (data.citizenship) form.citizenships = data.citizenship.split(',').map((s: string) => s.trim())
    if (data.phone) form.phones = data.phone.split(',').map((s: string) => s.trim())
    if (data.additional_emails) form.extra_emails = data.additional_emails.split(',').map((s: string) => s.trim())
    if (data.license_categories) form.license_categories_arr = data.license_categories.split(',').map((s: string) => s.trim())
    
    // Ensure at least one empty field for dynamic lists
    if (!form.citizenships || form.citizenships.length === 0) form.citizenships = ['']
    if (!form.phones || form.phones.length === 0) form.phones = ['']

    visasList.value = buildVisasList(data)
    medicalCertificatesList.value = buildMedicalCertificatesList(data)
    tachographCardsList.value = buildTachographCardsList(data)
    technicalMinimumCertsList.value = buildTechnicalMinimumCertsList(data)
    adrCertsList.value = buildAdrCertsList(data)
  } catch (e: any) {
    console.error('Error loading profile:', e)
    error.value = e?.data?.error || t('driver.card.loadProfileError')
  } finally {
    loading.value = false
  }
}

function buildSaveBody() {
  return {
    ...form,
    citizenship: form.citizenships.filter(Boolean).join(', '),
    phone: form.phones.filter(Boolean).join(', '),
    additional_emails: form.extra_emails.filter(Boolean).join(', '),
    license_categories: form.license_categories_arr.join(', ')
  }
}

async function handleSave() {
  saving.value = true
  try {
    const url = props.isDriverContext 
      ? `${apiBase}/cabinet/driver/profile`
      : `${apiBase}/admin/users/${useRoute().params.id}/driver-profile`
    
    await $fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      body: buildSaveBody()
    })

    if (props.isDriverContext) {
      await syncVisasToDocuments()
      await syncMedicalCertificatesToDocuments()
      await syncTechnicalMinimumCertsToDocuments()
      await syncAdrCertsToDocuments()
      await syncTachographCardsToDocuments()
    }

    message.success(t('driver.card.cardSaved'))
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  // Simple validation
  const required = [
    { v: form.surname, l: t('driver.changeRequests.fieldSurname') },
    { v: form.given_name, l: t('driver.changeRequests.fieldGivenName') },
    { v: form.date_of_birth, l: t('driver.changeRequests.fieldDateOfBirth') },
    { v: form.passport_number, l: t('driver.card.passportSeriesNumber') },
    { v: form.license_number, l: t('driver.card.licenseNumber') }
  ]
  const missing = required.filter(r => !r.v).map(r => r.l)
  if (missing.length > 0) {
    message.error(`${t('driver.card.missingFill')} ${missing.join(', ')}`)
    return
  }

  submitting.value = true
  try {
    const url = `${apiBase}/cabinet/driver/profile/submit-for-verification`
    await $fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: buildSaveBody()
    })

    if (props.isDriverContext) {
      await syncVisasToDocuments()
      await syncMedicalCertificatesToDocuments()
      await syncTechnicalMinimumCertsToDocuments()
      await syncAdrCertsToDocuments()
      await syncTachographCardsToDocuments()
    }

    message.success(t('driver.card.submittedSuccess'))
    form.verification_status = 'submitted'
    emit('submitted')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.requestError'))
  } finally {
    submitting.value = false
  }
}

function buildVisasList(data: Record<string, any>): VisaItem[] {
  const docs = Array.isArray(data?.visas_from_documents) ? data.visas_from_documents : []
  if (docs.length === 0) {
    return [{ _key: 'new-0', _source: 'new', country: '', number: '', issued_at: null, expires_at: null, scan_url: '' }]
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

function removeVisa(idx: number) {
  visasList.value.splice(idx, 1)
  if (visasList.value.length === 0) {
    visasList.value.push({ _key: 'new-0', _source: 'new', country: '', number: '', issued_at: null, expires_at: null, scan_url: '' })
  }
}

function buildMedicalCertificatesList(data: Record<string, any>): MedicalCertificateItem[] {
  const docs = Array.isArray(data?.medical_certificates_from_documents) ? data.medical_certificates_from_documents : []
  if (docs.length === 0) {
    return [{ _key: 'new-0', _source: 'new', number: '', issued_at: null, expires_at: null, scan_url: '' }]
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

function removeMedicalCertificate(idx: number) {
  medicalCertificatesList.value.splice(idx, 1)
  if (medicalCertificatesList.value.length === 0) {
    medicalCertificatesList.value.push({ _key: 'new-0', _source: 'new', number: '', issued_at: null, expires_at: null, scan_url: '' })
  }
}

function buildTachographCardsList(data: Record<string, any>): TachographCardItem[] {
  const docs = Array.isArray(data?.tachograph_cards_from_documents) ? data.tachograph_cards_from_documents : []
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
  const docs = Array.isArray(data?.technical_minimum_certs_from_documents) ? data.technical_minimum_certs_from_documents : []
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

function buildAdrCertsList(data: Record<string, any>): AdrCertItem[] {
  const docs = Array.isArray(data?.adr_certs_from_documents) ? data.adr_certs_from_documents : []
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

function removeAdrCert(idx: number) {
  adrCertsList.value.splice(idx, 1)
  if (adrCertsList.value.length === 0) {
    adrCertsList.value.push({
      _key: 'new-0',
      _source: 'new',
      issued_by: '',
      number: '',
      allowed_classes: [],
      issued_at: null,
      expires_at: null,
      scan_url: ''
    })
  }
}

function removeTechnicalMinimumCert(idx: number) {
  technicalMinimumCertsList.value.splice(idx, 1)
  if (technicalMinimumCertsList.value.length === 0) {
    technicalMinimumCertsList.value.push({
      _key: 'new-0',
      _source: 'new',
      issued_by: '',
      number: '',
      issued_at: null,
      expires_at: null,
      scan_url: ''
    })
  }
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

function removeTachographCard(idx: number) {
  tachographCardsList.value.splice(idx, 1)
  if (tachographCardsList.value.length === 0) {
    tachographCardsList.value.push({ _key: 'new-0', _source: 'new', number: '', country: '', issued_at: null, expires_at: null, scan_url: '' })
  }
}

async function syncVisasToDocuments() {
  const base = `${apiBase}/cabinet/driver/documents`
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
}

async function syncMedicalCertificatesToDocuments() {
  const base = `${apiBase}/cabinet/driver/documents`
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
}

async function syncAdrCertsToDocuments() {
  const base = `${apiBase}/cabinet/driver/documents`
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
}

async function syncTechnicalMinimumCertsToDocuments() {
  const base = `${apiBase}/cabinet/driver/documents`
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
}

async function syncTachographCardsToDocuments() {
  const base = `${apiBase}/cabinet/driver/documents`
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
}

async function handleTachographCardUpload(options: { file: { file?: File }; onFinish?: () => void; onError?: (e: Error) => void }, card: TachographCardItem) {
  const f = options.file?.file
  if (!f) return
  try {
    const fd = new FormData()
    fd.append('file', f, f.name)
    fd.append('doc_type', 'tachograph_card')
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    card.scan_url = res.url
    message.success(t('driver.card.fileUploaded'))
    options.onFinish?.()
  } catch (e: any) {
    message.error(t('common.uploadError'))
    options.onError?.(e)
  }
}

async function handleAdrCertUpload(options: { file: { file?: File }; onFinish?: () => void; onError?: (e: Error) => void }, a: AdrCertItem) {
  const f = options.file?.file
  if (!f) return
  try {
    const fd = new FormData()
    fd.append('file', f, f.name)
    fd.append('doc_type', 'adr_certificate')
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    a.scan_url = res.url
    message.success(t('driver.card.fileUploaded'))
    options.onFinish?.()
  } catch (e: any) {
    message.error(t('common.uploadError'))
    options.onError?.(e)
  }
}

async function handleTechnicalMinimumCertUpload(options: { file: { file?: File }; onFinish?: () => void; onError?: (e: Error) => void }, tm: TechnicalMinimumCertItem) {
  const f = options.file?.file
  if (!f) return
  try {
    const fd = new FormData()
    fd.append('file', f, f.name)
    fd.append('doc_type', 'technical_minimum_cert')
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    tm.scan_url = res.url
    message.success(t('driver.card.fileUploaded'))
    options.onFinish?.()
  } catch (e: any) {
    message.error(t('common.uploadError'))
    options.onError?.(e)
  }
}

async function handleMedicalCertificateUpload(options: { file: { file?: File }; onFinish?: () => void; onError?: (e: Error) => void }, m: MedicalCertificateItem) {
  const f = options.file?.file
  if (!f) return
  try {
    const fd = new FormData()
    fd.append('file', f, f.name)
    fd.append('doc_type', 'medical_certificate')
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    m.scan_url = res.url
    message.success(t('driver.card.fileUploaded'))
    options.onFinish?.()
  } catch (e: any) {
    message.error(t('common.uploadError'))
    options.onError?.(e)
  }
}

async function handleVisaUpload(options: { file: { file?: File }; onFinish?: () => void; onError?: (e: Error) => void }, v: VisaItem) {
  const f = options.file?.file
  if (!f) return
  try {
    const fd = new FormData()
    fd.append('file', f, f.name)
    fd.append('doc_type', 'visa')
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    v.scan_url = res.url
    message.success(t('driver.card.fileUploaded'))
    options.onFinish?.()
  } catch (e: any) {
    message.error(t('common.uploadError'))
    options.onError?.(e)
  }
}

async function handleUpload({ file }: any, type: string) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('doc_type', type)
    
    const res = await $fetch<{ url: string }>(`${apiBase}/cabinet/driver/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    
    if (type === 'passport') form.passport_scan_url = res.url
    else if (type === 'license') form.license_scan_url = res.url
    else if (type === 'intl_license') form.international_license_scan_url = res.url
    
    message.success(t('driver.card.fileUploaded'))
  } catch (e: any) {
    message.error(t('common.uploadError'))
  }
}

function openScan(url: string) {
  const fullUrl = url.startsWith('http') ? url : `${apiBase}${url}`
  window.open(fullUrl, '_blank')
}

onMounted(() => {
  if (props.isDriverContext) fetchVerification()
  loadProfile()
})
</script>

<style scoped>
.driver-card-v2 {
  max-width: 900px;
  margin: 0 auto;
}
.verified-status-block {
  padding: 20px;
  min-height: 200px;
}
.verified-alert {
  background: #f0f9eb;
  border-color: #c2e7b0;
}
.verified-title {
  font-weight: 600;
  font-size: 16px;
  color: #18a058;
}
.verified-date {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.9;
}
.v2-form {
  padding: 20px 0;
}
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }
.mt-8 { margin-top: 8px; }
.mt-24 { margin-top: 24px; }

:deep(.n-form-item-label) {
  font-weight: 600;
}
</style>
