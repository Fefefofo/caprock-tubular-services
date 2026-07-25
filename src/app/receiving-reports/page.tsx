import Link from "next/link";

import { ReceivingReports } from "@/components/receiving-reports";

export default function ReceivingReportsPage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Caprock Tubular Services</p>
          <h1>Receiving reports</h1>
        </div>
        <Link className="secondary-button" href="/">
          Yard operations
        </Link>
      </header>

      <ReceivingReports />
    </main>
  );
}
