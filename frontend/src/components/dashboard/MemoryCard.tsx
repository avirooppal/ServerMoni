import { useState } from "react";
import DonutChart from "./DonutChart";
import { MetricsModal, MetricRow, MetricBar, MetricSection } from "./MetricsModal";
import { AllData } from "@/lib/api";

interface MemoryCardProps {
  percentage: number;
  used: number;
  cached: number;
  swap: number;
  allData?: AllData;
}

const MemoryCard = ({ percentage, used, cached, swap, allData }: MemoryCardProps) => {
  const [open, setOpen] = useState(false);

  const total = allData?.memory.total ?? "—";
  const free = allData?.memory.free ?? "—";
  const swapTotal = allData?.memory.swap_total ?? "—";
  const swapUsed = allData?.memory.swap_used ?? "—";
  const memPressure = allData?.pressure?.memory_some_avg10 ?? "—";
  const ioPressure = allData?.pressure?.io_some_avg10 ?? "—";

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Memory</h3>
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-primary hover:underline"
          >
            View metrics →
          </button>
        </div>
        <div className="flex items-center gap-6">
          <DonutChart value={percentage} color="hsl(var(--chart-purple))" size={110} />
          <div className="space-y-2 text-sm flex-1">
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Used</span>
              <span className="text-foreground font-medium">{used.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Total</span>
              <span className="text-foreground font-medium">{total}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-muted-foreground">Swap</span>
              <span className={swap > 5 ? "text-destructive font-medium" : "text-accent font-medium"}>
                {swap.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="Memory">
        <MetricSection title="RAM USAGE">
          <MetricBar label="Used" value={percentage} color="bg-chart-purple" />
          <MetricRow label="Used" value={`${used.toFixed(1)} GB`} />
          <MetricRow label="Total" value={total} />
          <MetricRow label="Free" value={free} highlight="ok" />
        </MetricSection>
        <MetricSection title="SWAP">
          <MetricBar
            label="Swap Usage"
            value={swap}
            color={swap > 5 ? "bg-destructive" : "bg-accent"}
            extra={`${swap.toFixed(1)}%`}
          />
          <MetricRow label="Swap Used" value={swapUsed} highlight={swap > 5 ? "warn" : "ok"} />
          <MetricRow label="Swap Total" value={swapTotal} />
        </MetricSection>
        <MetricSection title="PRESSURE (PSI)">
          <MetricRow
            label="Memory Pressure (avg10)"
            value={memPressure}
            highlight={parseFloat(memPressure) > 30 ? "warn" : "ok"}
          />
          <MetricRow
            label="IO Pressure (avg10)"
            value={ioPressure}
            highlight={parseFloat(ioPressure) > 30 ? "warn" : "ok"}
          />
        </MetricSection>
      </MetricsModal>
    </>
  );
};

export default MemoryCard;
