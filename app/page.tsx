import { redirect } from "next/navigation";

import { getSession } from "@/lib/rbac";
import { roleHome } from "@/lib/roles";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(roleHome(session.user.role));
}
