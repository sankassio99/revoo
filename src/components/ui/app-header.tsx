import * as React from "react";
import { IconBell, IconArrowLeft, IconSparkles } from "@tabler/icons-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "cn";

export type AppHeaderProps = {
  title: string;
  subtitle?: string;
  logo?: React.ReactNode;
  notifications?: boolean;
  onBack?: () => void;
  onNotificationsClick?: () => void;
  className?: string;
};

function AppHeader({ title, subtitle, logo, notifications = false, onBack, onNotificationsClick, className }: AppHeaderProps) {
  return (
    <header className={cn("flex min-h-12 items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {onBack ? (
          <IconButton icon={<IconArrowLeft stroke={1.5} />} label="Voltar" onClick={onBack} />
        ) : (
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-white [&_svg]:size-5" aria-hidden="true">
            {logo ?? <IconSparkles stroke={1.5} />}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-medium leading-tight">{title}</p>
          {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      <IconButton icon={<IconBell stroke={1.5} />} label="Notificações" badge={notifications} onClick={onNotificationsClick} />
    </header>
  );
}

export { AppHeader };
