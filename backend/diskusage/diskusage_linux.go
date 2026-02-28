//go:build linux

package diskusage

import (
	"fmt"
	"syscall"
)

func getDiskUsagePlatform() ([]DiskUsage, error) {
	mounts := []string{"/", "/boot", "/home", "/var", "/tmp"}
	var results []DiskUsage
	seen := map[string]bool{}

	for _, mount := range mounts {
		var stat syscall.Statfs_t
		if err := syscall.Statfs(mount, &stat); err != nil {
			continue
		}
		total := stat.Blocks * uint64(stat.Bsize)
		free := stat.Bfree * uint64(stat.Bsize)
		if total == 0 {
			continue
		}
		used := total - free
		usedPct := float64(used) / float64(total) * 100

		// Deduplicate by total size (same device mounted multiple times)
		key := fmt.Sprintf("%d", total)
		if seen[key] {
			continue
		}
		seen[key] = true

		results = append(results, DiskUsage{
			Path:       mount,
			Fstype:     "ext4",
			Total:      formatBytes(total),
			Used:       formatBytes(used),
			Free:       formatBytes(free),
			UsedPct:    usedPct,
			TotalBytes: total,
			UsedBytes:  used,
			FreeBytes:  free,
		})
	}
	return results, nil
}
