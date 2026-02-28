import { Server, Activity, CheckCircle } from "lucide-react";

interface StatusBadgesProps {
  hostname?: string;
  uptime?: string;
  uptimePct?: string;
}

const StatusBadge = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) => (
  <div className="glass-card p-4 flex items-center gap-3">
    <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground truncate max-w-[120px]">{value}</p>
    </div>
  </div>
);

const StatusBadges = ({ hostname, uptime, uptimePct }: StatusBadgesProps) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    <StatusBadge
      icon={Server}
      label="Server"
      value={hostname ?? "—"}
      color="hsl(var(--chart-blue))"
    />
    <StatusBadge
      icon={CheckCircle}
      label="Uptime"
      value={uptime ?? "—"}
      color="hsl(var(--chart-green))"
    />
    <StatusBadge
      icon={Activity}
      label="OS / Arch"
      value={uptimePct ?? "—"}
      color="hsl(var(--chart-cyan))"
    />
  </div>
);

export default StatusBadges;
