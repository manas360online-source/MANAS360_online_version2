import create from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { Question, ResponseRecord } from '../types/question';
import {
  SessionState,
  Branching,
  recordAnswerAndAdvance,
  detectProblematicSCCs,
  Answers,
} from '../lib/branchingEngine';

type BuilderState = {
  questions: Question[];
  title: string;
  description: string;
  category: string;
  version: number;
  isDraft: boolean;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  backendId?: string;
  responses: Record<string, ResponseRecord | undefined>;
  branching?: Branching | undefined;
  session?: SessionState | undefined;
  templateWarnings: string[];
  addQuestion: () => void;
  reorderQuestions: (from: number, to: number) => void;
  updateQuestion: (id: string | number, data: Partial<Question>) => void;
  updateMetadata: (data: { title?: string; description?: string; category?: string }) => void;
  saveTemplate: () => Promise<void>;
  loadTemplate: (templateId: string) => Promise<void>;
  setResponse: (questionId: string | number, value: any) => void;
  validateQuestion: (questionId: string | number) => ResponseRecord;
  setBranching: (b: Branching) => void;
  validateTemplate: () => void;
  startSession: () => void;
  answerAndAdvance: (questionId: string | number, answer: any) => { next?: string | number | null; ended?: boolean; loopDetected?: boolean } | undefined;
};

export const useSessionBuilder = create<BuilderState>(
  devtools((set: any, get: any) => ({
    questions: [],
    title: 'Untitled Session',
    description: '',
    category: '',
    version: 1,
    isDraft: true,
    autosaveStatus: 'idle',
    backendId: undefined,
    responses: {},
    branching: undefined,
    session: undefined,
    templateWarnings: [],
    addQuestion: () =>
      set((state: any) => ({
        questions: [
          ...state.questions,
          { id: Date.now(), type: 'text', text: '', branching: {}, required: false, weight: 1 },
        ],
        isDraft: true,
      })),
    reorderQuestions: (from: number, to: number) =>
      set((state: any) => {
        const updated = [...state.questions];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        return { questions: updated, isDraft: true };
      }),
    updateQuestion: (id: string | number, data: Partial<Question>) =>
      set((state: any) => ({
        questions: state.questions.map((q: Question) => (q.id === id ? { ...q, ...data } : q)),
        isDraft: true,
      })),
    updateMetadata: (data: { title?: string; description?: string; category?: string }) => 
      set((state: any) => ({
        title: data.title ?? state.title,
        description: data.description ?? state.description,
        category: data.category ?? state.category,
        isDraft: true,
      })),
    loadTemplate: async (templateId: string) => {
      try {
        const token = localStorage.getItem('manas_token');
        if (!token) return;
        const res = await axios.get(`http://localhost:5001/api/v1/cbt-sessions/templates/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          const t = res.data.data;
          set({
            backendId: t.id,
            title: t.title,
            description: t.description || '',
            category: t.category || '',
            version: t.version || 1,
            questions: t.questions?.map((q: any) => ({
              id: q.id,
              type: q.type,
              text: q.prompt,
              required: q.isRequired,
              branching: q.branchingRules?.reduce((acc: any, r: any) => ({ ...acc, [r.condition.value]: r.toQuestionId }), {}),
              validation: q.metadata?.validation,
              options: q.metadata?.options
            })) || [],
            isDraft: false,
          });
        }
      } catch (e) {
        console.error("Failed to load template", e);
      }
    },
    saveTemplate: async () => {
      set({ autosaveStatus: 'saving' });
      const state = get();
      try {
        const token = localStorage.getItem('manas_token');
        if (!token) throw new Error("No auth token");
        
        const payload = {
          id: state.backendId || 'draft',
          title: state.title,
          description: state.description,
          category: state.category,
          questions: state.questions,
        };

        const res = await axios.post('http://localhost:5001/api/v1/cbt-sessions/templates', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data?.success && res.data.data) {
          set((state: any) => ({ 
            backendId: res.data.data.id,
            version: state.version + 1, 
            isDraft: false, 
            autosaveStatus: 'saved' 
          }));
        } else {
           throw new Error("Failed to save");
        }
      } catch (e) {
        set({ autosaveStatus: 'error' });
      }
    },
    setResponse: (questionId: string | number, value: any) =>
      set((state: any) => {
        // basic inline validation
        const q = state.questions.find((x: Question) => x.id === questionId);
        let valid = true;
        const errors: string[] = [];
        if (q) {
          if (q.required) {
            const empty =
              value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
            if (empty) {
              valid = false;
              errors.push('Required');
            }
          }
          if (q.validation?.pattern && typeof value === 'string') {
            try {
              const re = new RegExp(q.validation.pattern);
              if (!re.test(value)) {
                valid = false;
                errors.push('Invalid format');
              }
            } catch {}
          }
          if (typeof value === 'number') {
            if (q.validation?.min !== undefined && value < q.validation.min) {
              valid = false;
              errors.push(`Minimum ${q.validation.min}`);
            }
            if (q.validation?.max !== undefined && value > q.validation.max) {
              valid = false;
              errors.push(`Maximum ${q.validation.max}`);
            }
          }
        }
        const id = String(questionId);
        return { responses: { ...state.responses, [id]: { value, valid, errors } } } as any;
      }),
    setBranching: (b: Branching) => set({ branching: b }),
    validateTemplate: () => {
      const state = get();
      const warnings: string[] = [];
      try {
        const problematic = detectProblematicSCCs(state.questions, state.branching);
        for (const p of problematic) warnings.push(`Problematic cycle detected: ${p.join(' -> ')}`);
      } catch (e: any) {
        warnings.push(`Validation error: ${String(e)}`);
      }
      set({ templateWarnings: warnings });
    },
    startSession: () => {
      const state = get();
      const initial: SessionState = {
        currentQuestionId: state.questions.length ? state.questions[0].id : undefined,
        history: [],
        visited: new Set<string>(),
        stepCount: 0,
      };
      if (initial.currentQuestionId) initial.visited.add(String(initial.currentQuestionId));
      set({ session: initial });
    },
    answerAndAdvance: (questionId: string | number, answer: any) => {
      const state = get();
      if (!state.session) return undefined;
      const answers: Answers = {}; // build answers map from responses + new answer
      for (const k of Object.keys(state.responses)) {
        const r = state.responses[k];
        if (r) answers[k] = r.value;
      }
      answers[String(questionId)] = answer;
      const res = recordAnswerAndAdvance(state.session, state.questions, state.branching, answers, questionId, answer, { maxSteps: 500 });
      // persist response
      const id = String(questionId);
      const valid = res ? !res.loopDetected : true;
      set({ responses: { ...state.responses, [id]: { value: answer, valid, errors: res && res.loopDetected ? ['Loop detected'] : undefined } }, session: state.session });
      return res;
    },
    validateQuestion: (questionId: string | number) => {
      const state = get();
      const q = state.questions.find((x: Question) => x.id === questionId);
      const id = String(questionId);
      const existing = state.responses[id];
      if (existing) return existing as ResponseRecord;
      // if no response yet, run same validation logic with undefined
      let valid = true;
      const errors: string[] = [];
      if (q && q.required) {
        valid = false;
        errors.push('Required');
      }
      return { value: undefined, valid, errors } as ResponseRecord;
    },
  }))
);

