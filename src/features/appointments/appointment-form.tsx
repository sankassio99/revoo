"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/features/i18n/language-provider";
import { translate } from "@/lib/i18n/messages";

type Option = { id: string; name: string };
type ProfessionalOption = Option & { serviceIds: string[] };

export function AppointmentForm({
  tenantId,
  customers,
  services,
  professionals,
  defaultLocalStart,
  defaultOpen,
}: {
  tenantId: string;
  customers: Option[];
  services: Option[];
  professionals: ProfessionalOption[];
  defaultLocalStart: string;
  defaultOpen: boolean;
}) {
  const router = useRouter();
  const { locale } = useLanguage();
  const [customerId, setCustomerId] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [professionalId, setProfessionalId] = useState("");
  const [localStart, setLocalStart] = useState(defaultLocalStart);
  const [busy, setBusy] = useState(false);
  const eligibleProfessionals = professionals.filter((professional) =>
    serviceIds.every((id) => professional.serviceIds.includes(id)),
  );
  const selectedProfessionalId = eligibleProfessionals.some((p) => p.id === professionalId)
    ? professionalId
    : "";
  const canSubmit =
    !busy &&
    customerId !== "" &&
    serviceIds.length > 0 &&
    selectedProfessionalId !== "" &&
    localStart !== "";

  function toggleService(id: string, checked: boolean) {
    setServiceIds((current) =>
      checked ? [...current, id] : current.filter((serviceId) => serviceId !== id),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/workspaces/${tenantId}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          serviceIds,
          professionalId: selectedProfessionalId,
          localStart,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(translate(locale, result.error ?? "Appointment could not be booked."));
      toast.success(translate(locale, "Appointment booked."));
      setCustomerId("");
      setServiceIds([]);
      setProfessionalId("");
      setLocalStart(defaultLocalStart);
      router.refresh();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? translate(locale, submitError.message) : translate(locale, "Appointment could not be booked."));
    } finally {
      setBusy(false);
    }
  }

  const missingRecords = !customers.length || !services.length || (serviceIds.length > 0 && !eligibleProfessionals.length);

  return (
    <details className="group border-b border-line py-5" open={defaultOpen}>
      <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:hidden">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-forest px-4 text-xs font-medium text-white">
          {translate(locale, "New appointment")} <span aria-hidden="true">+</span>
        </span>
      </summary>
      <form className="mt-5 grid gap-4 rounded-2xl bg-[#f0eee7] p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
        <div className="grid content-start gap-1.5">
          <Label className="text-[11px] text-muted">{translate(locale, "Customer")}</Label>
          <Select
            items={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
            onValueChange={(value) => setCustomerId(value ?? "")}
            value={customerId || null}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue placeholder={translate(locale, "Choose a customer")} />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <fieldset className="grid content-start gap-1.5">
          <legend className="mb-1.5 text-[11px] font-medium text-muted">{translate(locale, "Service")}</legend>
          <div className="grid max-h-40 gap-2 overflow-y-auto rounded-lg border border-input bg-white p-3">
            {services.map((service) => (
              <Label className="gap-2 text-sm font-normal text-ink" key={service.id}>
                <Checkbox
                  checked={serviceIds.includes(service.id)}
                  onCheckedChange={(checked) => toggleService(service.id, checked)}
                />
                {service.name}
              </Label>
            ))}
          </div>
        </fieldset>
        <div className="grid content-start gap-1.5">
          <Label className="text-[11px] text-muted">{translate(locale, "Professional")}</Label>
          <Select
            items={eligibleProfessionals.map((professional) => ({ value: professional.id, label: professional.name }))}
            onValueChange={(value) => setProfessionalId(value ?? "")}
            value={selectedProfessionalId || null}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue placeholder={translate(locale, "Choose a professional")} />
            </SelectTrigger>
            <SelectContent>
              {eligibleProfessionals.map((professional) => <SelectItem key={professional.id} value={professional.id}>{professional.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid content-start gap-1.5">
          <Label className="text-[11px] text-muted" htmlFor="appointment-local-start">{translate(locale, "Date and time")}</Label>
          <Input
            className="h-10 bg-white"
            id="appointment-local-start"
            onChange={(event) => setLocalStart(event.target.value)}
            required
            type="datetime-local"
            value={localStart}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <Button className="h-10 rounded-full bg-forest px-4 text-xs text-white" disabled={!canSubmit} type="submit">
            {translate(locale, busy ? "Booking…" : "Book appointment")}
          </Button>
          {missingRecords && (
            <p className="text-xs text-muted">
              {translate(locale, "Add an active customer, service, and eligible professional before booking.")}
            </p>
          )}
        </div>
      </form>
    </details>
  );
}
