package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/kulmaganbetov/uniconnect/uniconnect-backend/internal/model"
)

const openaiAPIURL = "https://api.openai.com/v1/chat/completions"

// systemPrompt is sent on every conversation as the system message.
const systemPrompt = `You are the UniConnect AI Consultant — a friendly, knowledgeable assistant helping international students who are studying or planning to study at Narxoz University in Almaty, Kazakhstan.

Your areas of expertise:
- Visas, residency permits and registration with the migration police
- Narxoz University: programmes, campus, student life, academic calendar
- Finding dormitories and renting apartments near Narxoz campus in Almaty
- Healthcare access for foreign students (clinics, free services, insurance)
- Banking, mobile SIM cards, public transport (Onay card, metro, bus)
- Language: Kazakh and Russian basics, where to take classes
- Part-time work rules and student-friendly jobs near Narxoz
- Cultural adaptation, food, holidays, etiquette
- Safety, emergency numbers (112), what to do in a crisis
- Mental health and the UniConnect psychological support service

Style guide:
- Be warm, concise and practical. Default to 2–4 short paragraphs unless the user explicitly asks for detail.
- When you list steps, use numbered lists.
- If a student is in distress, gently mention the UniConnect Psychological Support page and the emergency number 112.
- If you do not know something, say so honestly and suggest where they can find an authoritative answer (Narxoz International Office, migration police, embassy).
- Always reply in the same language the user wrote in. Default to English.
- Do not invent prices, phone numbers, addresses or visa rules. If unsure, say "please verify with…".`

type AIService struct {
	apiKey string
	model  string
	client *http.Client
}

func NewAIService(apiKey, model string) *AIService {
	return &AIService{
		apiKey: apiKey,
		model:  model,
		client: &http.Client{Timeout: 60 * time.Second},
	}
}

// IsConfigured reports whether the service has an API key. Handlers
// should fail fast with a friendly message when this returns false.
func (s *AIService) IsConfigured() bool {
	return strings.TrimSpace(s.apiKey) != ""
}

// openaiRequest mirrors the JSON shape expected by OpenAI Chat Completions API.
type openaiRequest struct {
	Model    string          `json:"model"`
	Messages []openaiMessage `json:"messages"`
}

type openaiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openaiResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error,omitempty"`
}

// Chat sends the conversation to OpenAI and returns the assistant reply.
func (s *AIService) Chat(ctx context.Context, history []model.ChatMessage) (string, error) {
	if !s.IsConfigured() {
		return "", errors.New("AI consultant is not configured on the server")
	}
	if len(history) == 0 {
		return "", errors.New("at least one message is required")
	}

	// Build messages array: system prompt + conversation history
	msgs := make([]openaiMessage, 0, len(history)+1)
	msgs = append(msgs, openaiMessage{Role: "system", Content: systemPrompt})

	for _, m := range history {
		role := strings.ToLower(strings.TrimSpace(m.Role))
		if role != "user" && role != "assistant" {
			continue
		}
		content := strings.TrimSpace(m.Content)
		if content == "" {
			continue
		}
		msgs = append(msgs, openaiMessage{Role: role, Content: content})
	}
	if len(msgs) < 2 || msgs[len(msgs)-1].Role != "user" {
		return "", errors.New("conversation must end with a user message")
	}

	payload := openaiRequest{
		Model:    s.model,
		Messages: msgs,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", ErrInternal
	}

	reqCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, openaiAPIURL, bytes.NewReader(body))
	if err != nil {
		return "", ErrInternal
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("AI request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", ErrInternal
	}

	var parsed openaiResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("AI returned malformed response")
	}

	if resp.StatusCode >= 400 {
		if parsed.Error != nil {
			return "", fmt.Errorf("AI error: %s", parsed.Error.Message)
		}
		return "", fmt.Errorf("AI error: HTTP %d", resp.StatusCode)
	}

	if len(parsed.Choices) == 0 {
		return "", errors.New("AI returned an empty response")
	}

	out := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if out == "" {
		return "", errors.New("AI returned an empty response")
	}
	return out, nil
}
