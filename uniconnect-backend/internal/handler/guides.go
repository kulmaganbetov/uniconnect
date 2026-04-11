package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

type GuideHandler struct {
	svc *service.GuideService
}

func NewGuideHandler(svc *service.GuideService) *GuideHandler {
	return &GuideHandler{svc: svc}
}

func (h *GuideHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	category := r.URL.Query().Get("category")

	guides, err := h.svc.GetAll(r.Context(), category)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch guides"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: guides})
}

func (h *GuideHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid guide id"})
		return
	}

	guide, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "guide not found"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: guide})
}

// Admin / teacher operations

func (h *GuideHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.GuideUpsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}
	g, err := h.svc.Create(r.Context(), req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to create guide"})
		return
	}
	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: g})
}

func (h *GuideHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid guide id"})
		return
	}
	var req model.GuideUpsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}
	g, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to update guide"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: g})
}

func (h *GuideHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid guide id"})
		return
	}
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to delete guide"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "deleted"}})
}
