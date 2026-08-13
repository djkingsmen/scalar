"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Question } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { LoaderIcon } from "@/components/ui/icons";

export function ResponseDetailModal({
  formId,
  responseId,
  questions,
  onClose,
}: {
  formId: number;
  responseId: number | null;
  questions: Question[];
  onClose: () => void;
}) {
  const { data } = useQuery({
    queryKey: ["response", formId, responseId],
    queryFn: () => api.getResponse(formId, responseId as number),
    enabled: responseId !== null,
  });

  const answerByQuestion = new Map((data?.answers ?? []).map((a) => [a.question_id, a]));

  return (
    <Modal open={responseId !== null} onClose={onClose} title={`Response #${responseId ?? ""}`} width={560}>
      {!data ? (
        <div className="py-10 flex justify-center text-ink-soft">
          <LoaderIcon width={20} height={20} />
        </div>
      ) : (
        <div className="space-y-5 max-h-[60vh] overflow-y-auto tf-scrollbar">
          {questions.map((q) => {
            const answer = answerByQuestion.get(q.id);
            return (
              <div key={q.id}>
                <p className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1">{q.title}</p>
                <p className="text-sm text-ink">
                  {answer?.value_text || <span className="text-ink-soft italic">No answer</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
