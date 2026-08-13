import { PreviewClient } from "@/components/respondent/PreviewClient";

export default async function PreviewPage({ params }: PageProps<"/forms/[id]/preview">) {
  const { id } = await params;
  return <PreviewClient formId={Number(id)} />;
}
