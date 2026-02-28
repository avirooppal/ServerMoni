package system

import (
	"os/exec"
	"runtime"
	"strings"
	"time"
)

// CronJob represents a scheduled task (cron on Linux, schtasks on Windows)
type CronJob struct {
	Name     string `json:"name"`
	Schedule string `json:"schedule"`
	LastRun  string `json:"last_run"`
	Status   string `json:"status"`
}

// GetCronJobs returns scheduled tasks.
// On Linux reads from `crontab -l` (system-wide via /etc/cron* is complex, so we list user crontab).
// On Windows reads from Windows Task Scheduler via `schtasks`.
// Returns empty slice gracefully on error.
func GetCronJobs() ([]CronJob, error) {
	if runtime.GOOS == "windows" {
		return getWindowsScheduledTasks()
	}
	return getLinuxCronJobs()
}

func getLinuxCronJobs() ([]CronJob, error) {
	// Try to read /etc/crontab and /var/spool/cron/crontabs lines
	type cronSource struct {
		cmd  string
		args []string
	}

	sources := []cronSource{
		{"crontab", []string{"-l"}},
	}

	var jobs []CronJob
	for _, src := range sources {
		cmd := exec.Command(src.cmd, src.args...)
		ch := make(chan []byte, 1)
		go func() {
			out, _ := cmd.Output()
			ch <- out
		}()

		var out []byte
		select {
		case out = <-ch:
		case <-time.After(2 * time.Second):
			if cmd.Process != nil {
				cmd.Process.Kill()
			}
			continue
		}

		lines := strings.Split(string(out), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			// Simple cron line: MIN HOUR DOM MON DOW cmd
			parts := strings.Fields(line)
			if len(parts) < 6 {
				continue
			}
			schedule := strings.Join(parts[:5], " ")
			name := strings.Join(parts[5:], " ")
			if len(name) > 60 {
				name = name[:60] + "…"
			}
			jobs = append(jobs, CronJob{
				Name:     name,
				Schedule: schedule,
				LastRun:  "—",
				Status:   "scheduled",
			})
		}
	}

	return jobs, nil
}

func getWindowsScheduledTasks() ([]CronJob, error) {
	cmd := exec.Command("schtasks", "/query", "/fo", "CSV", "/v")

	ch := make(chan []byte, 1)
	go func() {
		out, _ := cmd.Output()
		ch <- out
	}()

	var out []byte
	select {
	case out = <-ch:
	case <-time.After(5 * time.Second):
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return []CronJob{}, nil
	}

	var jobs []CronJob
	lines := strings.Split(string(out), "\n")

	// Skip header row; CSV columns: HostName,TaskName,Next Run Time,Status,Logon Mode,Last Run Time,...
	header := true
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if header {
			header = false
			continue
		}
		cols := parseCSVLine(line)
		if len(cols) < 6 {
			continue
		}
		taskName := strings.Trim(cols[1], "\"")
		// Filter out empty or system noise
		if taskName == "" || taskName == "TaskName" {
			continue
		}
		status := strings.Trim(cols[3], "\"")
		lastRun := strings.Trim(cols[5], "\"")

		// Use last segment of task path as display name
		parts := strings.Split(taskName, "\\")
		displayName := parts[len(parts)-1]

		jobs = append(jobs, CronJob{
			Name:     displayName,
			Schedule: taskName,
			LastRun:  lastRun,
			Status:   strings.ToLower(status),
		})

		// Limit to 20 tasks to avoid flooding the UI
		if len(jobs) >= 20 {
			break
		}
	}

	return jobs, nil
}

// parseCSVLine splits a CSV line respecting quoted fields
func parseCSVLine(line string) []string {
	var fields []string
	inQuote := false
	var current strings.Builder

	for _, ch := range line {
		switch {
		case ch == '"':
			inQuote = !inQuote
			current.WriteRune(ch)
		case ch == ',' && !inQuote:
			fields = append(fields, current.String())
			current.Reset()
		default:
			current.WriteRune(ch)
		}
	}
	fields = append(fields, current.String())
	return fields
}
