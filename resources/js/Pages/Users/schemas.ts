import { z } from 'zod';

export const createUserSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    role: z.string().min(1, 'Role wajib dipilih'),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const editUserSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi'),
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter').or(z.literal('')).optional(),
    role: z.string().min(1, 'Role wajib dipilih'),
});

export type EditUserFormData = z.infer<typeof editUserSchema>;
