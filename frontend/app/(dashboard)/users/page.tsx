import { UsersList } from "@/components/users/users-list";
export const instant = false;

export default function UsersPage() {
  return (
    <section>
      <div className="mb-6">
        <p className="text-xs font-semibold text-primary">فضای کار تیم</p>
        <h2 className="mt-1.5 text-xl font-bold text-foreground">کاربران</h2>
        <p className="mt-1.5 text-sm text-muted">فهرست اعضا و مدیریت دسترسی‌های فضای کار</p>
      </div>
      <UsersList />
    </section>
  );
}
