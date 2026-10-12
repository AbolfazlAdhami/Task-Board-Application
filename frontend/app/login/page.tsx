"use client";

import { useState } from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth-api";

type LoginValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const formik = useFormik<LoginValues>({
    initialValues: { email: "", password: "" },

    validate(values) {
      const errors: Partial<Record<keyof LoginValues, string>> = {};

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = "ایمیل معتبر وارد کن.";
      }

      if (values.password.length < 8) {
        errors.password = "گذرواژه باید حداقل ۸ نویسه باشد.";
      }

      return errors;
    },

    async onSubmit(values) {
      setServerError("");

      try {
        await authApi.login(values);
        router.replace("/");
        router.refresh();
      } catch {
        setServerError("ورود انجام نشد؛ ایمیل و گذرواژه را بررسی کن.");
      }
    },
  });

  const emailError = (formik.touched.email || formik.submitCount > 0) && formik.errors.email;
  const passwordError = (formik.touched.password || formik.submitCount > 0) && formik.errors.password;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <p className="mb-2 text-sm font-semibold text-indigo-600">تسک‌برد</p>
        <h1 className="text-2xl font-bold text-slate-900">ورود به حساب</h1>
        <p className="mt-2 text-sm text-slate-500">برای ادامه، اطلاعات حساب کاربری‌ات را وارد کن.</p>

        <form className="mt-8 space-y-5" onSubmit={formik.handleSubmit} noValidate>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
              ایمیل
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
            />
            {emailError && (
              <p id="email-error" className="mt-1 text-sm text-red-600">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
              گذرواژه
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "password-error" : undefined}
            />
            {passwordError && (
              <p id="password-error" className="mt-1 text-sm text-red-600">
                {passwordError}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600" role="alert">
              {serverError}
            </p>
          )}

          <button
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={formik.isSubmitting}
            aria-busy={formik.isSubmitting}
          >
            {formik.isSubmitting ? "در حال ورود…" : "ورود"}
          </button>
        </form>
      </section>
    </main>
  );
}
