import React from "react";
import Textarea from "../ui/Textarea.jsx";

export default function PromptPanel({ prompt, onPromptChange }) {
  return (
    <div className="grid gap-2 px-4 pb-2 pt-4">
      <Textarea
        label="Website Prompt"
        className="min-h-[180px] resize-none rounded-xl border-[#e5e0f6] !bg-[#f3f1fb] text-sm shadow-sm hover:!bg-[#efecf8] focus:border-[#e5e0f6] focus:ring-0"
        placeholder="Describe what you want to build or change..."
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />
    </div>
  );
}
