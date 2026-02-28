import { X, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { type ReactNode } from "react";

interface MetricsModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export const MetricsModal = ({ open, onClose, title, children }: MetricsModalProps) => {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <h2 className="font-semibold text-foreground">{title} — Metrics</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface MetricRowProps {
    label: string;
    value: string | number;
    sub?: string;
    trend?: "up" | "down" | "neutral";
    highlight?: "warn" | "ok" | "critical";
}

export const MetricRow = ({ label, value, sub, trend, highlight }: MetricRowProps) => {
    const valueClass =
        highlight === "warn"
            ? "text-chart-orange"
            : highlight === "critical"
                ? "text-destructive"
                : highlight === "ok"
                    ? "text-accent"
                    : "text-foreground";

    return (
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
                <p className="text-sm text-foreground">{label}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className="flex items-center gap-1.5">
                {trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-destructive" />}
                {trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-accent" />}
                <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
            </div>
        </div>
    );
};

interface MetricBarProps {
    label: string;
    value: number; // 0-100
    color?: string;
    extra?: string;
}

export const MetricBar = ({ label, value, color = "bg-primary", extra }: MetricBarProps) => (
    <div className="space-y-1">
        <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium">{extra ?? `${value.toFixed(1)}%`}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary">
            <div
                className={`h-full rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    </div>
);

export const MetricSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <div>
        <p className="metric-label mb-3">{title}</p>
        <div className="glass-card p-3 space-y-1">{children}</div>
    </div>
);
