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

const anthropicAPIURL = "https://api.anthropic.com/v1/messages"
const anthropicVersion = "2023-06-01"

// systemPrompt is sent on every conversation. It is marked
// cache_control: ephemeral so the Anthropic API can reuse the cached
// prefix across requests, dramatically reducing latency and cost.
const systemPrompt = `You are the UniConnect AI Consultant — a friendly, knowledgeable assistant helping international students who are studying or planning to study in Kazakhstan.

Your areas of expertise:
- Visas, residency permits and registration with the migration police
- Choosing universities (Narxoz, KIMEP, Nazarbayev, KBTU, AUES and others)
- Finding dormitories and renting apartments in Almaty, Astana, Shymkent
- Healthcare access for foreign students (clinics, free services, insurance)
- Banking, mobile SIM cards, public transport (Onay card, metro, bus)
- Language: Kazakh and Russian basics, where to take classes
- Part-time work rules and student-friendly jobs
- Cultural adaptation, food, holidays, etiquette
- Safety, emergency numbers (112), what to do in a crisis
- Mental health and the UniConnect psychological support service

Style guide:
- Be warm, concise and practical. Default to 2–4 short paragraphs unless the user explicitly asks for detail.
- When you list steps, use numbered lists.
- If a student is in distress, gently mention the UniConnect Psychological Support page and the emergency number 112.
- If you do not know something, say so honestly and suggest where they can find an authoritative answer (university international office, migration police, embassy).
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

// anthropicRequest mirrors the JSON shape expected by the Messages API.
type anthropicRequest struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	System    []anthropicSysPart `json:"system"`
	Messages  []anthropicMessage `json:"messages"`
}

type anthropicSysPart struct {
	Type         string                  `json:"type"`
	Text         string                  `json:"text"`
	CacheControl *anthropicCacheControl  `json:"cache_control,omitempty"`
}

type anthropicCacheControl struct {
	Type string `json:"type"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Type    string `json:"type"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Chat sends the conversation to Anthropic and returns the assistant
// reply. The system prompt is wrapped with cache_control so the
// 700+ token instruction block is cached on the Anthropic side.
func (s *AIService) Chat(ctx context.Context, history []model.ChatMessage) (string, error) {
	if !s.IsConfigured() {
		return "", errors.New("AI consultant is not configured on the server")
	}
	if len(history) == 0 {
		return "", errors.New("at least one message is required")
	}

	msgs := make([]anthropicMessage, 0, len(history))
	for _, m := range history {
		role := strings.ToLower(strings.TrimSpace(m.Role))
		if role != "user" && role != "assistant" {
			continue
		}
		content := strings.TrimSpace(m.Content)
		if content == "" {
			continue
		}
		msgs = append(msgs, anthropicMessage{Role: role, Content: content})
	}
	if len(msgs) == 0 || msgs[len(msgs)-1].Role != "user" {
		return "", errors.New("conversation must end with a user message")
	}

	payload := anthropicRequest{
		Model:     s.model,
		MaxTokens: 1024,
		System: []anthropicSysPart{
			{
				Type:         "text",
				Text:         systemPrompt,
				CacheControl: &anthropicCacheControl{Type: "ephemeral"},
			},
		},
		Messages: msgs,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", ErrInternal
	}

	reqCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, anthropicAPIURL, bytes.NewReader(body))
	if err != nil {
		return "", ErrInternal
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("anthropic-version", anthropicVersion)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("AI request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", ErrInternal
	}

	var parsed anthropicResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("AI returned malformed response")
	}

	if resp.StatusCode >= 400 {
		if parsed.Error != nil {
			return "", fmt.Errorf("AI error: %s", parsed.Error.Message)
		}
		return "", fmt.Errorf("AI error: HTTP %d", resp.StatusCode)
	}

	var reply strings.Builder
	for _, c := range parsed.Content {
		if c.Type == "text" {
			reply.WriteString(c.Text)
		}
	}
	out := strings.TrimSpace(reply.String())
	if out == "" {
		return "", errors.New("AI returned an empty response")
	}
	return out, nil
}
