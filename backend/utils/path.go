package utils

import (
	"os"
	"path/filepath"
)

// GetProcPath returns the /proc path, optionally overridden by HOST_PROC environment variable
func GetProcPath() string {
	if p := os.Getenv("HOST_PROC"); p != "" {
		return p
	}
	return "/proc"
}

// GetHostPath returns the path prepended with HOST_ROOT if set.
// Useful for checking host mounts like "/", "/var", etc., inside a container.
func GetHostPath(path string) string {
	if root := os.Getenv("HOST_ROOT"); root != "" {
		return filepath.Join(root, path)
	}
	return path
}
