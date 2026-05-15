import ruCommon from '../locales/ru/common.json'
import ruLanding from '../locales/ru/landing.json'
import ruAdmin from '../locales/ru/admin.json'
import ruClient from '../locales/ru/client.json'
import ruDriver from '../locales/ru/driver.json'

import enCommon from '../locales/en/common.json'
import enLanding from '../locales/en/landing.json'
import enAdmin from '../locales/en/admin.json'
import enClient from '../locales/en/client.json'
import enDriver from '../locales/en/driver.json'

import tkCommon from '../locales/tk/common.json'
import tkLanding from '../locales/tk/landing.json'
import tkAdmin from '../locales/tk/admin.json'
import tkClient from '../locales/tk/client.json'
import tkDriver from '../locales/tk/driver.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages: {
    ru: {
      ...ruCommon,
      ...ruLanding,
      admin: ruAdmin,
      client: ruClient,
      driver: ruDriver
    },
    en: {
      ...enCommon,
      ...enLanding,
      admin: enAdmin,
      client: enClient,
      driver: enDriver
    },
    tk: {
      ...tkCommon,
      ...tkLanding,
      admin: tkAdmin,
      client: tkClient,
      driver: tkDriver
    },
    'tk-TM': {
      ...tkCommon,
      ...tkLanding,
      admin: tkAdmin,
      client: tkClient,
      driver: tkDriver
    }
  }
}))

