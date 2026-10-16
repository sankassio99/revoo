import type { Metadata } from "next";
import { NewWorkspaceContent } from "@/features/workspaces/new-workspace/page-content";

export const metadata: Metadata = {
  title: "Create a workspace",
};

export default function NewWorkspacePage() {
  return <NewWorkspaceContent />;
}
