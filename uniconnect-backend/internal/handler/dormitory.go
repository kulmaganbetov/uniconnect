package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/middleware"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

type DormitoryHandler struct {
	svc *service.DormitoryService
}

func NewDormitoryHandler(svc *service.DormitoryService) *DormitoryHandler {
	return &DormitoryHandler{svc: svc}
}

func (h *DormitoryHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	dorms, err := h.svc.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch dormitories"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: dorms})
}

func (h *DormitoryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid dormitory id"})
		return
	}

	dorm, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "dormitory not found"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: dorm})
}

func (h *DormitoryHandler) Apply(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.DormitoryApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	app, err := h.svc.Apply(r.Context(), userID, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to submit application"})
		return
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: app})
}

func (h *DormitoryHandler) MyApplications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	apps, err := h.svc.GetMyApplications(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch applications"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: apps})
}

func (h *DormitoryHandler) GetAllApplications(w http.ResponseWriter, r *http.Request) {
	apps, err := h.svc.GetAllApplications(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch applications"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: apps})
}

func (h *DormitoryHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid application id"})
		return
	}

	var req model.UpdateApplicationStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if req.Status != "approved" && req.Status != "rejected" && req.Status != "pending" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "status must be 'pending', 'approved', or 'rejected'"})
		return
	}

	app, err := h.svc.UpdateApplicationStatus(r.Context(), id, req.Status)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "application not found"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: app})
}
