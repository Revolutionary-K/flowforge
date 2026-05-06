package main

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/flowforge/backend/internal/config"
	"github.com/flowforge/backend/internal/handler"
	"github.com/flowforge/backend/internal/logger"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	cfg := config.Load()
	logger.Init(cfg.Log.Level)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	logger.Info().Str("uri", cfg.Database.URI).Msg("Connecting to MongoDB")
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(cfg.Database.URI))
	if err != nil {
		logger.Fatal().Err(err).Msg("Failed to connect to MongoDB")
	}
	defer client.Disconnect(ctx)

	if err := client.Ping(ctx, nil); err != nil {
		logger.Fatal().Err(err).Msg("Failed to ping MongoDB")
	}
	logger.Info().Msg("Connected to MongoDB")

	db := client.Database(cfg.Database.Database)

	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	{
		processHandler := handler.NewProcessHandler(db)
		processHandler.RegisterRoutes(api)
	}

	logger.Info().Str("port", cfg.Server.Port).Msg("Starting server")
	if err := r.Run(":" + cfg.Server.Port); err != nil {
		logger.Fatal().Err(err).Msg("Failed to start server")
	}
}
