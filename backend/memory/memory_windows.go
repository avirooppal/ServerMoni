//go:build windows

package memory

import (
	"fmt"
	"syscall"
	"unsafe"
)

// MemoryStats represents memory statistics
type MemoryStats struct {
	Total     uint64
	Used      uint64
	Free      uint64
	Buffers   uint64
	Cached    uint64
	Active    uint64
	Inactive  uint64
	SwapTotal uint64
	SwapUsed  uint64
	SwapFree  uint64
}

// MEMORYSTATUSEX is the Windows API struct for GlobalMemoryStatusEx
type memoryStatusEx struct {
	dwLength                uint32
	dwMemoryLoad            uint32
	ullTotalPhys            uint64
	ullAvailPhys            uint64
	ullTotalPageFile        uint64
	ullAvailPageFile        uint64
	ullTotalVirtual         uint64
	ullAvailVirtual         uint64
	ullAvailExtendedVirtual uint64
}

var (
	kernel32dll          = syscall.NewLazyDLL("kernel32.dll")
	globalMemoryStatusEx = kernel32dll.NewProc("GlobalMemoryStatusEx")
)

// GetMemory returns real memory statistics using GlobalMemoryStatusEx
func GetMemory() (*MemoryStats, error) {
	var memStatus memoryStatusEx
	memStatus.dwLength = uint32(unsafe.Sizeof(memStatus))

	ret, _, err := globalMemoryStatusEx.Call(uintptr(unsafe.Pointer(&memStatus)))
	if ret == 0 {
		return nil, fmt.Errorf("GlobalMemoryStatusEx failed: %w", err)
	}

	totalPhys := memStatus.ullTotalPhys
	availPhys := memStatus.ullAvailPhys
	usedPhys := totalPhys - availPhys

	// Page file = virtual swap (total page file - physical RAM)
	totalSwap := uint64(0)
	usedSwap := uint64(0)
	if memStatus.ullTotalPageFile > totalPhys {
		totalSwap = memStatus.ullTotalPageFile - totalPhys
		availSwap := uint64(0)
		if memStatus.ullAvailPageFile > availPhys {
			availSwap = memStatus.ullAvailPageFile - availPhys
		}
		if totalSwap > availSwap {
			usedSwap = totalSwap - availSwap
		}
	}

	return &MemoryStats{
		Total:     totalPhys,
		Used:      usedPhys,
		Free:      availPhys,
		SwapTotal: totalSwap,
		SwapUsed:  usedSwap,
		SwapFree:  totalSwap - usedSwap,
	}, nil
}
