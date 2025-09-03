import { z } from "zod";

export type ServerResponse<T> = {
  success: boolean;
  error: string | null;
  data: T | null;
};

export type Paginated<T> = {
  totalPages: number;
  currentPage: number;
  perPage: number;
  data: T[];
};

export const SignupFormSchema = z.object({
  email: z.string().email({ message: "Email inválido" }).trim(),
  password: z.string().trim(),
});

export type AuthFormState =
  | {
      error?: string[] | string;
      success: boolean;
    }
  | undefined;
