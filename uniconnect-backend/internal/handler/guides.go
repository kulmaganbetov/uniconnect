package handler

import (
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
