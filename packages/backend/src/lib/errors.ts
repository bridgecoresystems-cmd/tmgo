// Стандартные ошибки приложения. Сервис бросает их, не зная про HTTP.
// Маппинг в HTTP-ответ — централизованно через mapErrorToResponse (см. ниже),
// который модули вешают на .onError.
//
// Контракт ответа сохраняем прежним: { error: <code> } + соответствующий status,
// потому что фронтенд проверяет e.data.error (например 'already_reviewed').
export class AppError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export class Unauthorized extends AppError {
  constructor(code = 'unauthorized') { super(401, code); }
}
export class Forbidden extends AppError {
  constructor(code = 'forbidden') { super(403, code); }
}
export class NotFound extends AppError {
  constructor(code = 'not_found') { super(404, code); }
}
export class BadRequest extends AppError {
  constructor(code = 'bad_request') { super(400, code); }
}
export class Conflict extends AppError {
  constructor(code = 'conflict') { super(409, code); }
}

// Вешается на .onError модуля. Известные AppError → { error: code } + status.
// Всё остальное пробрасывается дальше в дефолтный обработчик Elysia.
export function mapErrorToResponse(error: unknown, set: { status?: number | string }) {
  if (error instanceof AppError) {
    set.status = error.status;
    return { error: error.code };
  }
  return undefined;
}
