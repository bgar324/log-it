"use client";

import { Bot, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { WorkoutSplitTemplate } from "@/lib/workout-splits/shared";
import { getSplitWeekdayLabel } from "@/lib/workout-splits/shared";
import { splitStyles } from "./split-system.styles";

type SplitAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SplitAssistantPanelProps = {
  draft: WorkoutSplitTemplate | null;
  onDraftChange: (draft: WorkoutSplitTemplate | null) => void;
  onBack: () => void;
  onSaveGeneratedSplit: (split: WorkoutSplitTemplate) => Promise<void>;
};

type AssistantEvent =
  | { event: "message_delta"; data: { content?: unknown } }
  | { event: "message_done"; data: { content?: unknown } }
  | { event: "split_draft"; data: { split?: unknown; assistantNote?: unknown } }
  | { event: "limit_reached"; data: { message?: unknown } }
  | { event: "error"; data: { message?: unknown } };

const assistantLandingPrompt =
  "Tell me what getting started looks like right now.\nSchedule, gym access, and what you want to improve are enough to begin.";

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseAssistantEvent(rawEvent: string): AssistantEvent | null {
  const eventName = rawEvent
    .split("\n")
    .find((line) => line.startsWith("event:"))
    ?.slice("event:".length)
    .trim();
  const rawData = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("\n");

  if (!eventName || !rawData) {
    return null;
  }

  try {
    return {
      event: eventName,
      data: JSON.parse(rawData),
    } as AssistantEvent;
  } catch {
    return null;
  }
}

function isWorkoutSplitTemplate(value: unknown): value is WorkoutSplitTemplate {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as WorkoutSplitTemplate).name === "string" &&
    Array.isArray((value as WorkoutSplitTemplate).days)
  );
}

function renderInlineMarkdown(content: string) {
  const segments = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={index}>{segment.slice(2, -2)}</strong>;
    }

    if (segment.startsWith("*") && segment.endsWith("*")) {
      return <em key={index}>{segment.slice(1, -1)}</em>;
    }

    return segment;
  });
}

function AssistantMarkdown({ content }: { content: string }) {
  const blocks = content.trim().split(/\n{2,}/);

  return (
    <div className={splitStyles.assistantMarkdown}>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const bulletLines = lines
          .map((line) => line.trim())
          .filter((line) => line.startsWith("- ") || line.startsWith("* "));

        if (bulletLines.length === lines.length) {
          return (
            <ul key={blockIndex}>
              {bulletLines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInlineMarkdown(line.slice(2).trim())}</li>
              ))}
            </ul>
          );
        }

        return <p key={blockIndex}>{renderInlineMarkdown(block)}</p>;
      })}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <span className={splitStyles.assistantThinking} aria-label="Ben is thinking">
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </span>
  );
}

export function SplitAssistantPanel({
  draft,
  onDraftChange,
  onBack,
  onSaveGeneratedSplit,
}: SplitAssistantPanelProps) {
  const [messages, setMessages] = useState<SplitAssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const assistantMessageIdRef = useRef<string | null>(null);
  const hasStartedChat = messages.some((message) => message.role === "user");
  const totalTrainingDays = useMemo(
    () => draft?.days.filter((day) => day.workoutTypeSlug !== "rest").length ?? 0,
    [draft],
  );

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [messages, draft]);

  function appendAssistantContent(content: string) {
    const assistantMessageId = assistantMessageIdRef.current;

    if (!assistantMessageId) {
      return;
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === assistantMessageId
          ? {
              ...message,
              content: `${message.content}${content}`,
            }
          : message,
      ),
    );
  }

  function handleAssistantEvent(event: AssistantEvent) {
    if (event.event === "message_delta") {
      const content = event.data.content;

      if (typeof content === "string") {
        appendAssistantContent(content);
      }
      return;
    }

    if (event.event === "message_done") {
      setIsSending(false);
      return;
    }

    if (event.event === "split_draft") {
      if (isWorkoutSplitTemplate(event.data.split)) {
        onDraftChange(event.data.split);
      }
      return;
    }

    if (event.event === "limit_reached" || event.event === "error") {
      const content =
        typeof event.data.message === "string"
          ? event.data.message
          : "Ben could not answer right now.";
      appendAssistantContent(`\n\n${content}`);
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();

    if (!content || isSending) {
      return;
    }

    const nextMessages = [
      ...messages,
      { id: createMessageId(), role: "user" as const, content },
    ];
    const assistantMessageId = createMessageId();

    assistantMessageIdRef.current = assistantMessageId;
    setMessages([
      ...nextMessages,
      { id: assistantMessageId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsSending(true);
    let receivedAssistantContent = false;
    let receivedTerminalEvent = false;

    try {
      const response = await fetch("/api/workout-split/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          draft,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Ben could not answer right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const rawEvent of events) {
          const parsed = parseAssistantEvent(rawEvent);

          if (parsed) {
            if (
              parsed.event === "message_delta" &&
              typeof parsed.data.content === "string" &&
              parsed.data.content.trim()
            ) {
              receivedAssistantContent = true;
            }
            if (parsed.event === "error" || parsed.event === "limit_reached") {
              receivedTerminalEvent = true;
            }
            handleAssistantEvent(parsed);
          }
        }
      }

      const tail = `${buffer}${decoder.decode()}`;
      const parsedTail = parseAssistantEvent(tail);

      if (parsedTail) {
        if (
          parsedTail.event === "message_delta" &&
          typeof parsedTail.data.content === "string" &&
          parsedTail.data.content.trim()
        ) {
          receivedAssistantContent = true;
        }
        if (parsedTail.event === "error" || parsedTail.event === "limit_reached") {
          receivedTerminalEvent = true;
        }
        handleAssistantEvent(parsedTail);
      }

      if (!receivedAssistantContent && !receivedTerminalEvent) {
        appendAssistantContent("Ben could not get a response from Gemini. Try again in a moment.");
      }
    } catch (error) {
      appendAssistantContent(
        `\n\n${error instanceof Error ? error.message : "Ben could not answer right now."}`,
      );
    } finally {
      assistantMessageIdRef.current = null;
      setIsSending(false);
    }
  }

  async function handleCreateSplit() {
    if (!draft || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await onSaveGeneratedSplit(draft);
      onDraftChange(null);
      onBack();
    } finally {
      setIsSaving(false);
    }
  }

  const composer = (
    <form className={splitStyles.assistantComposer} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className={splitStyles.assistantInput}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Tell Ben your schedule, goal, equipment, or what to change..."
        aria-label="Message Ben"
      />
      <button
        type="submit"
        className={splitStyles.assistantSendButton}
        disabled={isSending || !input.trim()}
        aria-label="Send message"
        title="Send"
      >
        <Send className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
      </button>
    </form>
  );

  return (
    <section className={splitStyles.assistantPanel} aria-label="Ben split assistant">
      <div className={splitStyles.assistantHeader}>
        <div className={splitStyles.assistantTitleWrap}>
          <span className={splitStyles.assistantIconWrap} aria-hidden="true">
            <Bot className={splitStyles.inlineIcon} strokeWidth={1.9} />
          </span>
          <h2 className={splitStyles.assistantTitle}>Ask Ben</h2>
        </div>
      </div>

      {!hasStartedChat && !draft ? (
        <div className={splitStyles.assistantLanding}>
          <p className={splitStyles.assistantLandingPrompt}>{assistantLandingPrompt}</p>
          <div className={splitStyles.assistantLandingComposer}>{composer}</div>
        </div>
      ) : (
        <>
          <div
            className={`${splitStyles.assistantBody} ${
              draft ? splitStyles.assistantBodyWithDraft : ""
            }`}
          >
            <div className={splitStyles.assistantConversation} aria-live="polite">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${splitStyles.assistantMessage} ${
                    message.role === "user" ? splitStyles.assistantMessageUser : ""
                  }`}
                >
                  {message.role === "assistant" && message.content ? (
                    <AssistantMarkdown content={message.content} />
                  ) : message.role === "assistant" ? (
                    <ThinkingIndicator />
                  ) : (
                    message.content
                  )}
                </div>
              ))}
              <div ref={conversationEndRef} aria-hidden="true" />
            </div>

            {draft ? (
              <aside className={splitStyles.assistantDraft} aria-label="Generated split preview">
                <div className={splitStyles.assistantDraftHeader}>
                  <div>
                    <p className={splitStyles.assistantDraftLabel}>Preview</p>
                    <h3 className={splitStyles.assistantDraftTitle}>{draft.name}</h3>
                    <p className={splitStyles.assistantDraftMeta}>
                      {totalTrainingDays} days ·{" "}
                      {draft.days.reduce((sum, day) => sum + day.exercises.length, 0)} exercises
                    </p>
                  </div>
                  <Sparkles className={splitStyles.inlineIcon} aria-hidden="true" strokeWidth={1.9} />
                </div>
                <div className={splitStyles.assistantDraftDays}>
                  {draft.days.map((day) => (
                    <div key={day.weekday} className={splitStyles.assistantDraftDay}>
                      <div className={splitStyles.assistantDraftDayHeader}>
                        <span>{getSplitWeekdayLabel(day.weekday)}</span>
                        <strong>{day.workoutType}</strong>
                      </div>
                      {day.exercises.length > 0 ? (
                        <ul className={splitStyles.assistantDraftExercises}>
                          {day.exercises.map((exercise) => (
                            <li
                              key={`${day.weekday}-${exercise.order}-${exercise.exerciseSlug}`}
                              className={splitStyles.assistantDraftExercise}
                            >
                              <span>{exercise.exerciseDisplayName}</span>
                              <em>{exercise.sets} sets</em>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className={splitStyles.assistantDraftActions}>
                  <button
                    type="button"
                    className={splitStyles.primaryButton}
                    onClick={handleCreateSplit}
                    disabled={isSaving}
                  >
                    Create split
                  </button>
                  <button
                    type="button"
                    className={splitStyles.inlineButton}
                    onClick={() => inputRef.current?.focus()}
                  >
                    Revise
                  </button>
                </div>
              </aside>
            ) : null}
          </div>

          {composer}
        </>
      )}
    </section>
  );
}
