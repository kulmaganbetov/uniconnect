package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
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

func (h *ProfileHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "file too large (max 5 MB)"})
		return
	}

	file, header, err := r.FormFile("avatar")
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "no file provided"})
		return
	}
	defer file.Close()

	// Detect content type from the first 512 bytes, then rewind.
	buf := make([]byte, 512)
	n, _ := file.Read(buf)
	contentType := http.DetectContentType(buf[:n])
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to process file"})
		return
	}

	switch contentType {
	case "image/jpeg", "image/png", "image/gif", "image/webp":
	default:
		// Also accept by file extension as a fallback for WebP (DetectContentType may return application/octet-stream)
		ext := ""
		if len(header.Filename) > 4 {
			ext = header.Filename[len(header.Filename)-5:]
		}
		if ext != ".webp" {
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "unsupported file type; allowed: JPEG, PNG, GIF, WebP"})
			return
		}
		contentType = "image/webp"
	}

	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if proto := r.Header.Get("X-Forwarded-Proto"); proto != "" {
		scheme = proto
	}
	host := r.Host
	if fwdHost := r.Header.Get("X-Forwarded-Host"); fwdHost != "" {
		host = fwdHost
	}
	baseURL := scheme + "://" + host

	user, err := h.svc.UploadAvatar(r.Context(), userID, file, contentType, baseURL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to save avatar"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"avatar_url": user.AvatarURL}})
}

func (h *ProfileHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if err := h.svc.ChangePassword(r.Context(), userID, req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "password changed"}})
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

// CreateUser provisions a new account from the admin panel.
func (h *AdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req model.AdminCreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	user, err := h.svc.CreateUser(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInternal) {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to create user"})
			return
		}
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: user})
}

func (h *AdminHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid user id"})
		return
	}

	var req model.UpdateUserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	user, err := h.svc.UpdateUserRole(r.Context(), id, req.Role)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "user not found"})
			return
		}
		if errors.Is(err, service.ErrInternal) {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to update role"})
			return
		}
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: user})
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid user id"})
		return
	}

	if err := h.svc.DeleteUser(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to delete user"})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "deleted"}})
}

func (h *AdminHandler) ListRoles(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: model.AllRoles})
}
