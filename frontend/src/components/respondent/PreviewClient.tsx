"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RespondentFlow } from "./RespondentFlow";
import { LoaderIcon } from "@/components/ui/icons";

export function PreviewClient({ formId }: { formId: number }) {
  const { data, isLoading } = useQuery({ queryKey: ["form", formId], queryFn: () => api.getForm(formId) });

  if (isLoading || !data) {
    return (
      <div className="h-screen w-screen flex items-center justify-center text-ink-soft gap-2">
        <LoaderIcon width={20} height={20} />
      </div>
    );
  }

  return (
    <RespondentFlow
      form={data}
      mode="preview"
      onSubmit={async () => {
        await new Promise((r) => setTimeout(r, 400));
      }}
    />
  );
}
