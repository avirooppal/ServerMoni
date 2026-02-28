import { useState } from "react";
import { Shield, Activity, Wifi, Cpu } from "lucide-react";
import DonutChart from "./DonutChart";
import { ProcessEntry, GPUStats, PortStatus } from "@/lib/api";
import { MetricsModal, MetricRow, MetricBar, MetricSection } from "./MetricsModal";

const Fail2banCard = () => (
  <div className="glass-card p-5">
    <div className="flex items-center gap-2 mb-4">
      <Shield className="w-4 h-4 text-chart-orange" />
      <h3 className="font-semibold text-foreground">Fail2ban</h3>
    </div>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between"><span className="text-muted-foreground">Active Jails</span><span className="text-foreground font-medium">—</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Total Banned</span><span className="text-chart-orange font-medium">—</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Currently Banned</span><span className="text-destructive font-medium">—</span></div>
      <p className="text-xs text-muted-foreground pt-1 border-t border-border">No Fail2ban API endpoint yet</p>
    </div>
  </div>
);

interface ProcessMonitorCardProps {
  processes?: ProcessEntry[];
}

const ProcessMonitorCard = ({ processes = [] }: ProcessMonitorCardProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-chart-blue" />
            <h3 className="font-semibold text-foreground">Process Monitor</h3>
          </div>
          <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline">View →</button>
        </div>
        <div className="space-y-2 text-sm">
          {processes.length === 0 && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {processes.slice(0, 5).map((p) => (
            <div key={p.pid} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span className="text-foreground truncate max-w-[90px]">{p.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">PID {p.pid}</span>
                <span className="text-xs text-muted-foreground">{p.memory}</span>
                {p.cpu_time && (
                  <span className="text-xs text-chart-blue">{p.cpu_time}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="Process Monitor">
        <MetricSection title="TOP PROCESSES">
          {processes.map((p) => (
            <MetricRow
              key={p.pid}
              label={p.name}
              value={p.memory}
              sub={p.cpu_time ? `PID ${p.pid} · ${p.cpu_time}` : `PID ${p.pid}`}
            />
          ))}
          {!processes.length && <p className="text-xs text-muted-foreground">No process data</p>}
        </MetricSection>
      </MetricsModal>
    </>
  );
};

// ── Port Check ────────────────────────────────────────────────────────────────

interface PortCheckCardProps {
  ports?: PortStatus[] | null;
}

const PortCheckCard = ({ ports }: PortCheckCardProps) => {
  const displayPorts = ports ?? [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="w-4 h-4 text-accent" />
        <h3 className="font-semibold text-foreground">Port Check</h3>
        {displayPorts.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {displayPorts.filter((p) => p.open).length}/{displayPorts.length} open
          </span>
        )}
      </div>

      {displayPorts.length === 0 ? (
        <p className="text-xs text-muted-foreground">Loading port status…</p>
      ) : (
        <div className="space-y-2 text-sm">
          {displayPorts.map((p) => (
            <div
              key={p.port}
              className="flex items-center justify-between py-1 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-foreground font-mono">{p.port}</span>
                <span className="text-muted-foreground">{p.service}</span>
              </div>
              <span
                className={
                  p.open
                    ? "status-ok text-xs px-2 py-0.5 rounded-full"
                    : "status-error text-xs px-2 py-0.5 rounded-full"
                }
              >
                {p.open ? "open" : "closed"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── GPU Card ──────────────────────────────────────────────────────────────────

interface GpuCardProps {
  gpuData?: GPUStats[] | null;
}

const GpuCard = ({ gpuData }: GpuCardProps) => {
  const [open, setOpen] = useState(false);
  const gpu = gpuData?.[0];

  const utilPct = Number(gpu?.util_gpu_percent) || 0;
  const memUsedMB = Number(gpu?.memory_used_mb) || 0;
  const memTotalMB = Number(gpu?.memory_total_mb) || 0;
  const memPct = memTotalMB ? (memUsedMB / memTotalMB) * 100 : 0;

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-chart-green" />
            <h3 className="font-semibold text-foreground">NVIDIA GPU</h3>
          </div>
          {gpu && (
            <button onClick={() => setOpen(true)} className="text-xs text-primary hover:underline">
              View metrics →
            </button>
          )}
        </div>
        {!gpu ? (
          <p className="text-xs text-muted-foreground">No GPU detected or nvidia-smi unavailable</p>
        ) : (
          <div className="flex items-center gap-6 mt-2">
            <div className="flex-shrink-0">
              <DonutChart value={utilPct} color="hsl(var(--chart-green))" size={110} />
            </div>
            <div className="space-y-2 text-sm flex-1">
              <p className="text-sm font-medium text-muted-foreground truncate mb-4">{gpu.name}</p>

              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">VRAM</span>
                <span className="text-foreground font-medium">{memUsedMB} / {memTotalMB} MB</span>
              </div>

              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Temp</span>
                <span className={gpu.temperature_c > 80 ? "text-destructive font-medium" : "text-chart-orange font-medium"}>
                  {gpu.temperature_c}°C
                </span>
              </div>

              <div className="flex justify-between gap-6">
                <span className="text-muted-foreground">Power</span>
                <span className="text-foreground font-medium">{gpu.power_draw_w}W / {gpu.power_limit_w}W</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {gpu && (
        <MetricsModal open={open} onClose={() => setOpen(false)} title="NVIDIA GPU">
          <MetricSection title="GPU INFO">
            <MetricRow label="Name" value={gpu.name} />
            <MetricRow label="Index" value={gpu.index} />
            <MetricRow label="UUID" value={gpu.uuid.slice(0, 16) + "…"} />
          </MetricSection>
          <MetricSection title="UTILIZATION">
            <MetricBar label="GPU Core" value={utilPct} color="bg-chart-green" />
            <MetricBar label="VRAM" value={memPct} color="bg-chart-blue" extra={`${memUsedMB} / ${memTotalMB} MB`} />
          </MetricSection>
          <MetricSection title="THERMALS & POWER">
            <MetricRow
              label="Temperature"
              value={`${gpu.temperature_c}°C`}
              highlight={gpu.temperature_c > 80 ? "critical" : gpu.temperature_c > 70 ? "warn" : "ok"}
            />
            <MetricRow label="Power Draw" value={`${gpu.power_draw_w} W`} />
            <MetricRow label="Power Limit" value={`${gpu.power_limit_w} W`} />
            <MetricBar
              label="Power Usage"
              value={gpu.power_limit_w ? (gpu.power_draw_w / gpu.power_limit_w) * 100 : 0}
              color="bg-chart-orange"
              extra={`${gpu.power_draw_w}W / ${gpu.power_limit_w}W`}
            />
          </MetricSection>
        </MetricsModal>
      )}
    </>
  );
};

export { Fail2banCard, ProcessMonitorCard, PortCheckCard, GpuCard };
