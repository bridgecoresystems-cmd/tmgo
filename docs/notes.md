Критические уязвимости
1. Privilege Escalation (КРИТИЧНО)
routes/auth.ts — при регистрации поле role принимает любую строку без проверки:


role: t.Optional(t.String())  // любой может передать role: "admin"
Любой пользователь может зарегистрироваться с ролью admin или dispatcher.

2. Path Traversal (КРИТИЧНО)
Эндпоинт /api/auth/avatars/:filename — параметр не защищён от ../:


GET /api/auth/avatars/../../db/schema.ts  → вернёт любой файл
То же самое в эндпоинте документов.

Серьёзные уязвимости
3. Нет rate limiting на sign-in
Можно брутфорсить пароли без ограничений.

4. Сессии не инвалидируются при смене пароля
После change-password все старые сессии остаются активными 30 дней.

5. Хардкод секретов в коде
db/index.ts: postgresql://tmgo_user:tmgo_pass123@localhost:5432/tmgo
lib/chat-attachments.ts: 'tmgo-chat-attachment-secret-change-in-prod'
Менее критичные замечания
Проблема	Место
CORS origin: true — принимает запросы с любого домена	backend index.ts
Нет валидации формата email (t.String() вместо t.Email())	sign-in/sign-up
Два конфига better-auth, ни один не используется как обработчик	src/auth.ts и src/auth/index.ts
Secure флаг на cookie только в production	auth.ts
SQL Injection
Нет уязвимостей — используется Drizzle ORM с параметризованными запросами везде, сырого SQL нет.

Хочешь чтобы я сразу исправил эти уязвимости? Начать с самых критичных (privilege escalation + path traversal)?