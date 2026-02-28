//go:build windows

package process

import (
	"fmt"
	"sort"
	"syscall"
	"unsafe"
)

// Process represents a single process and its metrics
type Process struct {
	PID     int
	PPID    int
	Name    string
	State   string
	RSS     uint64
	Utime   uint64
	Stime   uint64
	Cmdline string
}

// ── Windows API types ─────────────────────────────────────────────────────────

const (
	th32csSnapProcess  = 0x00000002
	processQueryInfo   = 0x1000
	invalidHandleValue = ^uintptr(0)
)

type processEntry32 struct {
	dwSize              uint32
	cntUsage            uint32
	th32ProcessID       uint32
	th32DefaultHeapID   uintptr
	th32ModuleID        uint32
	cntThreads          uint32
	th32ParentProcessID uint32
	pcPriClassBase      int32
	dwFlags             uint32
	szExeFile           [260]uint16
}

// PROCESS_MEMORY_COUNTERS_EX from psapi.h
type processMemoryCountersEx struct {
	cb                         uint32
	PageFaultCount             uint32
	PeakWorkingSetSize         uintptr
	WorkingSetSize             uintptr
	QuotaPeakPagedPoolUsage    uintptr
	QuotaPagedPoolUsage        uintptr
	QuotaPeakNonPagedPoolUsage uintptr
	QuotaNonPagedPoolUsage     uintptr
	PagefileUsage              uintptr
	PeakPagefileUsage          uintptr
	PrivateUsage               uintptr
}

// FILETIME for CPU time
type filetime struct {
	LowDateTime  uint32
	HighDateTime uint32
}

func (ft filetime) toUint64() uint64 {
	return uint64(ft.HighDateTime)<<32 | uint64(ft.LowDateTime)
}

var (
	kernel32dll                = syscall.NewLazyDLL("kernel32.dll")
	psapiDll                   = syscall.NewLazyDLL("psapi.dll")
	createToolhelp32Snapshot   = kernel32dll.NewProc("CreateToolhelp32Snapshot")
	process32First             = kernel32dll.NewProc("Process32FirstW")
	process32Next              = kernel32dll.NewProc("Process32NextW")
	closeHandle                = kernel32dll.NewProc("CloseHandle")
	openProcess                = kernel32dll.NewProc("OpenProcess")
	getProcessMemoryInfo       = psapiDll.NewProc("GetProcessMemoryInfo")
	getProcessTimes            = kernel32dll.NewProc("GetProcessTimes")
)

// GetProcesses returns a list of running processes using Windows toolhelp API.
func GetProcesses() ([]Process, error) {
	// Create snapshot of all processes
	snap, _, err := createToolhelp32Snapshot.Call(th32csSnapProcess, 0)
	if snap == invalidHandleValue {
		return nil, fmt.Errorf("CreateToolhelp32Snapshot failed: %w", err)
	}
	defer closeHandle.Call(snap)

	var entry processEntry32
	entry.dwSize = uint32(unsafe.Sizeof(entry))

	ret, _, _ := process32First.Call(snap, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return nil, fmt.Errorf("Process32First failed")
	}

	var processes []Process
	for {
		pid := int(entry.th32ProcessID)
		name := syscall.UTF16ToString(entry.szExeFile[:])
		rss, utime, stime := getProcessMetrics(pid)

		processes = append(processes, Process{
			PID:     pid,
			PPID:    int(entry.th32ParentProcessID),
			Name:    name,
			State:   "Running",
			RSS:     rss,
			Utime:   utime,
			Stime:   stime,
			Cmdline: name,
		})

		ret, _, _ = process32Next.Call(snap, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	return processes, nil
}

// getProcessMetrics opens the process and reads its memory and CPU times.
// Returns (rss bytes, utime 100ns ticks, stime 100ns ticks).
// Returns zeros gracefully if the process can't be opened (system/protected).
func getProcessMetrics(pid int) (rss, utime, stime uint64) {
	if pid == 0 || pid == 4 {
		// System Idle Process and System — skip for metrics
		return 0, 0, 0
	}

	handle, _, _ := openProcess.Call(processQueryInfo, 0, uintptr(pid))
	if handle == 0 {
		return 0, 0, 0
	}
	defer closeHandle.Call(handle)

	// Memory
	var mc processMemoryCountersEx
	mc.cb = uint32(unsafe.Sizeof(mc))
	getProcessMemoryInfo.Call(handle, uintptr(unsafe.Pointer(&mc)), uintptr(mc.cb))
	rss = uint64(mc.WorkingSetSize)

	// CPU times
	var createTime, exitTime, kernelTime, userTime filetime
	ret, _, _ := getProcessTimes.Call(
		handle,
		uintptr(unsafe.Pointer(&createTime)),
		uintptr(unsafe.Pointer(&exitTime)),
		uintptr(unsafe.Pointer(&kernelTime)),
		uintptr(unsafe.Pointer(&userTime)),
	)
	if ret != 0 {
		stime = kernelTime.toUint64()
		utime = userTime.toUint64()
	}

	return rss, utime, stime
}

// GetTopByCPU returns the top N processes sorted by total CPU time (user + kernel).
func GetTopByCPU(n int) ([]Process, error) {
	procs, err := GetProcesses()
	if err != nil {
		return nil, err
	}

	sort.Slice(procs, func(i, j int) bool {
		return (procs[i].Utime + procs[i].Stime) > (procs[j].Utime + procs[j].Stime)
	})

	if n > len(procs) {
		n = len(procs)
	}
	return procs[:n], nil
}

// GetTopByMemory returns the top N processes sorted by Working Set (RSS).
func GetTopByMemory(n int) ([]Process, error) {
	procs, err := GetProcesses()
	if err != nil {
		return nil, err
	}

	sort.Slice(procs, func(i, j int) bool {
		return procs[i].RSS > procs[j].RSS
	})

	if n > len(procs) {
		n = len(procs)
	}
	return procs[:n], nil
}
