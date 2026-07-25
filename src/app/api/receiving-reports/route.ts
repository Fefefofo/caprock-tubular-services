import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const REPORT_STATUSES = ["draft", "received", "verified", "cancelled"] as const;

type ReportStatus = (typeof REPORT_STATUSES)[number];

type CreateReceivingReportBody = {
  reportNumber?: unknown;
  customerName?: unknown;
  rackReference?: unknown;
  quantityReceived?: unknown;
  receivedDate?: unknown;
  notes?: unknown;
  status?: unknown;
};

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("receiving_reports")
      .select(
        "id, report_number, customer_name, rack_reference, quantity_received, received_date, notes, status, created_at",
      )
      .order("received_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return databaseError(error.message);
    }

    return NextResponse.json({ reports: data ?? [] });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  let body: CreateReceivingReportBody;

  try {
    body = (await request.json()) as CreateReceivingReportBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const reportNumber = readRequiredText(body.reportNumber);
  const customerName = readRequiredText(body.customerName);
  const rackReference = readRequiredText(body.rackReference);
  const quantityReceived = readPositiveInteger(body.quantityReceived);
  const receivedDate = readDate(body.receivedDate);
  const notes = readOptionalText(body.notes);
  const status = readStatus(body.status);

  if (!reportNumber || !customerName || !rackReference) {
    return NextResponse.json(
      { error: "Report ID, customer, and rack reference are required." },
      { status: 400 },
    );
  }

  if (quantityReceived === null) {
    return NextResponse.json(
      { error: "Quantity received must be a positive whole number." },
      { status: 400 },
    );
  }

  if (!receivedDate) {
    return NextResponse.json(
      { error: "Received date must use the YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  if (!status) {
    return NextResponse.json(
      { error: "Status must be draft, received, verified, or cancelled." },
      { status: 400 },
    );
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("receiving_reports")
      .insert({
        report_number: reportNumber,
        customer_name: customerName,
        rack_reference: rackReference,
        quantity_received: quantityReceived,
        received_date: receivedDate,
        notes,
        status,
        created_by: user?.id ?? null,
      })
      .select(
        "id, report_number, customer_name, rack_reference, quantity_received, received_date, notes, status, created_at",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "That report ID is already in use." },
          { status: 409 },
        );
      }

      return databaseError(error.message);
    }

    return NextResponse.json({ report: data }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

function readRequiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  return value.trim() || null;
}

function readPositiveInteger(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function readDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

function readStatus(value: unknown): ReportStatus | null {
  const status = value ?? "draft";
  return typeof status === "string" &&
    REPORT_STATUSES.includes(status as ReportStatus)
    ? (status as ReportStatus)
    : null;
}

function databaseError(message: string) {
  console.error("Receiving reports database error:", message);
  return NextResponse.json(
    { error: "The receiving reports database request failed." },
    { status: 500 },
  );
}

function serverError(error: unknown) {
  console.error("Receiving reports server error:", error);
  return NextResponse.json(.  { error: "The receiving reports service is not configured." },
   { status: 500 },
);
}
