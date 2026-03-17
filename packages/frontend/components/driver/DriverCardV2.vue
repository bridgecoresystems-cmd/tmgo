<template>
  <div class="driver-card-v2">
    <!-- Когда верифицирован — показываем только статус -->
    <div v-if="isDriverContext && isVerified" class="verified-status-block">
      <n-alert type="success" class="verified-alert">
        <template #header>
          <n-space align="center" :size="12">
            <n-icon :component="CheckmarkCircle" size="24" color="#18a058" />
            <span class="verified-title">Верифицирован</span>
          </n-space>
        </template>
        <p v-if="verifiedDate" class="verified-date">Отправлено: {{ verifiedDate }}</p>
      </n-alert>
    </div>

    <n-spin v-else :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-alert v-if="error" type="error" class="mb-16">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadProfile">Повторить</n-button>
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
        <!-- 1. Основная информация -->
        <n-h3 prefix="bar" align-text>1. Основная информация</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item label="Водитель ID">
              <n-space align="center">
                <n-text depth="3">{{ form.id || 'Генерируется системой' }}</n-text>
                <n-tag v-if="form.id" size="small" type="info">Auto</n-tag>
              </n-space>
            </n-form-item>

            <n-form-item label="Фамилия" required path="surname">
              <n-input v-model:value="form.surname" placeholder="Akmuradow" />
            </n-form-item>

            <n-form-item label="Имя" required path="given_name">
              <n-input v-model:value="form.given_name" placeholder="Batyr" />
            </n-form-item>

            <n-form-item label="Отчество" path="patronymic">
              <n-input v-model:value="form.patronymic" placeholder="Muhamednazarowich" />
            </n-form-item>

            <n-form-item label="Дата рождения" required path="date_of_birth">
              <n-date-picker
                :value="form.date_of_birth ? new Date(form.date_of_birth).getTime() : null"
                type="date"
                clearable
                @update:value="(v) => { form.date_of_birth = v ? new Date(v).toISOString().slice(0, 10) : null }"
              />
            </n-form-item>

            <n-form-item label="Гражданство" required>
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
                <n-button quaternary size="small" type="primary" @click="form.citizenships.push('')">+ Добавить</n-button>
              </n-space>
            </n-form-item>

            <n-form-item label="Пол" required path="gender">
              <n-radio-group v-model:value="form.gender">
                <n-space>
                  <n-radio value="male">Мужской</n-radio>
                  <n-radio value="female">Женский</n-radio>
                </n-space>
              </n-radio-group>
            </n-form-item>

            <n-form-item label="Контактный телефон" required>
              <n-space vertical style="width: 100%">
                <n-space v-for="(p, i) in form.phones" :key="i" align="center">
                  <n-input v-model:value="form.phones[i]" placeholder="+99364852563" style="width: 200px" />
                  <n-button v-if="i > 0" quaternary circle type="error" @click="form.phones.splice(i, 1)">×</n-button>
                </n-space>
                <n-button quaternary size="small" type="primary" @click="form.phones.push('')">+ Добавить</n-button>
              </n-space>
            </n-form-item>

            <n-form-item label="Email (Логин)" required>
              <n-space vertical style="width: 100%">
                <n-input :value="form.email" disabled style="width: 300px" />
                <n-space v-for="(e, i) in form.extra_emails" :key="i" align="center">
                  <n-input v-model:value="form.extra_emails[i]" placeholder="extra@mail.com" style="width: 200px" />
                  <n-button quaternary circle type="error" @click="form.extra_emails.splice(i, 1)">×</n-button>
                </n-space>
                <n-button quaternary size="small" type="primary" @click="form.extra_emails.push('')">+ Добавить</n-button>
              </n-space>
            </n-form-item>

            <n-form-item label="Статус (Диспетчер)">
              <n-select v-model:value="form.status" :options="statusOptions" :disabled="isDriverContext" style="width: 200px" />
            </n-form-item>

            <n-form-item label="Категория занятости">
              <n-select v-model:value="form.employment_category" :options="employmentOptions" :disabled="isDriverContext" style="width: 200px" />
            </n-form-item>
          </n-space>
        </n-card>

        <!-- 2. Паспортные данные -->
        <n-h3 prefix="bar" align-text>2. Паспортные данные</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item label="Серия / Номер паспорта" required>
              <n-space>
                <n-input v-model:value="form.passport_series" placeholder="AB" style="width: 80px" />
                <n-input v-model:value="form.passport_number" placeholder="123456" style="width: 160px" />
              </n-space>
            </n-form-item>

            <n-form-item label="Даты действия" required>
              <n-space align="center">
                <n-date-picker
                  :value="form.passport_issue_date ? new Date(form.passport_issue_date).getTime() : null"
                  type="date"
                  placeholder="Дата выдачи"
                  @update:value="(v) => { form.passport_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
                <n-text depth="3">—</n-text>
                <n-date-picker
                  :value="form.passport_expiry_date ? new Date(form.passport_expiry_date).getTime() : null"
                  type="date"
                  placeholder="Дата окончания"
                  @update:value="(v) => { form.passport_expiry_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
              </n-space>
            </n-form-item>

            <n-form-item label="Кем выдан" required path="passport_issued_by">
              <n-input v-model:value="form.passport_issued_by" placeholder="ОВД г. Ашхабад" />
            </n-form-item>

            <n-form-item label="Место рождения" required path="place_of_birth">
              <n-input v-model:value="form.place_of_birth" placeholder="г. Мары" />
            </n-form-item>

            <n-form-item label="Адрес проживания" required path="residential_address">
              <n-input v-model:value="form.residential_address" placeholder="ул. Махтумкули, д. 10" />
            </n-form-item>

            <n-form-item label="Скан паспорта (PDF/JPG)" required>
              <n-space vertical>
                <n-upload
                  :max="1"
                  :custom-request="(o) => handleUpload(o, 'passport')"
                  :show-file-list="false"
                >
                  <n-button size="small">{{ form.passport_scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                </n-upload>
                <n-button v-if="form.passport_scan_url" text type="primary" size="small" @click="openScan(form.passport_scan_url)">
                  Просмотр скана
                </n-button>
              </n-space>
            </n-form-item>
          </n-space>
        </n-card>

        <!-- 3. Водительское удостоверение -->
        <n-h3 prefix="bar" align-text>3. Водительское удостоверение</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-form-item label="Номер ВУ" required path="license_number">
              <n-input v-model:value="form.license_number" placeholder="tm-123456" style="width: 240px" />
            </n-form-item>

            <n-form-item label="Категории прав" required>
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

            <n-form-item label="Даты действия ВУ" required>
              <n-space align="center">
                <n-date-picker
                  :value="form.license_issue_date ? new Date(form.license_issue_date).getTime() : null"
                  type="date"
                  placeholder="Дата выдачи"
                  @update:value="(v) => { form.license_issue_date = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
                <n-text depth="3">—</n-text>
                <n-date-picker
                  :value="form.license_expiry ? new Date(form.license_expiry).getTime() : null"
                  type="date"
                  placeholder="Дата окончания"
                  @update:value="(v) => { form.license_expiry = v ? new Date(v).toISOString().slice(0, 10) : null }"
                />
              </n-space>
            </n-form-item>

            <n-form-item label="Скан ВУ (PDF/JPG)" required>
              <n-space vertical>
                <n-upload
                  :max="1"
                  :custom-request="(o) => handleUpload(o, 'license')"
                  :show-file-list="false"
                >
                  <n-button size="small">{{ form.license_scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                </n-upload>
                <n-button v-if="form.license_scan_url" text type="primary" size="small" @click="openScan(form.license_scan_url)">
                  Просмотр скана
                </n-button>
              </n-space>
            </n-form-item>

            <n-form-item label="Международные права">
              <n-space vertical style="width: 100%">
                <n-radio-group v-model:value="form.has_international_license">
                  <n-space>
                    <n-radio :value="true">Да</n-radio>
                    <n-radio :value="false">Нет</n-radio>
                  </n-space>
                </n-radio-group>

                <template v-if="form.has_international_license">
                  <n-space vertical size="small" class="mt-8">
                    <n-form-item label="Номер МВУ" label-placement="left" label-width="120">
                      <n-input v-model:value="form.international_license_number" placeholder="INT-789456" />
                    </n-form-item>
                    <n-form-item label="Срок действия" label-placement="left" label-width="120">
                      <n-input v-model:value="form.international_license_validity" placeholder="2022-2027" />
                    </n-form-item>
                    <n-form-item label="Скан МВУ" label-placement="left" label-width="120">
                      <n-upload
                        :max="1"
                        :custom-request="(o) => handleUpload(o, 'intl_license')"
                        :show-file-list="false"
                      >
                        <n-button size="small">Загрузить</n-button>
                      </n-upload>
                    </n-form-item>
                  </n-space>
                </template>
              </n-space>
            </n-form-item>
          </n-space>
        </n-card>

        <!-- 4. Разрешительные документы (виза, медсправка, техминимум, тахограф, ADR) -->
        <n-h3 prefix="bar" align-text>4. Разрешительные документы</n-h3>
        <n-card embedded :bordered="false" class="mb-24">
          <n-space vertical size="large">
            <n-text depth="3" style="margin-bottom: 8px;">Виза</n-text>
            <template v-for="(v, vi) in visasList" :key="v._key">
              <n-divider v-if="vi > 0" style="margin: 16px 0;">Виза {{ vi + 1 }}</n-divider>
              <n-form-item :label="`Страна выдачи${vi > 0 ? ` (${vi + 1})` : ''}`">
                <n-space align="center">
                  <n-select
                    v-model:value="v.country"
                    :options="visaCountryOptions"
                    filterable
                    placeholder="Выберите страну"
                    style="width: 240px"
                  />
                  <n-button v-if="vi > 0" quaternary circle type="error" @click="removeVisa(vi)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item label="Номер визы">
                <n-input v-model:value="v.number" placeholder="1234567" style="width: 200px" />
              </n-form-item>
              <n-form-item label="Дата начала — Дата окончания">
                <n-space align="center">
                  <n-date-picker
                    :value="v.issued_at ? new Date(v.issued_at).getTime() : null"
                    type="date"
                    placeholder="Дата начала"
                    @update:value="(val) => { v.issued_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                  />
                  <n-text depth="3">—</n-text>
                  <n-date-picker
                    :value="v.expires_at ? new Date(v.expires_at).getTime() : null"
                    type="date"
                    placeholder="Дата окончания"
                    @update:value="(val) => { v.expires_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                  />
                </n-space>
              </n-form-item>
              <n-form-item label="Скан визы">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleVisaUpload(o, v)" :show-file-list="false">
                    <n-button size="small">{{ v.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="v.scan_url" text type="primary" size="small" @click="openScan(v.scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addVisa">+ Добавить визу</n-button>

            <n-divider style="margin: 24px 0 16px;">Медицинская справка</n-divider>
            <template v-for="(m, mi) in medicalCertificatesList" :key="m._key">
              <n-divider v-if="mi > 0" style="margin: 16px 0;">Медсправка {{ mi + 1 }}</n-divider>
              <n-form-item :label="`Номер медсправки${mi > 0 ? ` (${mi + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="m.number" placeholder="№ 12345" style="width: 200px" />
                  <n-button v-if="mi > 0" quaternary circle type="error" @click="removeMedicalCertificate(mi)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item label="Дата выдачи">
                <n-date-picker
                  :value="m.issued_at ? new Date(m.issued_at).getTime() : null"
                  type="date"
                  placeholder="Дата выдачи"
                  @update:value="(val) => { m.issued_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Дата окончания">
                <n-date-picker
                  :value="m.expires_at ? new Date(m.expires_at).getTime() : null"
                  type="date"
                  placeholder="Дата окончания"
                  @update:value="(val) => { m.expires_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Скан медсправки">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleMedicalCertificateUpload(o, m)" :show-file-list="false">
                    <n-button size="small">{{ m.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="m.scan_url" text type="primary" size="small" @click="openScan(m.scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addMedicalCertificate">+ Добавить медсправку</n-button>

            <n-divider style="margin: 24px 0 16px;">Сертификат техминимума</n-divider>
            <template v-for="(tm, tmi) in technicalMinimumCertsList" :key="tm._key">
              <n-divider v-if="tmi > 0" style="margin: 16px 0;">Сертификат техминимума {{ tmi + 1 }}</n-divider>
              <n-form-item :label="`Имя учебного заведения${tmi > 0 ? ` (${tmi + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="tm.issued_by" placeholder="Название учебного центра" style="width: 280px" />
                  <n-button v-if="tmi > 0" quaternary circle type="error" @click="removeTechnicalMinimumCert(tmi)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item label="Номер сертификата">
                <n-input v-model:value="tm.number" placeholder="№ TM-2025-0098" style="width: 200px" />
              </n-form-item>
              <n-form-item label="Дата получения">
                <n-date-picker
                  :value="tm.issued_at ? new Date(tm.issued_at).getTime() : null"
                  type="date"
                  placeholder="Дата получения"
                  @update:value="(val) => { tm.issued_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Дата окончания">
                <n-date-picker
                  :value="tm.expires_at ? new Date(tm.expires_at).getTime() : null"
                  type="date"
                  placeholder="Дата окончания"
                  @update:value="(val) => { tm.expires_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Скан документа">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleTechnicalMinimumCertUpload(o, tm)" :show-file-list="false">
                    <n-button size="small">{{ tm.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="tm.scan_url" text type="primary" size="small" @click="openScan(tm.scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addTechnicalMinimumCert">+ Добавить сертификат техминимума</n-button>

            <n-divider style="margin: 24px 0 16px;">ADR допуск</n-divider>
            <template v-for="(a, ai) in adrCertsList" :key="a._key">
              <n-divider v-if="ai > 0" style="margin: 16px 0;">ADR допуск {{ ai + 1 }}</n-divider>
              <n-form-item :label="`Кем выдано${ai > 0 ? ` (${ai + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="a.issued_by" placeholder="Организация, выдавшая допуск" style="width: 280px" />
                  <n-button v-if="ai > 0" quaternary circle type="error" @click="removeAdrCert(ai)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item label="Номер свидетельства">
                <n-input v-model:value="a.number" placeholder="№ ADR-2025-001" style="width: 200px" />
              </n-form-item>
              <n-form-item label="Разрешённые классы">
                <n-checkbox-group v-model:value="a.allowed_classes">
                  <n-space vertical size="small">
                    <n-checkbox v-for="c in adrClasses" :key="c.value" :value="c.value" :label="c.label" />
                  </n-space>
                </n-checkbox-group>
              </n-form-item>
              <n-form-item label="Дата выдачи">
                <n-date-picker
                  :value="a.issued_at ? new Date(a.issued_at).getTime() : null"
                  type="date"
                  placeholder="Дата выдачи"
                  @update:value="(val) => { a.issued_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Дата окончания">
                <n-date-picker
                  :value="a.expires_at ? new Date(a.expires_at).getTime() : null"
                  type="date"
                  placeholder="Дата окончания"
                  @update:value="(val) => { a.expires_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Скан документа">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleAdrCertUpload(o, a)" :show-file-list="false">
                    <n-button size="small">{{ a.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="a.scan_url" text type="primary" size="small" @click="openScan(a.scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addAdrCert">+ Добавить ADR допуск</n-button>

            <n-divider style="margin: 24px 0 16px;">Карта тахографа</n-divider>
            <template v-for="(t, ti) in tachographCardsList" :key="t._key">
              <n-divider v-if="ti > 0" style="margin: 16px 0;">Карта тахографа {{ ti + 1 }}</n-divider>
              <n-form-item :label="`Номер карты тахографа${ti > 0 ? ` (${ti + 1})` : ''}`">
                <n-space align="center">
                  <n-input v-model:value="t.number" placeholder="№ TK-567890" style="width: 200px" />
                  <n-button v-if="ti > 0" quaternary circle type="error" @click="removeTachographCard(ti)">×</n-button>
                </n-space>
              </n-form-item>
              <n-form-item label="Страна выдачи">
                <n-select v-model:value="t.country" :options="visaCountryOptions" filterable placeholder="Выберите страну" style="width: 240px" />
              </n-form-item>
              <n-form-item label="Дата выдачи">
                <n-date-picker
                  :value="t.issued_at ? new Date(t.issued_at).getTime() : null"
                  type="date"
                  placeholder="Дата выдачи"
                  @update:value="(val) => { t.issued_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Дата окончания">
                <n-date-picker
                  :value="t.expires_at ? new Date(t.expires_at).getTime() : null"
                  type="date"
                  placeholder="Дата окончания"
                  @update:value="(val) => { t.expires_at = val ? new Date(val).toISOString().slice(0, 10) : null }"
                />
              </n-form-item>
              <n-form-item label="Скан документа">
                <n-space align="center">
                  <n-upload :max="1" :custom-request="(o) => handleTachographCardUpload(o, t)" :show-file-list="false">
                    <n-button size="small">{{ t.scan_url ? 'Заменить файл' : 'Загрузить файл' }}</n-button>
                  </n-upload>
                  <n-button v-if="t.scan_url" text type="primary" size="small" @click="openScan(t.scan_url)">
                    Просмотр скана
                  </n-button>
                </n-space>
              </n-form-item>
            </template>
            <n-button quaternary type="primary" size="small" @click="addTachographCard">+ Добавить карту тахографа</n-button>

            <n-divider style="margin: 24px 0 16px;">ADR пропуск</n-divider>
            <n-form-item label="ADR пропуск / Прочие документы">
              <n-input v-model:value="form.other_permits" type="textarea" placeholder="Страховка, пропуск, допуск ADR и т. д." />
            </n-form-item>

            <n-form-item label="Источник найма">
              <n-select v-model:value="form.hire_source" :options="hireSourceOptions" style="width: 240px" />
            </n-form-item>

            <n-form-item label="Прикреплённые документы">
              <n-space>
                <n-tag v-if="form.passport_scan_url" type="success" size="small">Паспорт</n-tag>
                <n-tag v-if="form.license_scan_url" type="success" size="small">ВУ</n-tag>
                <n-tag v-if="form.international_license_scan_url" type="success" size="small">МВУ</n-tag>
                <n-tag v-if="visasList.some((v: any) => v.scan_url)" type="success" size="small">Виза</n-tag>
                <n-tag v-if="medicalCertificatesList.some((m: any) => m.scan_url)" type="success" size="small">Медсправка</n-tag>
                <n-tag v-if="technicalMinimumCertsList.some((tm: any) => tm.scan_url)" type="success" size="small">Техминимум</n-tag>
                <n-tag v-if="adrCertsList.some((a: any) => a.scan_url)" type="success" size="small">ADR</n-tag>
                <n-tag v-if="tachographCardsList.some((t: any) => t.scan_url)" type="success" size="small">Карта тахографа</n-tag>
                <n-text v-if="!anyScanUploaded" depth="3">Нет прикреплённых файлов</n-text>
              </n-space>
            </n-form-item>

            <n-form-item label="Дата последнего обновления">
              <n-text depth="3">{{ form.updated_at || 'Автоматически системой' }}</n-text>
            </n-form-item>
          </n-space>
        </n-card>

          <!-- Actions -->
        <div class="form-actions mt-24">
          <n-space justify="end">
            <n-button :loading="saving" @click="handleSave">Сохранить черновик</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">Отправить на верификацию</n-button>
          </n-space>
        </div>
      </n-form>
    </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { CheckmarkCircle } from '@vicons/ionicons5'
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


const statusOptions = [
  { label: 'Активен', value: 'active' },
  { label: 'В отпуске', value: 'on_leave' },
  { label: 'Уволен', value: 'fired' }
]

const employmentOptions = [
  { label: 'Штатный', value: 'full_time' },
  { label: 'Внештатный', value: 'freelance' },
  { label: 'Аренда', value: 'leased' }
]

const hireSourceOptions = [
  { label: 'По рекомендации', value: 'По рекомендации' },
  { label: 'Объявление', value: 'Объявление' },
  { label: 'Агентство', value: 'Агентство' }
]

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
    error.value = e?.data?.error || 'Ошибка загрузки профиля'
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

    message.success('Черновик сохранен')
    emit('saved')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка сохранения')
  } finally {
    saving.value = false
  }
}

async function handleSubmit() {
  // Simple validation
  const required = [
    { v: form.surname, l: 'Фамилия' },
    { v: form.given_name, l: 'Имя' },
    { v: form.date_of_birth, l: 'Дата рождения' },
    { v: form.passport_number, l: 'Номер паспорта' },
    { v: form.license_number, l: 'Номер ВУ' }
  ]
  const missing = required.filter(r => !r.v).map(r => r.l)
  if (missing.length > 0) {
    message.error(`Заполните обязательные поля: ${missing.join(', ')}`)
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

    message.success('Карточка отправлена на верификацию')
    form.verification_status = 'submitted'
    emit('submitted')
  } catch (e: any) {
    message.error(e?.data?.error || 'Ошибка отправки')
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

async function handleTachographCardUpload(options: { file: { file?: File }; onFinish?: () => void; onError?: (e: Error) => void }, t: TachographCardItem) {
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
    t.scan_url = res.url
    message.success('Файл загружен')
    options.onFinish?.()
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
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
    message.success('Файл загружен')
    options.onFinish?.()
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
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
    message.success('Файл загружен')
    options.onFinish?.()
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
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
    message.success('Файл загружен')
    options.onFinish?.()
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
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
    message.success('Файл загружен')
    options.onFinish?.()
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
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
    
    message.success('Файл загружен')
  } catch (e: any) {
    message.error('Ошибка загрузки файла')
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
