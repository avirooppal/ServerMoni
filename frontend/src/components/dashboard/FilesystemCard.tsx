import { useState } from "react";
import DonutChart from "./DonutChart";
import { MetricsModal, MetricRow, MetricSection } from "./MetricsModal";
import { DiskEntry } from "@/lib/api";

interface FilesystemCardProps {
  disks?: DiskEntry[];
}

const FilesystemCard = ({ disks }: FilesystemCardProps) => {
  const [open, setOpen] = useState(false);
  const primaryDisk = disks?.[0];
  const totalReads = disks?.reduce((s, d) => s + d.reads, 0) ?? 0;
  const totalWrites = disks?.reduce((s, d) => s + d.writes, 0) ?? 0;

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Root Filesystem</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
              {primaryDisk?.name ?? "disk"}
            </span>
            <button
              onClick={() => setOpen(true)}
              className="text-xs text-primary hover:underline"
            >
              View metrics →
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <DonutChart value={60} color="hsl(var(--chart-purple))" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-chart-blue" />
              <span className="text-muted-foreground">IO Read</span>
              <span className="text-foreground font-mono text-xs ml-auto">
                {primaryDisk ? primaryDisk.reads.toLocaleString() : "—"} ops
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">IO Write</span>
              <span className="text-foreground font-mono text-xs ml-auto">
                {primaryDisk ? primaryDisk.writes.toLocaleString() : "—"} ops
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-chart-orange" />
              <span className="text-muted-foreground">IOPS</span>
              <span className="text-foreground font-mono text-xs ml-auto">
                {primaryDisk
                  ? (primaryDisk.reads + primaryDisk.writes).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="Disk I/O">
        <MetricSection title="TOTAL ACROSS ALL DISKS">
          <MetricRow label="Total Reads" value={totalReads.toLocaleString()} />
          <MetricRow label="Total Writes" value={totalWrites.toLocaleString()} />
          <MetricRow
            label="Total IOPS"
            value={(totalReads + totalWrites).toLocaleString()}
          />
        </MetricSection>
        {(disks ?? []).length > 0 && (
          <MetricSection title="PER DEVICE">
            {(disks ?? []).map((d) => (
              <div key={d.name}>
                <MetricRow
                  label={d.name}
                  value=""
                  sub={`Reads: ${d.reads.toLocaleString()} · Writes: ${d.writes.toLocaleString()}`}
                />
              </div>
            ))}
          </MetricSection>
        )}
        {!disks?.length && (
          <p className="text-xs text-muted-foreground">No disk data available</p>
        )}
      </MetricsModal>
    </>
  );
};

export default FilesystemCard;
