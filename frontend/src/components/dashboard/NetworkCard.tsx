import { useEffect, useState, useRef } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { NetworkEntry } from "@/lib/api";
import { MetricsModal, MetricRow, MetricSection } from "./MetricsModal";

interface NetworkCardProps {
  networkData?: NetworkEntry[];
}

interface ChartPoint {
  time: string;
  rx: number;
  tx: number;
}

const formatSpeed = (bytesPerSec: number) => {
  if (bytesPerSec === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSec) / Math.log(k));
  return parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const NetworkCard = ({ networkData }: NetworkCardProps) => {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<ChartPoint[]>(() =>
    Array(20).fill({ time: "", rx: 0, tx: 0 })
  );

  const prevRef = useRef<{ time: number; rx: number; tx: number } | null>(null);

  const iface = networkData?.[0]; // Defaulting to first interface for speed/chart

  useEffect(() => {
    if (!iface || iface.rx_bytes == null || iface.tx_bytes == null) {
      return;
    }

    const now = Date.now();
    let rxSpeed = 0;
    let txSpeed = 0;

    if (prevRef.current) {
      const ms = now - prevRef.current.time;
      if (ms > 0) {
        // Calculate bytes per second
        const rxDiff = iface.rx_bytes - prevRef.current.rx;
        const txDiff = iface.tx_bytes - prevRef.current.tx;

        // Handle potential counter wrap or restart
        if (rxDiff >= 0 && txDiff >= 0) {
          rxSpeed = (rxDiff / ms) * 1000;
          txSpeed = (txDiff / ms) * 1000;
        }
      }
    }

    prevRef.current = { time: now, rx: iface.rx_bytes, tx: iface.tx_bytes };

    const timeLabel = new Date(now).toLocaleTimeString([], {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });

    setHistory((prev) => {
      const newHistory = [...prev, { time: timeLabel, rx: rxSpeed, tx: txSpeed }];
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      return newHistory;
    });
  }, [iface]);

  // Extract the latest speed from history
  const currentSpeed = history[history.length - 1];

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Network</h3>
          <button
            onClick={() => setOpen(true)}
            className="text-xs text-primary hover:underline"
          >
            View metrics →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">↓ Rx (Speed)</p>
            <p className="text-xl font-bold text-foreground truncate">
              {currentSpeed ? (
                formatSpeed(currentSpeed.rx)
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Total: {iface?.received ?? "—"}
            </p>
          </div>
          <div className="bg-secondary rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">↑ Tx (Speed)</p>
            <p className="text-xl font-bold text-foreground truncate">
              {currentSpeed ? (
                formatSpeed(currentSpeed.tx)
              ) : (
                <span className="text-muted-foreground text-sm">—</span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              Total: {iface?.sent ?? "—"}
            </p>
          </div>
        </div>
        <div className="h-20 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontSize: '12px' }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => formatSpeed(value)}
                labelStyle={{ display: 'none' }}
              />
              <Area
                type="monotone"
                dataKey="tx"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorTx)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="rx"
                stroke="hsl(var(--chart-blue))"
                fillOpacity={1}
                fill="url(#colorRx)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          <p className="metric-label mb-1">INTERFACES</p>
          {(networkData ?? []).slice(0, 3).map((n) => (
            <div key={n.interface} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <span className="text-foreground truncate max-w-[140px]">{n.interface}</span>
              <span className="text-muted-foreground ml-auto text-[10px]">
                ↓ {n.received} &nbsp; ↑ {n.sent}
              </span>
            </div>
          ))}
          {!networkData?.length && (
            <span className="text-xs text-muted-foreground">Loading…</span>
          )}
        </div>
      </div>

      <MetricsModal open={open} onClose={() => setOpen(false)} title="Network">
        <MetricSection title="ALL INTERFACES">
          {(networkData ?? []).map((n) => (
            <div key={n.interface}>
              <MetricRow
                label={n.interface}
                value=""
                sub={`Total ↓ ${n.received}  ·  Total ↑ ${n.sent}`}
              />
              {(n.rx_errors !== undefined) && (
                <div className="pl-4 mt-1 space-y-1 pb-3 border-b border-white/5 last:border-0">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Rx Errors / Drops</span>
                    <span className={n.rx_errors > 0 || n.rx_dropped! > 0 ? "text-destructive" : "text-chart-green"}>
                      {n.rx_errors} / {n.rx_dropped}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Tx Errors / Drops</span>
                    <span className={n.tx_errors! > 0 || n.tx_dropped! > 0 ? "text-destructive" : "text-chart-green"}>
                      {n.tx_errors} / {n.tx_dropped}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {!networkData?.length && (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </MetricSection>
        <MetricSection title="LEGEND">
          <MetricRow label="Rx (Download)" value="Current speed and cumulative received" />
          <MetricRow label="Tx (Upload)" value="Current speed and cumulative sent" />
        </MetricSection>
      </MetricsModal>
    </>
  );
};

export default NetworkCard;
