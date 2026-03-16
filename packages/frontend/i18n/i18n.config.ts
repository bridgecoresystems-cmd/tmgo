import ru from '../locales/ru.json'
import en from '../locales/en.json'
import tk from '../locales/tk.json'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'ru',
  messages: {
    ru,
    en,
    tk,
    'tk-TM': tk
  }
}))
