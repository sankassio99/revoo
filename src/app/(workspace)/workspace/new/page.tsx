import type { Metadata } from "next";
import { NewWorkspaceContent } from "@/features/workspaces/new-workspace/page-content";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return { title: translate(locale, "Create a workspace") };
}

export default function NewWorkspacePage() {
  return <NewWorkspaceContent />;
}
