"use client";

import { use } from "react";
import { Editor } from "@/components/editor/editor";

export default function EditorPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  return <Editor projectId={projectId} />;
}
