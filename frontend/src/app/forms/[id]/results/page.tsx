import { ResultsClient } from "@/components/results/ResultsClient";

export default async function ResultsPage({ params }: PageProps<"/forms/[id]/results">) {
  const { id } = await params;
  return <ResultsClient formId={Number(id)} />;
}
