import { useState } from "react";
import DonutChart from "./DonutChart";
import { MetricsModal, MetricRow, MetricBar, MetricSection } from "./MetricsModal";
import { DiskUsageEntry } from "@/lib/api";

interface StorageCardProps {
  diskUsage?: DiskUsageEntry[] | null;
}

const StorageCard = ({ diskUsage }: StorageCardProps) => {
  const [open, setOpen] = useState(false);
  const primaryDisk = diskUsage?.[0];
  const primaryPct = primaryDisk?.used_percent ?? 60;

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Storage</h3>
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-primary hover:underline"
          >
            View metrics →
          </button>
        </div>
        <div className="space-y-4">
          {(diskUsage ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">Loading disk info…</p>
          )}
          {(diskUsage ?? []).map((m) => (
            <div key={m.path}>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-mono text-xs">{m.path}</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{m.fstype}</span>
                </div>
                <span className="text-muted-foreground">{m.used_percent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${m.used_percent > 90 ? "bg-destructive" : m.used_percent > 75 ? "bg-chart-orange" : "bg-primary"}`}
                  style={{ width: `${m.used_percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{m.used} used</span>
                <span>{m.free} free</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="Storage">
        {(diskUsage ?? []).length === 0 && (
          <p className="text-xs text-muted-foreground">No disk data available</p>
        )}
        {(diskUsage ?? []).map((d) => (
          <MetricSection key={d.path} title={d.path}>
            <MetricBar
              label="Used"
              value={d.used_percent}
              color={d.used_percent > 90 ? "bg-destructive" : d.used_percent > 75 ? "bg-chart-orange" : "bg-primary"}
              extra={`${d.used_percent.toFixed(1)}%`}
            />
            <MetricRow label="Used" value={d.used} />
            <MetricRow label="Free" value={d.free} highlight="ok" />
            <MetricRow label="Total" value={d.total} />
            <MetricRow label="Filesystem" value={d.fstype} />
          </MetricSection>
        ))}
      </MetricsModal>
    </>
  );
};

export default StorageCard;
