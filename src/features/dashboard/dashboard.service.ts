import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionUser } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/locale";
import { requireWorkspaceMember } from "@/lib/auth/authorization";
import { formatLocalDate, getLocalDayBounds } from "@/lib/domain/time";

async function loadFollowUpCustomers(
  tenantId: string,
  intervalDays: number,
  now: Date,
) {
  const dueBefore = Timestamp.fromMillis(
    now.getTime() - intervalDays * 24 * 60 * 60 * 1000,
  );
  const customers = adminDb.collection(`tenants/${tenantId}/customers`);
  const [whatsappResults, emailResults] = await Promise.all([
    customers
      .where("isArchived", "==", false)
      .where("communicationPreferences.whatsappMarketing", "==", "granted")
      .where("lastVisitAt", "<=", dueBefore)
      .limit(100)
      .get(),
    customers
      .where("isArchived", "==", false)
      .where("communicationPreferences.emailMarketing", "==", "granted")
      .where("lastVisitAt", "<=", dueBefore)
      .limit(100)
      .get(),
  ]);
  const documents = new Map(
    [...whatsappResults.docs, ...emailResults.docs].map((customer) => [
      customer.id,
      customer,
    ]),
  );
  return [...documents.values()]
    .map((customer) => {
      const data = customer.data();
      const preferences = data.communicationPreferences ?? {};
      const phoneAvailable =
        typeof data.phone === "string" && data.phone.replace(/\D/g, "").length >= 7;
      const emailAvailable = typeof data.email === "string" && data.email.length > 3;
      const marketingAllowed =
        (preferences.whatsappMarketing === "granted" && phoneAvailable) ||
        (preferences.emailMarketing === "granted" && emailAvailable);
      const lastVisitAt =
        data.lastVisitAt instanceof Timestamp ? data.lastVisitAt.toDate() : null;
      return {
        id: customer.id,
        name: typeof data.name === "string" ? data.name : "Customer",
        lastVisitAt,
        marketingAllowed,
      };
    })
    .filter(
      (customer): customer is typeof customer & { lastVisitAt: Date } =>
        customer.lastVisitAt !== null && customer.marketingAllowed,
    )
    .sort((first, second) => first.lastVisitAt.getTime() - second.lastVisitAt.getTime())
    .slice(0, 100);
}

export async function getFollowUpCustomers(
  user: SessionUser,
  tenantId: string,
  now = new Date(),
) {
  await requireWorkspaceMember(user, tenantId);
  const settings = await adminDb.doc(`tenants/${tenantId}/settings/general`).get();
  const configuredDays = settings.get("reactivationIntervalDays");
  const intervalDays =
    Number.isSafeInteger(configuredDays) && configuredDays > 0 ? configuredDays : 90;
  const customers = await loadFollowUpCustomers(tenantId, intervalDays, now);
  return { intervalDays, customers };
}

export async function getDashboardOverview(
  user: SessionUser,
  tenantId: string,
  timeZone: string,
  now = new Date(),
  locale: Locale = "en",
) {
  await requireWorkspaceMember(user, tenantId);
  const { start, end } = getLocalDayBounds(now, timeZone);
  const [today, activeCustomers, settings] = await Promise.all([
    adminDb
      .collection(`tenants/${tenantId}/appointments`)
      .where("startAtUtc", ">=", Timestamp.fromDate(start))
      .where("startAtUtc", "<", Timestamp.fromDate(end))
      .orderBy("startAtUtc")
      .get(),
    adminDb
      .collection(`tenants/${tenantId}/customers`)
      .where("isArchived", "==", false)
      .limit(1)
      .get(),
    adminDb.doc(`tenants/${tenantId}/settings/general`).get(),
  ]);

  const statusCounts = {
    Scheduled: 0,
    Confirmed: 0,
    Completed: 0,
    Cancelled: 0,
    NoShow: 0,
  };
  let revenueMinorUnits = 0;
  for (const appointment of today.docs) {
    const data = appointment.data();
    if (data.status in statusCounts) {
      statusCounts[data.status as keyof typeof statusCounts] += 1;
    }
    if (data.status === "Completed") {
      const charged = data.amountChargedMinorUnits;
      const bookingPrice = data.serviceSnapshot?.priceMinorUnits;
      const amount = Number.isSafeInteger(charged) ? charged : bookingPrice;
      if (Number.isSafeInteger(amount) && amount >= 0) revenueMinorUnits += amount;
    }
  }

  const intervalDays = settings.get("reactivationIntervalDays");
  const validIntervalDays =
    Number.isSafeInteger(intervalDays) && intervalDays > 0 ? intervalDays : 90;
  const followUps = await loadFollowUpCustomers(tenantId, validIntervalDays, now);

  const visibleAppointments = today.docs.slice(0, 8);
  const customerIds = [...new Set(
    visibleAppointments
      .map((appointment) => appointment.get("customerId"))
      .filter((id): id is string => typeof id === "string"),
  )];
  const professionalIds = [...new Set(
    visibleAppointments
      .map((appointment) => appointment.get("professionalId"))
      .filter((id): id is string => typeof id === "string"),
  )];
  const [customers, professionals] = await Promise.all([
    customerIds.length
      ? adminDb.getAll(...customerIds.map((id) => adminDb.doc(`tenants/${tenantId}/customers/${id}`)))
      : Promise.resolve([]),
    professionalIds.length
      ? adminDb.getAll(...professionalIds.map((id) => adminDb.doc(`tenants/${tenantId}/professionals/${id}`)))
      : Promise.resolve([]),
  ]);
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.get("name")]));
  const professionalNames = new Map(professionals.map((professional) => [professional.id, professional.get("name")]));
  const appointments = visibleAppointments.map((appointment) => {
    const data = appointment.data();
    return {
      id: appointment.id,
      startAt: data.startAtUtc.toDate(),
      customer:
        typeof customerNames.get(data.customerId) === "string"
          ? customerNames.get(data.customerId)
          : "Customer",
      service:
        typeof data.serviceSnapshot?.name === "string"
          ? data.serviceSnapshot.name
          : "Appointment",
      professional:
        typeof professionalNames.get(data.professionalId) === "string"
          ? professionalNames.get(data.professionalId)
          : "Your team",
      status: typeof data.status === "string" ? data.status : "Scheduled",
    };
  });

  return {
    localDate: formatLocalDate(now, timeZone, locale),
    appointments,
    statusCounts,
    totalAppointments: today.size,
    revenueMinorUnits,
    hasActiveCustomers: !activeCustomers.empty,
    followUps: followUps.slice(0, 12),
    reactivationIntervalDays: validIntervalDays,
  };
}
