# Chat Widget Architecture — Правила и Уроки

> Пасхалка от трёх сессий отладки: Claude Opus (VS Code) + Claude Sonnet + Gemini Pro (Antigravity).
> Если ты здесь — значит беджики снова сломались. Читай внимательно.

---

## Обзор архитектуры

```
[Client/Driver FAB] → picker popup → openChat(orderId, carrierId)
                                          ↓
                                    [ChatWidget.vue]
                                          ↓
                              WebSocket /cabinet/chat/ws/:orderId/:carrierId
                                          ↓
                                   Elysia backend
                                   rooms Map<key, Set<WS>>
```

**Три слоя сброса бейджей:**

1. **Клиентский** (`clientReadAt` в `useOrderChat`) — мгновенно, при открытии/закрытии чата
2. **Сетевой** (`POST /mark-read/:orderId/:carrierId`) — персистит курсор в БД
3. **Реактивный** (`chatClosedTick` + `watch` в кнопках) — обновляет список комнат после закрытия

---

## Правило №1 — WebSocket должен жить ровно столько, сколько открыта панель

**ChatWidget.vue** должен открывать WS только когда `modelValue === true && orderId && carrierId`.  
Когда панель закрывается (`modelValue → false`) — WS закрывается немедленно.

```typescript
// ПРАВИЛЬНО — watch на три условия вместе
watch(
  () => ({ open: props.modelValue, orderId: props.orderId, carrierId: props.carrierId }),
  (curr, prev) => {
    const wasActive = !!(prev?.open && prev.orderId && prev.carrierId)
    const isActive = !!(curr.open && curr.orderId && curr.carrierId)
    if (!isActive && wasActive) { closeWs(); return }
    if (isActive && (!wasActive || keyChanged)) { closeWs(); openWs(); }
  },
  { immediate: true }
)
```

**НЕЛЬЗЯ** смотреть только на `orderId/carrierId` и игнорировать `modelValue` — пользователь останется "в комнате" даже после закрытия чата, и бэкенд будет считать его онлайн-читателем.

---

## Правило №2 — Бэкенд НЕ обновляет курсор автоматически при получении сообщений

WS-хендлер на бэкенде рассылает сообщения по комнате и нотифицирует противоположную сторону. **Всё.** Курсор прочтения он не трогает.

```typescript
// ПРАВИЛЬНО — только рассылка + уведомление другой стороны
rooms.get(key)?.forEach(conn => conn.send(payload))

// Уведомить только другого участника (не отправителя)
for (const uid of [cp?.userId, carrier?.userId]) {
  if (uid && uid !== user.id) {
    notifyConns.get(uid)?.forEach(c => c.send(notifyPayload))
  }
}

// НЕ ДЕЛАТЬ:
// db.update(chatReadCursors).set({ lastReadAt: new Date() }).where(...)
// — это было первопричиной бага: auto-mark превращал все входящие в "прочитанные"
```

---

## Правило №3 — Курсор пишется только через mark-read эндпоинт, и только SQL-время

Есть специальный эндпоинт `POST /cabinet/chat/mark-read/:orderId/:carrierId`.  
Он вызывается в двух местах — при открытии чата и при закрытии.

**Время курсора — только из БД, никакого `new Date()` в Node:**

```typescript
// ПРАВИЛЬНО — время берётся из самой таблицы сообщений
const cursorSql = sql`COALESCE(
  (SELECT max(created_at) FROM order_messages
   WHERE order_id = ${orderId} AND carrier_profile_id = ${carrierId}),
  now()
)`

await db.insert(chatReadCursors)
  .values({ ..., lastReadAt: cursorSql })
  .onConflictDoUpdate({ ..., set: { lastReadAt: cursorSql } })
```

**Почему нельзя `new Date()`:**  
Колонка `created_at` в `order_messages` — тип `timestamp without time zone`.  
PostgreSQL хранит UTC-время. Node.js `new Date()` возвращает локальное время сервера.  
На VPS с Ашхабадом (UTC+5) это давало смещение в **5 часов** — курсор записывался в будущем,  
и все сообщения казались "прочитанными" навсегда.

---

## Правило №4 — closeChat() должен быть await перед обновлением picker

В `cabinet-driver.vue` и `cabinet-client.vue` функция `handleChatBack` — **async**:

```typescript
// ПРАВИЛЬНО
async function handleChatBack() {
  await closeChat()  // ждём mark-read + chatClosedTick++
  chatButtonRef.value?.openPicker()  // теперь picker откроется со свежими данными
}
```

Без `await` — `loadRooms()` в `watch(chatClosedTick)` стартует до того как курсор сохранён в БД,  
и сервер вернёт старые счётчики непрочитанных.

---

## Правило №5 — Клиентский read tracker как защитный слой

`useOrderChat` держит `clientReadAt: Record<string, number>` — карту `roomKey → timestamp`.  
Это позволяет бейджу исчезнуть мгновенно, не дожидаясь ответа сервера.

```typescript
function isRoomRead(orderId: string, carrierId: string, lastMessageAt?: string): boolean {
  const readAt = clientReadAt.value[roomKey(orderId, carrierId)]
  if (!readAt) return false
  if (!lastMessageAt) return true
  return readAt + 1000 >= new Date(lastMessageAt).getTime()
}
```

В кнопках (`effectiveUnread` / `driverUnread`) приоритет:
1. Чат открыт для этой комнаты → 0
2. `isRoomRead` → 0  
3. Иначе → `room.unreadCount` с сервера

---

## Хронология багов (для истории)

### Баг 1: Бейджи не появляются после первого открытия чата

**Симптом:** Новые сообщения не дают бейдж, если чат хоть раз открывался.  
**Причина:** WS в ChatWidget смотрел только на `orderId/carrierId`, не на `modelValue`.  
После закрытия панели WS оставался жить. Бэкенд считал пользователя "в комнате"  
и auto-обновлял курсор при каждом входящем сообщении.  
**Лечение:** Привязать WS lifecycle к `modelValue` (Правило №1) + убрать auto-cursor из WS хендлера (Правило №2).

### Баг 2: Бейджи исчезают мгновенно при открытии, но появляются снова при закрытии

**Симптом:** Открываешь чат — бейдж пропал. Нажимаешь "Назад" — бейдж вернулся.  
**Причина:** `loadRooms()` запускался синхронно до `await mark-read` в `closeChat()`.  
Сервер возвращал старый `unreadCount` потому что курсор ещё не был записан.  
**Лечение:** `await closeChat()` в `handleChatBack` (Правило №4).

### Баг 3: Курсор записывается в будущем (timezone drift)

**Симптом:** После первого открытия чата все сообщения навсегда "прочитаны",  
даже на свежем сервере без кэша.  
**Причина:** `new Date()` в Node.js на Ашхабадском VPS (UTC+5) vs `timestamp without time zone` в PG.  
Node передавал время как будто оно UTC, PG добавлял +5 часов при сравнении.  
**Лечение:** Убрать `new Date()` из mark-read, использовать `COALESCE(max(created_at), now())` в SQL (Правило №3).  
**Нашёл:** Gemini Pro (Antigravity) — спасибо 🤖

---

## Структура файлов

```
packages/
  backend/src/routes/cabinet/chat.ts   — WS хендлер, mark-read эндпоинт, notify WS
  frontend/
    composables/useOrderChat.ts        — глобальное состояние чата, clientReadAt, mark-read вызовы
    components/ChatWidget.vue          — UI чата, WS lifecycle
    components/DriverChatButton.vue    — FAB + picker для водителя, effectiveUnread()
    components/ClientChatButton.vue    — FAB + two-level picker для клиента, driverUnread()
    layouts/cabinet-driver.vue         — async handleChatBack
    layouts/cabinet-client.vue         — async handleChatBack
```

---

## Инварианты, которые нельзя нарушать

| # | Инвариант |
|---|-----------|
| 1 | WS в ChatWidget закрывается когда `modelValue` становится `false` |
| 2 | Бэкенд WS хендлер **не пишет** в `chat_read_cursors` |
| 3 | Все записи в `chat_read_cursors.last_read_at` — через SQL `max(created_at)`, не `new Date()` |
| 4 | `handleChatBack` — `async`, ждёт `await closeChat()` перед `openPicker()` |
| 5 | `effectiveUnread` / `driverUnread` проверяют `chatOpen` и `isRoomRead` перед `unreadCount` |
| 6 | Notify WS уведомляет только другого участника, не отправителя |
