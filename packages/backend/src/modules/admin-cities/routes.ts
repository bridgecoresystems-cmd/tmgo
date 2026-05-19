// Внимание: исходный contract сохранён 1:1 — у admin-роутов нет авторизации
// (так было до рефакторинга), а 404 отдаётся голой строкой через error().
import { Elysia } from 'elysia';
import { createCityBody, updateCityBody } from './schema';
import {
  listAllCities, listActiveCities, createCity, updateCity, deleteCity,
} from './service';

export const adminCitiesRoutes = new Elysia({ prefix: '/admin/cities' })
  .get('/', () => listAllCities())
  .post('/', ({ body }) => createCity(body), { body: createCityBody })
  .patch('/:id', async ({ params, body, error }) => {
    const updated = await updateCity(params.id, body);
    if (!updated) return error(404, 'City not found');
    return updated;
  }, { body: updateCityBody })
  .delete('/:id', async ({ params, error }) => {
    const deleted = await deleteCity(params.id);
    if (!deleted) return error(404, 'City not found');
    return { success: true };
  });

// Public endpoint для SearchBar
export const publicCitiesRoutes = new Elysia({ prefix: '/cities' })
  .get('/', () => listActiveCities());
