import { redirect } from "next/navigation";
import { InvitationAcceptance } from "@/features/workspaces/invitation-acceptance";
import { getSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; token?: string }>;
}) {
  const { tenantId, token } = await searchParams;
  if (!tenantId || !token) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-paper px-5">
        <p className="max-w-md text-center text-sm leading-6 text-muted">This invitation link is incomplete. Ask the workspace owner for a new one.</p>
      </main>
    );
  }
  const returnTo = `/accept-invitation?tenantId=${encodeURIComponent(tenantId)}&token=${encodeURIComponent(token)}`;
  const user = await getSessionUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-paper px-5">
      <section className="w-full max-w-lg rounded-[28px] border border-line bg-white p-7 sm:p-10">
        <InvitationAcceptance tenantId={tenantId} token={token} />
      </section>
    </main>
  );
}
