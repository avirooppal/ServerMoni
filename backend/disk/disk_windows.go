//go:build windows

package disk

import (
	"bytes"
	"os/exec"
	"strconv"
	"strings"
)

// DiskStats represents disk I/O statistics
type DiskStats struct {
	Name            string
	ReadsCompleted  uint64
	ReadsMerged     uint64
	SectorsRead     uint64
	ReadTime        uint64
	WritesCompleted uint64
	WritesMerged    uint64
	SectorsWritten  uint64
	WriteTime       uint64
	IoInProgress    uint64
	IoTime          uint64
	WeightedIoTime  uint64
	AvgDiskSecPerRead  uint64 // Disk Latency (Read, ticks)
	AvgDiskSecPerWrite uint64 // Disk Latency (Write, ticks)
}

// GetDisk returns real basic disk I/O statistics using WMI
func GetDisk() ([]DiskStats, error) {
	cmd := exec.Command("wmic", "path", "Win32_PerfRawData_PerfDisk_PhysicalDisk", "get", "Name,DiskReadsPersec,DiskWritesPersec,AvgDiskSecPerRead,AvgDiskSecPerWrite", "/format:csv")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	return parseWmicDiskOutput(output)
}

func parseWmicDiskOutput(output []byte) ([]DiskStats, error) {
	var stats []DiskStats
	lines := strings.Split(string(bytes.ReplaceAll(output, []byte("\r\n"), []byte("\n"))), "\n")

	// The CSV header contains: Node,DiskReadsPersec,DiskWritesPersec,Name
	var readIdx, writeIdx, nameIdx = -1, -1, -1

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.Split(line, ",")

		if readIdx == -1 {
			// Find indices from header
			for i, p := range parts {
				switch p {
				case "DiskReadsPersec":
					readIdx = i
				case "DiskWritesPersec":
					writeIdx = i
				case "Name":
					nameIdx = i
				}
			}
			continue
		}

		if len(parts) <= readIdx || len(parts) <= writeIdx || len(parts) <= nameIdx {
			continue
		}

		name := parts[nameIdx]
		// Skip the "_Total" aggregate row
		if name == "_Total" {
			continue
		}

		reads, _ := strconv.ParseUint(parts[readIdx], 10, 64)
		writes, _ := strconv.ParseUint(parts[writeIdx], 10, 64)

		var avgRead, avgWrite uint64
		if len(parts) > writeIdx+1 {
			// Find Average columns which WMIC might append dynamically after
			for i, p := range parts {
				switch p {
				case "AvgDiskSecPerRead":
					if len(parts) > i { avgRead, _ = strconv.ParseUint(parts[i], 10, 64) }
				case "AvgDiskSecPerWrite":
					if len(parts) > i { avgWrite, _ = strconv.ParseUint(parts[i], 10, 64) }
				}
			}
		}

		stats = append(stats, DiskStats{
			Name:               name,
			ReadsCompleted:     reads,
			WritesCompleted:    writes,
			AvgDiskSecPerRead:  avgRead,
			AvgDiskSecPerWrite: avgWrite,
		})
	}

	return stats, nil
}
