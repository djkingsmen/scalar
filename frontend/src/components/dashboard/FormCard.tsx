"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FormListItem } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import {
  BarChartIcon,
  CopyIcon,
  EditIcon,
  EyeIcon,
  LinkIcon,
  MoreIcon,
  TrashIcon,
} from "@/components/ui/icons";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function FormCard({
  form,
  onRename,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: {
  form: FormListItem;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const router = useRouter();
  const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${form.share_slug}` : "";

  return (
    <div className="group relative tf-elevated-card rounded-3xl p-5 hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_20%,transparent)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-3">
        <Badge tone={form.status === "published" ? "success" : "draft"}>
          {form.status === "published" ? "Published" : "Draft"}
        </Badge>
        <DropdownMenu
          trigger={
            <button className="p-1.5 rounded-xl border border-transparent hover:border-border hover:bg-surface/80 text-ink-soft cursor-pointer transition-colors">
              <MoreIcon width={18} height={18} />
            </button>
          }
          items={[
            { label: "Edit", icon: <EditIcon width={15} height={15} />, onClick: () => router.push(`/forms/${form.id}/edit`) },
            { label: "Rename", icon: <EditIcon width={15} height={15} />, onClick: onRename },
            { label: "Duplicate", icon: <CopyIcon width={15} height={15} />, onClick: onDuplicate },
            {
              label: form.status === "published" ? "Unpublish" : "Publish",
              icon: <EyeIcon width={15} height={15} />,
              onClick: onTogglePublish,
            },
            ...(form.status === "published"
              ? [
                  {
                    label: "Copy share link",
                    icon: <LinkIcon width={15} height={15} />,
                    onClick: () => {
                      navigator.clipboard.writeText(publicUrl);
                      toast.success("Share link copied");
                    },
                  },
                ]
              : []),
            { label: "Delete", icon: <TrashIcon width={15} height={15} />, onClick: onDelete, danger: true },
          ]}
        />
      </div>

      <Link href={`/forms/${form.id}/edit`} className="block flex-1">
        <h3 className="text-lg font-bold text-ink mb-1.5 line-clamp-2 tracking-tight">{form.title}</h3>
        <p className="text-sm text-ink-soft line-clamp-2 min-h-10 leading-relaxed">
          {form.description || "No description"}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/80 text-sm text-ink-soft">
        <span>{form.question_count} question{form.question_count === 1 ? "" : "s"}</span>
        <Link
          href={`/forms/${form.id}/results`}
          className="flex items-center gap-1 hover:text-ink font-semibold"
        >
          <BarChartIcon width={14} height={14} />
          {form.response_count} response{form.response_count === 1 ? "" : "s"}
        </Link>
      </div>
    </div>
  );
}
