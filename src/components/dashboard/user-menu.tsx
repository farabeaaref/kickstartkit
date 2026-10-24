import { requireUser } from "@/lib/auth/session";

import { UserMenuDropdown } from "./user-menu-dropdown";

export async function UserMenu() {
  const user = await requireUser();
  return <UserMenuDropdown name={user.fullName} email={user.email} workspaceName={user.workspace.name} />;
}
