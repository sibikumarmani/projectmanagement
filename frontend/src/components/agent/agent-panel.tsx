"use client";

import axios from "axios";
import { Loader2, SendHorizonal, Sparkles } from "lucide-react";
import { useState } from "react";
import { SectionCard } from "@/components/common/section-card";
import { agentApi } from "@/lib/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: Array<{
    toolName: string;
    success: boolean;
    summary: string;
  }>;
};

type AgentPanelProps = {
  compact?: boolean;
};

function extractApiError(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;
  if (typeof data?.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  return fallbackMessage;
}

export function AgentPanel({ compact = false }: AgentPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Describe the records you want to create, and I will turn that into real PMS data. I can create projects, WBS, milestones, activities, risks, users, allocations, timesheets, material requests, and billing entries.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    const nextUserMessage: ChatMessage = { role: "user", content: trimmed };
    const nextHistory = [...messages, nextUserMessage];

    setMessages(nextHistory);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      const response = await agentApi.chat({
        message: trimmed,
        history: messages.map((item) => ({ role: item.role, content: item.content })),
      });

      const payload = response.data.data as {
        message: string;
        model: string;
        actions: Array<{ toolName: string; success: boolean; summary: string }>;
      };

      setMessages([
        ...nextHistory,
        {
          role: "assistant",
          content: payload.message,
          actions: payload.actions,
        },
      ]);
    } catch (requestError: unknown) {
      setError(extractApiError(requestError, "The chatbot agent could not process that request."));
      setMessages(nextHistory);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={`grid gap-4 ${compact ? "" : "xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
      <SectionCard
        title="Agent conversation"
        eyebrow="Chatbot"
        action={
          <div className="rounded-full bg-brand px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Natural language to data
          </div>
        }
      >
        <div className={`space-y-4 ${compact ? "max-h-[44vh] overflow-y-auto pr-1" : ""}`}>
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-[24px] px-5 py-4 ${
                message.role === "user"
                  ? "ml-auto max-w-3xl bg-brand-strong text-white"
                  : "max-w-4xl border border-line bg-white/70 text-slate-700"
              }`}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
                {message.role === "user" ? "You" : "Agent"}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
              {message.actions && message.actions.length > 0 ? (
                <div className="mt-4 space-y-2 border-t border-slate-200/70 pt-4">
                  {message.actions.map((action, actionIndex) => (
                    <div
                      key={`${action.toolName}-${actionIndex}`}
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        action.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <p className="font-semibold">{action.toolName}</p>
                      <p className="mt-1">{action.summary}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {isSending ? (
            <div className="max-w-3xl rounded-[24px] border border-line bg-white/70 px-5 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                The agent is resolving your request and creating records...
              </div>
            </div>
          ) : null}

          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        </div>

        <div className="mt-6 rounded-[28px] border border-line bg-white/60 p-4">
          <textarea
            className={`w-full resize-none rounded-[22px] border border-line bg-white px-4 py-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 ${
              compact ? "min-h-28" : "min-h-32"
            }`}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Example: Create a project called South Plant Upgrade with code PRJ-2601 for Acme Manufacturing, then add WBS 1.0 Engineering, WBS 2.0 Execution, and two activities under Execution..."
            value={draft}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-brand-strong px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSending || !draft.trim()}
              onClick={() => void sendMessage(draft)}
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <SendHorizonal className="h-4 w-4" />
                Send to agent
              </span>
            </button>
            <button
              className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              onClick={() =>
                setDraft(
                  "Create project PRJ-2601 named South Plant Upgrade for Acme Manufacturing managed by Sibi Kumar starting 2026-05-01 and ending 2026-12-20 with budget 4500000. Add WBS 1.0 Engineering and WBS 2.0 Execution. Under WBS 2.0 create activity ACT-2601 Foundation Works from 2026-05-08 to 2026-05-28 for 20 days assigned to Sibi Kumar with status NOT_STARTED.",
                )
              }
              type="button"
            >
              Use sample prompt
            </button>
          </div>
        </div>
      </SectionCard>

      {!compact ? (
        <SectionCard title="What It Can Do" eyebrow="Guide">
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <div className="rounded-[24px] bg-white/60 px-5 py-4">
              <p className="mb-2 inline-flex items-center gap-2 font-semibold text-brand-strong">
                <Sparkles className="h-4 w-4" />
                Supported creates
              </p>
              <p>
                Projects, users, WBS, milestones, activities, risks, material requests, employee allocations, timesheets,
                and billing entries.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/60 px-5 py-4">
              <p className="font-semibold text-brand-strong">Best results</p>
              <p className="mt-2">
                Include dates, codes, responsible users, and project names in the same message. The agent can look up
                existing records, but it works fastest when you give the needed business details up front.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/60 px-5 py-4">
              <p className="font-semibold text-brand-strong">Important</p>
              <p className="mt-2">
                The agent writes to the live database. If something required is missing, it will ask a follow-up instead
                of guessing.
              </p>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
