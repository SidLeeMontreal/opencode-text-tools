import type { ClaimsResult, KeyPointsResult, ToneAssessmentResult, VoiceMatchResult } from "./types.js"

function todoMeta() {
  return { model: "TODO", todo: true as const }
}

// TODO: implement with OpenCode SDK session
export async function extractClaims(_text: string, _client: unknown): Promise<ClaimsResult> {
  return { claims: [], meta: todoMeta() }
}

// TODO: implement with OpenCode SDK session
export async function extractKeyPoints(_text: string, _client: unknown): Promise<KeyPointsResult> {
  return { key_points: [], meta: todoMeta() }
}

// TODO: implement with OpenCode SDK session
export async function assessTone(_text: string, _client: unknown): Promise<ToneAssessmentResult> {
  return { primary_tone: "unknown", secondary_tones: [], confidence: 0, signals: ["TODO: implement with OpenCode SDK session"], meta: todoMeta() }
}

// TODO: implement with OpenCode SDK session
export async function assessVoiceMatch(_text: string, _voiceProfile: string, _client: unknown): Promise<VoiceMatchResult> {
  return { score: 0, verdict: "todo", strengths: [], mismatches: [], recommendations: ["TODO: implement with OpenCode SDK session"], meta: todoMeta() }
}
