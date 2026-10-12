"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { AlertTriangle } from "lucide-react";

type TodoDeleteDialogProps = {
  title?: string;
  open: boolean;
  pending: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function TodoDeleteDialog({
  title,
  open,
  pending,
  error,
  onClose,
  onConfirm,
}: TodoDeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={pending ? () => undefined : onClose}
      dir="rtl"
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <div className="fixed inset-0 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <DialogPanel className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 text-foreground shadow-2xl shadow-black/20">
            <div className="mb-4 grid size-11 place-items-center rounded-2xl bg-danger/10 text-danger">
              <AlertTriangle aria-hidden="true" size={21} />
            </div>
            <DialogTitle className="text-base font-semibold">
              حذف وظیفه
            </DialogTitle>
            <p className="mt-3 text-[13px] leading-6 text-muted">
              «{title}» حذف شود؟ این کار قابل بازگشت نیست.
            </p>

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={onClose}
                className="min-h-10 rounded-xl px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onConfirm}
                className="min-h-10 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-wait disabled:opacity-50"
              >
                {pending ? "در حال حذف…" : "حذف وظیفه"}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
