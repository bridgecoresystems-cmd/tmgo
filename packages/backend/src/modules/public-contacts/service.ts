import { db } from '../../db';
import { contactMessages } from '../../db/schema';
import { BadRequest } from '../../lib/errors';

export async function submitContact(input: { name: string; email: string; message: string }) {
  const { name, email, message } = input;
  if (!name || !email || !message) throw new BadRequest('Missing fields');

  await db.insert(contactMessages).values({ name, email, message });
  return { success: true };
}
