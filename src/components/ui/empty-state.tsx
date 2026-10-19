import * as React from "react";
import { IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { IconCircle } from "@/components/ui/icon-circle";
import { cn } from "cn";

export type EmptyStateAction = { label: string } & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });
export type EmptyStateProps = { icon: React.ReactNode; title: string; description: string; action?: EmptyStateAction; className?: string };

function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section className={cn("rounded-card bg-surface p-5", className)} aria-label={title}>
      <IconCircle icon={icon} tone="brand" />
      <h2 className="mt-3.5 text-heading">{title}</h2>
      <p className="mt-1 text-[14px] leading-[1.5] text-muted">{description}</p>
      {action && <Button href={action.href} onClick={action.onClick} rightIcon={<IconArrowRight aria-hidden="true" stroke={1.5} />} className="mt-3.5">{action.label}</Button>}
    </section>
  );
}

export { EmptyState };
