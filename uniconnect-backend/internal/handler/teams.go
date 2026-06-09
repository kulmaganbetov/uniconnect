package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/middleware"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

// ─── TeamHandler ──────────────────────────────────────────────────────────────

type TeamHandler struct {
	svc *service.TeamService
}

func NewTeamHandler(svc *service.TeamService) *TeamHandler {
	return &TeamHandler{svc: svc}
}

// GetAll returns every team sorted by XP.
func (h *TeamHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	teams, err := h.svc.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch teams"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: teams})
}

// GetLeaderboard returns the top 20 teams by XP.
func (h *TeamHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	teams, err := h.svc.GetLeaderboard(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch leaderboard"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: teams})
}

// GetByID returns full detail for a single team.
func (h *TeamHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid team id"})
		return
	}

	detail, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "team not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch team"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: detail})
}

// MyTeam returns the team the current user belongs to.
func (h *TeamHandler) MyTeam(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	ts, err := h.svc.MyTeam(r.Context(), userID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "not a member of any team"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch team"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: ts})
}

// Create creates a new team and assigns the caller as leader.
func (h *TeamHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req model.CreateTeamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "team name is required"})
		return
	}

	detail, err := h.svc.Create(r.Context(), userID, req)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "user not found"})
			return
		}
		if errors.Is(err, service.ErrInternal) {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to create team"})
			return
		}
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: detail})
}

// Join adds the caller to the specified team.
func (h *TeamHandler) Join(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	teamIDStr := chi.URLParam(r, "id")
	teamID, err := uuid.Parse(teamIDStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid team id"})
		return
	}

	detail, err := h.svc.Join(r.Context(), userID, teamID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "team not found"})
			return
		}
		if errors.Is(err, service.ErrInternal) {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to join team"})
			return
		}
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: detail})
}

// Leave removes the caller from the specified team.
func (h *TeamHandler) Leave(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	teamIDStr := chi.URLParam(r, "id")
	teamID, err := uuid.Parse(teamIDStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid team id"})
		return
	}

	if err := h.svc.Leave(r.Context(), userID, teamID); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "team membership not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to leave team"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "left team"}})
}

// ─── TaskHandler ──────────────────────────────────────────────────────────────

type TaskHandler struct {
	svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

// GetAll returns every task (admin).
func (h *TaskHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.svc.GetAll(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch tasks"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: tasks})
}

// Create creates a new task (admin).
func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	adminID := middleware.GetUserID(r.Context())

	var req model.TaskUpsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if req.Title == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "task title is required"})
		return
	}

	t, err := h.svc.Create(r.Context(), adminID, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to create task"})
		return
	}
	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: t})
}

// Update updates an existing task (admin).
func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid task id"})
		return
	}

	var req model.TaskUpsertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	t, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "task not found"})
			return
		}
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to update task"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: t})
}

// Delete removes a task (admin).
func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid task id"})
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to delete task"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "deleted"}})
}

// Assign assigns a task to a team (admin). Body: {team_id}.
func (h *TaskHandler) Assign(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid task id"})
		return
	}

	var req model.AssignTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if req.TeamID == (uuid.UUID{}) {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "team_id is required"})
		return
	}

	tt, err := h.svc.AssignToTeam(r.Context(), taskID, req.TeamID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to assign task"})
		return
	}
	writeJSON(w, http.StatusCreated, model.APIResponse{Success: true, Data: tt})
}

// SubmitTeamTask allows an authenticated team member to submit a task for review.
func (h *TaskHandler) SubmitTeamTask(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid team-task id"})
		return
	}

	var req model.SubmitTeamTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}
	if req.SubmissionText == "" {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "submission_text is required"})
		return
	}

	if err := h.svc.SubmitTeamTask(r.Context(), userID, id, req.SubmissionText); err != nil {
		if errors.Is(err, service.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "team task not found"})
			return
		}
		if errors.Is(err, service.ErrInternal) {
			writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to submit task"})
			return
		}
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "submitted"}})
}

// ReviewTeamTask lets an admin approve ("completed") or reject ("assigned") a submitted task.
func (h *TaskHandler) ReviewTeamTask(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid team-task id"})
		return
	}

	var req model.ReviewTeamTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	switch req.Status {
	case "completed":
		if err := h.svc.CompleteTeamTask(r.Context(), id); err != nil {
			if errors.Is(err, service.ErrNotFound) {
				writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "team task not found"})
				return
			}
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "completed"}})
	case "assigned":
		if err := h.svc.RejectTeamTask(r.Context(), id); err != nil {
			if errors.Is(err, service.ErrNotFound) {
				writeJSON(w, http.StatusNotFound, model.APIResponse{Success: false, Error: "team task not found"})
				return
			}
			writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: map[string]string{"status": "assigned"}})
	default:
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "status must be 'completed' (approve) or 'assigned' (reject)"})
	}
}

// GetAllTeamTasks returns every team-task assignment (admin).
func (h *TaskHandler) GetAllTeamTasks(w http.ResponseWriter, r *http.Request) {
	details, err := h.svc.GetAllTeamTasks(r.Context())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, model.APIResponse{Success: false, Error: "failed to fetch team tasks"})
		return
	}
	writeJSON(w, http.StatusOK, model.APIResponse{Success: true, Data: details})
}
