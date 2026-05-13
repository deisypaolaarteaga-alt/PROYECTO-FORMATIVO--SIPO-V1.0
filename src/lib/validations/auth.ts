import { z } from 'zod';

// ============ Auth schemas ============

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const registroSchema = z
  .object({
    nombre_completo: z
      .string()
      .min(1, 'El nombre completo es obligatorio')
      .min(3, 'El nombre debe tener al menos 3 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres'),
    email: z
      .string()
      .min(1, 'El correo electrónico es obligatorio')
      .email('Ingresa un correo electrónico válido'),
    password: z
      .string()
      .min(1, 'La contraseña es obligatoria')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe incluir mayúsculas, minúsculas y números'
      ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
    empresa: z.string().optional(),
    ciudad: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const recuperarContrasenaSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingresa un correo electrónico válido'),
});

export const nuevaContrasenaSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe incluir mayúsculas, minúsculas y números'
      ),
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// ============ Onboarding schemas ============

export const onboardingEmpresaSchema = z.object({
  empresa: z
    .string()
    .min(1, 'El nombre de la empresa es obligatorio')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  ciudad: z.string().min(1, 'Selecciona una ciudad'),
  nit: z.string().optional(),
  telefono: z.string().optional(),
});

export const onboardingProyectoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre de la obra es obligatorio')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  cliente_nombre: z.string().optional(),
  ubicacion: z.string().min(1, 'Selecciona la ciudad de la obra'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

// Tipos inferidos
export type LoginInput = z.infer<typeof loginSchema>;
export type RegistroInput = z.infer<typeof registroSchema>;
export type RecuperarContrasenaInput = z.infer<typeof recuperarContrasenaSchema>;
export type NuevaContrasenaInput = z.infer<typeof nuevaContrasenaSchema>;
export type OnboardingEmpresaInput = z.infer<typeof onboardingEmpresaSchema>;
export type OnboardingProyectoInput = z.infer<typeof onboardingProyectoSchema>;
