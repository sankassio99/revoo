import { notFound } from "next/navigation";
import { DesignSystemPreview } from "@/components/design-system-preview";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignSystemPreview />;
}
