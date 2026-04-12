package handler

import (
	"encoding/json"
	"net/http"

	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/service"
)

type AIHandler struct {
	svc *service.AIService
}

func NewAIHandler(svc *service.AIService) *AIHandler {
	return &AIHandler{svc: svc}
}

// Chat sends a conversation history to the OpenAI API and returns the
// assistant reply. Auth is required.
func (h *AIHandler) Chat(w http.ResponseWriter, r *http.Request) {
	if !h.svc.IsConfigured() {
		writeJSON(w, http.StatusServiceUnavailable, model.APIResponse{
			Success: false,
			Error:   "AI consultant is not configured. Set OPENAI_API_KEY on the server.",
		})
		return
	}

	var req model.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "invalid request body"})
		return
	}

	if len(req.Messages) == 0 {
		writeJSON(w, http.StatusBadRequest, model.APIResponse{Success: false, Error: "messages are required"})
		return
	}

	reply, err := h.svc.Chat(r.Context(), req.Messages)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, model.APIResponse{Success: false, Error: err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, model.APIResponse{
		Success: true,
		Data:    model.ChatResponse{Reply: reply},
	})
}
