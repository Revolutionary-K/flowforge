package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/flowforge/backend/internal/domain"
)

func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	return r
}

func TestProcessHandler_List_InvalidPagination(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.GET("/processes", func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			}
		}()
		h.List(c)
	})

	req, _ := http.NewRequest("GET", "/processes?page=0&pageSize=200", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}
}

func TestProcessHandler_Get_InvalidID(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.GET("/processes/:id", h.Get)

	req, _ := http.NewRequest("GET", "/processes/invalid-id", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}

	var response map[string]string
	json.Unmarshal(w.Body.Bytes(), &response)
	if response["error"] != "Invalid ID" {
		t.Errorf("Expected error 'Invalid ID', got %s", response["error"])
	}
}

func TestProcessHandler_Create_InvalidBody(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.POST("/processes", h.Create)

	req, _ := http.NewRequest("POST", "/processes", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestProcessHandler_Create_ValidBody(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.POST("/processes", func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			}
		}()
		h.Create(c)
	})

	body := domain.CreateProcessRequest{
		Name:        "Test Process",
		Description: "Test Description",
		Category:    "test",
		Tags:        []string{"tag1", "tag2"},
		BpmnXML:     "<bpmn>test</bpmn>",
	}

	jsonBody, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "/processes", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Errorf("Expected status 500, got %d", w.Code)
	}
}

func TestProcessHandler_Update_InvalidID(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.PUT("/processes/:id", h.Update)

	req, _ := http.NewRequest("PUT", "/processes/invalid-id", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestProcessHandler_Update_InvalidBody(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.PUT("/processes/:id", h.Update)

	req, _ := http.NewRequest("PUT", "/processes/507f1f77bcf86cd799439011", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestProcessHandler_Delete_InvalidID(t *testing.T) {
	r := setupRouter()

	h := &ProcessHandler{collection: nil}
	r.DELETE("/processes/:id", h.Delete)

	req, _ := http.NewRequest("DELETE", "/processes/invalid-id", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", w.Code)
	}
}

func TestProcessHandler_RegisterRoutes(t *testing.T) {
	r := gin.New()
	api := r.Group("/api/v1")

	h := &ProcessHandler{}
	h.RegisterRoutes(api)

	routes := r.Routes()
	expectedRoutes := []string{
		"GET /api/v1/processes",
		"POST /api/v1/processes",
		"GET /api/v1/processes/:id",
		"PUT /api/v1/processes/:id",
		"DELETE /api/v1/processes/:id",
	}

	for _, expected := range expectedRoutes {
		found := false
		for _, route := range routes {
			if route.Method+" "+route.Path == expected {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected route %s not found", expected)
		}
	}
}
