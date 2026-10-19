# Prompt: adaptar o shadcn/ui e implementar o design system (Next.js + Tailwind)

## 1. Papel e objetivo

Você é um engenheiro front-end sénior. Vai implementar um design system novo num **projeto Next.js + Tailwind CSS + shadcn/ui já existente** (uma aplicação de agendamentos para barbearias e salões). O sistema é mobile-first, com estética "soft-minimal": muito espaço, formas em pílula, blocos de cor chapada e tipografia grande com espaçamento apertado.

O projeto **já tem uma biblioteca de componentes shadcn em `src/components/ui`**. A estratégia é:

- **Adaptar** os componentes shadcn que já existem para o novo layout (editando os ficheiros no próprio sítio).
- **Criar** os componentes que ainda não existem, **na mesma pasta `src/components/ui`**, seguindo as convenções do shadcn.
- **Instalar** a biblioteca de ícones **Tabler** (`@tabler/icons-react`), que ainda não existe no projeto.

Use como referencia de implementação os arquivos de implementação dos components em:
- rebranding\design-system\data_cards.html
- rebranding\design-system\forms_feedback_structure.html
- rebranding\design-system\foundations_actions_navigation.html

Objetivos, por ordem de prioridade:

1. Criar os **tokens** (cores, tipografia, raios) e ligá-los às **variáveis semânticas do shadcn**.
2. Adaptar os componentes shadcn existentes e criar os que faltam (secções 5 e 7).
3. Criar uma página de pré-visualização (`/design-system`) com todos os componentes e variantes.
4. **Não quebrar a API pública dos componentes existentes** (nomes de props, variantes e exports). A mudança visual nas telas atuais é esperada e desejada; erros de compilação ou de comportamento não.

---

## 2. Passo zero: inspecionar antes de escrever código

Antes de criar ou alterar qualquer ficheiro, analise o projeto e escreva um resumo curto do que encontrou:

- Versão do Next.js e tipo de roteamento (`app/` ou `pages/`), e se o código vive em `src/`.
- Versão do Tailwind: v4 (`@theme` em CSS, sem `tailwind.config`) ou v3 (`tailwind.config.*`). O formato das variáveis do shadcn depende disto (v3 costuma usar tripletos HSL; v4 usa valores `oklch`).
- O ficheiro `components.json` do shadcn: `style`, caminho do CSS global, aliases (`@/components`, `@/lib/utils`) e `iconLibrary`.
- **Quais componentes já existem em `src/components/ui`** (liste todos os ficheiros) e quais são importados por páginas e outros componentes.
- Utilitários já presentes: `cn` em `src/lib/utils.ts`, `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`, `next-intl` ou outra biblioteca de i18n, `next/font`.
- Se usa TypeScript (assuma que sim; se não, use JS com JSDoc).
- Se existe modo escuro (`.dark` no CSS). O design system é **só modo claro** por agora: não apague o bloco `.dark`, apenas não o desenhe.

**Regras:**

- Os componentes shadcn existentes são **editados no próprio ficheiro**. Não crie cópias paralelas (nada de `components/ds/`).
- Preserve os **nomes de exports, props, variantes e tamanhos** existentes. Se um nome antigo não tem equivalente no novo design, mantenha-o e remapeie o visual para o mais próximo.
- Para primitivos shadcn que faltam (por exemplo `toggle-group`, `dropdown-menu`, `label`, `select`, `switch`), **prefira `npx shadcn@latest add <nome>`** e depois adapte o resultado ao design, em vez de os escrever do zero.
- Reutilize `cn`, `cva` e o que já está instalado. **Não crie outro `cn`.**
- Não altere lógica de negócio, rotas, chamadas de API nem estado. Os componentes são **apresentacionais**: recebem dados por props.
- Siga o estilo de código do projeto (aspas, ponto e vírgula, ordem de imports).

### Ícones: instalar Tabler

O projeto ainda **não tem** a biblioteca de ícones do design system. Instale:

```bash
npm i @tabler/icons-react
```

(use o gestor de pacotes do projeto: `pnpm add`, `yarn add` ou `bun add`, conforme o lockfile).

- Importe sempre com nomes explícitos, por exemplo `import { IconHome } from "@tabler/icons-react"`, e use `stroke={1.5}`.
- Em `next.config.*`, acrescente `experimental.optimizePackageImports: ["@tabler/icons-react"]` (se ainda não houver) para evitar bundles grandes.
- Dentro dos componentes shadcn que **forem adaptados**, troque os ícones do `lucide-react` pelos equivalentes Tabler (`ChevronDown` → `IconChevronDown`, `Check` → `IconCheck`, `X` → `IconX`, e assim por diante).
- **Não remova `lucide-react` do `package.json`**: outras partes da aplicação ainda o usam. Liste no relatório final os ficheiros que continuam a importar `lucide-react`, para migração posterior.
- Se a versão do CLI do shadcn suportar, defina `"iconLibrary": "tabler"` em `components.json`, para que futuros `shadcn add` já gerem ícones Tabler. Caso contrário, deixe como está.

Ícones usados no design (nome Tabler → componente React):

| Uso | Componente |
|---|---|
| Navegação | `IconHome`, `IconSun`, `IconCalendar`, `IconPlug`, `IconSettings` |
| Cabeçalho e ações | `IconBell`, `IconArrowLeft`, `IconSearch`, `IconShare`, `IconPlus`, `IconArrowUpRight`, `IconArrowRight`, `IconDots`, `IconX`, `IconSparkles` |
| Listas | `IconChevronRight`, `IconChevronDown`, `IconUsers`, `IconUserCheck`, `IconUsersGroup`, `IconBuildingStore` |
| Serviços | `IconScissors`, `IconRazor`, `IconDroplet` |
| Página pública | `IconNavigation`, `IconQrcode`, `IconBrandWhatsapp`, `IconCalendarPlus`, `IconMapPin`, `IconRosetteDiscountCheck`, `IconStar`, `IconClock` |

---

## 3. Princípios visuais (regras que valem para tudo)

- **Formas:** círculo para ícones e avatares, **pílula** para botões, chips e linhas de lista, **24 px** para cartões, **20 px** para campos de formulário, **28 px** para o contentor "ecrã" no preview.
- **Superfícies planas:** sem gradientes, sem sombras, sem blur. A profundidade vem de cor chapada e contraste.
- **Cor com significado:** violeta = principal/ação/corte; lima = barba/confirmado; amarelo = coloração/receita; preto = destaque e estado ativo; vermelho só para alerta e cancelado.
- **Tipografia:** apenas dois pesos, **400** e **500**. Títulos grandes com `letter-spacing` negativo. Frases em *sentence case*, nunca tudo em maiúsculas, exceto a legenda (eyebrow) de 12 px.
- **Espaçamento:** base de 4 px. Padding de página 16 px, intervalo entre cartões 8 px, intervalo entre secções 24–26 px.
- **Áreas de toque:** mínimo 44×44 px em qualquer elemento interativo (os círculos de 40 px devem ter área de toque de 44 px, via `min-h-11 min-w-11` ou padding invisível).
- **Sem emojis** na interface. Ícones sempre da família Tabler, traço de 1.5.

---

## 4. Tokens

### 4.1 Paleta

Use nomes próprios para **não colidir** com as cores padrão do Tailwind (`violet`, `lime`, `yellow`).

| Token | Hex | Uso |
|---|---|---|
| `ink` | `#1E1E1E` | Texto principal, botão principal, cartões escuros |
| `ink-soft` | `#B8B8B3` | Texto secundário sobre fundo escuro, ícones inativos da nav |
| `canvas` | `#F2F2F0` | Fundo da aplicação |
| `surface` | `#FFFFFF` | Cartões, campos, botões secundários |
| `muted` | `#8A8A86` | Texto secundário, legendas, placeholders |
| `line` | `#DADAD5` | Divisores e contornos de 0.5–1 px |
| `off` | `#D3D3CE` | Interruptor desligado |
| `brand` | `#6B4EF0` | Violeta: ação principal, selecionado, cartão de corte |
| `brand-hover` | `#5B3FE0` | Hover/pressed do violeta |
| `brand-soft` | `#E9E4FF` | Fundo de ícone/etiqueta violeta |
| `brand-deep` | `#4A34C4` | Texto sobre `brand-soft` |
| `brand-tint` | `#D9D2FF` | Texto secundário sobre `brand` |
| `leaf` | `#CBDB7C` | Lima: barba, confirmado |
| `leaf-soft` | `#E3EDB0` | Fundo de ícone/etiqueta lima |
| `leaf-deep` | `#2F3A0B` | Texto sobre `leaf` e `leaf-soft` |
| `leaf-mid` | `#4B5A14` | Texto secundário sobre `leaf` |
| `sun` | `#FFC845` | Amarelo: coloração, receita, estrelas |
| `sun-soft` | `#FFE3A3` | Fundo de ícone/etiqueta amarela |
| `sun-deep` | `#6B4C00` | Texto sobre `sun-soft`, secundário sobre `sun` |
| `sun-ink` | `#3D2C00` | Texto principal sobre `sun` |
| `stone-soft` | `#E8E8E4` | Avatar/etiqueta neutra |
| `stone-deep` | `#444441` | Texto sobre `stone-soft` |
| `danger` | `#F0443A` | Ponto de notificação, erro |
| `danger-soft` | `#FDE0DE` | Fundo da etiqueta "Cancelado" |
| `danger-deep` | `#A32D2D` | Texto sobre `danger-soft` |

**Pares de contraste já validados** (use sempre estes): branco sobre `brand`; `leaf-deep` sobre `leaf`; `sun-ink` sobre `sun`; branco sobre `ink`; `brand-deep` sobre `brand-soft`. Não invente combinações novas sem confirmar contraste mínimo 4.5:1 para texto de corpo.

### 4.2 Tailwind v4 (se o projeto usar `@theme`)

Em `app/globals.css` (ou no CSS global existente), acrescente sem apagar o que já existe:

```css
@theme {
  --color-ink: #1e1e1e;
  --color-ink-soft: #b8b8b3;
  --color-canvas: #f2f2f0;
  --color-surface: #ffffff;
  --color-muted: #8a8a86;
  --color-line: #dadad5;
  --color-off: #d3d3ce;

  --color-brand: #6b4ef0;
  --color-brand-hover: #5b3fe0;
  --color-brand-soft: #e9e4ff;
  --color-brand-deep: #4a34c4;
  --color-brand-tint: #d9d2ff;

  --color-leaf: #cbdb7c;
  --color-leaf-soft: #e3edb0;
  --color-leaf-deep: #2f3a0b;
  --color-leaf-mid: #4b5a14;

  --color-sun: #ffc845;
  --color-sun-soft: #ffe3a3;
  --color-sun-deep: #6b4c00;
  --color-sun-ink: #3d2c00;

  --color-stone-soft: #e8e8e4;
  --color-stone-deep: #444441;

  --color-danger: #f0443a;
  --color-danger-soft: #fde0de;
  --color-danger-deep: #a32d2d;

  --radius-card: 24px;
  --radius-field: 20px;
  --radius-sheet: 28px;

  --text-display: 34px;
  --text-display--line-height: 1.08;
  --text-display--letter-spacing: -0.03em;
  --text-title: 24px;
  --text-title--line-height: 1.15;
  --text-title--letter-spacing: -0.02em;
  --text-heading: 20px;
  --text-heading--line-height: 1.2;
  --text-heading--letter-spacing: -0.02em;
  --text-body: 16px;
  --text-body--line-height: 1.5;
  --text-secondary: 14px;
  --text-secondary--line-height: 1.5;
  --text-caption: 12px;
  --text-caption--line-height: 1.4;
}
```

### 4.3 Tailwind v3 (se o projeto usar `tailwind.config`)

Use `theme.extend` (nunca `theme` direto, para não apagar o padrão):

```ts
// tailwind.config.ts
extend: {
  colors: {
    ink: { DEFAULT: "#1E1E1E", soft: "#B8B8B3" },
    canvas: "#F2F2F0",
    surface: "#FFFFFF",
    muted: "#8A8A86",
    line: "#DADAD5",
    off: "#D3D3CE",
    brand: { DEFAULT: "#6B4EF0", hover: "#5B3FE0", soft: "#E9E4FF", deep: "#4A34C4", tint: "#D9D2FF" },
    leaf: { DEFAULT: "#CBDB7C", soft: "#E3EDB0", deep: "#2F3A0B", mid: "#4B5A14" },
    sun: { DEFAULT: "#FFC845", soft: "#FFE3A3", deep: "#6B4C00", ink: "#3D2C00" },
    "stone-soft": "#E8E8E4",
    "stone-deep": "#444441",
    danger: { DEFAULT: "#F0443A", soft: "#FDE0DE", deep: "#A32D2D" },
  },
  borderRadius: { card: "24px", field: "20px", sheet: "28px" },
  fontSize: {
    display: ["34px", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
    title: ["24px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
    heading: ["20px", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
    body: ["16px", { lineHeight: "1.5" }],
    secondary: ["14px", { lineHeight: "1.5" }],
    caption: ["12px", { lineHeight: "1.4" }],
  },
}
```

### 4.4 Tipografia

- Fonte: uma sans geométrica/grotesca moderna carregada com `next/font`. **Se o projeto já tem uma fonte, mantenha-a.** Caso contrário use `Geist` (ou `Inter` como alternativa), exposta como variável `--font-sans`.
- Fonte mono (opcional): `Geist Mono`, apenas para **horas** (`9:00`) e valores numéricos em listas. Variável `--font-mono`.
- Escala:

| Papel | Classe | Tamanho | Notas |
|---|---|---|---|
| Display | `text-display` | 34 | Título de página, peso 400 |
| Título | `text-title` | 24 | Título de secção, peso 400 |
| Heading | `text-heading` | 20 | Título dentro de cartão, peso 400 |
| Corpo | `text-body` | 16 | Nome em lista, botões |
| Secundário | `text-secondary` | 14 | Descrições, `text-muted` |
| Legenda | `text-caption` | 12 | Subtítulo de lista, etiquetas |
| Eyebrow | `text-caption uppercase tracking-[0.08em] font-medium` | 12 | Legenda de secção, cor `brand` |

### 4.5 Utilitário `cn`

O shadcn já traz `cn` em `src/lib/utils.ts`. Confirme que existe e reutilize-o. **Não crie outro.**

### 4.6 Ligar os tokens às variáveis semânticas do shadcn

Os componentes shadcn usam variáveis semânticas (`bg-background`, `bg-primary`, `text-muted-foreground`, `border-input`, `ring-ring`, e assim por diante). **Altere os valores dessas variáveis no bloco `:root`** do CSS global para a nova paleta, mantendo o formato que o projeto já usa (tripleto HSL na v3, `oklch` ou hex na v4; converta a partir do hex abaixo, que é a fonte de verdade). Assim, qualquer componente shadcn, mesmo os que não forem tocados, já herda o visual novo.

| Variável shadcn | Hex | Corresponde a |
|---|---|---|
| `--background` | `#F2F2F0` | `canvas` |
| `--foreground` | `#1E1E1E` | `ink` |
| `--card` / `--popover` | `#FFFFFF` | `surface` |
| `--card-foreground` / `--popover-foreground` | `#1E1E1E` | `ink` |
| `--primary` | `#1E1E1E` | `ink` (o botão principal é preto) |
| `--primary-foreground` | `#FFFFFF` | |
| `--secondary` | `#FFFFFF` | `surface` |
| `--secondary-foreground` | `#1E1E1E` | |
| `--muted` | `#E8E8E4` | `stone-soft` |
| `--muted-foreground` | `#8A8A86` | `muted` |
| `--accent` | `#E9E4FF` | `brand-soft` (hover de itens de menu e seleção) |
| `--accent-foreground` | `#4A34C4` | `brand-deep` |
| `--destructive` | `#F0443A` | `danger` |
| `--border` | `#DADAD5` | `line` |
| `--input` | `#DADAD5` | `line` (os campos não usam contorno por padrão) |
| `--ring` | `#6B4EF0` | `brand` |
| `--radius` | `1.5rem` | 24 px; os derivados (`sm`, `md`, `lg`) saem dele |
| `--chart-1` a `--chart-5` | `#6B4EF0`, `#CBDB7C`, `#FFC845`, `#1E1E1E`, `#8A8A86` | gráficos |

Os tokens próprios (`brand`, `leaf`, `sun`, `ink`, `stone-soft`, `danger`, e assim por diante, secções 4.1 a 4.3) **somam-se** a estas variáveis. Nos componentes novos, use os tokens próprios (`bg-brand`, `text-leaf-deep`); nos componentes shadcn adaptados, mantenha as variáveis semânticas sempre que fizerem sentido (`bg-primary`, `text-muted-foreground`) e use os tokens próprios para as variantes novas.

Nas variáveis de barra lateral (`--sidebar-*`), se existirem, não mexa.

---

## 5. Estrutura e mapeamento para o shadcn

**Todos os ficheiros ficam em `src/components/ui`**, em `kebab-case`, um componente por ficheiro, export nomeado, sem *barrel* (o shadcn importa diretamente de cada ficheiro: `@/components/ui/button`). Cada componente exporta os **tipos das props**, usa `forwardRef` onde há elemento DOM interativo e aceita `className` (sempre com `cn`). Mapeamentos partilhados ficam em `src/components/ui/tones.ts`. A pré-visualização fica em `src/app/design-system/page.tsx` (ou `app/` se o projeto não usar `src`).

### 5.1 Componentes do design system

"Adaptar" = editar o ficheiro shadcn existente (ou adicioná-lo com `npx shadcn@latest add` se faltar e depois adaptar). "Novo" = criar o ficheiro.

| Componente | Ficheiro em `src/components/ui` | Ação |
|---|---|---|
| Button | `button.tsx` | Adaptar |
| IconButton | `icon-button.tsx` | Novo (compõe `Button`) |
| AddButton | `add-button.tsx` | Novo (compõe `Button`) |
| ArrowButton | `arrow-button.tsx` | Novo |
| BottomNav | `bottom-nav.tsx` | Novo |
| AppHeader | `app-header.tsx` | Novo |
| PageHeader | `page-header.tsx` | Novo |
| WeekStrip | `week-strip.tsx` | Novo |
| SegmentedControl | `segmented-control.tsx` | Novo (sobre `toggle-group` do shadcn) |
| Avatar | `avatar.tsx` | Adaptar (iniciais com tom) |
| IconCircle | `icon-circle.tsx` | Novo |
| Tag | `badge.tsx` | Adaptar (o Tag **é** o `Badge`, com variantes de tom; não criar `tag.tsx`) |
| StatusPill | `status-pill.tsx` | Novo (sobre `Badge`) |
| FilterChips | `filter-chips.tsx` | Novo (sobre `toggle-group`) |
| RatingStars | `rating-stars.tsx` | Novo |
| VerifiedBadge | `verified-badge.tsx` | Novo |
| StatCard | `stat-card.tsx` | Novo (base `card.tsx`) |
| AppointmentCard | `appointment-card.tsx` | Novo (usa `dropdown-menu`) |
| ClientCard | `client-card.tsx` | Novo |
| ProfessionalCard | `professional-card.tsx` | Novo |
| ServiceRow | `service-row.tsx` | Novo |
| ListRow | `list-row.tsx` | Novo |
| InfoCard | `info-card.tsx` | Novo (base `card.tsx`) |
| HoursCard | `hours-card.tsx` | Novo (base `card.tsx`) |
| TextField | `text-field.tsx` | Novo (compõe `input.tsx` e `label.tsx` adaptados) |
| SelectField | `select-field.tsx` | Novo (sobre `select.tsx` adaptado) |
| SearchField | `search-field.tsx` | Novo (sobre `input.tsx`) |
| Toggle | `switch.tsx` | Adaptar (o Toggle **é** o `Switch`; não criar `toggle.tsx`, que no shadcn é outro componente) |
| DayHoursRow | `day-hours-row.tsx` | Novo (usa `switch.tsx`) |
| LogoUploader | `logo-uploader.tsx` | Novo |
| EmptyState | `empty-state.tsx` | Novo |
| SectionTitle | `section-title.tsx` | Novo |
| CoverHeader | `cover-header.tsx` | Novo |
| ActionBar | `action-bar.tsx` | Novo |

### 5.2 Outros componentes shadcn que já existam (alinhamento visual)

Se existirem `card`, `input`, `label`, `select`, `textarea`, `checkbox`, `radio-group`, `separator`, `skeleton`, `tabs`, `dialog`, `alert-dialog`, `sheet`, `drawer`, `popover`, `dropdown-menu`, `tooltip`, `sonner`/`toast`, `calendar`, `table`, entre outros, **não os reescreva**. Aplique só estes ajustes:

- Cartões e painéis: `rounded-card` (24 px), **sem sombra** e sem contorno por padrão (`shadow-none border-0`), fundo `bg-card`.
- Campos (`input`, `textarea`, `select` trigger): `rounded-field` (20 px), fundo `bg-card`, **sem contorno**, altura mínima 44 px, anel de foco `brand`.
- Sobreposições (`dialog`, `sheet`, `popover`, `dropdown-menu`, `tooltip`): `rounded-card`, sem sombra pesada (no máximo `border border-line`), *overlay* `bg-ink/40`. `sheet` e `drawer` com cantos superiores de 28 px.
- `checkbox` e `radio-group`: selecionado em `brand`.
- `tabs`: tratar como `SegmentedControl` (trilho `bg-card rounded-full p-1`, ativa `bg-brand text-white`).
- Troque os ícones `lucide-react` desses ficheiros por Tabler, **apenas nos que tocar**.
- `table`, `calendar` e outros densos: só ajuste cores e raios; não force pílulas onde prejudicam a leitura.

---

## 6. Tons e mapeamentos (`src/components/ui/tones.ts`)

Centralize a relação cor ↔ significado para não repetir classes.

```ts
export type Tone = "brand" | "leaf" | "sun" | "ink" | "stone" | "danger";

/** Fundo sólido de cartão + cores de texto primário e secundário. */
export const solidTone: Record<Tone, { bg: string; fg: string; sub: string }> = {
  brand:  { bg: "bg-brand",  fg: "text-white",     sub: "text-brand-tint" },
  leaf:   { bg: "bg-leaf",   fg: "text-leaf-deep", sub: "text-leaf-mid" },
  sun:    { bg: "bg-sun",    fg: "text-sun-ink",   sub: "text-sun-deep" },
  ink:    { bg: "bg-ink",    fg: "text-white",     sub: "text-ink-soft" },
  stone:  { bg: "bg-stone-soft", fg: "text-stone-deep", sub: "text-muted" },
  danger: { bg: "bg-danger", fg: "text-white",     sub: "text-danger-soft" },
};

/** Fundo suave para ícones, avatares e etiquetas. */
export const softTone: Record<Tone, string> = {
  brand:  "bg-brand-soft text-brand-deep",
  leaf:   "bg-leaf-soft text-leaf-deep",
  sun:    "bg-sun-soft text-sun-deep",
  ink:    "bg-ink text-white",
  stone:  "bg-stone-soft text-stone-deep",
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
  | "agendado" | "confirmado" | "concluido" | "cancelado" | "falta";

export const statusTone: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  agendado:   { label: "Agendado",   tone: "brand" },
  confirmado: { label: "Confirmado", tone: "leaf" },
  concluido:  { label: "Concluído",  tone: "ink" },
  cancelado:  { label: "Cancelado",  tone: "danger" },
  falta:      { label: "Falta",      tone: "sun" },
};
```

---

## 7. Especificação dos componentes

Todas as medidas abaixo são em px; converta para classes Tailwind (`h-11` = 44, `h-12` = 48, etc.) ou valores arbitrários quando não existir equivalente. Para cada componente: **props**, **visual** e **regras**. O ficheiro de cada um e se é adaptação ou criação estão na tabela da secção 5.1. Onde o componente é uma adaptação, **mantenha as props e variantes shadcn existentes** e acrescente as novas; onde é novo, siga as convenções do shadcn (cva para variantes, `data-slot`, `className` com `cn`).

### 7.1 Ações

**Button** — adaptar `button.tsx` (cva). **Mantenha os nomes de variantes e tamanhos existentes** e remapeie o visual: `default` → principal (`bg-primary text-primary-foreground`, preto); `secondary` → `bg-secondary text-secondary-foreground` (branco); `outline` → branco com `border border-line`; `ghost` → transparente, hover `bg-muted`; `destructive` → `bg-danger text-white`; `link` inalterado. **Acrescente** a variante `accent` (violeta) e as props `leftIcon`, `rightIcon` e `loading`. Tamanhos: `default` 44, `sm` 36, `lg` 52, `icon` 44 em círculo. Renderiza `<button>` (ou `<Link>`/`asChild` quando houver `href`, mantendo o padrão do shadcn).
- Altura 44 (`default`) / 36 (`sm`), padding horizontal 20 / 16, `rounded-full`, texto 15 / 13, peso 400.
- Principal (`default`): `bg-ink text-white`. `secondary`: `bg-surface text-ink`. `accent`: `bg-brand text-white hover:bg-brand-hover`.
- `disabled`: `bg-stone-soft text-muted`, sem pointer events. `loading`: spinner discreto no lugar do ícone, mantém a largura.
- `active:scale-[0.98]` com transição de 120 ms. Respeite `prefers-reduced-motion`.

**IconButton** — novo, compõe `Button size="icon"`. Props: `icon`, `label` (obrigatório, vira `aria-label`), `variant: "surface" | "ink" | "brand"`, `badge?: boolean` (ponto vermelho 8 px no canto superior direito, como o sino).
- Círculo 40 (área de toque 44), ícone 20. `surface`: `bg-surface`. `ink`: `bg-ink text-white`. `brand`: `bg-brand text-white`.

**AddButton** — `label?`. Sem `label`: círculo violeta 44 com ícone `plus`. Com `label`: pílula violeta, altura 44, padding `pl-3.5 pr-4.5`, ícone `plus` 20 + texto 14. Sempre `bg-brand text-white`.

**ArrowButton** — círculo 40 com ícone `arrow-up-right`. `variant: "plain" | "surface" | "leaf"` (`plain`: `bg-canvas`; `surface`: `bg-surface`; `leaf`: `bg-leaf text-leaf-deep`). Decorativo quando está dentro de uma linha clicável (`aria-hidden`).

### 7.2 Navegação

**BottomNav** — `items: { key, label, icon, href }[]`, `activeKey`.
- Posição `fixed inset-x-0 bottom-0` com wrapper `px-4 pb-[max(16px,env(safe-area-inset-bottom))]`, contentor centrado com `max-w-md`.
- Barra `bg-ink rounded-full p-1.5`, itens distribuídos com `justify-between`.
- Item inativo: círculo 48, ícone 22, `text-ink-soft`. Item ativo: pílula `bg-brand text-white`, altura 48, `px-4`, ícone + rótulo 14.
- Itens padrão: Início (`home`), Hoje (`sun`), Calendário (`calendar`), Integrações (`plug`), Definições (`settings`).
- `<nav aria-label="Principal">`, links com `aria-current="page"` no ativo, itens inativos com `aria-label` do rótulo.
- O conteúdo da página precisa de `pb-28` para não ficar escondido atrás da barra.

**AppHeader** — `title`, `subtitle?`, `logo?: ReactNode`, `notifications?: boolean`, `onBack?`.
- Esquerda: círculo 40 `bg-ink` com ícone `sparkles` (ou o `logo`), ao lado título 16 peso 500 e subtítulo 13 `text-muted`. Com `onBack`, troque o logo por um IconButton `arrow-left`.
- Direita: IconButton `bell` com `badge` quando houver notificações.

**PageHeader** — `title`, `subtitle?`, `action?: ReactNode`, `eyebrow?`.
- `h1` com `text-display font-normal`, subtítulo `text-secondary text-muted mt-1.5`. `action` (normalmente AddButton) alinhado à direita pela base (`items-end`). `eyebrow` acima, estilo da secção 4.4.

**WeekStrip** — `days: { date: Date; label: string }[]`, `selected: Date`, `onSelect(date)`.
- Duas linhas de 7 colunas iguais: rótulos 12 `text-muted` e círculos 38. Selecionado: `bg-brand text-white`. Outros: `bg-surface`. Dia atual sem seleção ganha um contorno `border border-ink`.
- Implementar como `role="radiogroup"` com navegação por setas; cada dia é `role="radio"` com `aria-label` completo ("segunda-feira, 19 de outubro").

**SegmentedControl** — sobre `toggle-group` do shadcn (`type="single"`, garantindo que não fica sem seleção). Props: `options: { value, label }[]`, `value`, `onChange`.
- Trilho `bg-surface rounded-full p-1`; opção altura 40, `px-5`; ativa `bg-brand text-white`, inativa `text-muted`. `role="radiogroup"`.

### 7.3 Dados e conteúdo

**Avatar** — adaptar `avatar.tsx` (Radix) mantendo `Avatar`, `AvatarImage` e `AvatarFallback`. Acrescente ao `Avatar` as props `name`, `src?`, `size: 32 | 40 | 48 | 56` e `tone?: Tone`.
- Círculo; com `src` usa `AvatarImage` (ou `next/image` com `object-cover`); sem `src` mostra iniciais (máx. 2 letras) com peso 500. Se `tone` não for passado, derive um tom estável a partir do nome (hash simples entre `brand`, `sun`, `leaf`, `stone`) usando `softTone`.
- Tamanho da inicial: 12 / 14 / 16 / 18 conforme o tamanho.

**IconCircle** — `icon`, `tone`, `size: 40 | 48`. Usa `softTone`; ícone 20 (40) ou 22 (48). `tone="ink"` dá círculo preto com ícone branco.

**Tag** — é o `Badge` adaptado (`badge.tsx`). Mantenha as variantes existentes e acrescente `brand | leaf | sun | ink | stone | danger` (via `softTone`) e `outline`. Props: `tone`, `children`. Pílula `px-2.5 py-0.5 text-caption`; a variante `outline` é `bg-surface border border-line text-ink` (para "45 min"). Exporte também `Tag` como alias de `Badge` para legibilidade.

**StatusPill** — `status: AppointmentStatus`. Usa `statusTone` e renderiza um `Badge`. Sobre cartões coloridos, aceita `onSolid` para usar fundo branco e texto `ink`.

**FilterChips** — `options`, `value`, `onChange`. Construído sobre `toggle-group` do shadcn (`type="single"`). Pílulas de altura 34, `px-3.5`, texto 13. Ativa `bg-ink text-white`, inativa `bg-surface`. `role="tablist"` ou `radiogroup`, scroll horizontal sem barra quando exceder a largura.

**RatingStars** — `value: number`, `count?: number`. Mostra o número (18, peso 500), cinco estrelas `text-sun` com preenchimento proporcional ao valor, e `(N avaliações)` em `text-muted`. `aria-label="Nota 5.0 em 5, 138 avaliações"`.

**VerifiedBadge** — ícone `rosette-discount-check` 26, `text-brand`, com `aria-label="Verificado"`. Usado ao lado do nome do negócio.

### 7.4 Cartões

**StatCard** — `label`, `value`, `caption?`, `tone`, `href?`, `icon?`.
- `rounded-card p-4 min-h-[112px]` (128 no dashboard), `flex flex-col justify-between`, fundo `solidTone[tone].bg`.
- Rótulo em cima: 12, `tracking-[0.04em]`, cor `sub`. Valor: 34, `tracking-[-0.03em]`, `leading-none`, cor `fg`. Legenda 12 em `sub`.
- Variante "ação": `icon` renderiza um ArrowButton `leaf` 32 px no canto superior direito e o valor vira texto 20 ("Gerir o estúdio").
- Com `href`, o cartão inteiro é um link.

**AppointmentCard** — `client`, `service`, `professional`, `time`, `phone?`, `status`, `category`, `onConfirm?`, `onMore?`.
- Hora acima do cartão em `font-mono text-secondary text-muted`.
- Base `card.tsx` adaptado; `rounded-card p-4` com `solidTone[categoryTone[category]]`. Topo: nome 20 + linha "Serviço · Profissional" 13 em `sub`; à direita `StatusPill onSolid`.
- Rodapé (mt-3.5): Button principal (`default`) sm "Confirmar" (invertido para `secondary` quando o fundo é `ink` ou `brand`) e IconButton `dots` branco que abre o `DropdownMenu` do shadcn (Remarcar, Cancelar, Marcar falta). Só mostra "Confirmar" se `status === "agendado"`.
- Várias marcações seguidas formam uma pilha com espaçamento de 8.

**ClientCard** — `name`, `phone?`, `lastVisit?`, `topService?`, `visits?`, `todayAt?`, `href`.
- Cartão branco `rounded-card p-3`, linha inteira clicável. Esquerda: Avatar 48 + nome 16, linha 12 `text-muted` (telefone ou "Última visita: 12 out"), Tag do serviço mais usado. Direita: `todayAt` ou "N visitas" em 12 `text-muted` e chevron `chevron-right`.

**ProfessionalCard** — `name`, `role`, `specialties: {label, category}[]`, `schedule`, `active`, `onToggle`, `tone?`.
- `rounded-card p-4`. Padrão branco; quando `tone` é passado usa `solidTone` (o primeiro profissional em `brand`, o segundo em `leaf`). Cabeçalho: Avatar 52 + nome 18 + função 13; à direita Toggle. Linha de Tags (fundo branco quando o cartão é colorido). Rodapé com ícone `clock` e horário em 13.
- Quando `active` é falso, o cartão fica branco e o horário mostra o motivo (ex.: "De férias até 25 out").

**ServiceRow** — `name`, `duration`, `price`, `category`, `href?`.
- Pílula branca `rounded-full p-2`. IconCircle 48 com ícone por categoria (`scissors`, `razor`, `droplet`) e tom de `categoryTone`. Nome 16, duração 12 `text-muted`. Preço à direita 16 com `pr-3`. Formate o preço com `Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })`.

**ListRow** — `icon`, `tone`, `title`, `subtitle?`, `href`.
- Mesma pílula do ServiceRow, mas com ArrowButton `plain` à direita. Usada no menu de Definições e nos atalhos.

**InfoCard** — `eyebrow?`, `title`, `body?`. `bg-ink text-white rounded-card p-[18px]`. Eyebrow como Tag `leaf` ("Um pequeno lembrete"), título 22–24 com `tracking-[-0.02em]`, corpo 14 em `text-ink-soft`.

**HoursCard** — `open: boolean`, `rows: { label, value }[]`. Fundo `ink`, Tag `leaf` "Aberto agora" (ou Tag `stone` "Fechado" quando `open` é falso), linhas `flex justify-between` com valor em `text-ink-soft`.

### 7.5 Formulários

Os campos compõem o `input.tsx`, o `label.tsx` e o `select.tsx` do shadcn (adaptados conforme a secção 5.2). Todos devem ser **controlados ou não controlados** (aceitar `value`/`onChange` e `defaultValue`), compatíveis com `react-hook-form` via `forwardRef`, e expor `error?: string`.

**TextField** — `label`, `error?`, mais props nativas de `<input>`.
- Contentor `bg-surface rounded-field px-4 py-2.5`; rótulo 12 `text-muted`; input 15 sem borda, `bg-transparent`, `w-full`. Rótulo ligado por `htmlFor`/`useId`.
- Foco: `focus-within:outline-2 outline-brand` (anel de 2 px com offset 2). Erro: contorno `danger` e mensagem 12 `text-danger-deep` abaixo, ligada por `aria-describedby`.

**SelectField** — mesmo contentor do TextField, com chevron `chevron-down` à direita. Use o `Select` do shadcn (Radix), com o `SelectTrigger` estilizado como campo e o `SelectContent` com `rounded-card`. Mesmas regras de foco e erro.

**SearchField** — pílula `bg-surface h-11 px-4`, ícone `search` 18 `text-muted`, `type="search"`, botão de limpar (`x`) quando há texto. `role="search"` no contentor.

**Toggle** — na prática o `Switch` adaptado. Props: `checked`, `onCheckedChange`, `label` (para `aria-label`), `disabled?`.
- Adapte `switch.tsx` (Radix Switch; **não crie `toggle.tsx`**). Props shadcn mantidas (`checked`, `onCheckedChange`, `disabled`). Trilho 44×26 `rounded-full`, ligado `bg-brand`, desligado `bg-off`; bola branca 20×20 com `translate-x` e transição de 150 ms. Variante `tone="ink"` para usar sobre cartões lima (trilho `bg-ink`).

**DayHoursRow** — `label`, `open`, `from?`, `to?`, `onToggle`, `onEdit?`.
- Linha com padding vertical 12, divisor `border-b border-line/60` entre linhas, rótulo 15 e horário 13 `text-muted` ("9:00 às 14:00" ou "Fechado"); Toggle à direita. Agrupar várias linhas dentro de um cartão branco `rounded-card px-4`.

**LogoUploader** — `src?`, `onChange(file)`, `maxSizeMb = 2`.
- Cartão branco `rounded-card p-3.5`. Pré-visualização círculo 64 (`bg-ink` com ícone `sparkles` quando vazio), texto "Logo" 16 e "PNG ou JPG, até 2 MB" 12 `text-muted`, botão "Alterar" como Tag clicável (`bg-canvas`, 13, `px-3.5 py-2`).
- `<input type="file" accept="image/png,image/jpeg" hidden>` acionado pelo botão; valida tipo e tamanho e mostra erro com `aria-live="polite"`.

### 7.6 Feedback e estrutura

**EmptyState** — `icon`, `title`, `description`, `action?: { label, href | onClick }`.
- Cartão branco `rounded-card p-5`. IconCircle 48 `brand`, título 20 (`mt-3.5`), descrição 14 `text-muted`, Button principal (`default`) com seta à direita (`mt-3.5`).

**SectionTitle** — `eyebrow?`, `title`, `action?`. Eyebrow estilo 4.4, título `text-title`. Margem superior de 24–26 entre secções.

**CoverHeader** — `name`, `tagline?`, `verified?`, `logoSrc?`, `actions: { key, icon, label, href }[]`, `storeHref?`.
- Cartão de capa `rounded-sheet h-[210px] bg-brand overflow-hidden` com formas circulares decorativas em `brand-hover`, `leaf` e `sun` (posicionadas por CSS, sem imagens). Quatro IconButtons `surface` (38) no canto superior direito: direções (`navigation`), QR (`qrcode`), WhatsApp (`brand-whatsapp`), partilhar (`share`). Pílula branca "Loja" no canto inferior direito.
- Logo circular 84 com anel `border-4 border-canvas`, sobreposto ao fundo da capa (`-mt-9 ml-3.5`). Abaixo: nome em `text-display` + VerifiedBadge, tagline 16 `text-muted`.
- Se houver imagem de capa configurada pelo negócio, ela substitui as formas (com `next/image`, `object-cover`).

**ActionBar** — `ctaLabel`, `onCta | href`, `locale`, `onLocaleChange`.
- `fixed inset-x-0 bottom-0` com o mesmo wrapper de safe area da BottomNav. Contentor `bg-surface rounded-full p-2 flex gap-2`. CTA `primary` ocupa o espaço restante (altura 52, texto 16, ícone `calendar-plus`). À direita um SegmentedControl compacto PT/ENG (variante sobre `bg-canvas`, opção ativa `bg-brand`).
- Páginas públicas usam ActionBar; páginas da aplicação usam BottomNav. **Nunca os dois na mesma página.**

---

## 8. Comportamento e acessibilidade (obrigatório)

- Todos os controlos só com ícone têm `aria-label` em português.
- Foco visível em tudo: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand` (sobre fundos `brand`, use `outline-white`).
- Navegação por teclado completa: `Tab` para controlos, setas em `WeekStrip`, `SegmentedControl` e `FilterChips`, `Space`/`Enter` em `Toggle`.
- A cor nunca é a única informação: o estado de uma marcação aparece sempre com texto na `StatusPill`.
- Linhas e cartões clicáveis usam um único elemento `<a>`/`<Link>` (não aninhar botões dentro de links; os botões secundários ficam fora da área do link ou usam `stopPropagation` com semântica correta).
- Respeitar `prefers-reduced-motion`: desativar a transição de escala e deslocamentos.
- Respeitar áreas seguras do iOS (`env(safe-area-inset-*)`) nas barras fixas.
- Suportar textos mais longos: nomes truncam com `truncate` em linha única dentro de flex (`min-w-0`), nunca quebram o layout.
- Sem *layout shift*: avatares e logos têm tamanho fixo.

---

## 9. Layout base e página de pré-visualização

**Contentor de página mobile:**

```tsx
<div className="min-h-dvh bg-canvas text-ink">
  <main className="mx-auto w-full max-w-md px-4 pb-28 pt-4.5">{children}</main>
</div>
```

No desktop o conteúdo fica numa coluna central de `max-w-md`; não crie layouts de desktop agora.

**`/design-system`** (em `src/app/design-system/page.tsx`; apenas em desenvolvimento: devolva `notFound()` quando `process.env.NODE_ENV === "production"`):

- Secções na mesma ordem da lista de componentes: Fundações, Ações, Navegação, Dados e conteúdo, Cartões, Formulários, Feedback e estrutura.
- Fundações mostra swatches de todos os tokens com nome e hex, a escala tipográfica e os raios.
- Cada componente aparece com o nome em `font-mono text-caption text-muted`, todas as variantes e estados (padrão, hover não aplicável em mobile, foco, desativado, erro, carregamento onde existir).
- Inclua também os componentes shadcn adaptados com sobreposições (Select aberto, Dropdown, Dialog, Sheet) em estado aberto ou acionável por botão.
- Em vez de `BottomNav` e `ActionBar` fixos, renderize-os com uma prop `static` (posição relativa) para caberem na página.

---

## 10. Ordem de trabalho

1. Inspecionar o projeto e escrever o resumo da secção 2.
2. Instalar `@tabler/icons-react` e configurar `optimizePackageImports`.
3. Tokens (secções 4.1 a 4.3), fonte via `next/font` (se ainda não houver) e **variáveis semânticas do shadcn** (secção 4.6). Neste ponto, abra a aplicação e verifique que as telas existentes já herdaram as cores.
4. `tones.ts` e tipos partilhados.
5. **Adaptar os componentes shadcn existentes** da tabela 5.1: `button`, `avatar`, `badge`, `switch`, `input`, `label`, `select`, `card`. Depois aplicar os ajustes visuais da secção 5.2 aos restantes.
6. **Criar os componentes novos**: primeiro os base (`icon-button`, `add-button`, `arrow-button`, `icon-circle`, `text-field`), depois navegação, dados, cartões, formulários e feedback.
7. Página `/design-system`.
8. Verificações: `tsc --noEmit`, lint, `next build`. Navegar pelas 3 a 5 páginas mais usadas da aplicação e confirmar que nada ficou ilegível ou desalinhado. Corrigir tudo antes de concluir.

---

## 11. Critérios de aceitação

- [ ] `next build` passa e a API pública dos componentes shadcn existentes foi preservada (mesmos exports, props e variantes; só foram acrescentadas novas).
- [ ] As telas existentes herdam a nova paleta pelas variáveis semânticas, sem erros visuais graves (texto ilegível, contraste insuficiente, elementos sobrepostos).
- [ ] Todos os 34 componentes da tabela 5.1 existem em `src/components/ui`, adaptados ou novos, com props tipadas. Não existem `components/ds/`, `tag.tsx` nem `toggle.tsx`.
- [ ] `@tabler/icons-react` está instalado, e os componentes adaptados ou criados usam Tabler. `lucide-react` continua instalado e só aparece em ficheiros não tocados.
- [ ] Nenhum valor hexadecimal solto nos componentes: tudo via tokens ou variáveis do Tailwind.
- [ ] Apenas pesos de fonte 400 e 500; sem sombras nem gradientes nos componentes adaptados ou novos.
- [ ] Todos os elementos interativos têm área de toque de 44 px, foco visível e rótulo acessível.
- [ ] A página `/design-system` mostra todos os componentes e variantes e funciona em 375 px de largura.
- [ ] `BottomNav` e `ActionBar` respeitam a área segura do iOS e não tapam conteúdo.
- [ ] Textos longos não quebram o layout em nenhum componente.

---

## 12. Relatório final

Ao terminar, responda com:

1. Lista de ficheiros **adaptados** (shadcn existentes), **criados** e alterados fora de `src/components/ui` (CSS global, `next.config`, `components.json`).
2. Dependências instaladas (`@tabler/icons-react` e quaisquer primitivos adicionados via `shadcn add`).
3. Mudanças de aparência nas telas existentes que merecem revisão humana (por exemplo, botões agora em pílula dentro de tabelas, tabs que viraram segmented control).
4. Ficheiros que ainda importam `lucide-react`, para migração posterior.
5. Decisões tomadas onde havia ambiguidade (fonte escolhida, formato das variáveis, colisões de nome).
6. O que ficou por fazer, incluindo sugestão de ordem para migrar as telas existentes (Dashboard → Agenda → Definições → Clientes → Serviços → Profissionais → O seu negócio → Página pública).

**Se algo neste documento entrar em conflito com o projeto existente, não adivinhe: descreva o conflito, proponha a solução mais conservadora e continue com ela.**
