"use client";

import { FormEvent, useEffect, useState } from "react";

type ReceivingReport = {
  id: string;
  report_number: string;
  customerName: string;
  rack_reference: string;
  quantity_received: number;
  received_date: string;
  notes: string | null;
  status: "draft" | "received" | "verified" | "cancelled";
  created_at: string;
};

type ReportsResponse = {
  reports?: ReceivingReport[];
  report?: ReceivingReport;
  error?: string;
};

const EMPTY_FORM = {
  reportNumber: "",
  customerName: "",
  rackReference: "",
  quantityReceived: "",
  receivedDate: "",
  notes: "",
  status: "draft",
};

export function ReceivingReports() {
  const [reports, setReports] = useState<ReceivingReport[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadReports() {
      try {
        const response = await fetch("/api/receiving-reports");
        const data = (await response.json()) as ReportsResponse;

        if (!response.ok) {
          throw new Error(data.error || "Unable to load receiving reports.");
        }

        if (isActive) {
          setReports(data.reports ?? []);
        }
      } catch (loadError) {
        if (isActive) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/receiving-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify.{
          ...form,
          quantityReceived: Number(form.quantityReceived),
        }),
      });
      const data = (await response.json()) as ReportsResponse;

      if (!response.ok || !data.report) {
        throw new Error(data.error || "Unable to save the receiving report.");
      }

      setReports((current) => [data.report!, ...current]);
      setForm({
        ...EMPTY_FORM,
        receivedDate: form.receivedDate,
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="receiving-workspace">
      <section className="report-form-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">New receiving report</p>
            <h2>Log pipe arriving on the yard</h2>
          </div>
          <span className="phase-label">Required fields marked *</span>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          <label>
            <span>Report ID *</span>
            <input
              name="reportNumber"
              value={form.reportNumber}
              onChange={(event) =>
                updateField("reportNumber", event.target.value)
              }
              placeholder="RR-2026-001"
              required
            />
          </label>

          <label>
            <span>Customer *</span>
            <input
              name="customerName"
              value={form.customerName}
              onChange={(event) =>
                updateField("customerName", event.target.value)
              }
              placeholder="Customer name"
              required
            />
          </label>

          <label>
            <span>Rack reference *</span>
            <input
              name="rackReference"
              value={form.rackReference}
              onChange={(event) =>
                updateField("rackReference", event.target.value)
              }
              placeholder="Rack B"
              required
            />
          </label>

          <label>
            <span>Quantity received *</span>
            <input
              name="quantityReceived"
              type="number"
              min="1"
              step="1"
              value={form.quantityReceived}
              onChange={(event) =>
                updateField("quantityReceived", event.target.value)
              }
              placeholder="120"
              required
            />
          </label>

          <label>
            <span>Received date *</span>
            <input
              name="receivedDate"
              type="date"
              value={form.receivedDate}
              onChange={(event) =>
                updateField("receivedDate", event.target.value)
              }
              required
            />
          </label>

          <label>
            <span>Status *</span>
            <select
              name="status"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="received">Received</option>
              <option value="verified">Verified</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="notes-field">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={4}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Condition, tally details, or handling instructions"
            />
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? "Saving report..." : "Add receiving report"}
            </button>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </form>
      </section>

      <section className="reports-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Receiving log</p>
            <h2>Recent reports</h2>
          </div>
          <strong className="report-count">{reports.length}</strong>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading receiving reports...</p>
        ) : reports.length === 0 ? (
          <p className="empty-state">
            No receiving reports yet. Add the first yard receipt.
          </p>
        ) : (
          <div className="reports-table-wrap">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Customer</th>
                  <th>Rack</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <strong>{report.report_number}</strong>
                      {report.notes && <small>{report.notes}</small>}
                    </td>
                    <td>{report.customer_name}</td>
                    <td>{report.rack_reference}</td>
                    <td>{report.quantity_received.toLocaleString()}</td>
                    <td>{formatDate(report.received_date)}</td>
                    <td>
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
