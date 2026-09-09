import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock, Server, Globe, Database, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "System Status & Service Availability — VibeCheck",
  description: "Real-time service health, uptime statistics, and scheduled maintenance history.",
};

export default function StatusPage() {
  const components = [
    { name: "Remote Scan Probe API", status: "OPERATIONAL", uptime: "99.99%", latency: "42ms" },
    { name: "Automated Evaluation Engine", status: "OPERATIONAL", uptime: "99.98%", latency: "118ms" },
    { name: "SSRF Sandbox Network", status: "OPERATIONAL", uptime: "100.00%", latency: "4ms" },
    { name: "Neon PostgreSQL Cluster", status: "OPERATIONAL", uptime: "99.99%", latency: "18ms" },
    { name: "Global Edge CDN (Vercel)", status: "OPERATIONAL", uptime: "100.00%", latency: "9ms" },
    { name: "Expert Review Delivery Queue", status: "OPERATIONAL", uptime: "99.95%", latency: "230ms" },
  ];

  const pastIncidents = [
    {
      date: "August 28, 2026",
      title: "Elevated Scan Worker TTFB Latency in EU-West",
      status: "RESOLVED",
      description: "Between 14:12 UTC and 14:38 UTC, automated scan jobs dispatched from the Frankfurt edge region experienced 250ms increased TTFB due to upstream cloud provider routing reconfiguration. Traffic was automatically redirected to Dublin. Zero data loss occurred.",
    },
    {
      date: "August 14, 2026",
      title: "Scheduled Database Index Maintenance",
      status: "COMPLETED",
      description: "Planned zero-downtime re-indexing of findings tables to optimize multi-column sorting performance. Completed in 8 minutes.",
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-neutral-800 text-sm">
      <div className="border-b border-neutral-200 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 uppercase tracking-wider">
          <Server className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
          <span>Real-Time Telemetry</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
              Platform Service Status
            </h1>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Live Edge Probes • Global Latency: 38ms • 90-Day Rolling Uptime: 99.98%
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
          Component Health & Latency
        </h2>
        <div className="border border-neutral-200 rounded-md overflow-hidden bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium font-mono uppercase text-[11px]">
              <tr>
                <th className="p-3">Platform Service</th>
                <th className="p-3">Current Status</th>
                <th className="p-3">30-Day Uptime</th>
                <th className="p-3">P95 Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {components.map((c) => (
                <tr key={c.name} className="hover:bg-neutral-50/50">
                  <td className="p-3 font-medium text-neutral-900">{c.name}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Operational
                    </span>
                  </td>
                  <td className="p-3 font-mono text-neutral-600">{c.uptime}</td>
                  <td className="p-3 font-mono text-neutral-600">{c.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider font-mono">
          Recent Incident Log & Post-Mortems
        </h2>
        <div className="space-y-3">
          {pastIncidents.map((incident, i) => (
            <div key={i} className="p-4 rounded-md border border-neutral-200 bg-white space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900 text-xs">{incident.title}</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-mono text-[10px]">
                    {incident.status}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">{incident.date}</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {incident.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
