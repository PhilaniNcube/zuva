import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/rbac";
import { roleHome } from "@/lib/roles";

async function HomeInner() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(roleHome(session.user.role));
  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
