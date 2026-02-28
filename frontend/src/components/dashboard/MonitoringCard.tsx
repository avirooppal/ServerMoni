import { useState } from "react";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { AllData } from "@/lib/api";
import { MetricsModal, MetricRow, MetricSection } from "./MetricsModal";

interface MonitoringCardProps {
  allData?: AllData;
}

const StatusIcon = ({ s }: { s: "ok" | "warn" | "critical" }) => {
  if (s === "ok") return <CheckCircle className="w-3 h-3" />;
  if (s === "warn") return <AlertTriangle className="w-3 h-3" />;
  return <XCircle className="w-3 h-3" />;
};

const statusBadgeClass = (s: "ok" | "warn" | "critical") =>
  s === "ok" ? "status-ok" : s === "warn" ? "status-warn" : "status-critical";

const MonitoringCard = ({ allData }: MonitoringCardProps) => {
  const [open, setOpen] = useState(false);

  const memPct = allData ? parseFloat(allData.memory.usage) : 0;
  const cpuPressure = allData ? parseFloat(allData.pressure?.cpu_some_avg10 ?? "0") : 0;
  const memPressure = allData ? parseFloat(allData.pressure?.memory_some_avg10 ?? "0") : 0;
  const ioPressure = allData ? parseFloat(allData.pressure?.io_some_avg10 ?? "0") : 0;

  const memStatus = memPct > 95 ? "critical" : memPct > 90 ? "warn" : "ok";
  const cpuPressureStatus = cpuPressure > 30 ? "warn" : "ok";
  const memPressureStatus = memPressure > 30 ? "warn" : "ok";
  const ioPressureStatus = ioPressure > 30 ? "warn" : "ok";

  const items = [
    {
      label: "Memory usage",
      description: `${memPct.toFixed(1)}% used — threshold 90%`,
      status: memStatus,
    },
    {
      label: "CPU Pressure",
      description: `PSI avg10: ${allData?.pressure?.cpu_some_avg10 ?? "—"}`,
      status: cpuPressureStatus,
    },
    {
      label: "IO Pressure",
      description: `PSI avg10: ${allData?.pressure?.io_some_avg10 ?? "—"}`,
      status: ioPressureStatus,
    },
    {
      label: "Agent Status",
      description: allData ? "Data received within the last 5s" : "Connecting…",
      status: allData ? "ok" : "warn",
    } as const,
    {
      label: "Cron Jobs",
      description: "All scheduled jobs completed successfully",
      status: "ok",
    } as const,
  ] as const;

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Monitoring</h3>
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-primary hover:underline"
          >
            Manage →
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <span
                className={`${statusBadgeClass(item.status)} text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0`}
              >
                <StatusIcon s={item.status} />
                {item.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="Monitoring">
        <MetricSection title="MEMORY THRESHOLDS">
          <MetricRow
            label="Memory used"
            value={`${memPct.toFixed(1)}%`}
            highlight={memStatus === "critical" ? "critical" : memStatus === "warn" ? "warn" : "ok"}
          />
          <MetricRow label="Warning threshold" value="90%" />
          <MetricRow label="Critical threshold" value="95%" />
        </MetricSection>
        <MetricSection title="PRESSURE STALL INFO (PSI avg10)">
          <MetricRow
            label="CPU pressure"
            value={allData?.pressure?.cpu_some_avg10 ?? "—"}
            highlight={cpuPressureStatus}
          />
          <MetricRow
            label="Memory pressure"
            value={allData?.pressure?.memory_some_avg10 ?? "—"}
            highlight={memPressureStatus}
          />
          <MetricRow
            label="IO pressure"
            value={allData?.pressure?.io_some_avg10 ?? "—"}
            highlight={ioPressureStatus}
          />
        </MetricSection>
        <MetricSection title="SOCKETS">
          <MetricRow label="Sockets used" value={allData?.sockets?.used ?? "—"} />
          <MetricRow label="TCP in use" value={allData?.sockets?.tcp_inuse ?? "—"} />
          <MetricRow label="TCP time-wait" value={allData?.sockets?.tcp_tw ?? "—"} />
          <MetricRow label="UDP in use" value={allData?.sockets?.udp_inuse ?? "—"} />
        </MetricSection>
        <MetricSection title="FILE DESCRIPTORS">
          <MetricRow label="Allocated" value={allData?.file_descriptors?.allocated ?? "—"} />
          <MetricRow label="Max" value={allData?.file_descriptors?.max ?? "—"} />
          <MetricRow
            label="Used %"
            value={allData?.file_descriptors?.used_percent ?? "—"}
            highlight={parseFloat(allData?.file_descriptors?.used_percent ?? "0") > 80 ? "warn" : "ok"}
          />
        </MetricSection>
      </MetricsModal>
    </>
  );
};

export default MonitoringCard;
