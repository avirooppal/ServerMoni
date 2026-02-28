//go:build windows

package diskusage

import (
	"syscall"
	"unsafe"
)

func getDiskUsagePlatform() ([]DiskUsage, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	getDiskFreeSpaceEx := kernel32.NewProc("GetDiskFreeSpaceExW")

	drives := []string{"C:\\", "D:\\", "E:\\", "F:\\", "G:\\"}
	var results []DiskUsage

	for _, drive := range drives {
		var freeBytesAvailable, totalNumberOfBytes, totalNumberOfFreeBytes uint64
		drivePtr, err := syscall.UTF16PtrFromString(drive)
		if err != nil {
			continue
		}
		ret, _, _ := getDiskFreeSpaceEx.Call(
			uintptr(unsafe.Pointer(drivePtr)),
			uintptr(unsafe.Pointer(&freeBytesAvailable)),
			uintptr(unsafe.Pointer(&totalNumberOfBytes)),
			uintptr(unsafe.Pointer(&totalNumberOfFreeBytes)),
		)
		if ret == 0 || totalNumberOfBytes == 0 {
			continue
		}
		usedBytes := totalNumberOfBytes - totalNumberOfFreeBytes
		usedPct := float64(usedBytes) / float64(totalNumberOfBytes) * 100

		results = append(results, DiskUsage{
			Path:       drive,
			Fstype:     "NTFS",
			Total:      formatBytes(totalNumberOfBytes),
			Used:       formatBytes(usedBytes),
			Free:       formatBytes(totalNumberOfFreeBytes),
			UsedPct:    usedPct,
			TotalBytes: totalNumberOfBytes,
			UsedBytes:  usedBytes,
			FreeBytes:  totalNumberOfFreeBytes,
		})
	}
	return results, nil
}
