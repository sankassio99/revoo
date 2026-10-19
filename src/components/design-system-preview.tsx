"use client";

import * as React from "react";
import {
  IconArrowRight,
  IconBell,
  IconCalendar,
  IconCalendarPlus,
  IconClock,
  IconHome,
  IconPlug,
  IconQrcode,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconSun,
  IconUsers,
  IconUsersGroup,
  IconBrandWhatsapp,
  IconMapPin,
  IconShare,
} from "@tabler/icons-react";
import { ActionBar } from "@/components/ui/action-bar";
import { AddButton } from "@/components/ui/add-button";
import { AppHeader } from "@/components/ui/app-header";
import { AppointmentCard } from "@/components/ui/appointment-card";
import { ArrowButton } from "@/components/ui/arrow-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientCard } from "@/components/ui/client-card";
import { CoverHeader } from "@/components/ui/cover-header";
import { DayHoursRow } from "@/components/ui/day-hours-row";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { HoursCard } from "@/components/ui/hours-card";
import { IconButton } from "@/components/ui/icon-button";
import { IconCircle } from "@/components/ui/icon-circle";
import { InfoCard } from "@/components/ui/info-card";
import { ListRow } from "@/components/ui/list-row";
import { LogoUploader } from "@/components/ui/logo-uploader";
import { PageHeader } from "@/components/ui/page-header";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { RatingStars } from "@/components/ui/rating-stars";
import { SearchField } from "@/components/ui/search-field";
import { SectionTitle } from "@/components/ui/section-title";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectField } from "@/components/ui/select-field";
import { ServiceRow } from "@/components/ui/service-row";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TextField } from "@/components/ui/text-field";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { WeekStrip } from "@/components/ui/week-strip";

const swatches = [
  ["Ink", "#1E1E1E", "bg-ink"], ["Ink soft", "#B8B8B3", "bg-ink-soft"],
  ["Canvas", "#F2F2F0", "bg-canvas"], ["Surface", "#FFFFFF", "bg-surface"],
  ["Muted", "#8A8A86", "bg-muted"], ["Line", "#DADAD5", "bg-line"],
  ["Off", "#D3D3CE", "bg-off"], ["Brand", "#6B4EF0", "bg-brand"],
  ["Brand hover", "#5B3FE0", "bg-brand-hover"], ["Brand soft", "#E9E4FF", "bg-brand-soft"],
  ["Brand deep", "#4A34C4", "bg-brand-deep"], ["Brand tint", "#D9D2FF", "bg-brand-tint"],
  ["Leaf", "#CBDB7C", "bg-leaf"], ["Leaf soft", "#E3EDB0", "bg-leaf-soft"],
  ["Leaf deep", "#2F3A0B", "bg-leaf-deep"], ["Leaf mid", "#4B5A14", "bg-leaf-mid"],
  ["Sun", "#FFC845", "bg-sun"], ["Sun soft", "#FFE3A3", "bg-sun-soft"],
  ["Sun deep", "#6B4C00", "bg-sun-deep"], ["Sun ink", "#3D2C00", "bg-sun-ink"],
  ["Stone soft", "#E8E8E4", "bg-stone-soft"], ["Stone deep", "#444441", "bg-stone-deep"],
  ["Danger", "#F0443A", "bg-danger"], ["Danger soft", "#FDE0DE", "bg-danger-soft"],
  ["Danger deep", "#A32D2D", "bg-danger-deep"],
];

const today = new Date();
const monday = new Date(today);
monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
const weekDays = Array.from({ length: 7 }, (_, index) => {
  const date = new Date(monday);
  date.setDate(monday.getDate() + index);
  return { date, label: new Intl.DateTimeFormat("pt-PT", { weekday: "short" }).format(date).slice(0, 2) };
});

function DemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <SectionTitle title={title} />
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function DemoItem({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="font-mono text-caption text-muted">{name}</p>
      {children}
    </div>
  );
}

export function DesignSystemPreview() {
  const [selectedDate, setSelectedDate] = React.useState(today);
  const [range, setRange] = React.useState("Semana");
  const [filter, setFilter] = React.useState("Todos");
  const [locale, setLocale] = React.useState<"pt" | "en">("pt");
  const [checked, setChecked] = React.useState(true);
  const [active, setActive] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [checkbox, setCheckbox] = React.useState(true);
  const [selectOpen, setSelectOpen] = React.useState(false);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <main className="mx-auto w-full max-w-md space-y-7 px-4 pb-8 pt-[18px]">
        <PageHeader eyebrow="Revoo · UI" title="Design system" subtitle="Componentes, tokens e padrões de interface." />

        <DemoSection title="Fundações">
          <div className="grid grid-cols-2 gap-2">
            {swatches.map(([name, hex, color]) => (
              <div key={name} className="flex min-w-0 items-center gap-2 rounded-card bg-surface p-2">
                <span aria-hidden="true" className={`size-9 shrink-0 rounded-full ${color}`} />
                <span className="min-w-0">
                  <span className="block truncate text-caption">{name}</span>
                  <span className="block text-caption text-muted">{hex}</span>
                </span>
              </div>
            ))}
          </div>
          <Card className="space-y-2 p-4">
            <p className="text-caption font-medium uppercase tracking-[0.08em] text-brand">Tipografia</p>
            <p className="text-display">Display 34</p>
            <p className="text-title">Título 24</p>
            <p className="text-heading">Cabeçalho 20</p>
            <p className="text-body">Corpo 16 · peso 400</p>
            <p className="text-[14px] leading-[1.5]">Secundário 14</p>
            <p className="text-caption">Legenda 12 · raios 20 / 24 / 28</p>
          </Card>
        </DemoSection>

        <DemoSection title="Ações">
          <DemoItem name="Button · variantes">
            <div className="flex flex-wrap gap-2">
              <Button>Principal</Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Contorno</Button>
              <Button variant="ghost">Fantasma</Button>
              <Button variant="destructive">Destrutivo</Button>
              <Button variant="accent">Violeta</Button>
              <Button variant="link">Ligação</Button>
            </div>
          </DemoItem>
          <DemoItem name="Button · tamanhos e estados">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Pequeno</Button>
              <Button size="lg">Grande</Button>
              <Button disabled>Desativado</Button>
              <Button loading>Carregando</Button>
              <Button leftIcon={<IconCalendarPlus stroke={1.5} />} rightIcon={<IconArrowRight stroke={1.5} />}>Com ícones</Button>
            </div>
          </DemoItem>
          <DemoItem name="IconButton">
            <div className="flex flex-wrap items-center gap-2">
              <IconButton icon={<IconBell stroke={1.5} />} label="Notificações" badge />
              <IconButton icon={<IconSettings stroke={1.5} />} label="Definições" variant="ink" />
              <IconButton icon={<IconSparkles stroke={1.5} />} label="Destaque" variant="brand" />
            </div>
          </DemoItem>
          <DemoItem name="AddButton">
            <div className="flex flex-wrap items-center gap-2"><AddButton aria-label="Adicionar" /><AddButton label="Adicionar serviço" /></div>
          </DemoItem>
          <DemoItem name="ArrowButton">
            <div className="flex flex-wrap items-center gap-2"><ArrowButton aria-label="Abrir" /><ArrowButton variant="surface" aria-label="Abrir" /><ArrowButton variant="leaf" aria-label="Abrir" /></div>
          </DemoItem>
        </DemoSection>

        <DemoSection title="Navegação">
          <DemoItem name="AppHeader"><AppHeader title="Bom dia, Kassi" subtitle="O seu estúdio" notifications /></DemoItem>
          <DemoItem name="PageHeader"><PageHeader title="Clientes" subtitle="24 clientes" action={<AddButton aria-label="Adicionar cliente" />} /></DemoItem>
          <DemoItem name="WeekStrip"><WeekStrip days={weekDays} selected={selectedDate} onSelect={setSelectedDate} /></DemoItem>
          <DemoItem name="SegmentedControl"><SegmentedControl options={[{ value: "Dia", label: "Dia" }, { value: "Semana", label: "Semana" }, { value: "Mês", label: "Mês" }]} value={range} onChange={setRange} /></DemoItem>
          <DemoItem name="BottomNav"><BottomNav
            activeKey="today"
            static
            items={[
              { key: "home", label: "Início", icon: <IconHome stroke={1.5} />, href: "/workspace" },
              { key: "today", label: "Hoje", icon: <IconSun stroke={1.5} />, href: "/workspace/appointments" },
              { key: "calendar", label: "Calendário", icon: <IconCalendar stroke={1.5} />, href: "/workspace/appointments" },
              { key: "integrations", label: "Integrações", icon: <IconPlug stroke={1.5} />, href: "/workspace/reports" },
              { key: "settings", label: "Definições", icon: <IconSettings stroke={1.5} />, href: "/workspace/settings" },
            ]}
          /></DemoItem>
        </DemoSection>

        <DemoSection title="Dados e conteúdo">
          <DemoItem name="Avatar"><div className="flex items-center gap-2"><Avatar name="Kassi Silva" size={32} /><Avatar name="Kassi Silva" size={40} /><Avatar name="Kassi Silva" size={48} /><Avatar name="Kassi Silva" size={56} tone="leaf" /></div></DemoItem>
          <DemoItem name="IconCircle"><div className="flex items-center gap-2"><IconCircle icon={<IconUsers />} tone="brand" /><IconCircle icon={<IconUsersGroup />} tone="ink" size={40} /></div></DemoItem>
          <DemoItem name="Badge / Tag">
            <div className="flex flex-wrap gap-2">
              {(["brand", "leaf", "sun", "ink", "stone", "danger"] as const).map((tone) => <Badge key={tone} tone={tone}>{tone}</Badge>)}
              <Badge variant="outline">45 min</Badge>
            </div>
          </DemoItem>
          <DemoItem name="StatusPill"><div className="flex flex-wrap gap-2">{(["agendado", "confirmado", "concluido", "cancelado", "falta"] as const).map((status) => <StatusPill key={status} status={status} />)}</div></DemoItem>
          <DemoItem name="FilterChips"><FilterChips options={[{ value: "Todos", label: "Todos" }, { value: "Cabelo", label: "Cabelo" }, { value: "Barba", label: "Barba" }, { value: "Cor", label: "Coloração" }]} value={filter} onChange={setFilter} /></DemoItem>
          <DemoItem name="RatingStars"><RatingStars value={4.7} count={138} /></DemoItem>
          <DemoItem name="VerifiedBadge"><div className="flex items-center gap-2 text-sm">Estúdio Revoo <VerifiedBadge className="text-brand" /></div></DemoItem>
        </DemoSection>

        <DemoSection title="Cartões">
          <DemoItem name="StatCard">
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Marcações hoje" value="12" caption="+2 esta semana" tone="brand" />
              <StatCard label="Receita" value="€480" caption="Hoje" tone="sun" />
              <StatCard label="Profissionais" value="3" tone="leaf" />
              <StatCard label="Clientes" value="24" tone="ink" />
              <StatCard label="Ação" value="Gerir o estúdio" tone="stone" icon={<IconArrowRight />} />
              <StatCard label="Alertas" value="1" tone="danger" />
            </div>
          </DemoItem>
          <DemoItem name="AppointmentCard"><AppointmentCard client="Inês Martins" service="Corte e lavagem" professional="Marta" time="09:30" status="agendado" category="cabelo" onConfirm={() => undefined} onMore={() => undefined} /></DemoItem>
          <DemoItem name="ClientCard"><ClientCard name="Rita Gomes" phone="+351 910 000 000" topService="Corte" visits={8} href="#" /></DemoItem>
          <DemoItem name="ProfessionalCard"><ProfessionalCard name="Marta Silva" role="Cabeleireira" specialties={[{ label: "Corte", category: "cabelo" }, { label: "Coloração", category: "coloracao" }]} schedule="9:00 às 18:00" active={active} onToggle={setActive} tone="brand" /></DemoItem>
          <DemoItem name="ServiceRow"><ServiceRow name="Corte clássico" duration={45} price={24} category="cabelo" /></DemoItem>
          <DemoItem name="ListRow"><ListRow icon={<IconCalendar />} tone="sun" title="Horário de funcionamento" subtitle="Definir dias e horas" href="#" /></DemoItem>
          <DemoItem name="InfoCard"><InfoCard eyebrow="Um pequeno lembrete" title="Cuide do ritmo do seu dia." body="Deixe espaço entre as marcações para respirar." /></DemoItem>
          <DemoItem name="HoursCard"><HoursCard open rows={[{ label: "Hoje", value: "9:00 às 18:00" }, { label: "Amanhã", value: "9:00 às 14:00" }]} /></DemoItem>
        </DemoSection>

        <DemoSection title="Formulários">
          <DemoItem name="TextField · normal e erro">
            <div className="space-y-3">
              <TextField label="Nome completo" placeholder="Ex.: Inês Martins" />
              <TextField label="Email" type="email" defaultValue="ines@email.pt" error="Introduza um endereço de email válido." />
            </div>
          </DemoItem>
          <DemoItem name="SelectField"><SelectField label="Profissional" placeholder="Escolher profissional" options={[{ value: "marta", label: "Marta Silva" }, { value: "ines", label: "Inês Costa" }]} /></DemoItem>
          <DemoItem name="SearchField"><SearchField placeholder="Pesquisar clientes" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} /></DemoItem>
          <DemoItem name="Switch / Toggle">
            <div className="flex items-center justify-between rounded-card bg-surface px-4 py-2">
              <span className="text-sm">Notificações ativas</span>
              <Switch checked={checked} onCheckedChange={setChecked} label="Ativar notificações" />
            </div>
          </DemoItem>
          <DemoItem name="Checkbox"><label className="flex min-h-11 items-center gap-3 rounded-card bg-surface px-4"><Checkbox checked={checkbox} onCheckedChange={setCheckbox} aria-label="Enviar lembrete ao cliente" /><span className="text-sm">Enviar lembrete ao cliente</span></label></DemoItem>
          <DemoItem name="DayHoursRow">
            <Card>
              <DayHoursRow label="Segunda-feira" open from="9:00" to="18:00" onToggle={() => undefined} />
              <DayHoursRow label="Terça-feira" open={false} onToggle={() => undefined} />
            </Card>
          </DemoItem>
          <DemoItem name="LogoUploader"><LogoUploader onChange={() => undefined} /></DemoItem>
        </DemoSection>

        <DemoSection title="Feedback e estrutura">
          <DemoItem name="EmptyState"><EmptyState icon={<IconSearch />} title="Sem resultados" description="Experimente ajustar a pesquisa ou os filtros." action={{ label: "Limpar filtros", onClick: () => setFilter("Todos") }} /></DemoItem>
          <DemoItem name="SectionTitle"><SectionTitle eyebrow="O seu espaço" title="Acesso rápido" action={<Button size="sm" variant="secondary">Ver tudo</Button>} /></DemoItem>
          <DemoItem name="CoverHeader">
            <CoverHeader
              name="Estúdio Revoo"
              tagline="Cuidado com tempo e intenção."
              verified
              actions={[
                { key: "directions", icon: <IconMapPin stroke={1.5} />, label: "Como chegar", href: "#" },
                { key: "qr", icon: <IconQrcode stroke={1.5} />, label: "Código QR", href: "#" },
                { key: "whatsapp", icon: <IconBrandWhatsapp stroke={1.5} />, label: "WhatsApp", href: "#" },
                { key: "share", icon: <IconShare stroke={1.5} />, label: "Partilhar", href: "#" },
              ]}
              storeHref="#"
            />
          </DemoItem>
          <DemoItem name="ActionBar"><ActionBar ctaLabel="Marcar horário" onCta={() => undefined} locale={locale} onLocaleChange={setLocale} static /></DemoItem>
          <DemoItem name="Select, Dropdown, Dialog e Sheet">
            <div className="flex flex-wrap gap-2">
              <Select open={selectOpen} onOpenChange={setSelectOpen} value={range} onValueChange={(value) => { if (value) setRange(value); }}>
                <SelectTrigger className="w-auto"><SelectValue placeholder="Abrir seleção" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dia">Dia</SelectItem>
                  <SelectItem value="Semana">Semana</SelectItem>
                  <SelectItem value="Mês">Mês</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="secondary">Abrir menu</Button>} />
                <DropdownMenuContent><DropdownMenuItem>Editar</DropdownMenuItem><DropdownMenuItem>Partilhar</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
              <Dialog>
                <DialogTrigger render={<Button variant="secondary">Abrir diálogo</Button>} />
                <DialogContent>
                  <DialogHeader><DialogTitle>Uma janela de diálogo</DialogTitle><DialogDescription>Conteúdo de exemplo para um diálogo acessível.</DialogDescription></DialogHeader>
                </DialogContent>
              </Dialog>
              <Sheet>
                <SheetTrigger render={<Button variant="secondary">Abrir folha</Button>} />
                <SheetContent side="bottom">
                  <SheetHeader><SheetTitle>Folha de exemplo</SheetTitle><SheetDescription>Painel inferior com cantos superiores arredondados.</SheetDescription></SheetHeader>
                </SheetContent>
              </Sheet>
            </div>
          </DemoItem>
        </DemoSection>

        <footer className="flex items-center gap-2 pb-4 text-caption text-muted">
          <IconHome size={16} stroke={1.5} />
          <span>Revoo · fundamentos de interface</span>
          <span className="ml-auto"><IconClock size={16} stroke={1.5} /></span>
        </footer>
      </main>
    </div>
  );
}
