export interface EvaluationConversation {
  questionNumber: number;
  question: string;
  answer: string;
  type: string;
}

export interface EvaluationContext {
  role: string;
  difficulty: string;
  interviewType: string;
  duration: number;
  conversation: EvaluationConversation[];
}
