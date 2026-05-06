package config

import (
	"os"
	"testing"
	"time"
)

func TestLoad_DefaultValues(t *testing.T) {
	cfg := Load()

	if cfg.Server.Port != "8080" {
		t.Errorf("Expected default port 8080, got %s", cfg.Server.Port)
	}

	if cfg.Database.URI != "mongodb://localhost:27017" {
		t.Errorf("Expected default MongoDB URI, got %s", cfg.Database.URI)
	}

	if cfg.Database.Database != "flowforge" {
		t.Errorf("Expected default database name 'flowforge', got %s", cfg.Database.Database)
	}

	if cfg.JWT.Secret != "your-secret-key" {
		t.Errorf("Expected default JWT secret, got %s", cfg.JWT.Secret)
	}

	if cfg.JWT.Expiration != 24*time.Hour {
		t.Errorf("Expected JWT expiration 24h, got %v", cfg.JWT.Expiration)
	}

	if cfg.Server.ReadTimeout != 10*time.Second {
		t.Errorf("Expected read timeout 10s, got %v", cfg.Server.ReadTimeout)
	}

	if cfg.Server.WriteTimeout != 10*time.Second {
		t.Errorf("Expected write timeout 10s, got %v", cfg.Server.WriteTimeout)
	}
}

func TestLoad_EnvironmentVariables(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("MONGODB_URI", "mongodb://custom:27017")
	os.Setenv("MONGODB_DATABASE", "testdb")
	os.Setenv("JWT_SECRET", "custom-secret")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("MONGODB_URI")
		os.Unsetenv("MONGODB_DATABASE")
		os.Unsetenv("JWT_SECRET")
	}()

	cfg := Load()

	if cfg.Server.Port != "9090" {
		t.Errorf("Expected port 9090, got %s", cfg.Server.Port)
	}

	if cfg.Database.URI != "mongodb://custom:27017" {
		t.Errorf("Expected custom MongoDB URI, got %s", cfg.Database.URI)
	}

	if cfg.Database.Database != "testdb" {
		t.Errorf("Expected custom database name 'testdb', got %s", cfg.Database.Database)
	}

	if cfg.JWT.Secret != "custom-secret" {
		t.Errorf("Expected custom JWT secret, got %s", cfg.JWT.Secret)
	}
}

func TestGetEnv_WithDefault(t *testing.T) {
	result := getEnv("NONEXISTENT_KEY", "default-value")
	if result != "default-value" {
		t.Errorf("Expected 'default-value', got %s", result)
	}
}

func TestGetEnv_WithValue(t *testing.T) {
	os.Setenv("TEST_KEY", "test-value")
	defer os.Unsetenv("TEST_KEY")

	result := getEnv("TEST_KEY", "default-value")
	if result != "test-value" {
		t.Errorf("Expected 'test-value', got %s", result)
	}
}
