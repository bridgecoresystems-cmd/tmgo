<template>
  <div>
    <n-alert v-if="loadError" type="error" style="margin-bottom: 16px">
      {{ loadError }}
      <n-button size="small" style="margin-top: 8px" @click="loadProfile">{{ t('common.retry') }}</n-button>
    </n-alert>

    <n-card v-else>
      <n-tabs
        v-model:value="activeTab"
        type="line"
        animated
        :class="{ 'form-sections-mode': layoutMode === 'sections' }"
        @update:value="onTabChange"
      >
        <n-tab-pane name="main" :tab="t('driver.card.section1')">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item :label="t('driver.card.driverId')">
              <n-input :value="form.id" disabled :placeholder="t('driver.card.generatedBySystem')" />
            </n-form-item>
            <n-form-item :label="t('driver.changeRequests.fieldSurname')">
              <div class="field-with-request">
                <n-input v-model:value="form.surname" :placeholder="t('driver.card.placeholderSurname')" :disabled="!isFieldEditable('surname')" />
                <n-button v-if="showRequestBtn('surname')" quaternary size="small" type="info" :loading="requestingFieldKey === 'surname'" @click="requestChange('surname')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('surname')" size="small" type="success" :loading="approvingFieldKey === 'surname'" @click="approveRequestByField('surname')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.changeRequests.fieldGivenName')">
              <div class="field-with-request">
                <n-input v-model:value="form.given_name" :placeholder="t('driver.card.placeholderGivenName')" :disabled="!isFieldEditable('given_name')" />
                <n-button v-if="showRequestBtn('given_name')" quaternary size="small" type="info" :loading="requestingFieldKey === 'given_name'" @click="requestChange('given_name')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('given_name')" size="small" type="success" :loading="approvingFieldKey === 'given_name'" @click="approveRequestByField('given_name')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.patronymic')">
              <div class="field-with-request">
                <n-input v-model:value="form.patronymic" :placeholder="t('driver.card.placeholderPatronymic')" :disabled="!isFieldEditable('patronymic')" />
                <n-button v-if="showRequestBtn('patronymic')" quaternary size="small" type="info" :loading="requestingFieldKey === 'patronymic'" @click="requestChange('patronymic')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('patronymic')" size="small" type="success" :loading="approvingFieldKey === 'patronymic'" @click="approveRequestByField('patronymic')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.dateOfBirth')">
              <div class="field-with-request">
              <n-date-picker
                :value="form.date_of_birth ? new Date(form.date_of_birth).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                :disabled="!isFieldEditable('date_of_birth')"
                @update:value="(v: number | null) => { form.date_of_birth = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
                <n-button v-if="showRequestBtn('date_of_birth')" quaternary size="small" type="info" :loading="requestingFieldKey === 'date_of_birth'" @click="requestChange('date_of_birth')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('date_of_birth')" size="small" type="success" :loading="approvingFieldKey === 'date_of_birth'" @click="approveRequestByField('date_of_birth')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.citizenship')">
              <div class="field-with-request">
              <div class="multi-field">
                <div v-for="(item, i) in form.citizenships" :key="'c-' + i" class="multi-field-row multi-field-row-with-btn">
                  <n-select
                    v-model:value="form.citizenships[i]"
                    :disabled="!isFieldEditable('citizenship', i)"
                    :options="citizenshipOptions"
                    filterable
                    tag
                    :placeholder="t('driver.card.selectOrEnter')"
                    clearable
                    style="flex: 1; margin-bottom: 8px"
                  />
                  <UiDeleteBtn
                    v-if="i > 0"
                    size="tiny"
                    :disabled="!isFieldEditable('citizenship', i)"
                    :confirm-text="t('driver.card.confirmDelete')"
                    @confirm="form.citizenships.splice(i, 1)"
                  />
                  <n-button v-if="showRequestBtn('citizenship', i)" quaternary size="small" type="info" :loading="requestingFieldKey === 'citizenship_' + i" @click="requestChange('citizenship_' + i)">{{ t('driver.card.request') }}</n-button>
                  <n-button v-else-if="showApproveBtn('citizenship', i)" size="small" type="success" :loading="approvingFieldKey === 'citizenship_' + i" @click="approveRequestByField('citizenship_' + i)">{{ t('driver.card.allow') }}</n-button>
                </div>
                <div class="add-row">
                  <n-button quaternary size="small" type="primary" @click="addCitizenship" :disabled="!isAddEditable('citizenship')">{{ t('driver.card.addCitizenship') }}</n-button>
                  <n-button v-if="showRequestBtnForAdd('citizenship')" quaternary size="small" type="info" :loading="requestingFieldKey === 'citizenship_add'" @click="openAddRequestModal('citizenship_add')">{{ t('driver.card.request') }}</n-button>
                  <n-button v-else-if="showApproveBtnForAdd('citizenship')" size="small" type="success" :loading="approvingFieldKey === 'citizenship_add'" @click="approveRequestByField('citizenship_add')">{{ t('driver.card.allow') }}</n-button>
                </div>
              </div>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.gender')">
              <div class="field-with-request">
                <n-select
                  v-model:value="form.gender"
                  :options="genderOptions"
                  :placeholder="t('driver.card.selectOrEnter')"
                  clearable
                  :disabled="!isFieldEditable('gender')"
                />
                <n-button v-if="showRequestBtn('gender')" quaternary size="small" type="info" :loading="requestingFieldKey === 'gender'" @click="requestChange('gender')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('gender')" size="small" type="success" :loading="approvingFieldKey === 'gender'" @click="approveRequestByField('gender')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.contactPhone')">
              <div class="field-with-request">
              <div class="multi-field">
                <div v-for="(item, i) in form.phones" :key="'p-' + i" class="multi-field-row multi-field-row-with-btn">
                  <n-input
                    v-model:value="form.phones[i]"
                    :placeholder="t('driver.card.placeholderPhone')"
                    style="flex: 1; margin-bottom: 8px"
                    :disabled="!isFieldEditable('phone', i)"
                  />
                  <UiDeleteBtn
                    v-if="i > 0"
                    size="tiny"
                    :disabled="!isFieldEditable('phone', i)"
                    :confirm-text="t('driver.card.confirmDelete')"
                    @confirm="form.phones.splice(i, 1)"
                  />
                  <n-button v-if="showRequestBtn('phone', i)" quaternary size="small" type="info" :loading="requestingFieldKey === 'phone_' + i" @click="requestChange('phone_' + i)">{{ t('driver.card.request') }}</n-button>
                  <n-button v-else-if="showApproveBtn('phone', i)" size="small" type="success" :loading="approvingFieldKey === 'phone_' + i" @click="approveRequestByField('phone_' + i)">{{ t('driver.card.allow') }}</n-button>
                </div>
                <div class="add-row">
                  <n-button quaternary size="small" type="primary" @click="addPhone" :disabled="!isAddEditable('phone')">{{ t('driver.card.addPhone') }}</n-button>
                  <n-button v-if="showRequestBtnForAdd('phone')" quaternary size="small" type="info" :loading="requestingFieldKey === 'phone_add'" @click="openAddRequestModal('phone_add')">{{ t('driver.card.request') }}</n-button>
                  <n-button v-else-if="showApproveBtnForAdd('phone')" size="small" type="success" :loading="approvingFieldKey === 'phone_add'" @click="approveRequestByField('phone_add')">{{ t('driver.card.allow') }}</n-button>
                </div>
              </div>
              </div>
            </n-form-item>
            <n-form-item :label="t('common.email')">
              <div class="field-with-request">
              <div class="multi-field">
                <div class="multi-field-row">
                  <n-input :value="form.email" disabled :placeholder="t('driver.card.fromAccountRecord')" style="flex: 1; margin-bottom: 8px" />
                </div>
                <div v-for="(item, i) in form.extra_emails" :key="'e-' + i" class="multi-field-row multi-field-row-with-btn">
                  <n-input
                    v-model:value="form.extra_emails[i]"
                    :placeholder="t('driver.card.extraEmail')"
                    style="flex: 1; margin-bottom: 8px"
                    :disabled="!isFieldEditable('additional_emails', i)"
                  />
                  <UiDeleteBtn
                    size="tiny"
                    :disabled="!isFieldEditable('additional_emails', i)"
                    :confirm-text="t('driver.card.confirmDelete')"
                    @confirm="form.extra_emails.splice(i, 1)"
                  />
                  <n-button v-if="showRequestBtn('additional_emails', i)" quaternary size="small" type="info" :loading="requestingFieldKey === 'additional_emails_' + i" @click="requestChange('additional_emails_' + i)">{{ t('driver.card.request') }}</n-button>
                  <n-button v-else-if="showApproveBtn('additional_emails', i)" size="small" type="success" :loading="approvingFieldKey === 'additional_emails_' + i" @click="approveRequestByField('additional_emails_' + i)">{{ t('driver.card.allow') }}</n-button>
                </div>
                <div class="add-row">
                  <n-button quaternary size="small" type="primary" @click="addEmail" :disabled="!isAddEditable('additional_emails')">{{ t('driver.card.addEmail') }}</n-button>
                  <n-button v-if="showRequestBtnForAdd('additional_emails')" quaternary size="small" type="info" :loading="requestingFieldKey === 'additional_emails_add'" @click="openAddRequestModal('additional_emails_add')">{{ t('driver.card.request') }}</n-button>
                  <n-button v-else-if="showApproveBtnForAdd('additional_emails')" size="small" type="success" :loading="approvingFieldKey === 'additional_emails_add'" @click="approveRequestByField('additional_emails_add')">{{ t('driver.card.allow') }}</n-button>
                </div>
              </div>
              </div>
            </n-form-item>
            <n-form-item :label="t('common.status')">
              <div class="field-with-request">
                <n-select
                  v-model:value="form.status"
                  :options="statusOptions"
                  :placeholder="t('driver.card.selectOrEnter')"
                  clearable
                  :disabled="!isFieldEditable('status')"
                />
                <n-button v-if="showRequestBtn('status')" quaternary size="small" type="info" :loading="requestingFieldKey === 'status'" @click="requestChange('status')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('status')" size="small" type="success" :loading="approvingFieldKey === 'status'" @click="approveRequestByField('status')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.employmentCategory')">
              <div class="field-with-request">
                <n-select
                  v-model:value="form.employment_category"
                  :options="employmentOptions"
                  :placeholder="t('driver.card.selectOrEnter')"
                  clearable
                  :disabled="!isFieldEditable('employment_category')"
                />
                <n-button v-if="showRequestBtn('employment_category')" quaternary size="small" type="info" :loading="requestingFieldKey === 'employment_category'" @click="requestChange('employment_category')">{{ t('driver.card.requestChange') }}</n-button>
                <n-button v-else-if="showApproveBtn('employment_category')" size="small" type="success" :loading="approvingFieldKey === 'employment_category'" @click="approveRequestByField('employment_category')">{{ t('driver.card.allow') }}</n-button>
              </div>
            </n-form-item>
            <n-space v-if="isDriverContext">
              <UiSaveBtn :loading="saving" @click="handleSave" />
              <n-button type="success" :loading="submittingForVerification" @click="handleSubmitForVerification">
                {{ t('driver.card.submitForVerification') }}
              </n-button>
            </n-space>
            <n-button v-else type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="passport" :tab="t('driver.card.section2')">
          <n-form :model="form" label-placement="left" label-width="180" class="form-uniform form-passport-inline" style="max-width: 700px; padding-top: 16px;">
            <!-- Passport 1: collapsible when passport 2 exists -->
            <n-collapse v-if="hasPassport2" class="passport-collapse">
              <n-collapse-item :title="`${t('driver.card.passport2')} (1) ${form.passport_series || ''} ${form.passport_number || ''}`.trim() || `${t('driver.card.passport2')} (1)`" name="p1" default-expanded>
                <div class="passport-block-inner">
                  <n-form-item :label="t('driver.card.passportSeriesNumber')">
                    <div class="passport-series-number-row">
                      <div class="passport-series-wrap">
                        <n-input v-model:value="form.passport_series" placeholder="AB" maxlength="6" :disabled="isDriverContext" />
                      </div>
                      <span class="passport-sep">/</span>
                      <div class="passport-number-wrap">
                        <n-input v-model:value="form.passport_number" placeholder="1234567" :disabled="isDriverContext" />
                      </div>
                    </div>
                  </n-form-item>
                  <n-form-item v-if="!isDriverContext" :label="t('driver.card.passportStatus')">
                    <n-switch v-model:value="form.passport_is_active">
                      <template #checked>{{ t('driver.card.passportActive') }}</template>
                      <template #unchecked>{{ t('driver.card.passportInactive') }}</template>
                    </n-switch>
                  </n-form-item>
                  <n-form-item :label="t('driver.card.passportIssueDate')">
                    <n-date-picker
                      v-if="!isDriverContext"
                      :value="form.passport_issue_date ? new Date(form.passport_issue_date).getTime() : null"
                      type="date"
                      clearable
                      style="width: 100%"
                      @update:value="(v: number | null) => { form.passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                    <n-input v-else :value="form.passport_issue_date" disabled />
                  </n-form-item>
                  <n-form-item :label="t('driver.card.passportExpiryDate')">
                    <n-date-picker
                      v-if="!isDriverContext"
                      :value="form.passport_expiry_date ? new Date(form.passport_expiry_date).getTime() : null"
                      type="date"
                      clearable
                      style="width: 100%"
                      @update:value="(v: number | null) => { form.passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                    />
                    <n-input v-else :value="form.passport_expiry_date" disabled />
                  </n-form-item>
                  <n-form-item :label="t('driver.card.passportIssuedBy')">
                    <n-input v-model:value="form.passport_issued_by" :placeholder="t('driver.card.placeholderIssuedBy')" :disabled="isDriverContext" />
                  </n-form-item>
                  <n-form-item :label="t('driver.card.placeOfBirth')">
                    <n-input v-model:value="form.place_of_birth" :placeholder="t('driver.card.placeholderPlaceOfBirth')" :disabled="isDriverContext" />
                  </n-form-item>
                  <n-form-item :label="t('driver.card.residentialAddress')">
                    <n-input v-model:value="form.residential_address" type="textarea" :placeholder="t('driver.card.placeholderAddress')" :rows="2" :disabled="isDriverContext" />
                  </n-form-item>
                  <n-form-item :label="t('driver.card.passportScan')">
                    <div class="passport-scan-block">
                      <div class="passport-scan-upload">
                        <n-upload
                          v-if="!isDriverContext"
                          :default-file-list="passportFileList"
                          :max="1"
                          accept=".pdf,.jpg,.jpeg,.png"
                          :custom-request="handlePassportUpload"
                        >
                          <n-button>{{ t('driver.card.uploadPdfOrJpg') }}</n-button>
                        </n-upload>
                      </div>
                      <div v-if="form.passport_scan_url" class="scan-preview-row">
                        <div class="scan-preview" @click="openScanModal(form.passport_scan_url, `${t('driver.card.passportScan')} (1)`)">
                          <img v-if="isImageUrl(form.passport_scan_url)" :src="scanFullUrl(form.passport_scan_url)" :alt="t('driver.card.scanPassportShort')" class="scan-thumb" />
                          <div v-else class="scan-thumb scan-thumb-pdf"><span>PDF</span></div>
                          <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.viewScan') }}</n-text>
                        </div>
                        <n-text depth="3" style="font-size: 12px;">{{ isDriverContext ? t('driver.card.fileUploaded') : t('driver.card.fileUploadedSave') }}</n-text>
                      </div>
                    </div>
                  </n-form-item>
                </div>
              </n-collapse-item>
            </n-collapse>
            <template v-else>
            <n-form-item :label="t('driver.card.passportSeriesNumber')">
              <div class="passport-series-number-row">
                <div class="passport-series-wrap">
                  <n-input v-model:value="form.passport_series" placeholder="AB" maxlength="6" :disabled="!isFieldEditable('passport_series')" />
                </div>
                <span class="passport-sep">/</span>
                <div class="passport-number-wrap">
                  <n-input v-model:value="form.passport_number" placeholder="1234567" :disabled="!isFieldEditable('passport_number')" />
                </div>
              </div>
            </n-form-item>
            <n-form-item v-if="!isDriverContext" :label="t('driver.card.passportStatus')">
              <n-switch v-model:value="form.passport_is_active">
<template #checked>{{ t('driver.card.passportActive') }}</template>
                    <template #unchecked>{{ t('driver.card.passportInactive') }}</template>
              </n-switch>
            </n-form-item>
            <n-form-item :label="t('driver.card.passportIssueDate')">
              <n-date-picker
                :value="form.passport_issue_date ? new Date(form.passport_issue_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                :disabled="!isFieldEditable('passport_issue_date')"
                @update:value="(v: number | null) => { form.passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.passportExpiryDate')">
              <n-date-picker
                :value="form.passport_expiry_date ? new Date(form.passport_expiry_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                :disabled="!isFieldEditable('passport_expiry_date')"
                @update:value="(v: number | null) => { form.passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.passportIssuedBy')">
              <n-input v-model:value="form.passport_issued_by" :placeholder="t('driver.card.placeholderIssuedBy')" :disabled="!isFieldEditable('passport_issued_by')" />
            </n-form-item>
            <n-form-item :label="t('driver.card.placeOfBirth')">
              <n-input v-model:value="form.place_of_birth" :placeholder="t('driver.card.placeholderPlaceOfBirth')" :disabled="!isFieldEditable('place_of_birth')" />
            </n-form-item>
            <n-form-item :label="t('driver.card.residentialAddress')">
              <n-input v-model:value="form.residential_address" type="textarea" :placeholder="t('driver.card.placeholderAddress')" :rows="2" :disabled="!isFieldEditable('residential_address')" />
            </n-form-item>
            <n-form-item :label="t('driver.card.passportScan')">
              <div class="passport-scan-block">
                <div class="passport-scan-upload">
                  <n-upload
                    :default-file-list="passportFileList"
                    :max="1"
                    accept=".pdf,.jpg,.jpeg,.png"
                    :custom-request="handlePassportUpload"
                    :disabled="!isFieldEditable('passport_scan_url')"
                  >
                    <n-button :disabled="!isFieldEditable('passport_scan_url')">{{ t('driver.card.uploadPdfOrJpg') }}</n-button>
                  </n-upload>
                </div>
                <div v-if="form.passport_scan_url" class="scan-preview-row">
                  <div class="scan-preview" @click="openScanModal(form.passport_scan_url, t('driver.card.passportScan'))">
                    <img v-if="isImageUrl(form.passport_scan_url)" :src="scanFullUrl(form.passport_scan_url)" :alt="t('driver.card.scanPassportShort')" class="scan-thumb" />
                    <div v-else class="scan-thumb scan-thumb-pdf">
                      <span>PDF</span>
                    </div>
                    <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.viewScan') }}</n-text>
                  </div>
                  <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.fileUploadedSaveHint') }}</n-text>
                </div>
              </div>
            </n-form-item>
            </template>

            <!-- Passport 2 (after passport_add approval) -->
            <template v-if="hasPassport2">
              <n-divider style="margin: 24px 0 16px;">{{ t('driver.card.passport2') }}</n-divider>
              <n-form-item :label="t('driver.card.passportSeriesNumber')">
                <div class="passport-series-number-row">
                  <div class="passport-series-wrap">
                    <n-input v-model:value="form.extra_passports[0].passport_series" placeholder="AB" maxlength="6" :disabled="isPassport2Locked" />
                  </div>
                  <span class="passport-sep">/</span>
                  <div class="passport-number-wrap">
                    <n-input v-model:value="form.extra_passports[0].passport_number" placeholder="1234567" :disabled="isPassport2Locked" />
                  </div>
                </div>
              </n-form-item>
              <n-form-item v-if="!isDriverContext" :label="t('driver.card.passportStatus')">
                <n-switch v-model:value="form.extra_passports[0].is_active">
<template #checked>{{ t('driver.card.passportActive') }}</template>
                    <template #unchecked>{{ t('driver.card.passportInactive') }}</template>
                </n-switch>
              </n-form-item>
              <n-form-item :label="t('driver.card.passportIssueDate')">
                <n-date-picker
                  :value="form.extra_passports[0].passport_issue_date ? new Date(form.extra_passports[0].passport_issue_date).getTime() : null"
                  type="date"
                  clearable
                  style="width: 100%"
                  :disabled="isPassport2Locked"
                  @update:value="(v: number | null) => { form.extra_passports[0].passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.card.passportExpiryDate')">
                <n-date-picker
                  :value="form.extra_passports[0].passport_expiry_date ? new Date(form.extra_passports[0].passport_expiry_date).getTime() : null"
                  type="date"
                  clearable
                  style="width: 100%"
                  :disabled="isPassport2Locked"
                  @update:value="(v: number | null) => { form.extra_passports[0].passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item :label="t('driver.card.passportIssuedBy')">
                <n-input v-model:value="form.extra_passports[0].passport_issued_by" :placeholder="t('driver.card.placeholderIssuedBy')" :disabled="isPassport2Locked" />
              </n-form-item>
              <n-form-item :label="t('driver.card.placeOfBirth')">
                <n-input v-model:value="form.extra_passports[0].place_of_birth" :placeholder="t('driver.card.placeholderPlaceOfBirth')" :disabled="isPassport2Locked" />
              </n-form-item>
              <n-form-item :label="t('driver.card.residentialAddress')">
                <n-input v-model:value="form.extra_passports[0].residential_address" type="textarea" :placeholder="t('driver.card.placeholderAddress')" :rows="2" :disabled="isPassport2Locked" />
              </n-form-item>
              <n-form-item :label="t('driver.card.passportScan')">
                <div class="passport-scan-block">
                  <div class="passport-scan-upload">
                    <n-upload
                      :default-file-list="extraPassportFileList"
                      :max="1"
                      accept=".pdf,.jpg,.jpeg,.png"
                      :custom-request="handleExtraPassportUpload"
                      :disabled="isPassport2Locked"
                    >
                      <n-button :disabled="isPassport2Locked">{{ t('driver.card.uploadPdfOrJpg') }}</n-button>
                    </n-upload>
                  </div>
                  <div v-if="form.extra_passports[0]?.passport_scan_url" class="scan-preview-row">
                    <div class="scan-preview" @click.stop="openScanModalPassport2">
                      <img v-if="isImageUrl(form.extra_passports[0].passport_scan_url!)" :src="scanFullUrl(form.extra_passports[0].passport_scan_url!)" :alt="t('driver.card.scanPassport2Short')" class="scan-thumb" />
                      <div v-else class="scan-thumb scan-thumb-pdf">
                        <span>PDF</span>
                      </div>
                      <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.viewScan') }}</n-text>
                    </div>
                    <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.fileUploadedSaveHint') }}</n-text>
                  </div>
                </div>
              </n-form-item>
            </template>

            <div class="passport-actions">
              <template v-if="isDriverContext">
                <n-space>
                  <n-button v-if="isPassportAddEditable && !hasPassport2" quaternary type="primary" size="small" @click="onAddPassport">
                    {{ t('driver.card.addPassport') }}
                  </n-button>
                  <n-button v-if="showRequestBtnForPassportAdd" quaternary size="small" type="info" :loading="requestingFieldKey === 'passport_add'" @click="requestChange('passport_add')">
                    {{ t('driver.card.request') }}
                  </n-button>
                  <n-button v-else-if="showApproveBtnForPassportAdd" size="small" type="success" :loading="approvingFieldKey === 'passport_add'" @click="approveRequestByField('passport_add')">
                    {{ t('driver.card.allow') }}
                  </n-button>
                </n-space>
              </template>
              <n-space>
                <UiSaveBtn :loading="saving" @click="handleSave" />
                <n-button v-if="isDriverContext" type="success" :loading="submittingForVerification" @click="handleSubmitForVerification">
                  {{ t('driver.card.submitForVerification') }}
                </n-button>
              </n-space>
            </div>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="license" :tab="t('driver.card.section3')">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item :label="t('driver.card.licenseNumber')">
              <n-input v-model:value="form.license_number" placeholder="TM-123456" />
            </n-form-item>
            <n-form-item :label="t('driver.card.licenseCategories')">
              <n-checkbox-group v-model:value="form.license_categories_arr">
                <n-space>
                  <n-checkbox v-for="c in licenseCategories" :key="c.value" :value="c.value" :label="c.label" />
                </n-space>
              </n-checkbox-group>
            </n-form-item>
            <n-form-item :label="t('driver.card.passportIssueDate')">
              <n-date-picker
                :value="form.license_issue_date ? new Date(form.license_issue_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.license_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.passportExpiryDate')">
              <n-date-picker
                :value="form.license_expiry ? new Date(form.license_expiry).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.license_expiry = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.adrIssuedBy')">
              <n-input v-model:value="form.license_issued_by" :placeholder="t('driver.card.placeholderIssuedBy')" />
            </n-form-item>
            <n-form-item :label="t('driver.card.licenseScan')">
              <n-upload
                :default-file-list="licenseFileList"
                :max="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :custom-request="handleLicenseUpload"
              >
                <n-button>{{ t('driver.card.uploadPdfOrJpg') }}</n-button>
              </n-upload>
              <div v-if="form.license_scan_url" class="scan-preview-row">
                <div class="scan-preview" @click="openScanModal(form.license_scan_url, t('driver.card.licenseScan'))">
                  <img v-if="isImageUrl(form.license_scan_url)" :src="scanFullUrl(form.license_scan_url)" :alt="t('driver.card.scanLicenseShort')" class="scan-thumb" />
                  <div v-else class="scan-thumb scan-thumb-pdf">
                    <span>PDF</span>
                  </div>
                  <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.viewScan') }}</n-text>
                </div>
                <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.fileUploadedSave') }}</n-text>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.internationalLicense')">
              <n-select
                v-model:value="form.has_international_license"
                :options="yesNoOptions"
                :placeholder="`${t('common.yes')} / ${t('common.no')}`"
                clearable
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.intlLicenseNumber')">
              <n-input v-model:value="form.international_license_number" placeholder="INT-789456" />
            </n-form-item>
            <n-form-item :label="t('driver.card.intlLicenseValidity')">
              <n-input v-model:value="form.international_license_validity" placeholder="2022-2027" />
            </n-form-item>
            <n-form-item :label="t('driver.documents.validUntil')">
              <n-date-picker
                :value="form.last_medical_examination_date ? new Date(form.last_medical_examination_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.last_medical_examination_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.hireSource')">
              <n-select
                v-model:value="form.hire_source"
                :options="hireSourceOptions"
                :placeholder="t('driver.card.selectOrEnter')"
                clearable
              />
            </n-form-item>
            <n-form-item :label="t('admin.attachedDocuments')">
              <n-input v-model:value="form.attached_documents" type="textarea" :placeholder="t('driver.card.placeholderAttachedDocs')" :rows="2" />
            </n-form-item>
            <n-form-item :label="t('admin.lastUpdateDate')">
              <n-input :value="form.updated_at" disabled :placeholder="t('admin.autoBySystem')" />
            </n-form-item>
            <n-space v-if="isDriverContext">
              <UiSaveBtn :loading="saving" @click="handleSave" />
              <n-button type="success" :loading="submittingForVerification" @click="handleSubmitForVerification">
                {{ t('driver.card.submitForVerification') }}
              </n-button>
            </n-space>
            <n-button v-else type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane name="permits" :tab="t('driver.card.section4')">
          <n-form :model="form" label-placement="top" class="form-uniform" style="max-width: 600px; padding-top: 16px;">
            <n-form-item :label="t('driver.card.entryPermitVisa')">
              <n-input v-model:value="form.permission_entry_zone" type="textarea" :placeholder="t('driver.card.placeholderEntryPermit')" :rows="2" />
            </n-form-item>
            <n-form-item :label="t('driver.documents.issueDate')">
              <n-date-picker
                :value="form.permission_issue_date ? new Date(form.permission_issue_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.permission_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.intlLicenseValidity')">
              <n-date-picker
                :value="form.permission_validity_date ? new Date(form.permission_validity_date).getTime() : null"
                type="date"
                clearable
                style="width: 100%"
                @update:value="(v: number | null) => { form.permission_validity_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>
            <n-form-item :label="t('driver.card.medicalCertificate')">
              <n-input v-model:value="form.medical_certificate" :placeholder="t('driver.card.placeholderMedical')" />
            </n-form-item>
            <n-form-item :label="t('driver.card.scanMedical')">
              <n-upload
                :default-file-list="medicalFileList"
                :max="1"
                accept=".pdf,.jpg,.jpeg,.png"
                :custom-request="handleMedicalUpload"
              >
                <n-button>{{ t('driver.card.uploadPdfOrJpg') }}</n-button>
              </n-upload>
              <div v-if="form.medical_certificate_scan_url" class="scan-preview-row">
                <div class="scan-preview" @click="openScanModal(form.medical_certificate_scan_url, t('driver.card.scanMedical'))">
                  <img v-if="isImageUrl(form.medical_certificate_scan_url)" :src="scanFullUrl(form.medical_certificate_scan_url)" :alt="t('driver.card.scanMedicalShort')" class="scan-thumb" />
                  <div v-else class="scan-thumb scan-thumb-pdf">
                    <span>PDF</span>
                  </div>
                  <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.viewScan') }}</n-text>
                </div>
                <n-text depth="3" style="font-size: 12px;">{{ t('driver.card.fileUploadedSave') }}</n-text>
              </div>
            </n-form-item>
            <n-form-item :label="t('driver.card.techMinCert')">
              <n-input v-model:value="form.technical_minimum_certificate" placeholder="Nº TM-2025-0098" />
            </n-form-item>
            <n-form-item :label="t('driver.card.tachographCard')">
              <n-input v-model:value="form.tachograph_card_number" placeholder="Nº TK-567890" />
            </n-form-item>
            <n-form-item :label="t('driver.card.otherPermits')">
              <n-input v-model:value="form.other_permits" type="textarea" :placeholder="t('driver.card.placeholderOtherPermits')" :rows="2" />
            </n-form-item>
            <template v-if="isDriverContext">
            <n-form-item :label="t('admin.company')">
              <n-input v-model:value="form.company_name" :placeholder="t('driver.card.placeholderCompany')" />
            </n-form-item>
            <n-form-item :label="t('admin.inn')">
              <n-input v-model:value="form.inn" :placeholder="t('driver.card.placeholderInn')" />
            </n-form-item>
            <n-form-item :label="t('admin.address')">
              <n-input v-model:value="form.address" type="textarea" :placeholder="t('driver.card.placeholderLegalAddress')" :rows="2" />
            </n-form-item>
            </template>
            <n-space v-if="isDriverContext">
              <UiSaveBtn :loading="saving" @click="handleSave" />
              <n-button type="success" :loading="submittingForVerification" @click="handleSubmitForVerification">
                {{ t('driver.card.submitForVerification') }}
              </n-button>
            </n-space>
            <n-button v-else type="primary" :loading="saving" @click="handleSave">{{ t('common.save') }}</n-button>
          </n-form>
        </n-tab-pane>

        <n-tab-pane v-if="!isDriverContext && layoutMode !== 'sections'" name="requests" :tab="t('driver.card.sectionRequests')">
          <div style="padding: 16px 0; max-width: 600px;">
            <n-empty v-if="editRequests.length === 0" :description="t('driver.changeRequests.noItems')" />
            <n-space v-else vertical>
              <div v-for="r in editRequests" :key="r.id" class="edit-request-row">
                <div>
                  <n-text strong>{{ fieldLabel(r.field_key) }}</n-text>
                  <n-tag v-if="r.status === 'pending'" type="warning" size="small" style="margin-left: 8px;">{{ t('driver.changeRequests.statusPending') }}</n-tag>
                  <n-tag v-else size="small" style="margin-left: 8px;">{{ r.status }}</n-tag>
                  <n-text v-if="r.field_value" depth="2" style="display: block; font-size: 13px; margin-top: 2px;">{{ r.field_value }}</n-text>
                  <n-text depth="3" style="display: block; font-size: 12px;">{{ r.driver_comment || t('driver.card.noComment') }} · {{ formatDate(r.requested_at) }}</n-text>
                </div>
                <n-button v-if="r.status === 'pending'" size="small" type="success" :loading="approvingFieldKey === r.field_key" @click="approveRequestByField(r.field_key)">
                  {{ t('driver.card.allow') }}
                </n-button>
              </div>
            </n-space>
          </div>
        </n-tab-pane>

      </n-tabs>
    </n-card>

    <n-modal v-model:show="addRequestModal" preset="dialog" :title="t('driver.changeRequests.addRequestModal')" :loading="requestingFieldKey === addRequestFieldKey" :positive-text="t('common.send')" :negative-text="t('common.cancel')" @positive-click="submitAddRequest" @negative-click="closeAddRequestModal">
      <n-form-item :label="`${t('driver.card.whatToAdd')} (${addRequestLabel})`">
        <n-input v-model:value="addRequestValue" :placeholder="addRequestPlaceholder" />
      </n-form-item>
    </n-modal>

    <Teleport to="body">
      <Transition name="scan-modal-fade">
        <div v-if="scanModalVisible" class="scan-modal-overlay">
          <div
            ref="scanModalEl"
            class="scan-modal-draggable"
            :style="{ left: modalPos.x + 'px', top: modalPos.y + 'px' }"
            @mousedown="onModalContentMousedown"
          >
            <div
              class="scan-modal-header"
              @mousedown.stop="startDrag"
            >
              <span class="scan-modal-title">{{ scanModalTitle }}</span>
              <n-button quaternary circle size="small" @click="closeScanModal">
                <template #icon>
                  <span style="font-size: 18px; line-height: 1;">×</span>
                </template>
              </n-button>
            </div>
            <div v-if="scanModalUrl" class="scan-modal-body">
              <img v-if="isImageUrl(scanModalUrl)" :src="scanFullUrl(scanModalUrl)" alt="" class="scan-modal-img" />
              <iframe v-else :src="scanFullUrl(scanModalUrl)" class="scan-modal-iframe" :title="t('driver.card.documentTitle')" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { citizenships, licenseCategories } from '@tmgo/shared'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    loadUrl: string
    saveUrl: string
    saveMethod: 'PATCH'
    apiBase: string
    activeTab?: string
    /** Driver mode: lock fields during verification, two buttons */
    isDriverContext?: boolean
    /** When provided — form is filled from it without fetch (for admin) */
    initialProfile?: Record<string, any> | null
    /** 'tabs' = tabbed layout, 'sections' = all 4 sections in one scroll like DriverCardV2 */
    layoutMode?: 'tabs' | 'sections'
  }>(),
  { activeTab: 'main', isDriverContext: false, layoutMode: 'tabs' }
)

const emit = defineEmits<{ saved: []; 'update:activeTab': [value: string] }>()

const citizenshipOptions = computed(() =>
  citizenships.map((c) => ({ label: c, value: c }))
)

const message = useMessage()
const saving = ref(false)
const submittingForVerification = ref(false)
const requestingFieldKey = ref<string | null>(null)
const approvingFieldKey = ref<string | null>(null)

const verificationStatus = ref<string>('not_verified')
const unlockedFields = ref<string[]>([])
const editRequests = ref<Array<{ id: string; field_key: string; status: string; driver_comment?: string; requested_at: string; field_value?: string }>>([])
const originalPhoneCount = ref(0)
const originalCitizenshipCount = ref(0)
const originalEmailCount = ref(0)

const FIELD_I18N_KEYS: Record<string, string> = {
  surname: 'driver.card.fieldLabels.surname', given_name: 'driver.card.fieldLabels.given_name',
  patronymic: 'driver.card.fieldLabels.patronymic', date_of_birth: 'driver.card.fieldLabels.date_of_birth',
  citizenship: 'driver.card.fieldLabels.citizenship', gender: 'driver.card.fieldLabels.gender',
  status: 'driver.card.fieldLabels.status', employment_category: 'driver.card.fieldLabels.employment_category',
  phone: 'driver.card.fieldLabels.phone', additional_emails: 'driver.card.fieldLabels.additional_emails',
  company_name: 'driver.card.fieldLabels.company_name', license_number: 'driver.card.fieldLabels.license_number',
  passport_series: 'driver.card.fieldLabels.passport_series', passport_number: 'driver.card.fieldLabels.passport_number',
  passport_series_number: 'driver.card.fieldLabels.passport_series_number',
  passport_issue_date: 'driver.card.fieldLabels.passport_issue_date', passport_expiry_date: 'driver.card.fieldLabels.passport_expiry_date',
  passport_issued_by: 'driver.card.fieldLabels.passport_issued_by', place_of_birth: 'driver.card.fieldLabels.place_of_birth',
  residential_address: 'driver.card.fieldLabels.residential_address', passport_scan_url: 'driver.card.fieldLabels.passport_scan_url',
  passport_add: 'driver.card.fieldLabels.passport_add',
}

function fieldLabel(key: string) {
  const m = key.match(/^(.+)_(\d+)$/)
  if (m) {
    const baseKey = FIELD_I18N_KEYS[m[1]] ? t(FIELD_I18N_KEYS[m[1]]) : m[1]
    return `${baseKey} (${parseInt(m[2], 10) + 1})`
  }
  if (key.endsWith('_add')) {
    const baseKey = key.replace(/_add$/, '')
    const label = FIELD_I18N_KEYS[baseKey] ? t(FIELD_I18N_KEYS[baseKey]) : baseKey
    return `${label}${t('driver.card.addToField')}`
  }
  return FIELD_I18N_KEYS[key] ? t(FIELD_I18N_KEYS[key]) : key
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ru-RU')
}

const editRequestsUrl = computed(() => {
  const base = props.loadUrl.replace(/\/$/, '')
  return base.includes('/admin/') ? base.replace(/driver-profile\/?$/, 'edit-requests') : base + '/edit-requests'
})

async function loadEditRequests() {
  if (props.isDriverContext) return
  try {
    const list = await $fetch<any[]>(editRequestsUrl.value, { credentials: 'include' })
    editRequests.value = Array.isArray(list) ? list : []
  } catch {
    editRequests.value = []
  }
}

const isLocked = computed(() =>
  props.isDriverContext && ['waiting_verification', 'verified', 'request'].includes(verificationStatus.value)
)

/** Second passport fields are locked for driver after submit for verification. Admin can always edit. */
const isPassport2Locked = computed(() =>
  props.isDriverContext && isLocked.value
)

const COMBINED_FIELDS: Record<string, string[]> = { passport_series_number: ['passport_series', 'passport_number'] }

function isFieldEditable(fieldKey: string, index?: number) {
  if (!isLocked.value) return true
  if (unlockedFields.value.includes(fieldKey)) return true
  const combinedForField = Object.entries(COMBINED_FIELDS).find(([, keys]) => keys.includes(fieldKey))
  if (combinedForField && unlockedFields.value.includes(combinedForField[0])) return true
  const keysForCombined = COMBINED_FIELDS[fieldKey]
  if (keysForCombined && keysForCombined.some((k) => unlockedFields.value.includes(k))) return true
  if (index !== undefined && ['phone', 'citizenship', 'additional_emails'].includes(fieldKey)) {
    const origCount = fieldKey === 'phone' ? originalPhoneCount.value : fieldKey === 'citizenship' ? originalCitizenshipCount.value : originalEmailCount.value
    if (index >= origCount && isAddEditable(fieldKey)) return true
  }
  const key = index !== undefined ? `${fieldKey}_${index}` : fieldKey
  return unlockedFields.value.includes(key)
}

function isAddEditable(fieldKey: string) {
  if (!isLocked.value) return true
  return unlockedFields.value.includes(`${fieldKey}_add`) || unlockedFields.value.includes(fieldKey)
}

function showRequestBtn(fieldKey: string, index?: number) {
  if (!props.isDriverContext || !isLocked.value) return false
  if (isFieldEditable(fieldKey, index)) return false
  if (index !== undefined && index >= 0 && ['phone', 'citizenship', 'additional_emails'].includes(fieldKey)) {
    const origCount = fieldKey === 'phone' ? originalPhoneCount.value : fieldKey === 'citizenship' ? originalCitizenshipCount.value : originalEmailCount.value
    if (index >= origCount) return false
  }
  const key = index === -1 ? `${fieldKey}_add` : index !== undefined ? `${fieldKey}_${index}` : fieldKey
  return !unlockedFields.value.includes(key) && !unlockedFields.value.includes(fieldKey)
}

function showRequestBtnForAdd(fieldKey: string) {
  return showRequestBtn(fieldKey, -1)
}

function showApproveBtnForAdd(fieldKey: string) {
  return showApproveBtn(fieldKey, -1)
}

function showApproveBtn(fieldKey: string, index?: number) {
  if (props.isDriverContext) return false
  if (index !== undefined && index >= 0 && ['phone', 'citizenship', 'additional_emails'].includes(fieldKey)) {
    const origCount = fieldKey === 'phone' ? originalPhoneCount.value : fieldKey === 'citizenship' ? originalCitizenshipCount.value : originalEmailCount.value
    if (index >= origCount) return false
  }
  const key = index === -1 ? `${fieldKey}_add` : index !== undefined ? `${fieldKey}_${index}` : fieldKey
  const req = editRequests.value.find((r) => r.field_key === key && r.status === 'pending')
  return !!req
}

const approveBaseUrl = computed(() => {
  const base = props.loadUrl.replace(/\/$/, '')
  return base.replace(/\/driver-profile\/?$/, '')
})

async function approveRequestByField(fieldKey: string) {
  const req = editRequests.value.find((r) => r.field_key === fieldKey && r.status === 'pending')
  if (!req) return
  approvingFieldKey.value = fieldKey
  try {
    await $fetch(`${approveBaseUrl.value}/edit-requests/${req.id}/approve`, {
      method: 'POST',
      credentials: 'include',
    })
    message.success(t('driver.card.approveEditSuccess', { field: fieldLabel(fieldKey) }))
    await loadEditRequests()
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || e?.message || t('common.error'))
  } finally {
    approvingFieldKey.value = null
  }
}

const addRequestModal = ref(false)
const addRequestFieldKey = ref('')
const addRequestValue = ref('')
const addRequestLabel = computed(() => {
  if (addRequestFieldKey.value === 'citizenship_add') return t('driver.card.addRequestCitizenship')
  if (addRequestFieldKey.value === 'phone_add') return t('driver.card.addRequestPhone')
  if (addRequestFieldKey.value === 'additional_emails_add') return t('driver.card.addRequestEmail')
  return ''
})

const addRequestPlaceholder = computed(() => {
  if (addRequestFieldKey.value === 'phone_add') return t('driver.card.placeholderPhone')
  if (addRequestFieldKey.value === 'citizenship_add') return t('driver.card.placeholderCitizenship')
  if (addRequestFieldKey.value === 'additional_emails_add') return t('driver.card.placeholderEmail')
  return ''
})

function openAddRequestModal(fieldKey: string) {
  addRequestFieldKey.value = fieldKey
  addRequestValue.value = ''
  addRequestModal.value = true
}

function closeAddRequestModal() {
  addRequestModal.value = false
  addRequestFieldKey.value = ''
  addRequestValue.value = ''
}

const FIELD_KEY_MAP: Record<string, string> = {
  passport_add: 'passport:add',
  citizenship_add: 'citizenship:add',
  additional_emails_add: 'identity_correction',
  phone_add: 'identity_correction',
}

async function requestChange(fieldKey: string, requestedValue?: string) {
  requestingFieldKey.value = fieldKey
  try {
    const mappedKey = FIELD_KEY_MAP[fieldKey] || fieldKey
    const base = props.apiBase
    const body: { field_key: string; reason: string; requested_value?: string } = {
      field_key: mappedKey,
      reason: requestedValue?.trim() || t('driver.card.requestChangeReason'),
    }
    if (requestedValue?.trim()) body.requested_value = requestedValue.trim()
    await $fetch(`${base}/cabinet/driver/change-requests`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    message.success(t('driver.card.requestSent'))
    await loadEditRequests()
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.requestError'))
  } finally {
    requestingFieldKey.value = null
  }
}

async function submitAddRequest() {
  if (!addRequestFieldKey.value) return
  try {
    await requestChange(addRequestFieldKey.value, addRequestValue.value)
    closeAddRequestModal()
  } catch {
    // requestChange shows error, keep modal open
  }
}

async function handleSubmitForVerification() {
  submittingForVerification.value = true
  try {
    const base = props.loadUrl.replace(/\/$/, '')
    const body = buildSaveBody()
    const res = await $fetch<any>(`${base}/submit-for-verification`, {
      method: 'POST',
      credentials: 'include',
      body,
    })
    verificationStatus.value = res?.verification_status ?? 'waiting_verification'
    unlockedFields.value = []
    message.success(t('driver.card.submittedSuccess'))
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.requestError'))
  } finally {
    submittingForVerification.value = false
  }
}

const hasPassport2 = computed(() => form.extra_passports.length > 0)
const isPassportAddEditable = () => isAddEditable('passport')
const showRequestBtnForPassportAdd = () => showRequestBtn('passport_add')
const showApproveBtnForPassportAdd = () => showApproveBtn('passport_add')

function onAddPassport() {
  if (!isPassportAddEditable()) return
  form.extra_passports.push({
    passport_series: '',
    passport_number: '',
    passport_issue_date: null,
    passport_expiry_date: null,
    passport_issued_by: '',
    place_of_birth: '',
    residential_address: '',
    passport_scan_url: '',
  })
}
const scanModalVisible = ref(false)
const scanModalUrl = ref<string | null>(null)
const scanModalTitle = ref('')
const scanModalEl = ref<HTMLElement | null>(null)

const modalPos = ref({ x: 0, y: 0 })
let dragStart = { x: 0, y: 0, posX: 0, posY: 0 }

function centerModal() {
  if (typeof window === 'undefined') return
  const w = 900
  const h = Math.min(window.innerHeight * 0.9, 700)
  modalPos.value = {
    x: Math.max(0, (window.innerWidth - w) / 2),
    y: Math.max(0, (window.innerHeight - h) / 2),
  }
}

function startDrag(e: MouseEvent) {
  dragStart = { x: e.clientX, y: e.clientY, posX: modalPos.value.x, posY: modalPos.value.y }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDrag)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - dragStart.x
  const dy = e.clientY - dragStart.y
  modalPos.value = {
    x: Math.max(0, dragStart.posX + dx),
    y: Math.max(0, dragStart.posY + dy),
  }
}

function stopDrag() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
}

function onModalContentMousedown(e: MouseEvent) {
  e.stopPropagation()
}

function closeScanModal() {
  scanModalVisible.value = false
  scanModalUrl.value = null
}

function isImageUrl(url: string) {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif')
}

function scanFullUrl(path: string) {
  if (!path) return ''
  return path.startsWith('http') ? path : `${props.apiBase}${path}`
}

function openScanModal(url: string, title: string) {
  scanModalUrl.value = url
  scanModalTitle.value = title
  centerModal()
  scanModalVisible.value = true
}

function openScanModalPassport2() {
  const url = form.extra_passports[0]?.passport_scan_url
  if (url) {
    openScanModal(url, t('driver.card.scanPassport2Short'))
  } else {
    message.warning(t('driver.card.scanSecondPassportNotFound'))
  }
}
const loadError = ref<string | null>(null)
const activeTab = ref(props.activeTab)
watch(() => props.activeTab, (v) => {
  if (v && tabNames.includes(v as any)) activeTab.value = v
})

const tabNames = ['main', 'passport', 'license', 'permits', 'requests'] as const

const uploadBaseUrl = computed(() => props.loadUrl.replace(/\/$/, ''))

const genderOptions = computed(() => [
  { label: t('driver.card.male'), value: 'male' },
  { label: t('driver.card.female'), value: 'female' },
])

const statusOptions = computed(() => [
  { label: t('driver.card.statusActive'), value: 'active' },
  { label: t('driver.card.statusInactive'), value: 'inactive' },
  { label: t('driver.card.statusOnLeave'), value: 'on_leave' },
  { label: t('driver.card.statusFired'), value: 'fired' },
])

const employmentOptions = computed(() => [
  { label: t('driver.card.employmentFullTime'), value: 'full_time' },
  { label: t('driver.card.employmentFreelance'), value: 'freelance' },
  { label: t('driver.card.employmentLeased'), value: 'leased' },
])

const yesNoOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
])

const hireSourceOptions = computed(() => [
  { label: t('driver.card.hireSourceRecommendation'), value: 'recommendation' },
  { label: t('driver.card.hireSourceAdvertisement'), value: 'advertisement' },
  { label: t('driver.card.hireSourceAgency'), value: 'agency' },
])

const passportFileList = computed(() =>
  form.passport_scan_url
    ? [{ id: '1', name: t('driver.card.scanPassportShort'), status: 'done' as const, url: `${props.apiBase}${form.passport_scan_url}` }]
    : [],
)

async function handlePassportUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-passport`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    form.passport_scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

const extraPassportFileList = computed(() => {
  const url = form.extra_passports[0]?.passport_scan_url
  if (!url) return []
  const fullUrl = url.startsWith('http') ? url : `${props.apiBase}${url}`
  return [{ id: 'extra-1', name: t('driver.card.scanPassport2Short'), status: 'done' as const, url: fullUrl }]
})

async function handleExtraPassportUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    fd.append('index', '0')
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-extra-passport`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    if (form.extra_passports.length === 0) {
      form.extra_passports.push({
        passport_series: '', passport_number: '', passport_issue_date: null, passport_expiry_date: null,
        passport_issued_by: '', place_of_birth: '', residential_address: '', passport_scan_url: res.url,
      })
    } else {
      form.extra_passports[0] = { ...form.extra_passports[0], passport_scan_url: res.url }
    }
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

const licenseFileList = computed(() =>
  form.license_scan_url
    ? [{ id: '1', name: t('driver.card.scanLicenseShort'), status: 'done' as const, url: `${props.apiBase}${form.license_scan_url}` }]
    : [],
)

async function handleLicenseUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-license`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    form.license_scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

const medicalFileList = computed(() =>
  form.medical_certificate_scan_url
    ? [{ id: '1', name: t('driver.card.scanMedicalShort'), status: 'done' as const, url: `${props.apiBase}${form.medical_certificate_scan_url}` }]
    : [],
)

async function handleMedicalUpload({ file, onFinish, onError }: { file: { file: File }; onFinish: () => void; onError: (e: Error) => void }) {
  try {
    const fd = new FormData()
    fd.append('file', file.file, file.file.name)
    const res = await $fetch<{ url: string }>(`${uploadBaseUrl.value}/upload-medical`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    form.medical_certificate_scan_url = res.url
    message.success(t('driver.card.fileUploadedSaveHint'))
    onFinish()
  } catch (e: any) {
    message.error(e?.data?.error || t('common.uploadError'))
    onError(e)
  }
}

const form = reactive({
  id: '' as string,
  surname: '' as string,
  given_name: '' as string,
  patronymic: '' as string,
  date_of_birth: null as string | null,
  citizenships: [''] as string[],
  gender: null as string | null,
  phones: [''] as string[],
  email: '' as string,
  extra_emails: [] as string[],
  status: null as string | null,
  employment_category: null as string | null,
  company_name: '' as string,
  license_number: '' as string,
  license_expiry: null as string | null,
  license_categories: '' as string,
  license_categories_arr: [] as string[],
  license_issue_date: null as string | null,
  license_issued_by: '' as string,
  license_scan_url: '' as string,
  has_international_license: null as boolean | null,
  international_license_number: '' as string,
  international_license_validity: '' as string,
  last_medical_examination_date: null as string | null,
  hire_source: null as string | null,
  attached_documents: '' as string,
  updated_at: '' as string,
  permission_entry_zone: '' as string,
  permission_issue_date: null as string | null,
  permission_validity_date: null as string | null,
  medical_certificate: '' as string,
  medical_certificate_scan_url: '' as string,
  technical_minimum_certificate: '' as string,
  tachograph_card_number: '' as string,
  other_permits: '' as string,
  inn: '' as string,
  address: '' as string,
  passport_series: '' as string,
  passport_number: '' as string,
  passport_issue_date: null as string | null,
  passport_expiry_date: null as string | null,
  passport_issued_by: '' as string,
  place_of_birth: '' as string,
  residential_address: '' as string,
  passport_scan_url: '' as string,
  passport_is_active: true as boolean,
  extra_passports: [] as Array<{
    passport_series?: string;
    passport_number?: string;
    passport_issue_date?: string | null;
    passport_expiry_date?: string | null;
    passport_issued_by?: string;
    place_of_birth?: string;
    residential_address?: string;
    passport_scan_url?: string;
    is_active?: boolean;
  }>,
  bank_name: '' as string,
  bank_account: '' as string,
  bank_bik: '' as string,
})

function applyProfileData(data: Record<string, any>) {
  if (!data) return
  form.id = data.id ?? ''
  form.surname = data.surname ?? ''
  form.given_name = data.given_name ?? ''
  form.patronymic = data.patronymic ?? ''
  form.date_of_birth = data.date_of_birth ?? null
  const c = (data.citizenship ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
  form.citizenships = c.length ? c : ['']
  originalCitizenshipCount.value = form.citizenships.length
  form.gender = data.gender ?? null
  const p = (data.phone ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
  form.phones = p.length ? p : ['']
  originalPhoneCount.value = form.phones.length
  form.email = data.email ?? ''
  const e = (data.additional_emails ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
  form.extra_emails = e
  originalEmailCount.value = form.extra_emails.length
  form.status = data.status ?? null
  form.employment_category = data.employment_category ?? null
  form.company_name = data.company_name ?? ''
  form.license_number = data.license_number ?? ''
  form.license_expiry = data.license_expiry ?? null
  form.license_categories = data.license_categories ?? ''
  form.license_categories_arr = data.license_categories ? data.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean) : []
  form.license_issue_date = data.license_issue_date ?? null
  form.license_issued_by = data.license_issued_by ?? ''
  form.license_scan_url = data.license_scan_url ?? ''
  form.has_international_license = data.has_international_license ?? null
  form.international_license_number = data.international_license_number ?? ''
  form.international_license_validity = data.international_license_validity ?? ''
  form.last_medical_examination_date = data.last_medical_examination_date ?? null
  form.hire_source = data.hire_source ?? null
  form.attached_documents = data.attached_documents ?? ''
  form.updated_at = data.updated_at ?? ''
  form.permission_entry_zone = data.permission_entry_zone ?? ''
  form.permission_issue_date = data.permission_issue_date ?? null
  form.permission_validity_date = data.permission_validity_date ?? null
  form.medical_certificate = data.medical_certificate ?? ''
  form.medical_certificate_scan_url = data.medical_certificate_scan_url ?? ''
  form.technical_minimum_certificate = data.technical_minimum_certificate ?? ''
  form.tachograph_card_number = data.tachograph_card_number ?? ''
  form.other_permits = data.other_permits ?? ''
  form.inn = data.inn ?? ''
  form.address = data.address ?? ''
  let ps = data.passport_series ?? ''
  let pn = data.passport_number ?? ''
  if (!pn && ps.includes(' ')) {
    const [a, b] = ps.split(/\s+/, 2)
    if (a && b) {
      ps = a.trim()
      pn = b.replace(/\D/g, '')
    }
  }
  form.passport_series = ps
  form.passport_number = pn
  form.passport_issue_date = data.passport_issue_date ?? null
  form.passport_expiry_date = data.passport_expiry_date ?? null
  form.passport_issued_by = data.passport_issued_by ?? ''
  form.place_of_birth = data.place_of_birth ?? ''
  form.residential_address = data.residential_address ?? ''
  form.passport_scan_url = data.passport_scan_url ?? ''
  form.passport_is_active = data.passport_is_active ?? true
  form.extra_passports = Array.isArray(data.extra_passports) ? data.extra_passports.map((p: any) => ({
    passport_series: p.passport_series ?? '',
    passport_number: p.passport_number ?? '',
    passport_issue_date: p.passport_issue_date ?? null,
    passport_expiry_date: p.passport_expiry_date ?? null,
    passport_issued_by: p.passport_issued_by ?? '',
    place_of_birth: p.place_of_birth ?? '',
    residential_address: p.residential_address ?? '',
    passport_scan_url: p.passport_scan_url ?? '',
    is_active: p.is_active ?? true,
  })) : []
  form.bank_name = data.bank_name ?? ''
  form.bank_account = data.bank_account ?? ''
  form.bank_bik = data.bank_bik ?? ''
  verificationStatus.value = data.verification_status ?? 'not_verified'
  unlockedFields.value = Array.isArray(data.unlocked_fields) ? data.unlocked_fields : []
  if (props.adminEditedFields && Array.isArray(data.admin_edited_fields)) {
    props.adminEditedFields.value = data.admin_edited_fields
  }
}

watch(
  () => props.initialProfile,
  async (data) => {
    if (data && Object.keys(data).length) {
      applyProfileData(data)
      if (!props.isDriverContext) await loadEditRequests()
    }
  },
  { immediate: true }
)

async function loadProfile(forceFetch = false) {
  if (!forceFetch && props.initialProfile && Object.keys(props.initialProfile).length) {
    applyProfileData(props.initialProfile)
    await loadEditRequests()
    return
  }
  loadError.value = null
  try {
    const data = await $fetch<any>(props.loadUrl, { credentials: 'include' })
    applyProfileData(data)
    await loadEditRequests()
  } catch (e: any) {
    loadError.value = e?.data?.error || t('driver.card.loadProfileError')
  }
}

function buildSaveBody() {
  return {
    surname: form.surname || null,
    given_name: form.given_name || null,
    patronymic: form.patronymic || null,
    date_of_birth: form.date_of_birth || null,
    citizenship: form.citizenships.filter(Boolean).join(', ') || null,
    gender: form.gender || null,
    status: form.status || null,
    employment_category: form.employment_category || null,
    company_name: form.company_name || null,
    license_number: form.license_number || null,
    license_expiry: form.license_expiry || null,
    license_categories: (form.license_categories_arr?.length ? form.license_categories_arr.join(', ') : form.license_categories) || null,
    license_issue_date: form.license_issue_date || null,
    license_issued_by: form.license_issued_by || null,
    license_scan_url: form.license_scan_url || null,
    has_international_license: form.has_international_license ?? null,
    international_license_number: form.international_license_number || null,
    international_license_validity: form.international_license_validity || null,
    last_medical_examination_date: form.last_medical_examination_date || null,
    hire_source: form.hire_source || null,
    attached_documents: form.attached_documents || null,
    permission_entry_zone: form.permission_entry_zone || null,
    permission_issue_date: form.permission_issue_date || null,
    permission_validity_date: form.permission_validity_date || null,
    medical_certificate: form.medical_certificate || null,
    medical_certificate_scan_url: form.medical_certificate_scan_url || null,
    technical_minimum_certificate: form.technical_minimum_certificate || null,
    tachograph_card_number: form.tachograph_card_number || null,
    other_permits: form.other_permits || null,
    phone: form.phones.filter(Boolean).join(', ') || null,
    additional_emails: form.extra_emails.filter(Boolean).join(', ') || null,
    inn: form.inn || null,
    address: form.address || null,
    passport_series: form.passport_series || null,
    passport_number: form.passport_number || null,
    passport_issue_date: form.passport_issue_date || null,
    passport_expiry_date: form.passport_expiry_date || null,
    passport_issued_by: form.passport_issued_by || null,
    place_of_birth: form.place_of_birth || null,
    residential_address: form.residential_address || null,
    passport_scan_url: form.passport_scan_url || null,
    passport_is_active: form.passport_is_active,
    extra_passports: form.extra_passports.map((p) => ({
      passport_series: p.passport_series || null,
      passport_number: p.passport_number || null,
      passport_issue_date: p.passport_issue_date || null,
      passport_expiry_date: p.passport_expiry_date || null,
      passport_issued_by: p.passport_issued_by || null,
      place_of_birth: p.place_of_birth || null,
      residential_address: p.residential_address || null,
      passport_scan_url: p.passport_scan_url || null,
      is_active: p.is_active ?? true,
    })),
    bank_name: form.bank_name || null,
    bank_account: form.bank_account || null,
    bank_bik: form.bank_bik || null,
  }
}

async function handleSave() {
  saving.value = true
  try {
    await $fetch(props.saveUrl, {
      method: props.saveMethod,
      credentials: 'include',
      body: buildSaveBody(),
    })
    message.success(t('driver.card.cardSaved'))
    // Reload data after save to refresh reactive refs and file lists
    await loadProfile(true)
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || t('common.saveError'))
  } finally {
    saving.value = false
  }
}

function addCitizenship() {
  form.citizenships.push('')
}
function addPhone() {
  form.phones.push('')
}
function addEmail() {
  form.extra_emails.push('')
}

function onTabChange(name: string) {
  emit('update:activeTab', name)
}

defineExpose({
  loadProfile,
  handleSave,
})
</script>

<style scoped>
.form-uniform :deep(.n-form-item .n-input),
.form-uniform :deep(.n-form-item .n-select),
.form-uniform :deep(.n-form-item .n-date-picker) {
  width: 100%;
}
.form-uniform .multi-field {
  width: 100%;
}
.multi-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.multi-field-row .remove-btn {
  flex-shrink: 0;
  min-width: 32px;
}
.multi-field-row .n-input,
.multi-field-row .n-select {
  min-width: 0;
  flex: 1;
}

.field-with-request {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}
.field-with-request > .n-input,
.field-with-request > .n-date-picker,
.field-with-request > .n-select,
.field-with-request > .multi-field {
  flex: 1;
  min-width: 0;
}
.field-with-request > .n-button {
  flex-shrink: 0;
  white-space: nowrap;
}
.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.multi-field-row-with-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.multi-field-row-with-btn > .n-input,
.multi-field-row-with-btn > .n-select {
  flex: 1;
  min-width: 0;
}

.form-passport-inline .n-form-item .n-form-item-label {
  padding-right: 16px;
}
.form-passport-inline .n-form-item .n-form-item-blank {
  flex: 1;
  min-width: 0;
}
.passport-series-number-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}
.passport-series-wrap {
  width: 72px;
  flex-shrink: 0;
}
.passport-series-wrap .n-input {
  width: 100%;
}
.passport-sep {
  color: var(--n-text-color-3);
  font-size: 14px;
  flex-shrink: 0;
}
.passport-number-wrap {
  flex: 1;
  min-width: 0;
}
.passport-number-wrap .n-input {
  width: 100%;
}
.passport-scan-block {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.passport-scan-upload {
  flex-shrink: 0;
}
.passport-scan-block .scan-preview-row {
  margin-top: 0;
}
.passport-collapse {
  margin-bottom: 16px;
}
.passport-collapse .n-collapse-item__header {
  font-weight: 600;
}
.passport-block-inner {
  padding: 8px 0;
}
.passport-block-inner .n-form-item {
  margin-bottom: 12px;
}
.passport-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}
@media (max-width: 600px) {
  .form-passport-inline {
    --n-form-item-label-width: 140px;
  }
  .form-passport-inline .n-form-item {
    flex-direction: column;
    align-items: stretch;
  }
  .form-passport-inline .n-form-item .n-form-item-label {
    padding-right: 0;
  }
}

.scan-preview-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.scan-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  transition: background 0.2s, border-color 0.2s;
}
.scan-preview:hover {
  background: var(--n-color-hover);
  border-color: var(--n-color-primary);
}
.scan-thumb {
  width: 80px;
  height: 60px;
  object-fit: contain;
  border-radius: 4px;
}
.scan-thumb-pdf {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
}
.scan-modal-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  z-index: 9999;
  pointer-events: none;
}
.scan-modal-draggable {
  position: fixed;
  width: 90vw;
  max-width: 900px;
  max-height: 90vh;
  background: var(--n-color-modal, #fff);
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10000;
  pointer-events: auto;
}
.scan-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--n-border-color, #e5e7eb);
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}
.scan-modal-title {
  font-weight: 600;
  font-size: 16px;
}
.scan-modal-body {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 400px;
  padding: 16px;
}
.scan-modal-img {
  max-width: 100%;
  max-height: calc(90vh - 80px);
  object-fit: contain;
}
.scan-modal-iframe {
  width: 100%;
  min-height: 60vh;
  border: none;
}
.scan-modal-fade-enter-active,
.scan-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.scan-modal-fade-enter-from,
.scan-modal-fade-leave-to {
  opacity: 0;
}

.edit-request-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--n-border-color);
}
.edit-request-row:last-child {
  border-bottom: none;
}

/* Sections mode: all 4 sections in one scroll like DriverCardV2 */
.form-sections-mode :deep(.n-tabs-nav) {
  display: none;
}
.form-sections-mode :deep(.n-tabs-pane-wrapper),
.form-sections-mode :deep(.n-tabs-pane-wrapper > div) {
  display: block !important;
}
.form-sections-mode :deep(.n-tab-pane) {
  display: block !important;
  padding: 0 0 24px 0;
  border: none;
}
.form-sections-mode :deep(.n-tab-pane:not(:first-child)) {
  padding-top: 24px;
  border-top: 1px solid var(--n-border-color);
  margin-top: 24px;
}
.form-sections-mode :deep(.n-tab-pane) .n-form {
  padding-top: 0;
}
</style>
