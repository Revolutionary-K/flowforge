package logger

import (
	"testing"

	"github.com/rs/zerolog"
)

func TestInit(t *testing.T) {
	tests := []struct {
		name  string
		level string
		want  zerolog.Level
	}{
		{"debug level", "debug", zerolog.DebugLevel},
		{"info level", "info", zerolog.InfoLevel},
		{"warn level", "warn", zerolog.WarnLevel},
		{"error level", "error", zerolog.ErrorLevel},
		{"fatal level", "fatal", zerolog.FatalLevel},
		{"panic level", "panic", zerolog.PanicLevel},
		{"default level", "unknown", zerolog.InfoLevel},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			Init(tt.level)
			if zerolog.GlobalLevel() != tt.want {
				t.Errorf("Init(%s) = %v, want %v", tt.level, zerolog.GlobalLevel(), tt.want)
			}
		})
	}
}

func TestGetLogger(t *testing.T) {
	logger := GetLogger()
	if logger.GetLevel() == zerolog.NoLevel {
		t.Error("GetLogger() returned logger with NoLevel")
	}
}

func TestDebug(t *testing.T) {
	Debug()
}

func TestInfo(t *testing.T) {
	Info()
}

func TestWarn(t *testing.T) {
	Warn()
}

func TestError(t *testing.T) {
	Error()
}

func TestWith(t *testing.T) {
	ctx := With()
	if ctx.Logger().GetLevel() == zerolog.NoLevel {
		t.Error("With() returned context with NoLevel")
	}
}
