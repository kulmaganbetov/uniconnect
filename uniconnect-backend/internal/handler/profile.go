package handler

import (
	"encoding/json"
	"net/http"

	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/middleware"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/repository"
)

type ProfileHandler struct {
	db *repository.DB
}

func NewProfileHandler(db *repository.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	user, err := h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "user not found"})
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

	user, err := h.db.UpdateUser(r.Context(), userID, req.Name, req.Country, req.University)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to update profile"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: user})
}

type AdminHandler struct {
	db *repository.DB
}

func NewAdminHandler(db *repository.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

func (h *AdminHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.db.GetAllUsers(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch users"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: users})
}
