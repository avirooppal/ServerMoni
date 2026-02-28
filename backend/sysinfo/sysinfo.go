package sysinfo

import (
	"fmt"
	"net"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// SysInfo holds system identification data
type SysInfo struct {
	Hostname string `json:"hostname"`
	OS       string `json:"os"`
	Arch     string `json:"arch"`
	Kernel   string `json:"kernel"`
	CPUModel string `json:"cpu_model"`
	IPAddress string `json:"ip_address"`
}

// GetSysInfo returns real system information
func GetSysInfo() (*SysInfo, error) {
	info := &SysInfo{
		OS:   runtime.GOOS,
		Arch: runtime.GOARCH,
	}

	// Hostname
	if h, err := os.Hostname(); err == nil {
		info.Hostname = h
	} else {
		info.Hostname = "unknown"
	}

	// Kernel version
	info.Kernel = getKernel()

	// CPU Model
	info.CPUModel = getCPUModel()

	// Outbound IP
	info.IPAddress = getOutboundIP()

	return info, nil
}

func getKernel() string {
	switch runtime.GOOS {
	case "windows":
		out, err := exec.Command("cmd", "/C", "ver").Output()
		if err != nil {
			return "Windows"
		}
		return strings.TrimSpace(strings.ReplaceAll(string(out), "\r\n", " "))
	default:
		out, err := exec.Command("uname", "-r").Output()
		if err != nil {
			return "unknown"
		}
		return strings.TrimSpace(string(out))
	}
}

func getCPUModel() string {
	switch runtime.GOOS {
	case "windows":
		out, err := exec.Command("wmic", "cpu", "get", "name").Output()
		if err != nil {
			return "unknown"
		}
		lines := strings.Split(strings.TrimSpace(string(out)), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" && line != "Name" {
				return line
			}
		}
		return "unknown"
	default:
		out, err := exec.Command("sh", "-c",
			`grep -m1 "model name" /proc/cpuinfo | cut -d: -f2`).Output()
		if err != nil {
			return "unknown"
		}
		return strings.TrimSpace(string(out))
	}
}

func getOutboundIP() string {
	// Try connecting to a public address to determine the outbound IP
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		// Fallback: enumerate interfaces
		ifaces, err := net.Interfaces()
		if err != nil {
			return "unknown"
		}
		for _, iface := range ifaces {
			if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
				continue
			}
			addrs, _ := iface.Addrs()
			for _, addr := range addrs {
				var ip net.IP
				switch v := addr.(type) {
				case *net.IPNet:
					ip = v.IP
				case *net.IPAddr:
					ip = v.IP
				}
				if ip != nil && !ip.IsLoopback() && ip.To4() != nil {
					return ip.String()
				}
			}
		}
		return "unknown"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return fmt.Sprintf("%s", localAddr.IP)
}
