import Link from "next/link";

import { VoiceCommandCapture } from "@/components/voice-command-capture";

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Caprock Tubular Services</p>
          <h1>Yard operations</h1>
        </div>
        <div className="topbar-actions">
          <div className="operator-status">
            <span className="status-dot" aria-hidden="true" />
            Operator station online
          </div>
          <Link className="secondary-button" href="/receiving-reports">
            Receiving reports
          </Link>
        </div>
      </header>

      <section className="summary-grid" aria-label="Yard summary">
        <article className="metric">
          <span>Inventory on yard</span>
          <strong>2,460 joints</strong>
          <small>Across 18 active lots</small>
        </article>
        <article className="metric">
          <span>Open work orders</span>
          <strong>7</strong>
          <small>3 scheduled today</small>
        </article>
        <article className="metric">
          <span>Active stations</span>
          <strong>4 of 5</strong>
          <small>Inspection station available</small>
        </article>
      </section>

      <section className="workspace">
        <VoiceCommandCapture />

        <aside className="command-reference">
          <p className="eyebrow">Known commands</p>
          <h2>Speak naturally</h2>
          <ul>
            <li>
              <strong>Log pipe count</strong>
              <span>“Log 120 joints of 5 1/2 casing in Rack B.”</span>
            </li>
            <li>
              <strong>Complete work order</strong>
              <span>“Mark work order 1048 complete.”</span>
            </li>
            <li>
              <strong>Move inventory</strong>
              <span>“Move lot CT-221 from Rack C to Station 2.”</span>
            </li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
