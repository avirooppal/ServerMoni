//go:build windows

package system

import (
	"syscall"
	"unsafe"
)

// LoadAvg represents system load averages
type LoadAvg struct {
	Load1  float64 `json:"load_1m"`
	Load5  float64 `json:"load_5m"`
	Load15 float64 `json:"load_15m"`
}

// UptimeStats represents system uptime information
type UptimeStats struct {
	Uptime   float64 `json:"uptime_seconds"`
	IdleTime float64 `json:"idle_time_seconds"`
}

// StealIOStats represents CPU steal and IO wait times (VPS specific)
type StealIOStats struct {
	StealPercent  float64 `json:"steal_percent"`
	IOWaitPercent float64 `json:"iowait_percent"`
}

var (
	kernel32      = syscall.NewLazyDLL("kernel32.dll")
	getTickCount64 = kernel32.NewProc("GetTickCount64")
)

// GetLoadAvg returns mock load average statistics for Windows
// (load averages are a Linux concept; return zeros on Windows)
func GetLoadAvg() (*LoadAvg, error) {
	return &LoadAvg{
		Load1:  0.0,
		Load5:  0.0,
		Load15: 0.0,
	}, nil
}

// GetUptime returns real system uptime using kernel32.dll GetTickCount64
func GetUptime() (*UptimeStats, error) {
	ret, _, _ := getTickCount64.Call()
	uptimeMs := uint64(*(*uint64)(unsafe.Pointer(&ret)))
	uptimeSec := float64(uptimeMs) / 1000.0
	return &UptimeStats{
		Uptime:   uptimeSec,
		IdleTime: 0.0,
	}, nil
}

// GetStealIOWait returns zeros for Windows (no hypervisor steal concept)
func GetStealIOWait() (*StealIOStats, error) {
	return &StealIOStats{
		StealPercent:  0.0,
		IOWaitPercent: 0.0,
	}, nil
}
