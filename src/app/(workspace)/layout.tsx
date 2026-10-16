import { redirect } from "next/navigation";
import { AppFrame } from "@/features/navigation/app-frame";
import { getCurrentWorkspace } from "@/lib/auth/current-workspace";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  const { workspace, workspaces } = await getCurrentWorkspace(user);

  return (
    <AppFrame
      activeTenantId={workspace?.tenantId ?? null}
      user={{ email: user.email, displayName: user.displayName }}
      workspaces={workspaces}
    >
      {children}
    </AppFrame>
  );
}
