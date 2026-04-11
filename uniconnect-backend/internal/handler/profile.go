package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/middleware"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

type ProfileHandler struct {
	svc *service.ProfileService
}

func NewProfileHandler(svc *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{svc: svc}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	user, err := h.svc.GetProfile(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "user not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "internal server error"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: user})
}

func (h *ProfileHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if err := validateUpdateProfileRequest(req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}

	user, err := h.svc.UpdateProfile(r.Context(), userID, req)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "user not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to update profile"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: user})
}

type AdminHandler struct {
	svc *service.AdminService
}

func NewAdminHandler(svc *service.AdminService) *AdminHandler {
	return &AdminHandler{svc: svc}
}

func (h *AdminHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.GetAllUsers(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch users"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: users})
}
