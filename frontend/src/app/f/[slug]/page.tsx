import { PublicFormClient } from "@/components/respondent/PublicFormClient";

export default async function PublicFormPage({ params }: PageProps<"/f/[slug]">) {
  const { slug } = await params;
  return <PublicFormClient slug={slug} />;
}
