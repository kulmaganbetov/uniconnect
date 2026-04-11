package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

type PageContentHandler struct {
	svc *service.PageContentService
}

func NewPageContentHandler(svc *service.PageContentService) *PageContentHandler {
	return &PageContentHandler{svc: svc}
}

// GetAll lists every editable copy block. Public so the frontend can
// pull hero text without auth.
func (h *PageContentHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	out, err := h.svc.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch content"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: out})
}

func (h *PageContentHandler) Get(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	p, err := h.svc.Get(r.Context(), key)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "content not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch content"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: p})
}

// Upsert is admin-only.
func (h *PageContentHandler) Upsert(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "key")
	var req model.UpdatePageContentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}
	p, err := h.svc.Upsert(r.Context(), key, req)
	if err != nil {
		if errors.Is(err, service.ErrInternal) {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to save content"})
			return
		}
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: p})
}
