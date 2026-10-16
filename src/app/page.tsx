import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock, Sparkle } from "@phosphor-icons/react/dist/ssr";

const highlights = [
  { number: "01", title: "Know your day", detail: "Appointments and people, in one clear rhythm." },
  { number: "02", title: "Keep the details", detail: "Every visit remembers what was agreed." },
  { number: "03", title: "Make room to return", detail: "Thoughtful follow-up, on your terms." },
];

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] overflow-hidden bg-paper">
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link className="group flex items-center gap-3" href="/" aria-label="Revoo home">
          <span className="grid size-9 place-items-center rounded-full bg-forest text-white transition-transform duration-300 group-hover:rotate-[-8deg]">
            <Sparkle size={17} weight="fill" />
          </span>
          <span className="text-[19px] font-semibold tracking-[-0.06em]">revoo</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5">
          <Link
            className="hidden text-sm text-muted transition-colors hover:text-ink sm:inline-flex"
            href="#approach"
          >
            Our approach
          </Link>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white/70 px-5 text-sm font-medium transition-all duration-300 hover:-translate-y-px hover:border-forest/30 hover:bg-white active:scale-[0.98]"
            href="/login"
          >
            Sign in <ArrowUpRight size={15} />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-14 sm:px-8 md:gap-10 md:pb-28 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pt-24">
        <div className="page-reveal relative z-[1] max-w-[650px]">
          <p className="mb-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.19em] text-forest">
            <span className="size-1.5 rounded-full bg-accent" />
            A little more in rhythm
          </p>
          <h1 className="max-w-[620px] text-[clamp(3.25rem,7vw,6.25rem)] font-medium leading-[0.98] tracking-[-0.075em] text-ink">
            Your business,
            <br />
            <span className="font-normal text-forest">in good hands.</span>
          </h1>
          <p className="mt-7 max-w-[490px] text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Revoo brings the people, appointments, and small details of your studio into one
            thoughtful place—so you can get back to the work you love.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-forest px-6 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-px hover:bg-[#20483b] active:scale-[0.98]"
              href="/login?mode=register"
            >
              Create your workspace
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" size={16} />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
              href="#approach"
            >
              See what feels different <ArrowDownRight size={16} />
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-3 border-t border-line pt-5">
            <Clock className="text-accent" size={17} />
            <p className="text-xs leading-5 text-muted">
              Made for the pace of independent salons and studios.
            </p>
          </div>
        </div>

        <div className="page-reveal relative mx-auto w-full max-w-[620px] md:justify-self-end">
          <div className="absolute -right-12 -top-12 size-40 rounded-full border border-[#d9dfd6] sm:-right-20 sm:-top-16 sm:size-60" />
          <div className="absolute -bottom-14 -left-8 size-28 rounded-full bg-accent-soft sm:-bottom-20 sm:-left-16 sm:size-44" />
          <div className="relative overflow-hidden rounded-[2rem] bg-[#dfe6de] p-4 sm:rounded-[2.5rem] sm:p-6">
            <div className="relative min-h-[390px] overflow-hidden rounded-[1.5rem] bg-[#f2f3ed] p-5 sm:min-h-[500px] sm:p-8">
              <div className="absolute right-0 top-0 h-full w-[43%] bg-[#e9e0d4]" />
              <div className="absolute right-[8%] top-[10%] h-[75%] w-[34%] rounded-t-full bg-[#c8a789]" />
              <div className="absolute right-[13%] top-[13%] h-[68%] w-[25%] rounded-t-full bg-[#b78363]" />
              <div className="absolute right-[7%] top-[57%] h-[25%] w-[35%] rounded-t-[48%] bg-[#6a473c]" />
              <div className="absolute right-[20%] top-[32%] h-[17%] w-[4%] rounded-full bg-[#2b312d]" />
              <div className="absolute right-[29%] top-[31%] h-[17%] w-[4%] rounded-full bg-[#2b312d]" />
              <div className="absolute bottom-[10%] right-[12%] h-[22%] w-[34%] rounded-t-full bg-[#8c664f]" />
              <div className="relative z-[1] flex h-full min-h-[350px] flex-col justify-between sm:min-h-[452px]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                      A good day starts here
                    </p>
                    <h2 className="mt-3 max-w-[230px] text-3xl font-medium leading-[1.04] tracking-[-0.065em] text-forest sm:text-[2.75rem]">
                      A little more room to be present.
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[10px] font-medium text-forest backdrop-blur-sm">
                    09:41
                  </span>
                </div>
                <div className="max-w-[260px] rounded-2xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_38px_-24px_rgba(24,59,49,0.25)] backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink">Your morning</p>
                    <span className="size-2 rounded-full bg-accent status-pulse" />
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-1 rounded-full bg-accent" />
                      <div>
                        <p className="text-xs font-medium text-ink">A moment between</p>
                        <p className="mt-0.5 text-[10px] text-muted">Take a breath. You have time.</p>
                      </div>
                    </div>
                    <div className="h-px bg-line" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted">The day is taking shape</span>
                      <ArrowUpRight size={14} className="text-forest" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-right text-[10px] uppercase tracking-[0.16em] text-muted">
            A quieter kind of business software
          </p>
        </div>
      </section>

      <section
        className="border-y border-line bg-[#eef0e9]"
        id="approach"
        aria-labelledby="approach-title"
      >
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-10 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:px-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-accent">
              Less juggling, more focus
            </p>
            <h2
              className="mt-4 max-w-[330px] text-3xl font-medium leading-tight tracking-[-0.065em] text-ink sm:text-4xl"
              id="approach-title"
            >
              The care behind your craft, remembered.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-0 divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {highlights.map((item, index) => (
              <article
                className="py-5 md:px-6 md:py-2 first:md:pl-0"
                key={item.number}
                style={{ "--index": index } as React.CSSProperties}
              >
                <p className="font-mono text-[10px] tracking-[0.15em] text-accent">{item.number}</p>
                <h3 className="mt-7 text-lg font-medium tracking-[-0.04em] text-ink">{item.title}</h3>
                <p className="mt-2 max-w-[220px] text-sm leading-6 text-muted">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <p>Revoo · Thoughtfully made for service businesses.</p>
        <Link className="inline-flex items-center gap-1 text-forest transition-colors hover:text-accent" href="/login">
          Enter your workspace <ArrowRight size={13} />
        </Link>
      </footer>
    </main>
  );
}
