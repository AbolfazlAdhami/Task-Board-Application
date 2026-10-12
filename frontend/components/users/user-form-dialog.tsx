"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useFormik } from "formik";
import { AxiosError } from "axios";
import type { UserRole } from "@/lib/api/auth-api";
import {
  usersApi,
  type CreateUserInput,
  type UpdateUserInput,
  type UserSummary,
} from "@/lib/api/users-api";

type UserFormValues = {
  displayName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
};

const roleOptions: { value: UserRole; label: string }[] = [
  { value: "owner", label: "مالک" },
  { value: "manager", label: "مدیر" },
  { value: "member", label: "عضو" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data?.message;
    if (Array.isArray(responseMessage)) return responseMessage.join("، ");
    if (typeof responseMessage === "string") {
      if (responseMessage.includes("last active owner")) {
        return "آخرین مالک فعال را نمی‌توان غیرفعال یا به نقش دیگری تبدیل کرد.";
      }
      if (responseMessage.includes("already registered")) {
        return "این ایمیل قبلاً ثبت شده است.";
      }
      if (responseMessage.includes("not found")) {
        return "این کاربر دیگر در دسترس نیست. فهرست را تازه کنید.";
      }
    }
  }

  return "ذخیرهٔ اطلاعات کاربر انجام نشد. دوباره تلاش کنید.";
}

function Field({
  id,
  label,
  type = "text",
  value,
  error,
  autoComplete,
  maxLength,
  onChange,
}: {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  error?: string;
  autoComplete: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="min-h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-danger"
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function UserFormDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: UserSummary | null;
  onClose: () => void;
  onSaved: (user: UserSummary) => void;
}) {
  const formik = useFormik<UserFormValues>({
    enableReinitialize: true,
    initialValues: {
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "member",
      isActive: user?.isActive ?? true,
    },
    validate(values) {
      const errors: Partial<Record<keyof UserFormValues, string>> = {};
      if (!values.displayName.trim()) errors.displayName = "نام الزامی است.";
      if (values.displayName.length > 120)
        errors.displayName = "نام حداکثر ۱۲۰ نویسه باشد.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
        errors.email = "ایمیل معتبر وارد کنید.";
      if (values.email.length > 320)
        errors.email = "ایمیل بیش از حد طولانی است.";
      if (!user && values.password.length < 8)
        errors.password = "گذرواژه باید دست‌کم ۸ نویسه داشته باشد.";
      return errors;
    },
    async onSubmit(values, helpers) {
      const profile = {
        displayName: values.displayName.trim(),
        email: values.email.trim(),
      };

      try {
        const saved = user
          ? await usersApi.update(user.id, {
              ...profile,
              role: values.role,
              isActive: values.isActive,
            } satisfies UpdateUserInput)
          : await usersApi.create({
              ...profile,
              password: values.password,
              role: values.role,
            } satisfies CreateUserInput);
        onSaved(saved);
      } catch (error) {
        helpers.setStatus(getErrorMessage(error));
      }
    },
  });

  const selectedRole = roleOptions.find(
    (option) => option.value === formik.values.role,
  );

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!formik.isSubmitting) onClose();
      }}
      dir="rtl"
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-lg rounded-3xl border border-border bg-surface p-5 text-foreground shadow-2xl shadow-black/20 sm:p-7">
            <div className="mb-6">
              <DialogTitle className="text-lg font-bold">
                {user ? "ویرایش کاربر" : "افزودن کاربر"}
              </DialogTitle>
              <p className="mt-1.5 text-sm leading-6 text-muted">
                {user
                  ? "اطلاعات و سطح دسترسی این حساب را تغییر دهید."
                  : "حساب جدید با گذرواژهٔ اولیه ساخته می‌شود؛ کاربر می‌تواند بعداً گذرواژه‌اش را عوض کند."}
              </p>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <Field
                id="user-display-name"
                label="نام و نام خانوادگی"
                value={formik.values.displayName}
                error={
                  formik.touched.displayName
                    ? formik.errors.displayName
                    : undefined
                }
                autoComplete="name"
                maxLength={120}
                onChange={(value) =>
                  void formik.setFieldValue("displayName", value)
                }
              />
              <Field
                id="user-email"
                label="ایمیل"
                type="email"
                value={formik.values.email}
                error={formik.touched.email ? formik.errors.email : undefined}
                autoComplete="email"
                maxLength={320}
                onChange={(value) => void formik.setFieldValue("email", value)}
              />
              {!user && (
                <Field
                  id="user-password"
                  label="گذرواژهٔ اولیه"
                  type="password"
                  value={formik.values.password}
                  error={
                    formik.touched.password ? formik.errors.password : undefined
                  }
                  autoComplete="new-password"
                  maxLength={72}
                  onChange={(value) =>
                    void formik.setFieldValue("password", value)
                  }
                />
              )}

              <div>
                <Listbox
                  value={formik.values.role}
                  onChange={(role) => void formik.setFieldValue("role", role)}
                  disabled={formik.isSubmitting}
                >
                  <ListboxLabel className="mb-2 block text-sm font-semibold text-foreground">
                    نقش دسترسی
                  </ListboxLabel>
                  <ListboxButton className="flex min-h-11 w-full items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2.5 text-right text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span>{selectedRole?.label}</span>
                    <span aria-hidden="true" className="text-muted">
                      ⌄
                    </span>
                  </ListboxButton>
                  <ListboxOptions
                    anchor="bottom end"
                    className="z-60 mt-2 max-h-52 w-[var(--button-width)] overflow-auto rounded-xl border border-border bg-surface p-1 shadow-xl focus:outline-none"
                  >
                    {roleOptions.map((option) => (
                      <ListboxOption
                        key={option.value}
                        value={option.value}
                        className="cursor-pointer rounded-lg px-3 py-2.5 text-sm text-foreground data-[focus]:bg-surface-raised"
                      >
                        {option.label}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </Listbox>
                <p className="mt-1.5 text-xs leading-5 text-muted">
                  مالک کاربران را مدیریت می‌کند؛ مدیر وظایف تیم را مدیریت
                  می‌کند؛ عضو به وظایف خودش دسترسی دارد.
                </p>
              </div>

              {user && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-3.5">
                  <input
                    type="checkbox"
                    checked={formik.values.isActive}
                    disabled={formik.isSubmitting}
                    onChange={(event) =>
                      void formik.setFieldValue(
                        "isActive",
                        event.target.checked,
                      )
                    }
                    className="mt-0.5 size-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-foreground">
                      حساب فعال باشد
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">
                      حساب غیرفعال نمی‌تواند وارد شود و نشست‌های قبلی آن نیز رد
                      می‌شوند.
                    </span>
                  </span>
                </label>
              )}

              {formik.status && (
                <p
                  role="alert"
                  className="rounded-xl bg-danger/10 p-3 text-sm leading-6 text-danger"
                >
                  {formik.status}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={formik.isSubmitting}
                  onClick={onClose}
                  className="min-h-11 rounded-xl px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-60"
                >
                  {formik.isSubmitting
                    ? "در حال ذخیره…"
                    : user
                      ? "ذخیرهٔ تغییرات"
                      : "ساخت کاربر"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
