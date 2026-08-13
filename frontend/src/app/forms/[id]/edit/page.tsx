import { BuilderClient } from "@/components/builder/BuilderClient";

export default async function EditFormPage({ params }: PageProps<"/forms/[id]/edit">) {
  const { id } = await params;
  return <BuilderClient formId={Number(id)} />;
}
