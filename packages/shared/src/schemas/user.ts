import { z } from 'zod';

export const userDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']).default('user'),
  createdAt: z.string().datetime(),
});

export type UserDto = z.infer<typeof userDtoSchema>;
