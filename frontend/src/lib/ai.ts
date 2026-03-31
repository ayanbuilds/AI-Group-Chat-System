// edit 1
// type ContextMsg = {
//   role: "user" | "ai";
//   content: string;
//   sender_id?: string;
//   created_at?: string;
// };

// export async function askAI(params: {
//   groupId: string;
//   userQuestion: string;
//   context: ContextMsg[];
// }) {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_AI_API_BASE}/ai/reply`,
//     {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         group_id: params.groupId,
//         user_question: params.userQuestion,
//         context: params.context,
//       }),
//     }
//   );

//   if (!res.ok) {
//     const t = await res.text();
//     throw new Error(t || "AI request failed");
//   }

//   return res.json() as Promise<{ reply: string }>;
// }

// edit 2
// type ContextMsg = {
//   role: "user" | "ai";
//   content: string;
// //   sender_id?: string;
//   sender_id?: string | null;
//   created_at?: string;
// };

// function safeJsonParse(text: string) {
//   try {
//     return JSON.parse(text);
//   } catch {
//     return null;
//   }
// }

// export async function askAI(params: {
//   groupId: string;
//   userQuestion: string;
//   context: ContextMsg[];
// }) {
//   const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_BASE}/ai/reply`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       group_id: params.groupId,
//       user_question: params.userQuestion,
//       context: params.context,
//     }),
//   });

//   if (!res.ok) {
//     const raw = await res.text();
//     const j = safeJsonParse(raw);

//     // FastAPI can return { detail: "..." } OR { detail: { message: "..." } }
//     const msg =
//       j?.detail?.message ??
//       j?.detail ??
//       j?.message ??
//       raw ??
//       "AI request failed";

//     throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
//   }

//   return (await res.json()) as { reply: string };
// }

// edit 3
// -------------------- TYPES --------------------

// Context message sent to AI
// sender_id can be null because AI messages do not have a real user
export type ContextMsg = {
  role: "user" | "ai";
  content: string;
  sender_id?: string | null;
  created_at?: string;
};

// -------------------- HELPERS --------------------

// Safely parse JSON (FastAPI sometimes returns text errors)
function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Common POST helper for AI endpoints
async function postAI(path: string, body: unknown) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_AI_API_BASE}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const raw = await res.text();
    const j = safeJsonParse(raw);

    // FastAPI can return:
    // { detail: "..." }
    // { detail: { message: "..." } }
    // { message: "..." }
    const msg =
      j?.detail?.message ??
      j?.detail ??
      j?.message ??
      raw ??
      "AI request failed";

    throw new Error(
      typeof msg === "string" ? msg : JSON.stringify(msg)
    );
  }

  return (await res.json()) as { reply: string };
}

// -------------------- PUBLIC AI (GROUP MESSAGE) --------------------

/**
 * askAI
 * - PUBLIC AI call
 * - AI reply WILL be saved in DB
 * - AI reply WILL appear in group chat
 *
 * Used when:
 *   - user types "@AI hello"
 *   - user asks for summary in group
 */
export async function askAI(params: {
  groupId: string;
  userQuestion: string;
  context: ContextMsg[];
}) {
  return postAI("/ai/reply", {
    group_id: params.groupId,
    user_question: params.userQuestion,
    context: params.context,
  });
}

// -------------------- PRIVATE AI (EXPLAIN POPUP) --------------------

/**
 * askAIExplain
 * - PRIVATE AI call
 * - NO DB insert
 * - NO group message
 * - Result is ONLY for popup
 *
 * Used when:
 *   - user clicks "Explain" on a message
 */
export async function askAIExplain(params: {
  groupId: string;
  userQuestion: string;
  context: ContextMsg[];
}) {
  return postAI("/ai/explain", {
    group_id: params.groupId,
    user_question: params.userQuestion,
    context: params.context,
  });
}
