package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Process struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name" binding:"required"`
	Description string             `bson:"description" json:"description"`
	Category    string             `bson:"category" json:"category"`
	Tags        []string           `bson:"tags" json:"tags"`
	OwnerID     primitive.ObjectID `bson:"owner_id" json:"ownerId"`
	BpmnXML     string             `bson:"bpmn_xml" json:"bpmnXml"`
	Version     int                `bson:"version" json:"version"`
	Status      string             `bson:"status" json:"status"`
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
	PublishedAt *time.Time         `bson:"published_at,omitempty" json:"publishedAt,omitempty"`
}

type CreateProcessRequest struct {
	Name        string   `json:"name" binding:"required"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	BpmnXML     string   `json:"bpmnXml"`
}

type UpdateProcessRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	Category    *string  `json:"category"`
	Tags        []string `json:"tags"`
	BpmnXML     *string  `json:"bpmnXml"`
	Status      *string  `json:"status"`
}

type PaginatedResponse struct {
	Items      interface{} `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"pageSize"`
	TotalPages int         `json:"totalPages"`
}
