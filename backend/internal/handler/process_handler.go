package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/flowforge/backend/internal/domain"
	"github.com/flowforge/backend/internal/logger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProcessHandler struct {
	collection *mongo.Collection
}

func NewProcessHandler(db *mongo.Database) *ProcessHandler {
	return &ProcessHandler{
		collection: db.Collection("processes"),
	}
}

func (h *ProcessHandler) List(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	filter := bson.M{"status": bson.M{"$ne": "archived"}}
	if category := c.Query("category"); category != "" {
		filter["category"] = category
	}
	if search := c.Query("search"); search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": search, "$options": "i"}},
			{"description": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	logger.Debug().Int("page", page).Int("pageSize", pageSize).Msg("Listing processes")

	total, err := h.collection.CountDocuments(ctx, filter)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to count processes")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	skip := int64((page - 1) * pageSize)
	opts := options.Find().
		SetSkip(skip).
		SetLimit(int64(pageSize)).
		SetSort(bson.D{{Key: "updated_at", Value: -1}})

	cursor, err := h.collection.Find(ctx, filter, opts)
	if err != nil {
		logger.Error().Err(err).Msg("Failed to find processes")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer cursor.Close(ctx)

	var processes []domain.Process
	if err := cursor.All(ctx, &processes); err != nil {
		logger.Error().Err(err).Msg("Failed to decode processes")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info().Int64("total", total).Int("count", len(processes)).Msg("Listed processes")
	c.JSON(http.StatusOK, domain.PaginatedResponse{
		Items:      processes,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: int(total)/pageSize + 1,
	})
}

func (h *ProcessHandler) Get(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		logger.Debug().Str("id", c.Param("id")).Msg("Invalid process ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	logger.Debug().Str("id", id.Hex()).Msg("Getting process")

	var process domain.Process
	err = h.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&process)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			logger.Debug().Str("id", id.Hex()).Msg("Process not found")
			c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
			return
		}
		logger.Error().Err(err).Str("id", id.Hex()).Msg("Failed to get process")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info().Str("id", id.Hex()).Str("name", process.Name).Msg("Got process")
	c.JSON(http.StatusOK, process)
}

func (h *ProcessHandler) Create(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req domain.CreateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Debug().Err(err).Msg("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	process := domain.Process{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Tags:        req.Tags,
		BpmnXML:     req.BpmnXML,
		Version:     1,
		Status:      "draft",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	logger.Debug().Str("name", req.Name).Msg("Creating process")

	_, err := h.collection.InsertOne(ctx, process)
	if err != nil {
		logger.Error().Err(err).Str("name", req.Name).Msg("Failed to create process")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info().Str("id", process.ID.Hex()).Str("name", process.Name).Msg("Created process")
	c.JSON(http.StatusCreated, process)
}

func (h *ProcessHandler) Update(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		logger.Debug().Str("id", c.Param("id")).Msg("Invalid process ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req domain.UpdateProcessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Debug().Err(err).Msg("Invalid request body")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Debug().Str("id", id.Hex()).Msg("Updating process")

	update := bson.M{"$set": bson.M{"updated_at": time.Now()}}
	if req.Name != nil {
		update["$set"].(bson.M)["name"] = *req.Name
	}
	if req.Description != nil {
		update["$set"].(bson.M)["description"] = *req.Description
	}
	if req.Category != nil {
		update["$set"].(bson.M)["category"] = *req.Category
	}
	if req.Tags != nil {
		update["$set"].(bson.M)["tags"] = req.Tags
	}
	if req.BpmnXML != nil {
		update["$set"].(bson.M)["bpmn_xml"] = *req.BpmnXML
	}
	if req.Status != nil {
		update["$set"].(bson.M)["status"] = *req.Status
		if *req.Status == "published" {
			now := time.Now()
			update["$set"].(bson.M)["published_at"] = now
		}
	}

	result, err := h.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
	if err != nil {
		logger.Error().Err(err).Str("id", id.Hex()).Msg("Failed to update process")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.MatchedCount == 0 {
		logger.Debug().Str("id", id.Hex()).Msg("Process not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
		return
	}

	var process domain.Process
	h.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&process)
	logger.Info().Str("id", id.Hex()).Str("name", process.Name).Msg("Updated process")
	c.JSON(http.StatusOK, process)
}

func (h *ProcessHandler) Delete(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		logger.Debug().Str("id", c.Param("id")).Msg("Invalid process ID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	logger.Debug().Str("id", id.Hex()).Msg("Deleting process")

	result, err := h.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		logger.Error().Err(err).Str("id", id.Hex()).Msg("Failed to delete process")
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if result.DeletedCount == 0 {
		logger.Debug().Str("id", id.Hex()).Msg("Process not found")
		c.JSON(http.StatusNotFound, gin.H{"error": "Process not found"})
		return
	}

	logger.Info().Str("id", id.Hex()).Msg("Deleted process")
	c.JSON(http.StatusOK, gin.H{"message": "Process deleted"})
}

func (h *ProcessHandler) RegisterRoutes(r *gin.RouterGroup) {
	processes := r.Group("/processes")
	{
		processes.GET("", h.List)
		processes.POST("", h.Create)
		processes.GET("/:id", h.Get)
		processes.PUT("/:id", h.Update)
		processes.DELETE("/:id", h.Delete)
	}
}
