package diskusage

import "fmt"

// DiskUsage holds usage stats for one mount/partition
type DiskUsage struct {
	Path       string  `json:"path"`
	Fstype     string  `json:"fstype"`
	Total      string  `json:"total"`
	Used       string  `json:"used"`
	Free       string  `json:"free"`
	UsedPct    float64 `json:"used_percent"`
	TotalBytes uint64  `json:"total_bytes"`
	UsedBytes  uint64  `json:"used_bytes"`
	FreeBytes  uint64  `json:"free_bytes"`
}

// GetDiskUsage returns disk usage for key mount points / drives
func GetDiskUsage() ([]DiskUsage, error) {
	return getDiskUsagePlatform()
}

func formatBytes(b uint64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := uint64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}
