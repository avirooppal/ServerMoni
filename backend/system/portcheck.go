package system

import (
	"net"
	"time"
)

// PortStatus represents the check result for a single port
type PortStatus struct {
	Port    int    `json:"port"`
	Service string `json:"service"`
	Open    bool   `json:"open"`
}

// wellKnownPorts is the default list of ports to check
var wellKnownPorts = []PortStatus{
	{Port: 22, Service: "SSH"},
	{Port: 80, Service: "HTTP"},
	{Port: 443, Service: "HTTPS"},
	{Port: 3000, Service: "Node.js / Dev"},
	{Port: 3306, Service: "MySQL"},
	{Port: 5432, Service: "PostgreSQL"},
	{Port: 6379, Service: "Redis"},
	{Port: 8080, Service: "HTTP Alt"},
	{Port: 27017, Service: "MongoDB"},
}

// CheckPorts probes each well-known port on localhost with a short timeout.
// Works on both Linux and Windows.
func CheckPorts() ([]PortStatus, error) {
	results := make([]PortStatus, 0, len(wellKnownPorts))
	for _, p := range wellKnownPorts {
		status := PortStatus{
			Port:    p.Port,
			Service: p.Service,
			Open:    isPortOpen("127.0.0.1", p.Port),
		}
		results = append(results, status)
	}
	return results, nil
}

func isPortOpen(host string, port int) bool {
	addr := net.JoinHostPort(host, itoa(port))
	conn, err := net.DialTimeout("tcp", addr, 400*time.Millisecond)
	if err != nil {
		return false
	}
	conn.Close()
	return true
}

// itoa converts an int to a string without importing strconv (to keep the file small)
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	buf := [10]byte{}
	pos := 10
	for n > 0 {
		pos--
		buf[pos] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[pos:])
}
