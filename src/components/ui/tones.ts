export type Tone = "brand" | "leaf" | "sun" | "ink" | "stone" | "danger";

export const solidTone: Record<Tone, { bg: string; fg: string; sub: string }> = {
  brand: { bg: "bg-brand", fg: "text-white", sub: "text-brand-tint" },
  leaf: { bg: "bg-leaf", fg: "text-leaf-deep", sub: "text-leaf-mid" },
  sun: { bg: "bg-sun", fg: "text-sun-ink", sub: "text-sun-deep" },
  ink: { bg: "bg-ink", fg: "text-white", sub: "text-ink-soft" },
  stone: { bg: "bg-stone-soft", fg: "text-stone-deep", sub: "text-muted" },
  danger: { bg: "bg-danger", fg: "text-white", sub: "text-danger-soft" },
};

export const softTone: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-deep",
  leaf: "bg-leaf-soft text-leaf-deep",
  sun: "bg-sun-soft text-sun-deep",
  ink: "bg-ink text-white",
  stone: "bg-stone-soft text-stone-deep",
  danger: "bg-danger-soft text-danger-deep",
};

export type ServiceCategory = "cabelo" | "barba" | "coloracao" | "combo" | "outro";

export const categoryTone: Record<ServiceCategory, Tone> = {
  cabelo: "brand",
  barba: "leaf",
  combo: "leaf",
  coloracao: "sun",
  outro: "stone",
};

export type AppointmentStatus =
  | "agendado"
  | "confirmado"
  | "concluido"
  | "cancelado"
  | "falta";

export const statusTone: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  agendado: { label: "Agendado", tone: "brand" },
  confirmado: { label: "Confirmado", tone: "leaf" },
  concluido: { label: "Concluído", tone: "ink" },
  cancelado: { label: "Cancelado", tone: "danger" },
  falta: { label: "Falta", tone: "sun" },
};
