import { useState } from "react";
import { MetricsModal, MetricRow, MetricSection } from "./MetricsModal";
import { ProcessEntry } from "@/lib/api";

interface ProcessDisplayItem {
  name: string;
  memory: string;
  pid: number;
  color: string;
  cpu_time?: string;
}

interface TopProcessCardProps {
  title: string;
  processes: ProcessDisplayItem[];
  rawProcesses?: ProcessEntry[];
  /** set to true for Top CPU card so cpu_time is shown */
  showCpuTime?: boolean;
  totalProcesses?: number;
}

const TopProcessCard = ({ title, processes, rawProcesses, showCpuTime = false, totalProcesses }: TopProcessCardProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {totalProcesses !== undefined && (
              <span className="text-xs bg-accent px-2 py-0.5 rounded text-accent-foreground">
                Total: {totalProcesses}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">Top 5</span>
            <button
              onClick={() => setOpen(true)}
              className="text-xs text-primary hover:underline"
            >
              View →
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {processes.length === 0 && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {processes.map((proc, i) => (
            <div key={`${proc.name}-${i}`} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: proc.color }} />
                <span className="text-foreground truncate max-w-[120px]">{proc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {showCpuTime && proc.cpu_time && (
                  <span className="text-chart-blue text-xs">{proc.cpu_time}</span>
                )}
                <span className="text-muted-foreground text-xs text-right">{proc.memory}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title={title}>
        <MetricSection title={showCpuTime ? "TOP PROCESSES BY CPU TIME" : "TOP PROCESSES BY MEMORY"}>
          {(rawProcesses ?? []).map((p) => (
            <MetricRow
              key={p.pid}
              label={p.name}
              value={p.memory}
              sub={
                showCpuTime && p.cpu_time
                  ? `PID ${p.pid} · ${p.cpu_time}`
                  : `PID ${p.pid}`
              }
            />
          ))}
          {!rawProcesses?.length && (
            <p className="text-xs text-muted-foreground">No data available</p>
          )}
        </MetricSection>
      </MetricsModal>
    </>
  );
};

export default TopProcessCard;
