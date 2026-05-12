import {
  normalizeWorkoutSplitPayload,
  type RawWorkoutSplitPayload,
} from "./payload";
import {
  isSplitWeekday,
  SPLIT_WEEKDAYS,
  type SplitWeekdayValue,
  type WorkoutSplitTemplate,
} from "./shared";

export type SplitAssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type SplitAssistantDraftResult =
  | { ready: true; split: WorkoutSplitTemplate; assistantNote: string }
  | { ready: false; assistantNote: string };

const MAX_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 1_000;
const MAX_EXERCISES_PER_DAY = 6;
const MAX_SETS = 20;

export const SPLIT_ASSISTANT_DAILY_DRAFT_LIMIT = 5;

export const SPLIT_ASSISTANT_CHAT_SYSTEM_PROMPT = [
  "You are Ben inside a workout split builder.",
  "Your job is to help the user choose, revise, or finalize a practical weekly workout split.",
  "Keep replies short: one or two practical sentences unless the user explicitly asks for detail.",
  "Gather only missing decision-critical details: schedule availability, days per week, experience level, equipment, session length, main goal, focus areas, exercises to include or avoid, medical/injury constraints, and preferred training style.",
  "Preferred training style can include bodybuilding, strength-focused, general fitness, athletic training, machine-focused, dumbbell-focused, short efficient sessions, low-fatigue training, or simple beginner training.",
  "Ask one concise follow-up question at a time. Do not ask a checklist of questions in one message.",
  "Do not ask for rep ranges. The app only supports exercise names and set counts.",
  "Do not ask for exact set counts unless the user seems experienced, asks for volume customization, or the requested change depends on volume.",
  "If volume preference matters, ask in simple terms like lower volume, moderate volume, or higher volume instead of asking for exact programming details.",
  "If the user is a beginner, unsure, vague, or wants you to decide, use safe beginner defaults instead of asking about sets, reps, advanced programming, or detailed exercise selection.",
  "If the user gives enough detail to make a reasonable beginner split, stop asking questions and say you are drafting the split now.",
  "If the user asks to change an existing draft, use the current draft context, preserve unaffected days, and ask a follow-up only when the requested change is ambiguous.",
  "Be warm, direct, and practical. Sound like a focused training partner, not a generic coach. Do not mention that you are an AI model.",
  "Do not give medical advice, injury rehab plans, diagnoses, or guaranteed outcomes.",
  "If the user mentions pain, injury, illness, pregnancy, or a medical condition, advise them to check with a qualified clinician before training and keep the split conservative.",
  "When enough preferences are known, do not write the full split in chat. Say you are drafting the split now in one short message. The app will render the structured split preview separately.",
].join(" ");

export const SPLIT_ASSISTANT_DRAFT_SYSTEM_PROMPT = [
  "You convert a Ben split assistant conversation into structured JSON.",
  "Return ready=false if the conversation does not yet establish schedule availability, rough days per week, experience level, equipment, session length, and goal or focus.",
  "Return ready=true when there is enough information to draft a reasonable weekly split without asking more questions.",
  "If minor details are missing but the user gave enough context, use safe beginner defaults instead of returning ready=false.",
  "If current unsaved draft JSON is provided and the user requested changes, revise that draft and preserve unaffected days when possible.",
  "Draft beginner-friendly weekly templates only.",
  "Do not prescribe weights, rep ranges, effort targets, tempos, rest times, advanced periodization, medical advice, or injury rehab plans.",
  "The app only supports exercise names and set counts. Do not include reps anywhere.",
  "Use seven weekdays. The weekday field must be exactly one of MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY.",
  "Do not use Day 1, Day 2, custom weekday labels, or non-weekday labels.",
  "Rest days must use workoutType Rest and must have no exercises.",
  "Training days should usually have 3 to 6 exercises.",
  "Exercises should usually have 2 to 4 sets.",
  "Most beginner compound lifts should use 3 sets.",
  "Small accessories should usually use 2 or 3 sets.",
  "Use 2 sets for low-priority accessories, warm-up-style movements, or lower-volume preferences.",
  "Use 3 sets as the default for most normal beginner training days.",
  "Use 4 sets sparingly for the user's main priority movements or clearly higher-volume preferences.",
  "Never exceed the app limits for exercises per day or sets per exercise.",
  "If the user requested lower volume, use fewer exercises and mostly 2 to 3 sets.",
  "If the user requested moderate/default volume, use balanced training days with mostly 3 sets.",
  "If the user requested higher volume, add volume carefully while staying beginner-friendly.",
  "If the user stated exact preferred set counts, respect them within safe beginner limits.",
  "Order exercises from larger, more technical movements to smaller accessories.",
  "Use only exercises that fit the stated equipment.",
  "If equipment is vague, choose common gym machines, dumbbells, cables, and bodyweight movements.",
  "Distribute training days across the user's available week.",
  "Avoid repeating the same hard muscle focus on back-to-back training days when possible.",
  "Prefer familiar exercise names over niche variations.",
  "Keep arm focus additive instead of making every day arms.",
  "When the user gives a preferred training style, reflect it in the split structure and exercise choices while keeping the plan beginner-friendly.",
  "When the user has specific focus areas, prioritize them with slightly more exercise selection or sets, but do not let them crowd out the rest of the body.",
  "When the user asks for changes to a draft, make only the requested changes unless another change is necessary for balance, safety, or schedule consistency.",
].join(" ");

export function sanitizeSplitAssistantMessages(
  value: unknown,
): SplitAssistantChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(-MAX_MESSAGES)
    .map((message): SplitAssistantChatMessage | null => {
      if (!message || typeof message !== "object") {
        return null;
      }

      const role = (message as { role?: unknown }).role;
      const content = (message as { content?: unknown }).content;

      if (
        (role !== "user" && role !== "assistant") ||
        typeof content !== "string"
      ) {
        return null;
      }

      const trimmed = content.trim().slice(0, MAX_MESSAGE_LENGTH);

      if (!trimmed) {
        return null;
      }

      return { role, content: trimmed };
    })
    .filter(
      (message): message is SplitAssistantChatMessage => message !== null,
    );
}

function clampSets(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(Math.round(value), 1), MAX_SETS);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);

    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(parsed, 1), MAX_SETS);
    }
  }

  return 2;
}

function normalizeGeneratedWeekday(
  value: unknown,
  index: number,
): SplitWeekdayValue | unknown {
  if (isSplitWeekday(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return SPLIT_WEEKDAYS[index] ?? value;
  }

  const normalized = value.trim().toUpperCase();

  if (isSplitWeekday(normalized)) {
    return normalized;
  }

  const compact = normalized.replace(/[^A-Z0-9]/g, "");
  const weekday = SPLIT_WEEKDAYS.find(
    (candidate) =>
      candidate === compact || candidate.slice(0, 3) === compact.slice(0, 3),
  );

  if (weekday) {
    return weekday;
  }

  const dayNumber = /^DAY(\d+)$/.exec(compact)?.[1];

  if (dayNumber) {
    const parsedIndex = Number.parseInt(dayNumber, 10) - 1;
    return SPLIT_WEEKDAYS[parsedIndex] ?? value;
  }

  return SPLIT_WEEKDAYS[index] ?? value;
}

function sanitizeGeneratedSplitPayload(
  raw: RawWorkoutSplitPayload,
): RawWorkoutSplitPayload {
  const rawDays = Array.isArray(raw.days) ? raw.days : [];

  return {
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : "Beginner Split",
    days: rawDays.map((rawDay, dayIndex) => {
      if (!rawDay || typeof rawDay !== "object") {
        return rawDay;
      }

      const day = rawDay as {
        weekday?: unknown;
        workoutType?: unknown;
        exercises?: unknown;
      };
      const workoutType =
        typeof day.workoutType === "string" && day.workoutType.trim()
          ? day.workoutType.trim()
          : "Rest";
      const isRestDay = workoutType.trim().toLowerCase() === "rest";
      const exercises =
        Array.isArray(day.exercises) && !isRestDay
          ? day.exercises.slice(0, MAX_EXERCISES_PER_DAY).map((rawExercise) => {
              if (!rawExercise || typeof rawExercise !== "object") {
                return rawExercise;
              }

              const exercise = rawExercise as {
                exerciseDisplayName?: unknown;
                exerciseName?: unknown;
                sets?: unknown;
              };

              return {
                exerciseDisplayName:
                  typeof exercise.exerciseDisplayName === "string"
                    ? exercise.exerciseDisplayName
                    : typeof exercise.exerciseName === "string"
                      ? exercise.exerciseName
                      : "",
                sets: clampSets(exercise.sets),
              };
            })
          : [];

      return {
        weekday: normalizeGeneratedWeekday(day.weekday, dayIndex),
        workoutType,
        exercises,
      };
    }),
  };
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Empty response.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = /\{[\s\S]*\}/.exec(trimmed);

    if (!match) {
      throw new Error("Response did not include JSON.");
    }

    return JSON.parse(match[0]);
  }
}

export function parseSplitAssistantDraftResponse(
  text: string,
): SplitAssistantDraftResult {
  const parsed = parseJsonObject(text);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Draft response must be an object.");
  }

  const ready = (parsed as { ready?: unknown }).ready === true;
  const assistantNote =
    typeof (parsed as { assistantNote?: unknown }).assistantNote === "string"
      ? (parsed as { assistantNote: string }).assistantNote.trim() ||
        "I drafted a split."
      : "I drafted a split.";

  if (!ready) {
    return { ready: false, assistantNote };
  }

  const draft = (parsed as { draft?: unknown }).draft;

  if (!draft || typeof draft !== "object") {
    throw new Error("Ready draft response is missing a draft.");
  }

  const normalized = normalizeWorkoutSplitPayload(
    sanitizeGeneratedSplitPayload(draft as RawWorkoutSplitPayload),
  );

  if ("error" in normalized) {
    throw new Error(normalized.error);
  }

  return {
    ready: true,
    split: normalized.value,
    assistantNote,
  };
}

export function buildSplitAssistantTranscript(
  messages: SplitAssistantChatMessage[],
  draft?: RawWorkoutSplitPayload | null,
) {
  const transcript = messages
    .map(
      (message) =>
        `${message.role === "assistant" ? "Ben" : "User"}: ${message.content}`,
    )
    .join("\n");
  const currentDraft = draft
    ? `\n\nCurrent unsaved draft JSON:\n${JSON.stringify(draft)}`
    : "";

  return `${transcript}${currentDraft}`.trim();
}

export function buildSplitAssistantChatMessages(
  messages: SplitAssistantChatMessage[],
  draft?: RawWorkoutSplitPayload | null,
) {
  if (!draft) {
    return messages;
  }

  return [
    {
      role: "user" as const,
      content: [
        "Current unsaved draft JSON for context. Use it only if the user asks to revise the draft.",
        JSON.stringify(draft),
      ].join("\n"),
    },
    ...messages,
  ];
}

export const SPLIT_ASSISTANT_DRAFT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    ready: { type: "boolean" },
    assistantNote: { type: "string" },
    draft: {
      type: "object",
      properties: {
        name: { type: "string" },
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              weekday: {
                type: "string",
                enum: [
                  "MONDAY",
                  "TUESDAY",
                  "WEDNESDAY",
                  "THURSDAY",
                  "FRIDAY",
                  "SATURDAY",
                  "SUNDAY",
                ],
              },
              workoutType: { type: "string" },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    exerciseDisplayName: { type: "string" },
                    sets: { type: "integer" },
                  },
                  required: ["exerciseDisplayName", "sets"],
                },
              },
            },
            required: ["weekday", "workoutType", "exercises"],
          },
        },
      },
      required: ["name", "days"],
    },
  },
  required: ["ready", "assistantNote"],
} as const;
