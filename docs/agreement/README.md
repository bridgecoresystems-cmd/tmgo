# Пользовательское соглашение — исходники Markdown

Файлы **`ru.md`**, **`en.md`**, **`tk.md`** — готовые тексты для загрузки в Legal Docs CMS: `/admin/legal/agreement/ru|en|tk`.

## Формат файла

1. **YAML frontmatter** (между `---`) — метаданные для API `PUT /admin/legal-docs/agreement/:locale`:
   - `title` → поле `title`
   - `version` → поле `version`
   - `effectiveDate` → поле `effectiveDate` (ISO `YYYY-MM-DD`)
   - `docType` / `locale` — для справки в репозитории (в API не отправляются, задаются URL)

2. **Тело после второго `---`** — Markdown для поля `content`. На публичной странице заголовок `h1` берётся из `title`, поэтому в теле **не дублируйте** главный `#` заголовок — используйте `##` для разделов.

## Импорт вручную

1. Откройте `https://…/admin/legal/agreement/ru` (или `en` / `tk`).
2. Скопируйте `title`, `version`, `effectiveDate` из frontmatter.
3. Скопируйте всё **после** закрывающего `---` в поле контента.
4. Сохраните черновик → опубликуйте.

Рендер на сайте: `marked` (см. `pages/legal/[docType].vue`).
