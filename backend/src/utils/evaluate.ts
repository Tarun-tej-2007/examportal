type SnapshotQuestion = {
  questionId: any;
  type: string;
  marks: number;
  negativeMarks: number;
  correctAnswer: any;
};

function normalize(value: any) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function same(a: any, b: any) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.map(normalize).sort().join("|") === b.map(normalize).sort().join("|");
  }
  return normalize(a) === normalize(b);
}

export function evaluateObjective(
  questions: SnapshotQuestion[],
  answers: Array<{ questionId: any; selectedAnswer: any }>
) {
  let score = 0, correct = 0, incorrect = 0, unanswered = 0;
  for (const q of questions) {
    if (["short_answer", "descriptive"].includes(q.type)) continue;
    const a = answers.find(x => String(x.questionId) === String(q.questionId));
    if (!a || a.selectedAnswer === undefined || a.selectedAnswer === null || a.selectedAnswer === "") {
      unanswered++;
      continue;
    }
    if (same(a.selectedAnswer, q.correctAnswer)) {
      score += q.marks;
      correct++;
    } else {
      score -= q.negativeMarks || 0;
      incorrect++;
    }
  }
  return { score, correct, incorrect, unanswered };
}
