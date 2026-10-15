"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useFormik } from "formik";
import type { CurrentUser } from "@/lib/api/auth-api";
import { todosApi, type Todo, type TodoInput, type TodoPriority, type TodoStatus } from "@/lib/api/todos-api";
import type { UserSummary } from "@/lib/api/users-api";
import type { TiptapDocument } from "@/lib/api/tiptap-document";
import { RichTextEditor } from "./rich-text-editor";

const NO_ASSIGNEE = "";

type FormValues = {
  title: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string;
  assignedTo: string;
  description: TiptapDocument;
};

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void }) {
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="flex flex-col">
        <label className="mb-2 inline text-sm font-semibold text-foreground">{label}</label>
        <ListboxButton className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-right text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span>{selectedLabel ?? "انتخاب کنید"}</span>
          <span aria-hidden="true">⌄</span>
        </ListboxButton>
        <ListboxOptions anchor="bottom end" className="z-60 mt-2 max-h-56 w-(--button-width) overflow-auto rounded-xl border border-border bg-surface p-1 shadow-xl focus:outline-none">
          {options.map((option) => (
            <ListboxOption
              key={option.value || "unassigned"}
              value={option.value}
              disabled={option.disabled}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground data-focus:bg-surface-raised data-disabled:cursor-not-allowed data-disabled:opacity-50"
            >
              {option.label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export function TodoFormDialog({
  open,
  task,
  currentUser,
  users,
  onClose,
  onSaved,
}: {
  open: boolean;
  task: Todo | null;
  currentUser: CurrentUser;
  users: UserSummary[];
  onClose: () => void;
  onSaved: (todo: Todo) => void;
}) {
  const assignableUsers = currentUser.role === "member" ? [{ id: currentUser.userId, displayName: "من", isActive: true }] : users.filter((user) => user.isActive);

  const assigneeOptions: SelectOption[] = [
    { value: NO_ASSIGNEE, label: "بدون مسئول" },
    ...assignableUsers.map((user) => ({
      value: user.id,
      label: user.displayName,
    })),
  ];

  const existingAssignee = task?.assignedTo ?? NO_ASSIGNEE;

  if (task?.assignedTo && !assigneeOptions.some((option) => option.value === task.assignedTo)) {
    assigneeOptions.push({
      value: task.assignedTo,
      label: "مسئول فعلی",
      disabled: true,
    });
  }

  const initialValues: FormValues = {
    title: task?.title ?? "",
    status: task?.status ?? "todo",
    priority: task?.priority ?? "medium",
    dueDate: task?.dueDate ?? "",
    assignedTo: existingAssignee,
    description: task?.description ?? { type: "doc", content: [] },
  };

  const formik = useFormik<FormValues>({
    initialValues,
    validate(values) {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      if (!values.title.trim()) errors.title = "عنوان وظیفه الزامی است.";
      if (values.title.length > 200) errors.title = "عنوان حداکثر ۲۰۰ نویسه باشد.";
      return errors;
    },
    async onSubmit(values, helpers) {
      const assignee = values.assignedTo || null;
      const input: Partial<TodoInput> = {
        title: values.title.trim(),
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || null,
        description: values.description,
      };

      if (!task || assignee !== task.assignedTo) {
        input.assignedTo = assignee;
      }

      try {
        const saved = task ? await todosApi.update(task.id, input) : await todosApi.create(input as TodoInput);

        onSaved(saved);
      } catch {
        helpers.setStatus("ذخیرهٔ وظیفه انجام نشد. ورودی‌ها را بررسی کنید.");
      }
    },
  });

  const statusOptions: SelectOption[] = [
    { value: "todo", label: "برای انجام" },
    { value: "in_progress", label: "در حال انجام" },
    { value: "done", label: "انجام‌شده" },
  ];

  const priorityOptions: SelectOption[] = [
    { value: "low", label: "کم" },
    { value: "medium", label: "متوسط" },
    { value: "high", label: "زیاد" },
  ];

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!formik.isSubmitting) onClose();
      }}
      dir="rtl"
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-slate-950/40" />
      <div className="fixed inset-0 w-screen overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-2xl rounded-3xl bg-surface p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">{task ? "ویرایش وظیفه" : "وظیفهٔ جدید"}</DialogTitle>
              </div>
              <button
                type="button"
                aria-label="بستن پنجره"
                disabled={formik.isSubmitting}
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-muted transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ✕
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="todo-title" className="mb-2 block text-sm font-semibold text-foreground">
                  عنوان
                </label>
                <input
                  {...formik.getFieldProps("title")}
                  id="todo-title"
                  autoFocus
                  maxLength={200}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {formik.touched.title && formik.errors.title && (
                  <p role="alert" className="mt-1 text-xs text-danger">
                    {formik.errors.title}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormSelect label="وضعیت" value={formik.values.status} options={statusOptions} onChange={(value) => void formik.setFieldValue("status", value)} />
                <FormSelect label="اولویت" value={formik.values.priority} options={priorityOptions} onChange={(value) => void formik.setFieldValue("priority", value)} />
                <FormSelect label="مسئول" value={formik.values.assignedTo} options={assigneeOptions} onChange={(value) => void formik.setFieldValue("assignedTo", value)} />
                <div>
                  <label htmlFor="todo-due-date" className="mb-2 block text-sm font-semibold text-foreground">
                    مهلت
                  </label>
                  <input
                    id="todo-due-date"
                    type="date"
                    dir="ltr"
                    {...formik.getFieldProps("dueDate")}
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">شرح</p>
                <RichTextEditor
                  key={task?.id ?? "new-task"}
                  value={formik.values.description}
                  onChange={(document) => {
                    void formik.setFieldValue("description", document, false);
                  }}
                />
              </div>

              {formik.status && (
                <p role="alert" className="rounded-xl bg-danger/10 p-3 text-sm text-danger">
                  {formik.status}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button type="button" disabled={formik.isSubmitting} onClick={onClose} className="rounded-xl px-4 py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-raised">
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-50"
                >
                  {formik.isSubmitting ? "در حال ذخیره…" : "ذخیره"}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
