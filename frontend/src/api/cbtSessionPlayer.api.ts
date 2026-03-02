import { http } from '../lib/http';
import type { SessionPlayerQuestion, SessionAnswerValue } from '../types/sessionPlayer';

type ApiEnvelope<T> = { success: boolean; data: T; message?: string; error?: string };

type CbtQuestionRaw = {
  id: string;
  type: string;
  prompt: string;
  description?: string | null;
  orderIndex: number;
  isRequired?: boolean;
  helpText?: string | null;
  metadata?: Record<string, any>;
  branchingRules?: Array<{
    id: string;
    toQuestionId: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN_ARRAY';
    conditionValue: string;
  }>;
};

const mapQuestionType = (rawType: string): SessionPlayerQuestion['type'] => {
  switch (String(rawType || '').toUpperCase()) {
    case 'MULTIPLE_CHOICE':
      return 'multiple_choice';
    case 'TEXT':
      return 'text';
    case 'SLIDER':
      return 'slider';
    case 'CHECKBOX':
      return 'checkbox';
    default:
      return 'text';
  }
};

const parseQuestionMetadata = (metadata: Record<string, any> | undefined) => {
  if (!metadata) return { options: undefined, slider: undefined };
  const options = Array.isArray(metadata.options)
    ? metadata.options.map((opt: any, idx: number) => ({
        id: String(opt.id ?? idx + 1),
        label: String(opt.label ?? opt.value ?? `Option ${idx + 1}`),
        value: String(opt.value ?? opt.id ?? idx + 1),
      }))
    : undefined;

  const slider =
    typeof metadata.min === 'number' || typeof metadata.max === 'number'
      ? {
          min: Number(metadata.min ?? 0),
          max: Number(metadata.max ?? 10),
          step: Number(metadata.step ?? 1),
        }
      : undefined;

  return { options, slider };
};

export const mapQuestion = (question: CbtQuestionRaw): SessionPlayerQuestion => {
  const { options, slider } = parseQuestionMetadata(question.metadata);
  return {
    id: String(question.id),
    type: mapQuestionType(question.type),
    prompt: question.prompt,
    description: question.description ?? null,
    orderIndex: Number(question.orderIndex ?? 0),
    required: Boolean(question.isRequired ?? true),
    helpText: question.helpText ?? null,
    metadata: question.metadata ?? null,
    options,
    slider,
    branchingRules: Array.isArray(question.branchingRules)
      ? question.branchingRules.map((rule) => ({
          id: String(rule.id),
          toQuestionId: String(rule.toQuestionId),
          operator: rule.operator,
          conditionValue: String(rule.conditionValue),
        }))
      : [],
  };
};

export const cbtSessionPlayerApi = {
  getSessionSummary: async (sessionId: string) => {
    const response = await http.get<ApiEnvelope<any>>(`/cbt-sessions/${encodeURIComponent(sessionId)}/summary`);
    return response.data.data;
  },

  getTemplate: async (templateId: string): Promise<{ id: string; questions: SessionPlayerQuestion[] }> => {
    const response = await http.get<ApiEnvelope<any>>(`/cbt-sessions/templates/${encodeURIComponent(templateId)}`);
    const template = response.data.data;
    const questions = Array.isArray(template?.questions) ? template.questions.map(mapQuestion) : [];
    return { id: String(template?.id ?? templateId), questions };
  },

  getCurrentQuestion: async (sessionId: string): Promise<SessionPlayerQuestion | null> => {
    const response = await http.get<ApiEnvelope<CbtQuestionRaw | null>>(`/cbt-sessions/${encodeURIComponent(sessionId)}/current-question`);
    const payload = response.data.data;
    return payload ? mapQuestion(payload) : null;
  },

  respond: async (
    sessionId: string,
    questionId: string,
    value: SessionAnswerValue,
    timeSpentSeconds?: number,
    idempotencyKey?: string,
  ) => {
    const response = await http.post<ApiEnvelope<{ nextQuestionId: string | null; sessionComplete: boolean }>>(
      `/cbt-sessions/${encodeURIComponent(sessionId)}/respond`,
      {
        questionId,
        responseData: value,
        timeSpentSeconds,
        idempotencyKey,
      },
    );

    return response.data.data;
  },

  updateSessionStatus: async (sessionId: string, status: 'PAUSED' | 'ABANDONED') => {
    const response = await http.put<ApiEnvelope<any>>(`/cbt-sessions/${encodeURIComponent(sessionId)}/status`, { status });
    return response.data.data;
  },
};
