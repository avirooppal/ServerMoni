package system

import (
	"encoding/json"
	"os/exec"
	"strings"
	"time"
)

// DockerContainer represents a running or stopped Docker container
type DockerContainer struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Image   string `json:"image"`
	Status  string `json:"status"`
	State   string `json:"state"`
	Created string `json:"created"`
	Ports   string `json:"ports"`
}

// dockerPsEntry is used to decode `docker ps --format json`
type dockerPsEntry struct {
	ID      string `json:"ID"`
	Names   string `json:"Names"`
	Image   string `json:"Image"`
	Status  string `json:"Status"`
	State   string `json:"State"`
	Created string `json:"Created"`
	Ports   string `json:"Ports"`
}

// GetDockerContainers returns a list of all Docker containers (running + stopped).
// Returns an empty slice gracefully if Docker is not installed or daemon is not running.
func GetDockerContainers() ([]DockerContainer, error) {
	cmd := exec.Command("docker", "ps", "-a", "--format", "{{json .}}")
	cmd.Env = append(cmd.Environ())

	// Give docker a tight timeout so we don't block the API call
	type result struct {
		out []byte
		err error
	}
	ch := make(chan result, 1)
	go func() {
		out, err := cmd.Output()
		ch <- result{out, err}
	}()

	var out []byte
	select {
	case r := <-ch:
		if r.err != nil {
			// Docker not available — return empty, not an error
			return []DockerContainer{}, nil
		}
		out = r.out
	case <-time.After(3 * time.Second):
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return []DockerContainer{}, nil
	}

	var containers []DockerContainer
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		var entry dockerPsEntry
		if err := json.Unmarshal([]byte(line), &entry); err != nil {
			continue
		}
		containers = append(containers, DockerContainer{
			ID:      entry.ID,
			Name:    strings.TrimPrefix(entry.Names, "/"),
			Image:   entry.Image,
			Status:  entry.Status,
			State:   entry.State,
			Created: entry.Created,
			Ports:   entry.Ports,
		})
	}

	return containers, nil
}
