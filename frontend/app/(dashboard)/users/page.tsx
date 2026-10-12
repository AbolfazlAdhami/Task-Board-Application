import { UsersList } from "@/components/users/users-list";

export default function UsersPage() {
  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-semibold text-indigo-700">اعضای فضای کار</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">کاربران</h2>
        <p className="mt-2 text-sm text-slate-500">فهرست کاربران و نقش دسترسی آن‌ها</p>
      </div>
      <UsersList />
    </section>
  );
}
