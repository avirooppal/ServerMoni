import { Clock, CheckCircle, XCircle, Clock3 } from "lucide-react";
import { CronJob } from "@/lib/api";

interface CronJobCardProps {
  jobs?: CronJob[] | null;
}

const statusIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s === "ready" || s === "scheduled" || s === "ok")
    return <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />;
  if (s === "disabled" || s === "stopped")
    return <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
  return <Clock3 className="w-3.5 h-3.5 text-chart-orange shrink-0" />;
};

const statusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s === "ready" || s === "ok" || s === "scheduled")
    return "status-ok text-xs px-2 py-0.5 rounded-full";
  if (s === "disabled" || s === "stopped")
    return "status-error text-xs px-2 py-0.5 rounded-full";
  return "status-warn text-xs px-2 py-0.5 rounded-full";
};

const CronJobCard = ({ jobs }: CronJobCardProps) => {
  const displayJobs = jobs ?? [];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Cron Job Monitoring</h3>
        {displayJobs.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {displayJobs.length} task{displayJobs.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {displayJobs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No scheduled tasks found.</p>
      ) : (
        <div className="space-y-2">
          {displayJobs.slice(0, 8).map((job, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                {statusIcon(job.status)}
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate max-w-[180px]">
                    {job.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
                    {job.schedule}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <span className={statusBadge(job.status)}>
                  {job.status}
                </span>
                {job.last_run && job.last_run !== "—" && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-[100px] truncate">
                    {job.last_run}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CronJobCard;
