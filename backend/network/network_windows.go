//go:build windows

package network

import (
	"bytes"
	"os/exec"
	"strconv"
	"strings"
)

// NetworkStats represents network interface statistics
type NetworkStats struct {
	Name        string
	RxBytes     uint64
	RxPackets   uint64
	RxErrors    uint64
	RxDropped   uint64
	TxBytes     uint64
	TxPackets   uint64
	TxErrors    uint64
	TxDropped   uint64
}

// GetNetwork returns real network statistics using WMIC
func GetNetwork() ([]NetworkStats, error) {
	cmd := exec.Command("wmic", "path", "Win32_PerfRawData_Tcpip_NetworkInterface", "get", "Name,BytesReceivedPersec,BytesSentPersec,PacketsReceivedErrors,PacketsReceivedDiscarded,PacketsOutboundErrors,PacketsOutboundDiscarded", "/format:csv")
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	return parseWmicNetworkOutput(output)
}

func parseWmicNetworkOutput(output []byte) ([]NetworkStats, error) {
	var stats []NetworkStats
	lines := strings.Split(string(bytes.ReplaceAll(output, []byte("\r\n"), []byte("\n"))), "\n")

	var rxIdx, txIdx, nameIdx = -1, -1, -1

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		parts := strings.Split(line, ",")

		if rxIdx == -1 {
			for i, p := range parts {
				switch p {
				case "BytesReceivedPersec":
					rxIdx = i
				case "BytesSentPersec":
					txIdx = i
				case "Name":
					nameIdx = i
				}
			}
			continue
		}

		if len(parts) <= rxIdx || len(parts) <= txIdx || len(parts) <= nameIdx {
			continue
		}

		name := parts[nameIdx]
		if name == "" {
			continue
		}

		rx, _ := strconv.ParseUint(parts[rxIdx], 10, 64)
		tx, _ := strconv.ParseUint(parts[txIdx], 10, 64)

		var rxErr, rxDrop, txErr, txDrop uint64
		for i, p := range parts {
			switch p {
			case "PacketsReceivedErrors":
				if len(parts) > i { rxErr, _ = strconv.ParseUint(parts[i], 10, 64) }
			case "PacketsReceivedDiscarded":
				if len(parts) > i { rxDrop, _ = strconv.ParseUint(parts[i], 10, 64) }
			case "PacketsOutboundErrors":
				if len(parts) > i { txErr, _ = strconv.ParseUint(parts[i], 10, 64) }
			case "PacketsOutboundDiscarded":
				if len(parts) > i { txDrop, _ = strconv.ParseUint(parts[i], 10, 64) }
			}
		}

		stats = append(stats, NetworkStats{
			Name:      name,
			RxBytes:   rx,
			TxBytes:   tx,
			RxErrors:  rxErr,
			RxDropped: rxDrop,
			TxErrors:  txErr,
			TxDropped: txDrop,
		})
	}

	return stats, nil
}
