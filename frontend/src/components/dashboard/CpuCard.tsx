import { useState } from "react";
import DonutChart from "./DonutChart";
import { MetricsModal, MetricRow, MetricBar, MetricSection } from "./MetricsModal";
import { AllData, CoreUsage } from "@/lib/api";

interface CpuCardProps {
  percentage: number;
  user: number;
  system: number;
  allData?: AllData;
}

const CpuCard = ({ percentage, user, system, allData }: CpuCardProps) => {
  const [open, setOpen] = useState(false);

  const idle = allData ? parseFloat(allData.cpu.idle) : 100 - user - system;
  const steal = allData?.steal_iowait?.steal_percent ?? "—";
  const iowait = allData?.steal_iowait?.iowait_percent ?? "—";
  const cpuPressure = allData?.pressure?.cpu_some_avg10 ?? "—";
  const load1m = allData?.load_avg?.["1m"] ?? "—";
  const load5m = allData?.load_avg?.["5m"] ?? "—";
  const load15m = allData?.load_avg?.["15m"] ?? "—";
  const coreUsages: CoreUsage[] = allData?.cpu?.per_core ?? [];

  // Colour gradient based on core load
  const coreColor = (pct: number): string => {
    if (pct >= 80) return "bg-destructive";
    if (pct >= 50) return "bg-chart-orange";
    return "bg-primary";
  };

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">CPU Usage</h3>
            {allData?.cpu?.temperature_c !== undefined && allData.cpu.temperature_c > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${allData.cpu.temperature_c > 80 ? "bg-destructive/20 text-destructive" :
                  allData.cpu.temperature_c > 65 ? "bg-chart-orange/20 text-chart-orange" :
                    "bg-chart-green/20 text-chart-green"
                }`}>
                {allData.cpu.temperature_c.toFixed(1)}°C
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-primary hover:underline"
          >
            View metrics →
          </button>
        </div>
        <div className="flex items-center gap-6">
          <DonutChart value={percentage} color="hsl(var(--chart-purple))" />
          <div className="space-y-3 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-primary">User</span>
                <span className="text-foreground">{user.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${user}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">System</span>
                <span className="text-foreground">{system.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-chart-blue" style={{ width: `${system}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Idle</span>
                <span className="text-foreground">{idle.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-accent/50" style={{ width: `${idle}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="CPU">
        <MetricSection title="UTILIZATION">
          <MetricBar label="Total" value={percentage} color="bg-chart-purple" />
          <MetricBar label="User" value={user} color="bg-primary" />
          <MetricBar label="System" value={system} color="bg-chart-blue" />
          <MetricBar label="Idle" value={idle} color="bg-accent/50" />
        </MetricSection>

        {coreUsages.length > 0 && (
          <MetricSection title="PER-CORE USAGE">
            {coreUsages.map((c) => (
              <MetricBar
                key={c.core}
                label={`Core ${c.core}`}
                value={c.percent}
                color={coreColor(c.percent)}
              />
            ))}
          </MetricSection>
        )}

        <MetricSection title="LOAD AVERAGE">
          <MetricRow label="1 minute" value={load1m} />
          <MetricRow label="5 minutes" value={load5m} />
          <MetricRow label="15 minutes" value={load15m} />
        </MetricSection>
        <MetricSection title="VPS SPECIFIC">
          <MetricRow
            label="CPU Steal"
            value={steal}
            sub="Cycles taken by hypervisor"
            highlight={parseFloat(steal) > 5 ? "warn" : "ok"}
          />
          <MetricRow
            label="IO Wait"
            value={iowait}
            sub="Waiting for disk I/O"
            highlight={parseFloat(iowait) > 10 ? "warn" : "ok"}
          />
        </MetricSection>
        <MetricSection title="PRESSURE (PSI)">
          <MetricRow
            label="CPU Pressure (avg10)"
            value={cpuPressure}
            highlight={parseFloat(cpuPressure) > 30 ? "warn" : "ok"}
          />
        </MetricSection>
      </MetricsModal>
    </>
  );
};

export default CpuCard;
