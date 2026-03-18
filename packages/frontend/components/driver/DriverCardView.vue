<template>
  <div class="driver-card-view">
    <n-spin :show="loading">
      <div v-if="!loading" style="min-height: 400px; padding: 20px;">
        <n-alert v-if="error" type="error" class="mb-16">
          {{ error }}
          <template #footer>
            <n-button size="small" @click="loadProfile">{{ t('common.retry') }}</n-button>
          </template>
        </n-alert>

        <div v-if="!error && profile" class="view-content">
          <!-- 1. Main info -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section1') }}</n-h3>
          <n-card embedded :bordered="false" class="mb-24 view-card">
            <div class="view-grid">
              <template v-if="profile.id && !isHidden('main:driver_id')">
                <div class="view-row">
                  <span class="view-label">{{ t('driver.card.driverId') }}:</span>
                  <span class="view-value">{{ profile.id }} <n-tag size="small" type="info">Auto</n-tag></span>
                </div>
              </template>
              <div v-if="!isHidden('main:surname') && !isHidden('main:given_name') && !isHidden('main:patronymic')" class="view-row">
                <span class="view-label">{{ t('driver.card.fullName') }}</span>
                <span class="view-value">{{ fullName }}</span>
              </div>
              <div v-if="profile.date_of_birth && !isHidden('main:date_of_birth')" class="view-row">
                <span class="view-label">{{ t('driver.card.dateOfBirth') }}:</span>
                <span class="view-value">{{ formatDate(profile.date_of_birth) }}</span>
              </div>
              <div v-if="citizenshipsDisplay && !isHidden('main:citizenships')" class="view-row">
                <span class="view-label">{{ t('driver.card.citizenship') }}:</span>
                <span class="view-value">{{ citizenshipsDisplay }}</span>
              </div>
              <div v-if="profile.gender && !isHidden('main:gender')" class="view-row">
                <span class="view-label">{{ t('driver.card.gender') }}:</span>
                <span class="view-value">{{ genderLabel }}</span>
              </div>
              <div v-if="phonesDisplay && !isHidden('main:phones')" class="view-row">
                <span class="view-label">{{ t('driver.card.contactPhone') }}:</span>
                <span class="view-value">{{ phonesDisplay }}</span>
              </div>
              <div v-if="profile.email && !isHidden('main:emails')" class="view-row">
                <span class="view-label">{{ t('driver.card.emailLogin') }}:</span>
                <span class="view-value">{{ profile.email }}</span>
              </div>
              <div v-if="emailsDisplay && !isHidden('main:emails')" class="view-row">
                <span class="view-label">{{ t('driver.card.extraEmail') }}:</span>
                <span class="view-value">{{ emailsDisplay }}</span>
              </div>
              <div v-if="profile.status && !isHidden('main:status')" class="view-row">
                <span class="view-label">{{ t('driver.card.statusDispatcher') }}:</span>
                <span class="view-value">{{ statusLabel }}</span>
              </div>
              <div v-if="profile.employment_category && !isHidden('main:employment_category')" class="view-row">
                <span class="view-label">{{ t('driver.card.employmentCategory') }}:</span>
                <span class="view-value">{{ employmentLabel }}</span>
              </div>
            </div>
          </n-card>

          <!-- 2. Passport data -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section2') }}</n-h3>
          <n-card v-if="hasVisiblePassportData" embedded :bordered="false" class="mb-24 view-card">
            <div v-if="!isHidden('passport:0')" class="view-grid">
              <div v-if="passportSeriesNumber" class="view-row">
                <span class="view-label">{{ t('driver.card.passportSeriesNumber') }}:</span>
                <span class="view-value">{{ passportSeriesNumber }}</span>
              </div>
              <div v-if="passportDatesDisplay" class="view-row">
                <span class="view-label">{{ t('driver.card.validityDates') }}:</span>
                <span class="view-value">{{ passportDatesDisplay }}</span>
              </div>
              <div v-if="profile.passport_issued_by" class="view-row">
                <span class="view-label">{{ t('driver.card.passportIssuedBy') }}:</span>
                <span class="view-value">{{ profile.passport_issued_by }}</span>
              </div>
              <div v-if="profile.place_of_birth" class="view-row">
                <span class="view-label">{{ t('driver.card.placeOfBirth') }}:</span>
                <span class="view-value">{{ profile.place_of_birth }}</span>
              </div>
              <div v-if="profile.residential_address" class="view-row">
                <span class="view-label">{{ t('driver.card.residentialAddress') }}:</span>
                <span class="view-value">{{ profile.residential_address }}</span>
              </div>
              <div v-if="profile.passport_scan_url" class="view-row">
                <span class="view-label">{{ t('driver.card.passportScan') }}:</span>
                <span class="view-value">
                  <n-button text type="primary" size="small" @click="openScanModal(profile.passport_scan_url, t('driver.card.passportScan'))">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </span>
              </div>
            </div>
            <!-- Extra passports (from Add documents) -->
            <template v-for="(ep, idx) in extraPassports" :key="ep.id">
              <template v-if="!isHidden(`passport:${hasMainPassportData ? idx + 1 : idx}`)">
              <n-divider v-if="idx === 0 && hasMainPassportData" style="margin: 16px 0;" />
              <div class="view-grid extra-passport-block" :class="{ 'extra-passport-block--not-first': idx > 0 }">
                <div v-if="ep.series || ep.number" class="view-row">
                  <span class="view-label">{{ t('driver.card.passportSeriesNumber') }}{{ hasMainPassportData ? ` (${idx + 2})` : ` ${idx + 1}` }}:</span>
                  <span class="view-value">{{ [ep.series, ep.number].filter(Boolean).join(' ') || '—' }}</span>
                </div>
                <div v-if="ep.issued_at || ep.expires_at" class="view-row">
                  <span class="view-label">{{ t('driver.card.validityDates') }}:</span>
                  <span class="view-value">{{ formatDate(ep.issued_at) }} — {{ formatDate(ep.expires_at) }}</span>
                </div>
                <div v-if="ep.issued_by" class="view-row">
                  <span class="view-label">{{ t('driver.card.passportIssuedBy') }}:</span>
                  <span class="view-value">{{ ep.issued_by }}</span>
                </div>
                <div v-if="ep.place_of_birth" class="view-row">
                  <span class="view-label">{{ t('driver.card.placeOfBirth') }}:</span>
                  <span class="view-value">{{ ep.place_of_birth }}</span>
                </div>
                <div v-if="ep.residential_address" class="view-row">
                  <span class="view-label">{{ t('driver.card.residentialAddress') }}:</span>
                  <span class="view-value">{{ ep.residential_address }}</span>
                </div>
                <div v-if="ep.scan_url" class="view-row">
                  <span class="view-label">{{ t('driver.card.passportScan') }}:</span>
                  <span class="view-value">
                    <n-button text type="primary" size="small" @click="openScanModal(ep.scan_url, hasMainPassportData ? `${t('driver.card.passportScan')} (${idx + 2})` : `${t('driver.card.passportScan')} ${idx + 1}`)">
                      {{ t('driver.card.viewScan') }}
                    </n-button>
                  </span>
                </div>
              </div>
              </template>
            </template>
          </n-card>

          <!-- 3. Driver license -->
          <n-h3 prefix="bar" align-text>{{ t('driver.card.section3') }}</n-h3>
          <n-card v-if="hasVisibleLicenseData" embedded :bordered="false" class="mb-24 view-card">
            <div v-if="!isHidden('license:0')" class="view-grid">
              <div v-if="profile.license_number" class="view-row">
                <span class="view-label">{{ t('driver.card.licenseNumber') }}:</span>
                <span class="view-value">{{ profile.license_number }}</span>
              </div>
              <div v-if="licenseCategoriesDisplay" class="view-row">
                <span class="view-label">{{ t('driver.card.licenseCategories') }}:</span>
                <span class="view-value">{{ licenseCategoriesDisplay }}</span>
              </div>
              <div v-if="licenseDatesDisplay" class="view-row">
                <span class="view-label">{{ t('driver.card.licenseValidityDates') }}:</span>
                <span class="view-value">{{ licenseDatesDisplay }}</span>
              </div>
              <div v-if="profile.license_scan_url" class="view-row">
                <span class="view-label">{{ t('driver.card.licenseScan') }}:</span>
                <span class="view-value">
                  <n-button text type="primary" size="small" @click="openScanModal(profile.license_scan_url, t('driver.card.licenseScan'))">
                    {{ t('driver.card.viewScan') }}
                  </n-button>
                </span>
              </div>
              <!-- International license — only if driver specified -->
              <template v-if="profile.has_international_license">
                <div v-if="profile.international_license_number" class="view-row">
                  <span class="view-label">{{ t('driver.card.intlLicenseNumber') }}:</span>
                  <span class="view-value">{{ profile.international_license_number }}</span>
                </div>
                <div v-if="profile.international_license_validity" class="view-row">
                  <span class="view-label">{{ t('driver.card.intlLicenseValidity') }}:</span>
                  <span class="view-value">{{ profile.international_license_validity }}</span>
                </div>
                <div v-if="profile.international_license_scan_url" class="view-row">
                  <span class="view-label">{{ t('driver.card.intlLicenseScan') }}:</span>
                  <span class="view-value">
                    <n-button text type="primary" size="small" @click="openScanModal(profile.international_license_scan_url!, t('driver.card.intlLicenseScan'))">
                      {{ t('driver.card.viewScan') }}
                    </n-button>
                  </span>
                </div>
              </template>
            </div>
            <!-- Extra licenses (from Add documents) -->
            <template v-for="(el, idx) in extraLicenses" :key="el.id">
              <template v-if="!isHidden(`license:${hasMainLicenseData ? idx + 1 : idx}`)">
              <n-divider v-if="idx === 0 && hasMainLicenseData" style="margin: 16px 0;" />
              <div class="view-grid extra-passport-block" :class="{ 'extra-passport-block--not-first': idx > 0 }">
                <div v-if="el.number" class="view-row">
                  <span class="view-label">{{ t('driver.card.licenseNumber') }}{{ hasMainLicenseData ? ` (${idx + 2})` : ` ${idx + 1}` }}:</span>
                  <span class="view-value">{{ el.number }}</span>
                </div>
                <div v-if="el.license_categories" class="view-row">
                  <span class="view-label">{{ t('driver.card.licenseCategories') }}:</span>
                  <span class="view-value">{{ el.license_categories }}</span>
                </div>
                <div v-if="el.issued_at || el.expires_at" class="view-row">
                  <span class="view-label">{{ t('driver.card.licenseValidityDates') }}:</span>
                  <span class="view-value">{{ formatDate(el.issued_at) }} — {{ formatDate(el.expires_at) }}</span>
                </div>
                <div v-if="el.issued_by" class="view-row">
                  <span class="view-label">{{ t('driver.card.passportIssuedBy') }}:</span>
                  <span class="view-value">{{ el.issued_by }}</span>
                </div>
                <div v-if="el.scan_url" class="view-row">
                  <span class="view-label">{{ t('driver.card.licenseScan') }}:</span>
                  <span class="view-value">
                    <n-button text type="primary" size="small" @click="openScanModal(el.scan_url, hasMainLicenseData ? `${t('driver.card.licenseScan')} (${idx + 2})` : `${t('driver.card.licenseScan')} ${idx + 1}`)">
                      {{ t('driver.card.viewScan') }}
                    </n-button>
                  </span>
                </div>
              </div>
              </template>
            </template>
          </n-card>

          <!-- 4. Permits (visa, medical cert, tech minimum, tachograph, ADR) -->
          <template v-if="hasPermitsData || visasFromDocuments.length > 0 || medicalCertificatesFromDocuments.length > 0 || tachographCardsFromDocuments.length > 0 || technicalMinimumCertsFromDocuments.length > 0 || adrCertsFromDocuments.length > 0">
            <n-h3 prefix="bar" align-text>{{ t('driver.card.section4') }}</n-h3>
            <n-card embedded :bordered="false" class="mb-24 view-card">
              <div class="view-grid">
                <!-- Visas (from documents) -->
                <template v-for="(v, vi) in visasFromDocuments" :key="v.id || vi">
                  <template v-if="!isHidden(`visa:${vi}`)">
                  <div v-if="vi > 0" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-grid extra-passport-block">
                    <div v-if="v.country" class="view-row">
                      <span class="view-label">{{ t('driver.card.visa') }}{{ visasFromDocuments.length > 1 ? ` (${vi + 1})` : '' }} — {{ t('driver.card.visaIssueCountry') }}:</span>
                      <span class="view-value">{{ v.country }}</span>
                    </div>
                    <div v-if="v.number" class="view-row">
                      <span class="view-label">{{ t('driver.card.visaNumber') }}:</span>
                      <span class="view-value">{{ v.number }}</span>
                    </div>
                    <div v-if="v.issued_at || v.expires_at" class="view-row">
                      <span class="view-label">{{ t('driver.card.visaDateRange') }}:</span>
                      <span class="view-value">{{ formatDate(v.issued_at) }} — {{ formatDate(v.expires_at) }}</span>
                    </div>
                    <div v-if="v.scan_url" class="view-row">
                      <span class="view-label">{{ t('driver.card.scanVisa') }}:</span>
                      <span class="view-value">
                        <n-button text type="primary" size="small" @click="openScanModal(v.scan_url, visasFromDocuments.length > 1 ? `${t('driver.card.scanVisa')} (${vi + 1})` : t('driver.card.scanVisa'))">
                          {{ t('driver.card.viewScan') }}
                        </n-button>
                      </span>
                    </div>
                  </div>
                  </template>
                </template>
                <!-- Legacy visa (if no visas_from_documents) -->
                <template v-if="hasVisaData && visasFromDocuments.length === 0">
                  <div v-if="profile.permission_entry_zone" class="view-row">
                    <span class="view-label">{{ t('driver.card.entryPermitVisa') }}:</span>
                    <span class="view-value">{{ profile.permission_entry_zone }}</span>
                  </div>
                  <div v-if="visaDatesDisplay" class="view-row">
                    <span class="view-label">{{ t('driver.card.visaValidityDates') }}:</span>
                    <span class="view-value">{{ visaDatesDisplay }}</span>
                  </div>
                  <div v-if="profile.visa_scan_url" class="view-row">
                    <span class="view-label">{{ t('driver.card.scanVisa') }}:</span>
                    <span class="view-value">
                      <n-button text type="primary" size="small" @click="openScanModal(profile.visa_scan_url!, t('driver.card.scanVisa'))">
                        {{ t('driver.card.viewScan') }}
                      </n-button>
                    </span>
                  </div>
                </template>
                <!-- Medical certificates (from documents) -->
                <template v-for="(m, mi) in medicalCertificatesFromDocuments" :key="m.id || mi">
                  <template v-if="!isHidden(`medical:${mi}`)">
                  <div v-if="mi > 0 || visasFromDocuments.length > 0 || hasVisaData" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-grid extra-passport-block">
                    <div v-if="m.number" class="view-row">
                      <span class="view-label">{{ t('driver.card.medicalCertificate') }}{{ medicalCertificatesFromDocuments.length > 1 ? ` (${mi + 1})` : '' }} — {{ t('driver.documents.medicalNum') }}:</span>
                      <span class="view-value">{{ m.number }}</span>
                    </div>
                    <div v-if="m.issued_at || m.expires_at" class="view-row">
                      <span class="view-label">{{ t('driver.card.issueDateExpiry') }}:</span>
                      <span class="view-value">{{ formatDate(m.issued_at) }} — {{ formatDate(m.expires_at) }}</span>
                    </div>
                    <div v-if="m.scan_url" class="view-row">
                      <span class="view-label">{{ t('driver.card.scanMedical') }}:</span>
                      <span class="view-value">
                        <n-button text type="primary" size="small" @click="openScanModal(m.scan_url, medicalCertificatesFromDocuments.length > 1 ? `${t('driver.card.scanMedical')} (${mi + 1})` : t('driver.card.scanMedical'))">
                          {{ t('driver.card.viewScan') }}
                        </n-button>
                      </span>
                    </div>
                  </div>
                  </template>
                </template>
                <!-- Legacy medical cert (if no medical_certificates_from_documents) -->
                <template v-if="hasLegacyMedicalData && medicalCertificatesFromDocuments.length === 0">
                  <div v-if="visasFromDocuments.length > 0 || hasVisaData" class="extra-passport-block extra-passport-block--not-first" />
                  <div v-if="profile.medical_certificate" class="view-row">
                    <span class="view-label">{{ t('driver.card.medicalCertificate') }}:</span>
                    <span class="view-value">{{ profile.medical_certificate }}</span>
                  </div>
                  <div v-if="profile.last_medical_examination_date" class="view-row">
                    <span class="view-label">{{ t('driver.documents.validUntil') }}:</span>
                    <span class="view-value">{{ formatDate(profile.last_medical_examination_date) }}</span>
                  </div>
                  <div v-if="profile.medical_certificate_scan_url" class="view-row">
                    <span class="view-label">{{ t('driver.card.scanMedical') }}:</span>
                    <span class="view-value">
                      <n-button text type="primary" size="small" @click="openScanModal(profile.medical_certificate_scan_url!, t('driver.card.scanMedical'))">
                        {{ t('driver.card.viewScan') }}
                      </n-button>
                    </span>
                  </div>
                </template>
                <!-- Tachograph cards (from documents) -->
                <template v-for="(tc, ti) in tachographCardsFromDocuments" :key="tc.id || ti">
                  <template v-if="!isHidden(`tachograph:${ti}`)">
                  <div v-if="ti > 0 || medicalCertificatesFromDocuments.length > 0 || hasLegacyMedicalData" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-grid extra-passport-block">
                    <div v-if="tc.number" class="view-row">
                      <span class="view-label">{{ t('driver.card.tachographCard') }}{{ tachographCardsFromDocuments.length > 1 ? ` (${ti + 1})` : '' }} — {{ t('driver.card.tachographNumber') }}:</span>
                      <span class="view-value">{{ tc.number }}</span>
                    </div>
                    <div v-if="tc.country" class="view-row">
                      <span class="view-label">{{ t('driver.card.visaIssueCountry') }}:</span>
                      <span class="view-value">{{ tc.country }}</span>
                    </div>
                    <div v-if="tc.issued_at || tc.expires_at" class="view-row">
                      <span class="view-label">{{ t('driver.card.issueDateExpiry') }}:</span>
                      <span class="view-value">{{ formatDate(tc.issued_at) }} — {{ formatDate(tc.expires_at) }}</span>
                    </div>
                    <div v-if="tc.scan_url" class="view-row">
                      <span class="view-label">{{ t('driver.documents.docScan') }}:</span>
                      <span class="view-value">
                        <n-button text type="primary" size="small" @click="openScanModal(tc.scan_url, tachographCardsFromDocuments.length > 1 ? `${t('driver.card.scanTachograph')} (${ti + 1})` : t('driver.card.scanTachograph'))">
                          {{ t('driver.card.viewScan') }}
                        </n-button>
                      </span>
                    </div>
                  </div>
                  </template>
                </template>
                <!-- Legacy tachograph card -->
                <template v-if="profile.tachograph_card_number && tachographCardsFromDocuments.length === 0">
                  <div v-if="medicalCertificatesFromDocuments.length > 0 || hasLegacyMedicalData" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-row">
                    <span class="view-label">{{ t('driver.card.tachographCard') }}:</span>
                    <span class="view-value">{{ profile.tachograph_card_number }}</span>
                  </div>
                </template>
                <!-- Technical minimum certs (from documents) -->
                <template v-for="(tm, tmi) in technicalMinimumCertsFromDocuments" :key="tm.id || tmi">
                  <template v-if="!isHidden(`tech_min:${tmi}`)">
                  <div v-if="tmi > 0 || tachographCardsFromDocuments.length > 0 || profile.tachograph_card_number" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-grid extra-passport-block">
                    <div v-if="tm.issued_by" class="view-row">
                      <span class="view-label">{{ t('driver.card.techMinCert') }}{{ technicalMinimumCertsFromDocuments.length > 1 ? ` (${tmi + 1})` : '' }} — {{ t('driver.documents.techMinInstitution') }}:</span>
                      <span class="view-value">{{ tm.issued_by }}</span>
                    </div>
                    <div v-if="tm.number" class="view-row">
                      <span class="view-label">{{ t('driver.card.certNumber') }}:</span>
                      <span class="view-value">{{ tm.number }}</span>
                    </div>
                    <div v-if="tm.issued_at || tm.expires_at" class="view-row">
                      <span class="view-label">{{ t('driver.card.receiptDateExpiry') }}:</span>
                      <span class="view-value">{{ formatDate(tm.issued_at) }} — {{ formatDate(tm.expires_at) }}</span>
                    </div>
                    <div v-if="tm.scan_url" class="view-row">
                      <span class="view-label">{{ t('driver.documents.docScan') }}:</span>
                      <span class="view-value">
                        <n-button text type="primary" size="small" @click="openScanModal(tm.scan_url, technicalMinimumCertsFromDocuments.length > 1 ? `${t('driver.card.scanTechMin')} (${tmi + 1})` : t('driver.card.scanTechMin'))">
                          {{ t('driver.card.viewScan') }}
                        </n-button>
                      </span>
                    </div>
                  </div>
                  </template>
                </template>
                <!-- Legacy technical minimum cert -->
                <template v-if="profile.technical_minimum_certificate && technicalMinimumCertsFromDocuments.length === 0">
                  <div v-if="tachographCardsFromDocuments.length > 0 || profile.tachograph_card_number" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-row">
                    <span class="view-label">{{ t('driver.card.techMinCert') }}:</span>
                    <span class="view-value">{{ profile.technical_minimum_certificate }}</span>
                  </div>
                </template>
                <!-- ADR permits (from documents) -->
                <template v-for="(a, ai) in adrCertsFromDocuments" :key="a.id || ai">
                  <template v-if="!isHidden(`adr:${ai}`)">
                  <div v-if="ai > 0 || technicalMinimumCertsFromDocuments.length > 0 || profile.technical_minimum_certificate" class="extra-passport-block extra-passport-block--not-first" />
                  <div class="view-grid extra-passport-block">
                    <div v-if="a.issued_by" class="view-row">
                      <span class="view-label">{{ t('driver.card.adrCertificate') }}{{ adrCertsFromDocuments.length > 1 ? ` (${ai + 1})` : '' }} — {{ t('driver.card.adrIssuedBy') }}:</span>
                      <span class="view-value">{{ a.issued_by }}</span>
                    </div>
                    <div v-if="a.number" class="view-row">
                      <span class="view-label">{{ t('driver.card.adrCertNumber') }}:</span>
                      <span class="view-value">{{ a.number }}</span>
                    </div>
                    <div class="view-row">
                      <span class="view-label">{{ t('driver.card.adrAllowedClasses') }}:</span>
                      <span class="view-value">{{ formatAdrClasses(a) }}</span>
                    </div>
                    <div v-if="a.issued_at || a.expires_at" class="view-row">
                      <span class="view-label">{{ t('driver.card.issueDateExpiry') }}:</span>
                      <span class="view-value">{{ formatDate(a.issued_at) }} — {{ formatDate(a.expires_at) }}</span>
                    </div>
                    <div v-if="a.scan_url" class="view-row">
                      <span class="view-label">{{ t('driver.documents.docScan') }}:</span>
                      <span class="view-value">
                        <n-button text type="primary" size="small" @click="openScanModal(a.scan_url, adrCertsFromDocuments.length > 1 ? `${t('driver.card.scanAdr')} (${ai + 1})` : t('driver.card.scanAdr'))">
                          {{ t('driver.card.viewScan') }}
                        </n-button>
                      </span>
                    </div>
                  </div>
                  </template>
                </template>
                <div v-if="profile.other_permits" class="view-row">
                  <span class="view-label">{{ t('driver.card.otherPermits') }}:</span>
                  <span class="view-value">{{ profile.other_permits }}</span>
                </div>
                <div v-if="profile.hire_source" class="view-row">
                  <span class="view-label">{{ t('driver.card.hireSource') }}:</span>
                  <span class="view-value">{{ profile.hire_source }}</span>
                </div>
              </div>
            </n-card>
          </template>
        </div>
      </div>
    </n-spin>

    <!-- Scan modal -->
    <Teleport to="body">
      <Transition name="scan-modal-fade">
        <div v-if="scanModalVisible" class="scan-modal-overlay">
          <div
            ref="scanModalEl"
            class="scan-modal-draggable"
            :style="{ left: modalPos.x + 'px', top: modalPos.y + 'px' }"
            @mousedown="onModalContentMousedown"
          >
            <div class="scan-modal-header" @mousedown.stop="startDrag">
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
const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** Driver mode: load own profile */
    isDriverContext?: boolean
    /** Pre-loaded profile (for admin/client) — skip fetch */
    initialProfile?: Record<string, any> | null
  }>(),
  { isDriverContext: true, initialProfile: null }
)

const { apiBase } = useApiBase()
const route = useRoute()
const loading = ref(false)
const error = ref<string | null>(null)
const profile = ref<Record<string, any> | null>(props.initialProfile ?? null)

function isHidden(key: string) {
  const h = profile.value?.hidden_fields
  return Array.isArray(h) && h.includes(key)
}

const scanModalVisible = ref(false)
const scanModalUrl = ref<string | null>(null)
const scanModalTitle = ref('')
const scanModalEl = ref<HTMLElement | null>(null)
const modalPos = ref({ x: 0, y: 0 })
let dragStart = { x: 0, y: 0, posX: 0, posY: 0 }

const statusLabels: Record<string, string> = {
  active: () => t('driver.card.statusActive'),
  inactive: () => t('driver.card.statusInactive'),
  on_leave: () => t('driver.card.statusOnLeave'),
  fired: () => t('driver.card.statusFired'),
}
const employmentLabels: Record<string, () => string> = {
  full_time: () => t('driver.card.employmentFullTime'),
  freelance: () => t('driver.card.employmentFreelance'),
  leased: () => t('driver.card.employmentLeased'),
}

const fullName = computed(() => {
  const p = profile.value
  if (!p) return '—'
  const parts = [p.surname, p.given_name, p.patronymic].filter(Boolean)
  return parts.join(' ') || '—'
})

const citizenshipsDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.citizenships ?? (p.citizenship ? p.citizenship.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (p.citizenship || '')
})

const phonesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.phones ?? (p.phone ? p.phone.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (p.phone || '')
})

const emailsDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.extra_emails ?? (p.additional_emails ? p.additional_emails.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join(', ') : (p.additional_emails || '')
})

const genderLabel = computed(() => {
  const g = profile.value?.gender
  return g === 'female' ? t('driver.card.female') : g === 'male' ? t('driver.card.male') : g || '—'
})

const statusLabel = computed(() => {
  const fn = statusLabels[profile.value?.status]
  return fn ? fn() : (profile.value?.status ?? '—')
})
const employmentLabel = computed(() => {
  const fn = employmentLabels[profile.value?.employment_category]
  return fn ? fn() : (profile.value?.employment_category ?? '—')
})

const passportSeriesNumber = computed(() => {
  const p = profile.value
  if (!p) return ''
  const s = (p.passport_series ?? '').trim()
  const n = (p.passport_number ?? '').trim()
  if (s && n) return `${s} ${n}`
  return s || n || ''
})

const passportDatesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const from = p.passport_issue_date
  const to = p.passport_expiry_date
  if (!from && !to) return ''
  return `${formatDate(from)} — ${formatDate(to)}`
})

const licenseCategoriesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const arr = p.license_categories_arr ?? (p.license_categories ? p.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  return Array.isArray(arr) ? arr.filter(Boolean).join('/') : (p.license_categories || '')
})

const licenseDatesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const from = p.license_issue_date
  const to = p.license_expiry
  if (!from && !to) return ''
  return `${formatDate(from)} — ${formatDate(to)}`
})

const visaDatesDisplay = computed(() => {
  const p = profile.value
  if (!p) return ''
  const from = p.permission_issue_date
  const to = p.permission_validity_date
  if (!from && !to) return ''
  return `${formatDate(from)} — ${formatDate(to)}`
})

const extraPassports = computed(() => {
  const result: Array<{ id?: string; series?: string; number?: string; issued_at?: string; expires_at?: string; issued_by?: string; place_of_birth?: string; residential_address?: string; scan_url?: string }> = []
  const mainSeries = (profile.value?.passport_series ?? '').trim().toUpperCase()
  const mainNumber = (profile.value?.passport_number ?? '').trim()
  const mainKey = `${mainSeries} ${mainNumber}`.trim()

  const extraFromProfile = Array.isArray(profile.value?.extra_passports) ? profile.value.extra_passports : []
  for (let i = 0; i < extraFromProfile.length; i++) {
    const p = extraFromProfile[i]
    result.push({
      id: `ep-${i}`,
      series: p.passport_series ?? p.passportSeries ?? '',
      number: p.passport_number ?? p.passportNumber ?? '',
      issued_at: p.passport_issue_date ?? p.passportIssueDate ?? '',
      expires_at: p.passport_expiry_date ?? p.passportExpiryDate ?? '',
      issued_by: p.passport_issued_by ?? p.passportIssuedBy ?? '',
      place_of_birth: p.place_of_birth ?? p.placeOfBirth ?? '',
      residential_address: p.residential_address ?? p.residentialAddress ?? '',
      scan_url: p.passport_scan_url ?? p.passportScanUrl ?? ''
    })
  }

  const fromDocs = profile.value?.passports_from_documents
  if (Array.isArray(fromDocs)) {
    for (const ep of fromDocs) {
      const epSeries = (ep.series ?? '').trim().toUpperCase()
      const epNumber = (ep.number ?? '').trim()
      const epKey = `${epSeries} ${epNumber}`.trim()
      if (mainKey && epKey === mainKey) continue
      result.push({
        id: ep.id,
        series: ep.series,
        number: ep.number,
        issued_at: ep.issued_at,
        expires_at: ep.expires_at,
        issued_by: ep.issued_by,
        place_of_birth: ep.place_of_birth,
        residential_address: ep.residential_address,
        scan_url: ep.scan_url
      })
    }
  }
  return result
})

const hasMainPassportData = computed(() => {
  const p = profile.value
  return p && (passportSeriesNumber.value || p.passport_issued_by || p.place_of_birth || p.residential_address || p.passport_scan_url)
})

const hasPassportData = computed(() => hasMainPassportData.value || extraPassports.value.length > 0)

const hasVisiblePassportData = computed(() => {
  if (!hasPassportData.value) return false
  if (!isHidden('passport:0') && hasMainPassportData.value) return true
  return extraPassports.value.some((_, i) => !isHidden(`passport:${hasMainPassportData.value ? i + 1 : i}`))
})

const extraLicenses = computed(() => {
  const arr = profile.value?.licenses_from_documents
  if (!Array.isArray(arr)) return []
  const mainNumber = (profile.value?.license_number ?? '').trim()
  if (!mainNumber) return arr
  return arr.filter((el: any) => (el.number ?? '').trim() !== mainNumber)
})

const hasMainLicenseData = computed(() => {
  const p = profile.value
  return p && (p.license_number || licenseCategoriesDisplay.value || licenseDatesDisplay.value || p.license_scan_url || p.has_international_license)
})

const hasLicenseData = computed(() => hasMainLicenseData.value || extraLicenses.value.length > 0)

const hasVisibleLicenseData = computed(() => {
  if (!hasLicenseData.value) return false
  if (!isHidden('license:0') && hasMainLicenseData.value) return true
  return extraLicenses.value.some((_, i) => !isHidden(`license:${hasMainLicenseData.value ? i + 1 : i}`))
})

const visasFromDocuments = computed(() => {
  const arr = profile.value?.visas_from_documents
  return Array.isArray(arr) ? arr : []
})

const medicalCertificatesFromDocuments = computed(() => {
  const arr = profile.value?.medical_certificates_from_documents
  return Array.isArray(arr) ? arr : []
})

const hasLegacyMedicalData = computed(() => {
  const p = profile.value
  return p && (p.medical_certificate || p.last_medical_examination_date || p.medical_certificate_scan_url)
})

const tachographCardsFromDocuments = computed(() => {
  const arr = profile.value?.tachograph_cards_from_documents
  return Array.isArray(arr) ? arr : []
})

const technicalMinimumCertsFromDocuments = computed(() => {
  const arr = profile.value?.technical_minimum_certs_from_documents
  return Array.isArray(arr) ? arr : []
})

const adrCertsFromDocuments = computed(() => {
  const arr = profile.value?.adr_certs_from_documents
  return Array.isArray(arr) ? arr : []
})

const hasVisaData = computed(() => {
  const p = profile.value
  return p && (p.permission_entry_zone || p.permission_issue_date || p.permission_validity_date || p.visa_scan_url)
})

const hasPermitsData = computed(() => {
  const p = profile.value
  return p && (
    hasVisaData.value ||
    p.medical_certificate ||
    p.last_medical_examination_date ||
    p.medical_certificate_scan_url ||
    p.technical_minimum_certificate ||
    p.tachograph_card_number ||
    p.other_permits ||
    p.hire_source
  )
})

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU')
}

function formatAdrClasses(a: { allowed_classes?: string[]; license_categories?: string | null }) {
  const arr = Array.isArray(a.allowed_classes) && a.allowed_classes.length
    ? a.allowed_classes
    : (a.license_categories ? a.license_categories.split(',').map((s) => s.trim()).filter(Boolean) : [])
  if (!arr.length) return '—'
  return arr.map((v) => t(`adrClasses.${v}`) || t('adrClasses.fallback', { v })).join(', ')
}

async function loadProfile() {
  if (props.initialProfile) {
    profile.value = props.initialProfile
    return
  }
  loading.value = true
  error.value = null
  try {
    const url = props.isDriverContext
      ? `${apiBase}/cabinet/driver/profile`
      : `${apiBase}/admin/users/${route.params.id}/driver-profile`

    const data = await $fetch<any>(url, { credentials: 'include' })

    const mapped: Record<string, any> = { ...data }
    if (data.citizenship && !data.citizenships) {
      mapped.citizenships = data.citizenship.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (data.phone && !data.phones) {
      mapped.phones = data.phone.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    if (data.license_categories && !data.license_categories_arr) {
      mapped.license_categories_arr = data.license_categories.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
    profile.value = mapped
  } catch (e: any) {
    console.error('Error loading profile:', e)
    error.value = e?.data?.error || t('driver.card.loadProfileError')
  } finally {
    loading.value = false
  }
}

function isImageUrl(url: string) {
  if (!url) return false
  const lower = url.toLowerCase()
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif')
}

function scanFullUrl(path: string) {
  if (!path) return ''
  return path.startsWith('http') ? path : `${apiBase}${path}`
}

function centerModal() {
  if (typeof window === 'undefined') return
  const w = 900
  modalPos.value = {
    x: Math.max(0, (window.innerWidth - w) / 2),
    y: Math.max(0, (window.innerHeight - 700) / 2),
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

function openScanModal(url: string, title: string) {
  scanModalUrl.value = url
  scanModalTitle.value = title
  centerModal()
  scanModalVisible.value = true
}

watch(() => props.initialProfile, (v) => {
  if (v) profile.value = v
}, { immediate: true })

onMounted(() => {
  if (!props.initialProfile) loadProfile()
})
</script>

<style scoped>
.driver-card-view {
  max-width: 900px;
  margin: 0 auto;
}
.view-content {
  padding: 20px 0;
}
.view-card {
  background: var(--n-color-modal, #fff);
}
.view-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.view-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}
.view-label {
  font-weight: 600;
  color: var(--n-text-color-3, #666);
  min-width: 180px;
  flex-shrink: 0;
}
.view-value {
  color: var(--n-text-color, #333);
}
.extra-passport-block {
  margin-top: 8px;
  padding-top: 12px;
}
.extra-passport-block--not-first {
  border-top: 1px dashed var(--n-border-color, #e5e7eb);
  margin-top: 16px;
  padding-top: 16px;
}
.mb-16 { margin-bottom: 16px; }
.mb-24 { margin-bottom: 24px; }

/* Scan modal (same as DriverCardForm) */
.scan-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>
