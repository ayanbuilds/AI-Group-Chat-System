// // edit 1
// // export default function GroupChatPage() {
// //   return <h1>Group Chat Page</h1>;
// // }

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import type { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { askAI } from "@/lib/ai";
// import { askAIExplain } from "@/lib/ai";

// /* -------------------- TYPES -------------------- */
// // Message row coming from `public.messages`
// type Msg = {
//   id: string;
//   group_id: string;
//   // sender_id: string;
//   sender_id: string | null;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// // Presence payload we track in the realtime presence channel
// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// // Group member row (joined with profiles)
// type Member = {
//   user_id: string;
//   role: string; // "admin" | "member"
//   email?: string;
//   display_name?: string;
//   last_seen_at?: string | null;
//   deleted_at?: string | null; // ✅ NEW
// };

// /* -------------------- HELPERS -------------------- */
// // Convert email -> username (before @)
// function usernameFromEmail(email?: string) {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// // Human readable last seen string
// function formatLastSeen(ts?: string | null) {
//   if (!ts) return "Last seen: —";
//   return `Last seen: ${new Date(ts).toLocaleString()}`;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   /* -------------------- STATE -------------------- */
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   const [explainOpen, setExplainOpen] = useState(false);
//   const [explainText, setExplainText] = useState<string | null>(null);

//   /* -------------------- REFS -------------------- */
//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   // Keep channel refs so we can cleanly unsubscribe on unmount / group change
//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   // Throttle typing events
//   const lastTypingSentRef = useRef<number>(0);

//   // Track typing timeouts per user so we can replace/clear them
//   const typingTimeoutsRef = useRef<Map<string, number>>(new Map());

//   // Avoid forcing auto-scroll when user is reading old messages
//   const shouldAutoScrollRef = useRef(true);
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);

//   /* -------------------- AUTH GUARD -------------------- */
//   // If user is not logged in, redirect to login
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- DB: UPDATE LAST SEEN -------------------- */
//   // Update last_seen_at for the current user
//   const updateMyLastSeen = async () => {
//     if (!session) return;

//     const { error } = await supabase
//       .from("profiles")
//       .update({ last_seen_at: new Date().toISOString() })
//       .eq("id", session.user.id);

//     if (error) {
//       // Keep silent in UI; you can log if needed.
//       // console.log("last_seen update error:", error.message);
//     }
//   };

//   /* -------------------- DB: LOAD MEMBERS -------------------- */
//   // Load all group members (with their profiles)
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         role,
//         deleted_at,
//         profiles:profiles (
//           email,
//           display_name,
//           last_seen_at
//         )
//       `
//       )
//       .eq("group_id", groupId);

//     if (error) {
//       setError(error.message);
//       setMembers([]);
//       return;
//     }

//     // Map the nested join result into a clean Member[]
//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as {
//         user_id: string;
//         role: string;
//         profiles?: {
//           email?: string;
//           display_name?: string;
//           last_seen_at?: string | null;
//         } | null;
//       };

//       return {
//         user_id: r.user_id,
//         role: r.role ?? "member",
//         deleted_at: (r as any).deleted_at ?? null, // ✅ NEW
//         email: r.profiles?.email ?? undefined,
//         display_name: r.profiles?.display_name ?? undefined,
//         last_seen_at: r.profiles?.last_seen_at ?? null,
//       };
//     });

//     // Deduplicate just in case
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   /* -------------------- DB: LOAD INITIAL MESSAGES -------------------- */
//   // Load last 200 messages for the group
//   const loadMessages = async () => {
//     if (!session) return;

//     setLoadingMsgs(true);
//     setError(null);

//     const { data, error } = await supabase
//       .from("messages")
//       .select("id,group_id,sender_id,role,content,created_at")
//       .eq("group_id", groupId)
//       .order("created_at", { ascending: true })
//       .limit(200);

//     if (error) {
//       setError(error.message);
//       setMessages([]);
//     } else {
//       setMessages((data ?? []) as Msg[]);
//     }

//     setLoadingMsgs(false);
//   };

//   /* -------------------- INITIAL LOAD -------------------- */
//   // When session or group changes, load members + messages
//   useEffect(() => {
//     if (!session) return;
//     void loadMembers();
//     void loadMessages();
//     void updateMyLastSeen();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REFRESH: LAST SEEN + MEMBERS (LIGHT) -------------------- */
//   // Keep last seen updated and refresh members sometimes (not too often)
//   useEffect(() => {
//     if (!session) return;

//     const onVisibility = () => {
//       // When user switches tab, update last seen
//       void updateMyLastSeen();
//     };

//     // NOTE: beforeunload is not reliable for async calls, but it's still a best-effort ping
//     const onBeforeUnload = () => {
//       void updateMyLastSeen();
//     };

//     document.addEventListener("visibilitychange", onVisibility);
//     window.addEventListener("beforeunload", onBeforeUnload);

//     // Refresh members every 30s (enough for "last seen" UI without hammering DB)
//     const interval = window.setInterval(() => {
//       void loadMembers();
//       void updateMyLastSeen();
//     }, 30000);

//     return () => {
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.removeEventListener("beforeunload", onBeforeUnload);
//       window.clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REALTIME: MESSAGES (INSERT) -------------------- */
//   // Listen for new messages and append locally (no full reload)
//   useEffect(() => {
//     if (!session) return;

//     const channel = supabase
//       .channel(`messages:${groupId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `group_id=eq.${groupId}`,
//         },
//         (payload) => {
//           const newMsg = payload.new as Msg;

//           setMessages((prev) => {
//             // Avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });
//         }
//       )
//       .subscribe();

//     msgChannelRef.current = channel;

//     return () => {
//       if (msgChannelRef.current) {
//         supabase.removeChannel(msgChannelRef.current);
//         msgChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO-SCROLL (SMART) -------------------- */
//   // Only auto-scroll if user is already near bottom
//   useEffect(() => {
//     if (!shouldAutoScrollRef.current) return;
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Track if user is reading old messages (scrolling up)
//   const onScrollMessages = () => {
//     const el = scrollContainerRef.current;
//     if (!el) return;

//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     // If user is within ~120px from bottom, we allow auto-scroll
//     shouldAutoScrollRef.current = distanceFromBottom < 120;
//   };

//   /* -------------------- REALTIME: PRESENCE + TYPING -------------------- */
//   // Presence gives online/offline, typing uses broadcast
//   useEffect(() => {
//     if (!session) return;

//     // ✅ Snapshot refs INSIDE the effect (stable for handlers + cleanup)
//     const timeoutsMap = typingTimeoutsRef.current;

//     // ✅ Create channel (we will remove THIS exact channel in cleanup)
//     const channel = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     // ✅ Helper: recompute online users from presence state
//     const recomputeOnline = () => {
//       const state = channel.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];

//       Object.values(state).forEach((arr) => {
//         arr.forEach((u) => list.push(u));
//       });

//       // Dedup by user_id
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     // ✅ Keep online list updated
//     channel.on("presence", { event: "sync" }, recomputeOnline);
//     channel.on("presence", { event: "join" }, recomputeOnline);
//     channel.on("presence", { event: "leave" }, recomputeOnline);

//     // ✅ Handle typing broadcast (uses the snapshot timeoutsMap)
//     channel.on("broadcast", { event: "typing" }, (evt) => {
//       const from = (evt?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       // Clear previous timeout for this user
//       const prevId = timeoutsMap.get(from);
//       if (prevId) window.clearTimeout(prevId);

//       // Create a new timeout
//       const tId = window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//         timeoutsMap.delete(from);
//       }, 2200);

//       timeoutsMap.set(from, tId);
//     });

//     // ✅ Subscribe and track ourselves as online
//     channel.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await channel.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });

//         // Optional: refresh members once after presence connects
//         void loadMembers();
//       }
//     });

//     // (Optional) store channel ref if you still want it elsewhere
//     presenceChannelRef.current = channel;

//     return () => {
//       // ✅ Clear all typing timers safely using the snapshot map
//       timeoutsMap.forEach((id) => window.clearTimeout(id));
//       timeoutsMap.clear();

//       // ✅ Remove THIS channel instance (no ref usage)
//       supabase.removeChannel(channel);

//       // (Optional) clear ref
//       if (presenceChannelRef.current === channel) {
//         presenceChannelRef.current = null;
//       }
//     };

//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- SEND MESSAGE -------------------- */
//   // Insert message into DB; realtime will show it for everyone
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     const content = text.trim();
//     if (!content) return;

//     // Detect @AI or /ai
//     const isAI =
//       content.toLowerCase().startsWith("@ai") ||
//       content.toLowerCase().startsWith("/ai");

//     setSending(true);
//     setError(null);

//     try {
//       if (isAI) {
//         // 1) Save user's message normally (so others see the question)
//         await supabase.from("messages").insert({
//           group_id: groupId,
//           sender_id: session.user.id,
//           role: "user",
//           content,
//         });

//         // 2) Build context (last N messages)
//         const context = messages.slice(-30).map((m) => ({
//           role: m.role,
//           content: m.content,
//           sender_id: m.sender_id,
//           created_at: m.created_at,
//         }));

//         // 3) Call FastAPI (AI will insert its own reply)
//         await askAI({
//           groupId,
//           userQuestion: content.replace(/^(@ai|\/ai)\s*/i, ""),
//           context,
//         });

//         setText("");
//         setSending(false);
//         return;
//       }

//       // Normal message
//       const { error } = await supabase.from("messages").insert({
//         group_id: groupId,
//         sender_id: session.user.id,
//         role: "user",
//         content,
//       });

//       if (error) setError(error.message);
//       else setText("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "AI error");
//     } finally {
//       setSending(false);
//     }
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   // Send "typing" at most once every 700ms
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     const ch = presenceChannelRef.current;
//     if (!ch) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void ch.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   // Fast check for online members
//   const onlineSet = useMemo(
//     () => new Set(onlineUsers.map((u) => u.user_id)),
//     [onlineUsers]
//   );

//   // Best display info comes from DB members; presence is only fallback
//   const displayByUserId = useMemo(() => {
//     const map = new Map<
//       string,
//       {
//         email?: string;
//         display_name?: string;
//         last_seen_at?: string | null;
//         role?: string;
//       }
//     >();

//     for (const m of members) {
//       map.set(m.user_id, {
//         email: m.email,
//         display_name: m.display_name,
//         last_seen_at: m.last_seen_at,
//         role: m.role,
//       });
//     }

//     for (const u of onlineUsers) {
//       const existing = map.get(u.user_id) ?? {};
//       map.set(u.user_id, { ...existing, email: existing.email ?? u.email });
//     }

//     if (session?.user?.id && session.user.email) {
//       const existing = map.get(session.user.id) ?? {};
//       map.set(session.user.id, {
//         ...existing,
//         email: existing.email ?? session.user.email,
//       });
//     }

//     return map;
//   }, [members, onlineUsers, session]);

//   // Build typing text using usernames
//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers.map((uid) => {
//       const info = displayByUserId.get(uid);
//       const dn = info?.display_name?.trim();
//       return dn ? dn : usernameFromEmail(info?.email);
//     });

//     const clean = names.filter((n) => n && n !== "unknown");
//     if (clean.length === 0) return "Someone is typing...";

//     const shown = clean.slice(0, 2);
//     if (clean.length === 1) return `${shown[0]} is typing...`;
//     if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, displayByUserId]);

//   /* -------------------- RENDER GUARDS -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   // ✅ UI code continues below...
//   return (
//     <main style={{ padding: 24 }}>
//       {/* ================= HEADER ================= */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>
//       <hr style={{ margin: "16px 0" }} />

//       {/* ================= MAIN LAYOUT ================= */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 280px",
//           gap: 14,
//           alignItems: "start",
//         }}
//       >
//         {/* ================= CHAT COLUMN ================= */}
//         <div>
//           {/* ---------- Stats row ---------- */}
//           <div
//             style={{
//               marginBottom: 8,
//               display: "flex",
//               gap: 12,
//               flexWrap: "wrap",
//             }}
//           >
//             <span>
//               🟢 Online: <b>{onlineUsers.length}</b>
//             </span>
//             <span>
//               👥 Members: <b>{members.length}</b>
//             </span>
//             {typingText && <span>✍️ {typingText}</span>}

//             {!shouldAutoScrollRef.current && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   shouldAutoScrollRef.current = true;
//                   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//                 }}
//                 style={{
//                   marginLeft: "auto",
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                 }}
//               >
//                 Jump to latest ↓
//               </button>
//             )}
//           </div>

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           {/* ---------- Messages box ---------- */}
//           <div
//             ref={scrollContainerRef}
//             onScroll={onScrollMessages}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: 10,
//               padding: 12,
//               height: 420,
//               overflowY: "auto",
//               background: "#5c5959ff",
//             }}
//           >
//             {messages.length === 0 ? (
//               <p>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 // const isMe = m.sender_id === session.user.id;
//                 const isMe = !!m.sender_id && m.sender_id === session.user.id;
//                 // const info = displayByUserId.get(m.sender_id);
//                 const info = m.sender_id
//                   ? displayByUserId.get(m.sender_id)
//                   : undefined;
//                 const email = info?.email;
//                 const displayName = info?.display_name?.trim();
//                 const senderName =
//                   m.role === "ai"
//                     ? "🤖 AI"
//                     : displayName || usernameFromEmail(email);

//                 return (
//                   <div
//                     key={m.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: isMe ? "flex-end" : "flex-start",
//                       marginBottom: 10,
//                     }}
//                   >
//                     <div
//                       style={{
//                         maxWidth: "70%",
//                         padding: "10px 12px",
//                         borderRadius: 12,
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       {/* ---------- Message header ---------- */}
//                       <div
//                         style={{
//                           fontSize: 12,
//                           opacity: 0.9,
//                           marginBottom: 4,
//                           display: "flex",
//                           gap: 8,
//                         }}
//                       >
//                         <b>{senderName}</b>
//                         <span>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       {/* ---------- Message content ---------- */}
//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

//                       {/* ---------- Explain button (popup-only, NOT saved) ---------- */}
//                       {m.role !== "ai" && (
//                         <button
//                           type="button"
//                           style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}
//                           onClick={async () => {
//                             try {
//                               // Open popup + reset state
//                               setExplainOpen(true);
//                               setExplainText(null);
//                               setError(null);

//                               // Show temporary loading text in popup
//                               setExplainText("Thinking...");

//                               // Context (short)
//                               const ctx = messages.slice(-20).map((x) => ({
//                                 role: x.role,
//                                 content: x.content,
//                                 sender_id: x.sender_id ?? null,
//                                 created_at: x.created_at,
//                               }));

//                               // ✅ IMPORTANT: Use askAIExplain (should NOT insert into DB)
//                               const { reply } = await askAIExplain({
//                                 groupId,
//                                 userQuestion: `Explain this message in simple words (private popup only, do not post in group):\n"${m.content}"`,
//                                 context: ctx,
//                               });

//                               // ✅ Show only in popup
//                               setExplainText(reply);
//                             } catch (e: unknown) {
//                               const msg =
//                                 e instanceof Error
//                                   ? e.message
//                                   : "Failed to explain.";
//                               setExplainText("❌ " + msg);
//                             }
//                           }}
//                         >
//                           Explain
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           {/* ---------- Send message ---------- */}
//           <form
//             onSubmit={sendMessage}
//             style={{ display: "flex", gap: 8, marginTop: 12 }}
//           >
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (use "@AI ...")'
//               style={{ flex: 1, padding: 12, borderRadius: 10 }}
//             />
//             <button
//               disabled={sending}
//               style={{ padding: "12px 16px", borderRadius: 10 }}
//             >
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* ================= MEMBERS PANEL ================= */}
//         <aside
//           style={{
//             border: "1px solid #ddd",
//             borderRadius: 12,
//             padding: 12,
//             background: "#4cd678ff",
//             height: 520,
//             overflowY: "auto",
//           }}
//         >
//           <div style={{ display: "flex", justifyContent: "space-between" }}>
//             <h3>Members</h3>
//             <button onClick={() => void loadMembers()}>Refresh</button>
//           </div>

//           <p style={{ fontSize: 13 }}>🟢 Online / 🔴 Offline</p>

//           <div style={{ display: "grid", gap: 10 }}>
//             {members.map((m) => {
//               const info = displayByUserId.get(m.user_id);
//               const email = info?.email ?? m.email;
//               const name =
//                 info?.display_name?.trim() || usernameFromEmail(email);
//               const isOnline = onlineSet.has(m.user_id);
//               const isAdmin = m.role === "admin";

//               return (
//                 <div
//                   key={m.user_id}
//                   style={{
//                     display: "flex",
//                     gap: 10,
//                     padding: 10,
//                     borderRadius: 10,
//                     background: "rgba(255,255,255,0.4)",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: 10,
//                       height: 10,
//                       borderRadius: "50%",
//                       background: isOnline ? "green" : "red",
//                       marginTop: 6,
//                     }}
//                   />
//                   <div>
//                     <div style={{ fontWeight: 700 }}>
//                       {m.user_id === session.user.id ? `${name} (You)` : name}
//                       {isAdmin && (
//                         <span style={{ marginLeft: 6, fontSize: 11 }}>
//                           Admin
//                         </span>
//                       )}
//                     </div>
//                     <div style={{ fontSize: 12 }}>
//                       {isOnline ? "Online" : formatLastSeen(info?.last_seen_at)}
//                     </div>
//                     <div style={{ fontSize: 12, opacity: 0.7 }}>{email}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </aside>
//       </div>

//       {/* ================= EXPLAIN POPUP (popup-only, discard on close) ================= */}
//       {explainOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 100,
//           }}
//           onClick={() => {
//             // ✅ discard on close
//             setExplainOpen(false);
//             setExplainText(null);
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#7d8dceff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "90%",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <h3 style={{ margin: 0 }}>AI Explanation</h3>
//               <button
//                 type="button"
//                 onClick={() => {
//                   // ✅ discard on close
//                   setExplainOpen(false);
//                   setExplainText(null);
//                 }}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Close
//               </button>
//             </div>

//             <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
//               {explainText ?? "—"}
//             </p>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

// edit now

// // Updated GroupChatPage with Leave Group functionality
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import type { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { askAI } from "@/lib/ai";
// import { askAIExplain } from "@/lib/ai";

// /* -------------------- TYPES -------------------- */
// // Message row coming from `public.messages`
// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string | null;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// // Presence payload we track in the realtime presence channel
// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// // Group member row (joined with profiles)
// type Member = {
//   user_id: string;
//   role: string;
//   email?: string;
//   display_name?: string;
//   last_seen_at?: string | null;
//   deleted_at?: string | null;
// };

// /* -------------------- HELPERS -------------------- */
// // Convert email -> username (before @)
// function usernameFromEmail(email?: string): string {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// // Human readable last seen string
// function formatLastSeen(ts?: string | null): string {
//   if (!ts) return "Last seen: —";
//   return `Last seen: ${new Date(ts).toLocaleString()}`;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   /* -------------------- STATE -------------------- */
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   // Explain popup
//   const [explainOpen, setExplainOpen] = useState(false);
//   const [explainText, setExplainText] = useState<string | null>(null);

//   // ✅ NEW: Track if I've left the group
//   const [leftAt, setLeftAt] = useState<string | null>(null);

//   /* -------------------- REFS -------------------- */
//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   // Keep channel refs so we can cleanly unsubscribe on unmount / group change
//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   // Throttle typing events
//   const lastTypingSentRef = useRef<number>(0);

//   // Track typing timeouts per user so we can replace/clear them
//   const typingTimeoutsRef = useRef<Map<string, number>>(new Map());

//   // Avoid forcing auto-scroll when user is reading old messages
//   const shouldAutoScrollRef = useRef(true);
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);

//   /* -------------------- DERIVED HELPERS -------------------- */
//   // ✅ Find my member row
//   const myMemberRow = useMemo(() => {
//     if (!session) return null;
//     return members.find((m) => m.user_id === session.user.id) ?? null;
//   }, [members, session]);

//   // ✅ Am I an active member?
//   const amIActive = useMemo(() => {
//     return !!myMemberRow && !myMemberRow.deleted_at;
//   }, [myMemberRow]);

//   // ✅ Am I an admin?
//   const amIAdmin = useMemo(() => {
//     return (
//       !!myMemberRow &&
//       (myMemberRow.role ?? "").toLowerCase() === "admin" &&
//       !myMemberRow.deleted_at
//     );
//   }, [myMemberRow]);

//   /* -------------------- AUTH GUARD -------------------- */
//   // If user is not logged in, redirect to login
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- DB: UPDATE LAST SEEN -------------------- */
//   // Update last_seen_at for the current user
//   const updateMyLastSeen = async () => {
//     if (!session) return;

//     const { error } = await supabase
//       .from("profiles")
//       .update({ last_seen_at: new Date().toISOString() })
//       .eq("id", session.user.id);

//     if (error) {
//       // Keep silent in UI; you can log if needed.
//     }
//   };

//   /* -------------------- DB: LOAD MEMBERS -------------------- */
//   // Load all group members (with their profiles)
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         role,
//         deleted_at,
//         profiles:profiles (
//           email,
//           display_name,
//           last_seen_at
//         )
//       `
//       )
//       .eq("group_id", groupId);
      

//     if (error) {
//       setError(error.message);
//       setMembers([]);
//       return;
//     }

//     // Map the nested join result into a clean Member[]
//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as {
//         user_id: string;
//         role: string;
//         deleted_at?: string | null;
//         profiles?: {
//           email?: string;
//           display_name?: string;
//           last_seen_at?: string | null;
//         } | null;
//       };

//       return {
//         user_id: r.user_id,
//         role: r.role ?? "member",
//         deleted_at: r.deleted_at ?? null,
//         email: r.profiles?.email ?? undefined,
//         display_name: r.profiles?.display_name ?? undefined,
//         last_seen_at: r.profiles?.last_seen_at ?? null,
//       };
//     })
//     // 🔴 THIS is the key fix
//     .filter((m) => m.deleted_at === null);;

//     // Deduplicate just in case
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   /* -------------------- DB: LOAD INITIAL MESSAGES -------------------- */
//   // Load last 200 messages for the group
//   const loadMessages = async () => {
//     if (!session) return;

//     setLoadingMsgs(true);
//     setError(null);

//     const { data, error } = await supabase
//       .from("messages")
//       .select("id,group_id,sender_id,role,content,created_at")
//       .eq("group_id", groupId)
//       .order("created_at", { ascending: true })
//       .limit(200);

//     if (error) {
//       setError(error.message);
//       setMessages([]);
//     } else {
//       setMessages((data ?? []) as Msg[]);
//     }

//     setLoadingMsgs(false);
//   };

//   /* -------------------- INITIAL LOAD -------------------- */
//   // When session or group changes, load members + messages
//   useEffect(() => {
//     if (!session) return;
//     void loadMembers();
//     void loadMessages();
//     void updateMyLastSeen();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- SYNC LEFT AT -------------------- */
//   // ✅ When members load, sync leftAt state
//   useEffect(() => {
//     if (!myMemberRow) return;
//     setLeftAt(myMemberRow.deleted_at ?? null);
//   }, [myMemberRow]);

//   /* -------------------- REFRESH: LAST SEEN + MEMBERS (LIGHT) -------------------- */
//   // Keep last seen updated and refresh members sometimes (not too often)
//   useEffect(() => {
//     if (!session) return;

//     const onVisibility = () => {
//       void updateMyLastSeen();
//     };

//     const onBeforeUnload = () => {
//       void updateMyLastSeen();
//     };

//     document.addEventListener("visibilitychange", onVisibility);
//     window.addEventListener("beforeunload", onBeforeUnload);

//     // Refresh members every 30s
//     const interval = window.setInterval(() => {
//       void loadMembers();
//       void updateMyLastSeen();
//     }, 30000);

//     return () => {
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.removeEventListener("beforeunload", onBeforeUnload);
//       window.clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- STOP REALTIME -------------------- */
//   // ✅ Stop all realtime channels (messages + presence)
//   const stopRealtime = () => {
//     // Stop messages realtime
//     if (msgChannelRef.current) {
//       supabase.removeChannel(msgChannelRef.current);
//       msgChannelRef.current = null;
//     }
//     // Stop presence realtime
//     if (presenceChannelRef.current) {
//       supabase.removeChannel(presenceChannelRef.current);
//       presenceChannelRef.current = null;
//     }
//       // ✅ Clear UI presence/typing immediately for leaver
//     setOnlineUsers([]);
//     setTypingUsers([]);

//     // ✅ clear typing timers
//     typingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
//     typingTimeoutsRef.current.clear();
//   };

//   /* -------------------- REALTIME: MESSAGES (INSERT) -------------------- */
//   // Listen for new messages and append locally (no full reload)
//   useEffect(() => {
//     if (!session) return;

//     const channel = supabase
//       .channel(`messages:${groupId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `group_id=eq.${groupId}`,
//         },
//         (payload) => {
//           const newMsg = payload.new as Msg;

//           setMessages((prev) => {
//             // Avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });
//         }
//       )
//       .subscribe();

//     msgChannelRef.current = channel;

//     return () => {
//       if (msgChannelRef.current) {
//         supabase.removeChannel(msgChannelRef.current);
//         msgChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO-SCROLL (SMART) -------------------- */
//   // Only auto-scroll if user is already near bottom
//   useEffect(() => {
//     if (!shouldAutoScrollRef.current) return;
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Track if user is reading old messages (scrolling up)
//   const onScrollMessages = () => {
//     const el = scrollContainerRef.current;
//     if (!el) return;

//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     // If user is within ~120px from bottom, we allow auto-scroll
//     shouldAutoScrollRef.current = distanceFromBottom < 120;
//   };

//   /* -------------------- REALTIME: PRESENCE + TYPING -------------------- */
//   // Presence gives online/offline, typing uses broadcast
//   useEffect(() => {
//     if (!session) return;

//     const timeoutsMap = typingTimeoutsRef.current;

//     const channel = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     // Helper: recompute online users from presence state
//     const recomputeOnline = () => {
//       const state = channel.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];

//       Object.values(state).forEach((arr) => {
//         arr.forEach((u) => list.push(u));
//       });

//       // Dedup by user_id
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     // Keep online list updated
//     channel.on("presence", { event: "sync" }, recomputeOnline);
//     channel.on("presence", { event: "join" }, recomputeOnline);
//     channel.on("presence", { event: "leave" }, recomputeOnline);

//     // Handle typing broadcast
//     channel.on("broadcast", { event: "typing" }, (evt) => {
//       const from = (evt?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       // Clear previous timeout for this user
//       const prevId = timeoutsMap.get(from);
//       if (prevId) window.clearTimeout(prevId);

//       // Create a new timeout
//       const tId = window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//         timeoutsMap.delete(from);
//       }, 2200);

//       timeoutsMap.set(from, tId);
//     });

//     // Subscribe and track ourselves as online
//     channel.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await channel.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });

//         void loadMembers();
//       }
//     });

//     presenceChannelRef.current = channel;

//     return () => {
//       // Clear all typing timers safely
//       timeoutsMap.forEach((id) => window.clearTimeout(id));
//       timeoutsMap.clear();

//       // Remove channel
//       supabase.removeChannel(channel);

//       if (presenceChannelRef.current === channel) {
//         presenceChannelRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- LEAVE GROUP -------------------- */
//   // ✅ Leave group function
//   // const leaveGroup = async () => {
//   //   if (!session) return;

//   //   const ok = window.confirm("Are you sure you want to leave this group?");
//   //   if (!ok) return;

//   //   const nowIso = new Date().toISOString();

//   //   const { error } = await supabase
//   //     .from("group_members")
//   //     .update({ deleted_at: nowIso })
//   //     .eq("group_id", groupId)
//   //     .eq("user_id", session.user.id);

//   //   if (error) {
//   //     setError(error.message);
//   //     return;
//   //   }

//   //   // ✅ Immediately stop receiving any new realtime updates
//   //   stopRealtime();

//   //   // ✅ Mark left locally
//   //   setLeftAt(nowIso);

//   //   // ✅ Keep only messages up to leave time (optional, clean UX)
//   //   setMessages((prev) =>
//   //     prev.filter(
//   //       (m) =>
//   //         new Date(m.created_at).getTime() <= new Date(nowIso).getTime()
//   //     )
//   //   );

//   //   // Refresh members panel
//   //   void loadMembers();
//   // };

//   const leaveGroup = async () => {
//     if (!session) return;

//     const ok = window.confirm("Are you sure you want to leave this group?");
//     if (!ok) return;

//     const nowIso = new Date().toISOString();

//     console.log("Leaving group:", {
//       groupId,
//       userId: session.user.id,
//       time: nowIso,
//     });

//     const { data, error } = await supabase
//       .from("group_members")
//       .update({ deleted_at: nowIso })
//       .eq("group_id", groupId)
//       .eq("user_id", session.user.id)
//       .select(); // 👈 force Supabase to return updated row

//     console.log("Leave result:", { data, error });

//     if (error) {
//       console.error("Leave group failed:", error);
//       setError(error.message);
//       return;
//     }

//     if (!data || data.length === 0) {
//       setError("Leave failed: membership not found.");
//       return;
//     }

//     // ✅ Stop realtime immediately
//     stopRealtime();

//     // ✅ Mark locally as left
//     setLeftAt(nowIso);

//     // ✅ Remove messages after leave time
//     setMessages((prev) =>
//       prev.filter(
//         (m) =>
//           new Date(m.created_at).getTime() <=
//           new Date(nowIso).getTime()
//       )
//     );

//     // Refresh members UI
//     void loadMembers();
//   };


//   /* -------------------- SEND MESSAGE -------------------- */
//   // Insert message into DB; realtime will show it for everyone
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     // ✅ Block sending if not active
//     if (!amIActive) {
//       setError("You have left this group. You cannot send new messages.");
//       return;
//     }

//     const content = text.trim();
//     if (!content) return;

//     // Detect @AI or /ai
//     const isAI =
//       content.toLowerCase().startsWith("@ai") ||
//       content.toLowerCase().startsWith("/ai");

//     setSending(true);
//     setError(null);

//     try {
//       if (isAI) {
//         // 1) Save user's message normally
//         await supabase.from("messages").insert({
//           group_id: groupId,
//           sender_id: session.user.id,
//           role: "user",
//           content,
//         });

//         // 2) Build context
//         const context = messages.slice(-30).map((m) => ({
//           role: m.role,
//           content: m.content,
//           sender_id: m.sender_id,
//           created_at: m.created_at,
//         }));

//         // 3) Call FastAPI
//         await askAI({
//           groupId,
//           userQuestion: content.replace(/^(@ai|\/ai)\s*/i, ""),
//           context,
//         });

//         setText("");
//         setSending(false);
//         return;
//       }

//       // Normal message
//       const { error } = await supabase.from("messages").insert({
//         group_id: groupId,
//         sender_id: session.user.id,
//         role: "user",
//         content,
//       });

//       if (error) setError(error.message);
//       else setText("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "AI error");
//     } finally {
//       setSending(false);
//     }
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   // Send "typing" at most once every 700ms
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     const ch = presenceChannelRef.current;
//     if (!ch) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void ch.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   // Fast check for online members
//   const onlineSet = useMemo(
//     () => new Set(onlineUsers.map((u) => u.user_id)),
//     [onlineUsers]
//   );

//   // Best display info comes from DB members; presence is only fallback
//   const displayByUserId = useMemo(() => {
//     const map = new Map<
//       string,
//       {
//         email?: string;
//         display_name?: string;
//         last_seen_at?: string | null;
//         role?: string;
//       }
//     >();

//     for (const m of members) {
//       map.set(m.user_id, {
//         email: m.email,
//         display_name: m.display_name,
//         last_seen_at: m.last_seen_at,
//         role: m.role,
//       });
//     }

//     for (const u of onlineUsers) {
//       const existing = map.get(u.user_id) ?? {};
//       map.set(u.user_id, { ...existing, email: existing.email ?? u.email });
//     }

//     if (session?.user?.id && session.user.email) {
//       const existing = map.get(session.user.id) ?? {};
//       map.set(session.user.id, {
//         ...existing,
//         email: existing.email ?? session.user.email,
//       });
//     }

//     return map;
//   }, [members, onlineUsers, session]);

//   // Build typing text using usernames
//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers.map((uid) => {
//       const info = displayByUserId.get(uid);
//       const dn = info?.display_name?.trim();
//       return dn ? dn : usernameFromEmail(info?.email);
//     });

//     const clean = names.filter((n) => n && n !== "unknown");
//     if (clean.length === 0) return "Someone is typing...";

//     const shown = clean.slice(0, 2);
//     if (clean.length === 1) return `${shown[0]} is typing...`;
//     if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, displayByUserId]);

//   /* -------------------- RENDER GUARDS -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   /* -------------------- RENDER -------------------- */
//   return (
//     <main style={{ padding: 24 }}>
//       {/* ================= HEADER ================= */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>
//       <hr style={{ margin: "16px 0" }} />

//       {/* ================= MAIN LAYOUT ================= */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 280px",
//           gap: 14,
//           alignItems: "start",
//         }}
//       >
//         {/* ================= CHAT COLUMN ================= */}
//         <div>
//           {/* ---------- Stats row ---------- */}
//           <div
//             style={{
//               marginBottom: 8,
//               display: "flex",
//               gap: 12,
//               flexWrap: "wrap",
//             }}
//           >
//             <span>
//               🟢 Online: <b>{onlineUsers.length}</b>
//             </span>
//             <span>
//               👥 Members: <b>{members.length}</b>
//             </span>
//             {typingText && <span>✍️ {typingText}</span>}

//             {!shouldAutoScrollRef.current && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   shouldAutoScrollRef.current = true;
//                   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//                 }}
//                 style={{
//                   marginLeft: "auto",
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                 }}
//               >
//                 Jump to latest ↓
//               </button>
//             )}
//           </div>

//           {/* ✅ Show banner if user has left */}
//           {!amIActive && (
//             <p style={{ color: "#b45309", marginTop: 8 }}>
//               You have left this group. You can view old messages only.
//             </p>
//           )}

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           {/* ---------- Messages box ---------- */}
//           <div
//             ref={scrollContainerRef}
//             onScroll={onScrollMessages}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: 10,
//               padding: 12,
//               height: 420,
//               overflowY: "auto",
//               background: "#5c5959ff",
//             }}
//           >
//             {messages.length === 0 ? (
//               <p>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 const isMe = !!m.sender_id && m.sender_id === session.user.id;
//                 const info = m.sender_id
//                   ? displayByUserId.get(m.sender_id)
//                   : undefined;
//                 const email = info?.email;
//                 const displayName = info?.display_name?.trim();
//                 const senderName =
//                   m.role === "ai"
//                     ? "🤖 AI"
//                     : displayName || usernameFromEmail(email);

//                 return (
//                   <div
//                     key={m.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: isMe ? "flex-end" : "flex-start",
//                       marginBottom: 10,
//                     }}
//                   >
//                     <div
//                       style={{
//                         maxWidth: "70%",
//                         padding: "10px 12px",
//                         borderRadius: 12,
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       {/* ---------- Message header ---------- */}
//                       <div
//                         style={{
//                           fontSize: 12,
//                           opacity: 0.9,
//                           marginBottom: 4,
//                           display: "flex",
//                           gap: 8,
//                         }}
//                       >
//                         <b>{senderName}</b>
//                         <span>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       {/* ---------- Message content ---------- */}
//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

//                       {/* ---------- Explain button ---------- */}
//                       {m.role !== "ai" && (
//                         <button
//                           type="button"
//                           style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}
//                           onClick={async () => {
//                             try {
//                               setExplainOpen(true);
//                               setExplainText(null);
//                               setError(null);

//                               setExplainText("Thinking...");

//                               const ctx = messages.slice(-20).map((x) => ({
//                                 role: x.role,
//                                 content: x.content,
//                                 sender_id: x.sender_id ?? null,
//                                 created_at: x.created_at,
//                               }));

//                               const { reply } = await askAIExplain({
//                                 groupId,
//                                 userQuestion: `Explain this message in simple words (private popup only, do not post in group):\n"${m.content}"`,
//                                 context: ctx,
//                               });

//                               setExplainText(reply);
//                             } catch (e: unknown) {
//                               const msg =
//                                 e instanceof Error
//                                   ? e.message
//                                   : "Failed to explain.";
//                               setExplainText("❌ " + msg);
//                             }
//                           }}
//                         >
//                           Explain
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           {/* ---------- Send message ---------- */}
//           <form
//             onSubmit={sendMessage}
//             style={{ display: "flex", gap: 8, marginTop: 12 }}
//           >
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (use "@AI ...")'
//               style={{ flex: 1, padding: 12, borderRadius: 10 }}
//               disabled={!amIActive || sending}
//             />
//             <button
//               disabled={!amIActive || sending}
//               style={{ padding: "12px 16px", borderRadius: 10 }}
//             >
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* ================= MEMBERS PANEL ================= */}
//         <aside
//           style={{
//             border: "1px solid #ddd",
//             borderRadius: 12,
//             padding: 12,
//             background: "#4cd678ff",
//             height: 520,
//             overflowY: "auto",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: 8,
//             }}
//           >
//             <h3 style={{ margin: 0 }}>Members</h3>
//             <div style={{ display: "flex", gap: 6 }}>
//               <button
//                 type="button"
//                 onClick={() => void loadMembers()}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Refresh
//               </button>
//               {/* ✅ Leave Group button */}
//               <button
//                 type="button"
//                 onClick={leaveGroup}
//                 disabled={!amIActive}
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                   opacity: amIActive ? 1 : 0.5,
//                 }}
//               >
//                 Leave Group
//               </button>
//             </div>
//           </div>

//           <p style={{ fontSize: 13, marginTop: 8 }}>🟢 Online / 🔴 Offline</p>

//           <div style={{ display: "grid", gap: 10 }}>
//             {members.map((m) => {
//               const info = displayByUserId.get(m.user_id);
//               const email = info?.email ?? m.email;
//               const name =
//                 info?.display_name?.trim() || usernameFromEmail(email);
//               const isOnline = onlineSet.has(m.user_id);
//               const isAdmin = m.role === "admin";

//               return (
//                 <div
//                   key={m.user_id}
//                   style={{
//                     display: "flex",
//                     gap: 10,
//                     padding: 10,
//                     borderRadius: 10,
//                     background: "rgba(255,255,255,0.4)",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: 10,
//                       height: 10,
//                       borderRadius: "50%",
//                       background: isOnline ? "green" : "red",
//                       marginTop: 6,
//                     }}
//                   />
//                   <div>
//                     <div style={{ fontWeight: 700 }}>
//                       {m.user_id === session.user.id ? `${name} (You)` : name}
//                       {isAdmin && (
//                         <span style={{ marginLeft: 6, fontSize: 11 }}>
//                           Admin
//                         </span>
//                       )}
//                     </div>
//                     <div style={{ fontSize: 12 }}>
//                       {isOnline ? "Online" : formatLastSeen(info?.last_seen_at)}
//                     </div>
//                     <div style={{ fontSize: 12, opacity: 0.7 }}>{email}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </aside>
//       </div>

//       {/* ================= EXPLAIN POPUP ================= */}
//       {explainOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 100,
//           }}
//           onClick={() => {
//             setExplainOpen(false);
//             setExplainText(null);
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#7d8dceff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "90%",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <h3 style={{ margin: 0 }}>AI Explanation</h3>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setExplainOpen(false);
//                   setExplainText(null);
//                 }}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Close
//               </button>
//             </div>

//             <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
//               {explainText ?? "—"}
//             </p>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }


// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import type { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { askAI } from "@/lib/ai";
// import { askAIExplain } from "@/lib/ai";

// /* -------------------- TYPES -------------------- */
// // Message row coming from `public.messages`
// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string | null;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// // Presence payload we track in the realtime presence channel
// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// // Group member row (joined with profiles)
// type Member = {
//   user_id: string;
//   role: string;
//   email?: string;
//   display_name?: string;
//   last_seen_at?: string | null;
//   deleted_at?: string | null;
// };

// /* -------------------- HELPERS -------------------- */
// // Convert email -> username (before @)
// function usernameFromEmail(email?: string): string {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// // Human readable last seen string
// function formatLastSeen(ts?: string | null): string {
//   if (!ts) return "Last seen: —";
//   return `Last seen: ${new Date(ts).toLocaleString()}`;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   /* -------------------- STATE -------------------- */
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   // Explain popup
//   const [explainOpen, setExplainOpen] = useState(false);
//   const [explainText, setExplainText] = useState<string | null>(null);

//   // ✅ NEW: Track if I've left the group
//   const [leftAt, setLeftAt] = useState<string | null>(null);

//   /* -------------------- REFS -------------------- */
//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   // Keep channel refs so we can cleanly unsubscribe on unmount / group change
//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   // Throttle typing events
//   const lastTypingSentRef = useRef<number>(0);

//   // Track typing timeouts per user so we can replace/clear them
//   const typingTimeoutsRef = useRef<Map<string, number>>(new Map());

//   // Avoid forcing auto-scroll when user is reading old messages
//   const shouldAutoScrollRef = useRef(true);
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);

//   /* -------------------- DERIVED HELPERS -------------------- */
//   // ✅ Find my member row
//   const myMemberRow = useMemo(() => {
//     if (!session) return null;
//     return members.find((m) => m.user_id === session.user.id) ?? null;
//   }, [members, session]);

//   // ✅ Am I an active member?
//   const amIActive = useMemo(() => {
//     return !!myMemberRow && !myMemberRow.deleted_at;
//   }, [myMemberRow]);

//   // ✅ Am I an admin?
//   const amIAdmin = useMemo(() => {
//     return (
//       !!myMemberRow &&
//       (myMemberRow.role ?? "").toLowerCase() === "admin" &&
//       !myMemberRow.deleted_at
//     );
//   }, [myMemberRow]);

//   /* -------------------- AUTH GUARD -------------------- */
//   // If user is not logged in, redirect to login
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- DB: UPDATE LAST SEEN -------------------- */
//   // Update last_seen_at for the current user
//   const updateMyLastSeen = async () => {
//     if (!session) return;

//     const { error } = await supabase
//       .from("profiles")
//       .update({ last_seen_at: new Date().toISOString() })
//       .eq("id", session.user.id);

//     if (error) {
//       // Keep silent in UI; you can log if needed.
//     }
//   };

//   /* -------------------- DB: LOAD MEMBERS -------------------- */
//   // Load all group members (with their profiles)
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         role,
//         deleted_at,
//         profiles:profiles (
//           email,
//           display_name,
//           last_seen_at
//         )
//       `
//       )
//       .eq("group_id", groupId);
      

//     if (error) {
//       setError(error.message);
//       setMembers([]);
//       return;
//     }

//     // Map the nested join result into a clean Member[]
//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as {
//         user_id: string;
//         role: string;
//         deleted_at?: string | null;
//         profiles?: {
//           email?: string;
//           display_name?: string;
//           last_seen_at?: string | null;
//         } | null;
//       };

//       return {
//         user_id: r.user_id,
//         role: r.role ?? "member",
//         deleted_at: r.deleted_at ?? null,
//         email: r.profiles?.email ?? undefined,
//         display_name: r.profiles?.display_name ?? undefined,
//         last_seen_at: r.profiles?.last_seen_at ?? null,
//       };
//     })
//     // 🔴 Filter out members who have left
//     .filter((m) => m.deleted_at === null);

//     // Deduplicate just in case
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   /* -------------------- DB: LOAD INITIAL MESSAGES -------------------- */
//   // Load last 200 messages for the group
//   const loadMessages = async () => {
//     if (!session) return;

//     setLoadingMsgs(true);
//     setError(null);

//     const { data, error } = await supabase
//       .from("messages")
//       .select("id,group_id,sender_id,role,content,created_at")
//       .eq("group_id", groupId)
//       .order("created_at", { ascending: true })
//       .limit(200);

//     if (error) {
//       setError(error.message);
//       setMessages([]);
//     } else {
//       setMessages((data ?? []) as Msg[]);
//     }

//     setLoadingMsgs(false);
//   };

//   /* -------------------- INITIAL LOAD -------------------- */
//   // When session or group changes, load members + messages
//   useEffect(() => {
//     if (!session) return;
//     void loadMembers();
//     void loadMessages();
//     void updateMyLastSeen();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- SYNC LEFT AT -------------------- */
//   // ✅ When members load, sync leftAt state
//   useEffect(() => {
//     if (!myMemberRow) return;
//     setLeftAt(myMemberRow.deleted_at ?? null);
//   }, [myMemberRow]);

//   /* -------------------- REFRESH: LAST SEEN + MEMBERS (LIGHT) -------------------- */
//   // Keep last seen updated and refresh members sometimes (not too often)
//   useEffect(() => {
//     if (!session) return;

//     const onVisibility = () => {
//       void updateMyLastSeen();
//     };

//     const onBeforeUnload = () => {
//       void updateMyLastSeen();
//     };

//     document.addEventListener("visibilitychange", onVisibility);
//     window.addEventListener("beforeunload", onBeforeUnload);

//     // Refresh members every 30s
//     const interval = window.setInterval(() => {
//       void loadMembers();
//       void updateMyLastSeen();
//     }, 30000);

//     return () => {
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.removeEventListener("beforeunload", onBeforeUnload);
//       window.clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- STOP REALTIME -------------------- */
//   // ✅ Stop all realtime channels (messages + presence)
//   const stopRealtime = () => {
//     // Stop messages realtime
//     if (msgChannelRef.current) {
//       supabase.removeChannel(msgChannelRef.current);
//       msgChannelRef.current = null;
//     }
//     // Stop presence realtime
//     if (presenceChannelRef.current) {
//       supabase.removeChannel(presenceChannelRef.current);
//       presenceChannelRef.current = null;
//     }
//     // ✅ Clear UI presence/typing immediately for leaver
//     setOnlineUsers([]);
//     setTypingUsers([]);

//     // ✅ clear typing timers
//     typingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
//     typingTimeoutsRef.current.clear();
//   };

//   /* -------------------- REALTIME: MESSAGES (INSERT) -------------------- */
//   // Listen for new messages and append locally (no full reload)
//   useEffect(() => {
//     if (!session) return;

//     const channel = supabase
//       .channel(`messages:${groupId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `group_id=eq.${groupId}`,
//         },
//         (payload) => {
//           const newMsg = payload.new as Msg;

//           setMessages((prev) => {
//             // Avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });
//         }
//       )
//       .subscribe();

//     msgChannelRef.current = channel;

//     return () => {
//       if (msgChannelRef.current) {
//         supabase.removeChannel(msgChannelRef.current);
//         msgChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO-SCROLL (SMART) -------------------- */
//   // Only auto-scroll if user is already near bottom
//   useEffect(() => {
//     if (!shouldAutoScrollRef.current) return;
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Track if user is reading old messages (scrolling up)
//   const onScrollMessages = () => {
//     const el = scrollContainerRef.current;
//     if (!el) return;

//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     // If user is within ~120px from bottom, we allow auto-scroll
//     shouldAutoScrollRef.current = distanceFromBottom < 120;
//   };

//   /* -------------------- REALTIME: PRESENCE + TYPING -------------------- */
//   // Presence gives online/offline, typing uses broadcast
//   useEffect(() => {
//     if (!session) return;

//     const timeoutsMap = typingTimeoutsRef.current;

//     const channel = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     // Helper: recompute online users from presence state
//     const recomputeOnline = () => {
//       const state = channel.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];

//       Object.values(state).forEach((arr) => {
//         arr.forEach((u) => list.push(u));
//       });

//       // Dedup by user_id
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     // Keep online list updated
//     channel.on("presence", { event: "sync" }, recomputeOnline);
//     channel.on("presence", { event: "join" }, recomputeOnline);
//     channel.on("presence", { event: "leave" }, recomputeOnline);

//     // Handle typing broadcast
//     channel.on("broadcast", { event: "typing" }, (evt) => {
//       const from = (evt?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       // Clear previous timeout for this user
//       const prevId = timeoutsMap.get(from);
//       if (prevId) window.clearTimeout(prevId);

//       // Create a new timeout
//       const tId = window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//         timeoutsMap.delete(from);
//       }, 2200);

//       timeoutsMap.set(from, tId);
//     });

//     // Subscribe and track ourselves as online
//     channel.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await channel.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });

//         void loadMembers();
//       }
//     });

//     presenceChannelRef.current = channel;

//     return () => {
//       // Clear all typing timers safely
//       timeoutsMap.forEach((id) => window.clearTimeout(id));
//       timeoutsMap.clear();

//       // Remove channel
//       supabase.removeChannel(channel);

//       if (presenceChannelRef.current === channel) {
//         presenceChannelRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- LEAVE GROUP -------------------- */
//   // ✅ Leave group function
//   const leaveGroup = async () => {
//     if (!session) return;

//     const ok = window.confirm("Are you sure you want to leave this group?");
//     if (!ok) return;

//     const nowIso = new Date().toISOString();

//     console.log("Leaving group:", {
//       groupId,
//       userId: session.user.id,
//       time: nowIso,
//     });

//     const { data, error } = await supabase
//       .from("group_members")
//       .update({ deleted_at: nowIso })
//       .eq("group_id", groupId)
//       .eq("user_id", session.user.id)
//       .select(); // 👈 force Supabase to return updated row

//     console.log("Leave result:", { data, error });

//     if (error) {
//       console.error("Leave group failed:", error);
//       setError(error.message);
//       return;
//     }

//     if (!data || data.length === 0) {
//       setError("Leave failed: membership not found.");
//       return;
//     }

//     // ✅ Stop realtime immediately
//     stopRealtime();

//     // ✅ Mark locally as left
//     setLeftAt(nowIso);

//     // ✅ Remove messages after leave time
//     setMessages((prev) =>
//       prev.filter(
//         (m) =>
//           new Date(m.created_at).getTime() <=
//           new Date(nowIso).getTime()
//       )
//     );

//     // Refresh members UI
//     void loadMembers();
//   };

//   /* -------------------- SEND MESSAGE -------------------- */
//   // Insert message into DB; realtime will show it for everyone
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     // ✅ Block sending if not active
//     if (!amIActive) {
//       setError("You have left this group. You cannot send new messages.");
//       return;
//     }

//     const content = text.trim();
//     if (!content) return;

//     // Detect @AI or /ai
//     const isAI =
//       content.toLowerCase().startsWith("@ai") ||
//       content.toLowerCase().startsWith("/ai");

//     setSending(true);
//     setError(null);

//     try {
//       if (isAI) {
//         // 1) Save user's message normally
//         await supabase.from("messages").insert({
//           group_id: groupId,
//           sender_id: session.user.id,
//           role: "user",
//           content,
//         });

//         // 2) Build context
//         const context = messages.slice(-30).map((m) => ({
//           role: m.role,
//           content: m.content,
//           sender_id: m.sender_id,
//           created_at: m.created_at,
//         }));

//         // 3) Call FastAPI
//         await askAI({
//           groupId,
//           userQuestion: content.replace(/^(@ai|\/ai)\s*/i, ""),
//           context,
//         });

//         setText("");
//         setSending(false);
//         return;
//       }

//       // Normal message
//       const { error } = await supabase.from("messages").insert({
//         group_id: groupId,
//         sender_id: session.user.id,
//         role: "user",
//         content,
//       });

//       if (error) setError(error.message);
//       else setText("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "AI error");
//     } finally {
//       setSending(false);
//     }
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   // Send "typing" at most once every 700ms
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     const ch = presenceChannelRef.current;
//     if (!ch) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void ch.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   // ✅ Filter online users to only active members
//   const activeMemberSet = useMemo(
//     () => new Set(members.map((m) => m.user_id)),
//     [members]
//   );

//   const onlineActiveUsers = useMemo(
//     () => onlineUsers.filter((u) => activeMemberSet.has(u.user_id)),
//     [onlineUsers, activeMemberSet]
//   );

//   // Fast check for online members (based on active users only)
//   const onlineSet = useMemo(
//     () => new Set(onlineActiveUsers.map((u) => u.user_id)),
//     [onlineActiveUsers]
//   );

//   // Best display info comes from DB members; presence is only fallback
//   const displayByUserId = useMemo(() => {
//     const map = new Map<
//       string,
//       {
//         email?: string;
//         display_name?: string;
//         last_seen_at?: string | null;
//         role?: string;
//       }
//     >();

//     for (const m of members) {
//       map.set(m.user_id, {
//         email: m.email,
//         display_name: m.display_name,
//         last_seen_at: m.last_seen_at,
//         role: m.role,
//       });
//     }

//     for (const u of onlineActiveUsers) {
//       const existing = map.get(u.user_id) ?? {};
//       map.set(u.user_id, { ...existing, email: existing.email ?? u.email });
//     }

//     if (session?.user?.id && session.user.email) {
//       const existing = map.get(session.user.id) ?? {};
//       map.set(session.user.id, {
//         ...existing,
//         email: existing.email ?? session.user.email,
//       });
//     }

//     return map;
//   }, [members, onlineActiveUsers, session]);

//   // Build typing text using usernames
//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers.map((uid) => {
//       const info = displayByUserId.get(uid);
//       const dn = info?.display_name?.trim();
//       return dn ? dn : usernameFromEmail(info?.email);
//     });

//     const clean = names.filter((n) => n && n !== "unknown");
//     if (clean.length === 0) return "Someone is typing...";

//     const shown = clean.slice(0, 2);
//     if (clean.length === 1) return `${shown[0]} is typing...`;
//     if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, displayByUserId]);

//   /* -------------------- RENDER GUARDS -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   /* -------------------- RENDER -------------------- */
//   return (
//     <main style={{ padding: 24 }}>
//       {/* ================= HEADER ================= */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>
//       <hr style={{ margin: "16px 0" }} />

//       {/* ================= MAIN LAYOUT ================= */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 280px",
//           gap: 14,
//           alignItems: "start",
//         }}
//       >
//         {/* ================= CHAT COLUMN ================= */}
//         <div>
//           {/* ---------- Stats row ---------- */}
//           <div
//             style={{
//               marginBottom: 8,
//               display: "flex",
//               gap: 12,
//               flexWrap: "wrap",
//             }}
//           >
//             <span>
//               🟢 Online: <b>{onlineActiveUsers.length}</b>
//             </span>
//             <span>
//               👥 Members: <b>{members.length}</b>
//             </span>
//             {typingText && <span>✍️ {typingText}</span>}

//             {!shouldAutoScrollRef.current && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   shouldAutoScrollRef.current = true;
//                   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//                 }}
//                 style={{
//                   marginLeft: "auto",
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                 }}
//               >
//                 Jump to latest ↓
//               </button>
//             )}
//           </div>

//           {/* ✅ Show banner if user has left */}
//           {!amIActive && (
//             <p style={{ color: "#b45309", marginTop: 8 }}>
//               You have left this group. You can view old messages only.
//             </p>
//           )}

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           {/* ---------- Messages box ---------- */}
//           <div
//             ref={scrollContainerRef}
//             onScroll={onScrollMessages}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: 10,
//               padding: 12,
//               height: 420,
//               overflowY: "auto",
//               background: "#5c5959ff",
//             }}
//           >
//             {messages.length === 0 ? (
//               <p>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 const isMe = !!m.sender_id && m.sender_id === session.user.id;
//                 const info = m.sender_id
//                   ? displayByUserId.get(m.sender_id)
//                   : undefined;
//                 const email = info?.email;
//                 const displayName = info?.display_name?.trim();
//                 const senderName =
//                   m.role === "ai"
//                     ? "🤖 AI"
//                     : displayName || usernameFromEmail(email);

//                 return (
//                   <div
//                     key={m.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: isMe ? "flex-end" : "flex-start",
//                       marginBottom: 10,
//                     }}
//                   >
//                     <div
//                       style={{
//                         maxWidth: "70%",
//                         padding: "10px 12px",
//                         borderRadius: 12,
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       {/* ---------- Message header ---------- */}
//                       <div
//                         style={{
//                           fontSize: 12,
//                           opacity: 0.9,
//                           marginBottom: 4,
//                           display: "flex",
//                           gap: 8,
//                         }}
//                       >
//                         <b>{senderName}</b>
//                         <span>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       {/* ---------- Message content ---------- */}
//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

//                       {/* ---------- Explain button ---------- */}
//                       {m.role !== "ai" && (
//                         <button
//                           type="button"
//                           style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}
//                           onClick={async () => {
//                             try {
//                               setExplainOpen(true);
//                               setExplainText(null);
//                               setError(null);

//                               setExplainText("Thinking...");

//                               const ctx = messages.slice(-20).map((x) => ({
//                                 role: x.role,
//                                 content: x.content,
//                                 sender_id: x.sender_id ?? null,
//                                 created_at: x.created_at,
//                               }));

//                               const { reply } = await askAIExplain({
//                                 groupId,
//                                 userQuestion: `Explain this message in simple words (private popup only, do not post in group):\n"${m.content}"`,
//                                 context: ctx,
//                               });

//                               setExplainText(reply);
//                             } catch (e: unknown) {
//                               const msg =
//                                 e instanceof Error
//                                   ? e.message
//                                   : "Failed to explain.";
//                               setExplainText("❌ " + msg);
//                             }
//                           }}
//                         >
//                           Explain
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           {/* ---------- Send message ---------- */}
//           <form
//             onSubmit={sendMessage}
//             style={{ display: "flex", gap: 8, marginTop: 12 }}
//           >
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (use "@AI ...")'
//               style={{ flex: 1, padding: 12, borderRadius: 10 }}
//               disabled={!amIActive || sending}
//             />
//             <button
//               disabled={!amIActive || sending}
//               style={{ padding: "12px 16px", borderRadius: 10 }}
//             >
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* ================= MEMBERS PANEL ================= */}
//         <aside
//           style={{
//             border: "1px solid #ddd",
//             borderRadius: 12,
//             padding: 12,
//             background: "#4cd678ff",
//             height: 520,
//             overflowY: "auto",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginBottom: 8,
//             }}
//           >
//             <h3 style={{ margin: 0 }}>Members</h3>
//             <div style={{ display: "flex", gap: 6 }}>
//               <button
//                 type="button"
//                 onClick={() => void loadMembers()}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Refresh
//               </button>
//               {/* ✅ Leave Group button */}
//               <button
//                 type="button"
//                 onClick={leaveGroup}
//                 disabled={!amIActive}
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                   opacity: amIActive ? 1 : 0.5,
//                 }}
//               >
//                 Leave Group
//               </button>
//             </div>
//           </div>

//           <p style={{ fontSize: 13, marginTop: 8 }}>🟢 Online / 🔴 Offline</p>

//           <div style={{ display: "grid", gap: 10 }}>
//             {members.map((m) => {
//               const info = displayByUserId.get(m.user_id);
//               const email = info?.email ?? m.email;
//               const name =
//                 info?.display_name?.trim() || usernameFromEmail(email);
//               const isOnline = onlineSet.has(m.user_id);
//               const isAdmin = m.role === "admin";

//               return (
//                 <div
//                   key={m.user_id}
//                   style={{
//                     display: "flex",
//                     gap: 10,
//                     padding: 10,
//                     borderRadius: 10,
//                     background: "rgba(255,255,255,0.4)",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: 10,
//                       height: 10,
//                       borderRadius: "50%",
//                       background: isOnline ? "green" : "red",
//                       marginTop: 6,
//                     }}
//                   />
//                   <div>
//                     <div style={{ fontWeight: 700 }}>
//                       {m.user_id === session.user.id ? `${name} (You)` : name}
//                       {isAdmin && (
//                         <span style={{ marginLeft: 6, fontSize: 11 }}>
//                           Admin
//                         </span>
//                       )}
//                     </div>
//                     <div style={{ fontSize: 12 }}>
//                       {isOnline ? "Online" : formatLastSeen(info?.last_seen_at)}
//                     </div>
//                     <div style={{ fontSize: 12, opacity: 0.7 }}>{email}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </aside>
//       </div>

//       {/* ================= EXPLAIN POPUP ================= */}
//       {explainOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 100,
//           }}
//           onClick={() => {
//             setExplainOpen(false);
//             setExplainText(null);
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#7d8dceff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "90%",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <h3 style={{ margin: 0 }}>AI Explanation</h3>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setExplainOpen(false);
//                   setExplainText(null);
//                 }}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Close
//               </button>
//             </div>

//             <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
//               {explainText ?? "—"}
//             </p>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }


// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import type { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { askAI } from "@/lib/ai";
// import { askAIExplain } from "@/lib/ai";

// /* -------------------- TYPES -------------------- */
// // Message row coming from `public.messages`
// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string | null;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// // Presence payload we track in the realtime presence channel
// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// // Group member row (joined with profiles)
// type Member = {
//   user_id: string;
//   role: string;
//   email?: string;
//   display_name?: string;
//   last_seen_at?: string | null;
//   deleted_at?: string | null;
// };

// /* -------------------- HELPERS -------------------- */
// // Convert email -> username (before @)
// function usernameFromEmail(email?: string): string {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// // Human readable last seen string
// function formatLastSeen(ts?: string | null): string {
//   if (!ts) return "Last seen: —";
//   return `Last seen: ${new Date(ts).toLocaleString()}`;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   /* -------------------- STATE -------------------- */
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   // Explain popup
//   const [explainOpen, setExplainOpen] = useState(false);
//   const [explainText, setExplainText] = useState<string | null>(null);

//   // ✅ Track if I've left the group
//   const [leftAt, setLeftAt] = useState<string | null>(null);

//   /* -------------------- LEAVE GROUP (ADMIN TRANSFER) -------------------- */
//   const [leaveOpen, setLeaveOpen] = useState(false);
//   const [leaveLoading, setLeaveLoading] = useState(false);
//   const [leaveError, setLeaveError] = useState<string | null>(null);
//   const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);

//   const closeLeavePopup = () => {
//     setLeaveOpen(false);
//     setLeaveLoading(false);
//     setLeaveError(null);
//     setSelectedNewAdmin(null);
//   };

//   /* -------------------- REFS -------------------- */
//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   // Keep channel refs so we can cleanly unsubscribe on unmount / group change
//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   // Throttle typing events
//   const lastTypingSentRef = useRef<number>(0);

//   // Track typing timeouts per user so we can replace/clear them
//   const typingTimeoutsRef = useRef<Map<string, number>>(new Map());

//   // Avoid forcing auto-scroll when user is reading old messages
//   const shouldAutoScrollRef = useRef(true);
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);

//   /* -------------------- DERIVED HELPERS -------------------- */
//   // ✅ Active members only (not left)
//   const activeMembers = useMemo(() => {
//     return members.filter((m) => !m.deleted_at);
//   }, [members]);

//   // ✅ Find my member row
//   const myMemberRow = useMemo(() => {
//     if (!session) return null;
//     return members.find((m) => m.user_id === session.user.id) ?? null;
//   }, [members, session]);

//   // ✅ Am I an active member?
//   const amIActive = useMemo(() => {
//     return !!myMemberRow && !myMemberRow.deleted_at;
//   }, [myMemberRow]);

//   // ✅ Am I an admin?
//   const amIAdmin = useMemo(() => {
//     return (
//       !!myMemberRow &&
//       (myMemberRow.role ?? "").toLowerCase() === "admin" &&
//       !myMemberRow.deleted_at
//     );
//   }, [myMemberRow]);

//   // ✅ Non-admin candidates for transfer (active members except me)
//   const nonAdminCandidates = useMemo(() => {
//     if (!session) return [];
//     return activeMembers.filter((m) => m.user_id !== session.user.id);
//   }, [activeMembers, session]);

//   /* -------------------- AUTH GUARD -------------------- */
//   // If user is not logged in, redirect to login
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- DB: UPDATE LAST SEEN -------------------- */
//   // Update last_seen_at for the current user
//   const updateMyLastSeen = async () => {
//     if (!session) return;

//     const { error } = await supabase
//       .from("profiles")
//       .update({ last_seen_at: new Date().toISOString() })
//       .eq("id", session.user.id);

//     if (error) {
//       // Keep silent in UI; you can log if needed.
//     }
//   };

//   /* -------------------- DB: LOAD MEMBERS -------------------- */
//   // Load all group members (with their profiles)
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         role,
//         deleted_at,
//         profiles:profiles (
//           email,
//           display_name,
//           last_seen_at
//         )
//       `
//       )
//       .eq("group_id", groupId);

//     if (error) {
//       setError(error.message);
//       setMembers([]);
//       return;
//     }

//     // Map the nested join result into a clean Member[]
//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as {
//         user_id: string;
//         role: string;
//         deleted_at?: string | null;
//         profiles?: {
//           email?: string;
//           display_name?: string;
//           last_seen_at?: string | null;
//         } | null;
//       };

//       return {
//         user_id: r.user_id,
//         role: r.role ?? "member",
//         deleted_at: r.deleted_at ?? null,
//         email: r.profiles?.email ?? undefined,
//         display_name: r.profiles?.display_name ?? undefined,
//         last_seen_at: r.profiles?.last_seen_at ?? null,
//       };
//     });

//     // Deduplicate just in case
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   /* -------------------- DB: LOAD INITIAL MESSAGES -------------------- */
//   // Load last 200 messages for the group
//   const loadMessages = async () => {
//     if (!session) return;

//     setLoadingMsgs(true);
//     setError(null);

//     const { data, error } = await supabase
//       .from("messages")
//       .select("id,group_id,sender_id,role,content,created_at")
//       .eq("group_id", groupId)
//       .order("created_at", { ascending: true })
//       .limit(200);

//     if (error) {
//       setError(error.message);
//       setMessages([]);
//     } else {
//       setMessages((data ?? []) as Msg[]);
//     }

//     setLoadingMsgs(false);
//   };

//   /* -------------------- INITIAL LOAD -------------------- */
//   // When session or group changes, load members + messages
//   useEffect(() => {
//     if (!session) return;
//     void loadMembers();
//     void loadMessages();
//     void updateMyLastSeen();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- SYNC LEFT AT -------------------- */
//   // ✅ When members load, sync leftAt state
//   useEffect(() => {
//     if (!myMemberRow) return;
//     setLeftAt(myMemberRow.deleted_at ?? null);
//   }, [myMemberRow]);

//   /* -------------------- REFRESH: LAST SEEN + MEMBERS (LIGHT) -------------------- */
//   // Keep last seen updated and refresh members sometimes (not too often)
//   useEffect(() => {
//     if (!session) return;

//     const onVisibility = () => {
//       void updateMyLastSeen();
//     };

//     const onBeforeUnload = () => {
//       void updateMyLastSeen();
//     };

//     document.addEventListener("visibilitychange", onVisibility);
//     window.addEventListener("beforeunload", onBeforeUnload);

//     // Refresh members every 30s
//     const interval = window.setInterval(() => {
//       void loadMembers();
//       void updateMyLastSeen();
//     }, 30000);

//     return () => {
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.removeEventListener("beforeunload", onBeforeUnload);
//       window.clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- STOP REALTIME -------------------- */
//   // ✅ Stop all realtime channels (messages + presence)
//   const stopRealtime = () => {
//     // Stop messages realtime
//     if (msgChannelRef.current) {
//       supabase.removeChannel(msgChannelRef.current);
//       msgChannelRef.current = null;
//     }
//     // Stop presence realtime
//     if (presenceChannelRef.current) {
//       supabase.removeChannel(presenceChannelRef.current);
//       presenceChannelRef.current = null;
//     }
//     // ✅ Clear UI presence/typing immediately for leaver
//     setOnlineUsers([]);
//     setTypingUsers([]);

//     // ✅ clear typing timers
//     typingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
//     typingTimeoutsRef.current.clear();
//   };

//   /* -------------------- REALTIME: MESSAGES (INSERT) -------------------- */
//   // Listen for new messages and append locally (no full reload)
//   useEffect(() => {
//     if (!session) return;

//     const channel = supabase
//       .channel(`messages:${groupId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `group_id=eq.${groupId}`,
//         },
//         (payload) => {
//           const newMsg = payload.new as Msg;

//           setMessages((prev) => {
//             // Avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });
//         }
//       )
//       .subscribe();

//     msgChannelRef.current = channel;

//     return () => {
//       if (msgChannelRef.current) {
//         supabase.removeChannel(msgChannelRef.current);
//         msgChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO-SCROLL (SMART) -------------------- */
//   // Only auto-scroll if user is already near bottom
//   useEffect(() => {
//     if (!shouldAutoScrollRef.current) return;
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Track if user is reading old messages (scrolling up)
//   const onScrollMessages = () => {
//     const el = scrollContainerRef.current;
//     if (!el) return;

//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     // If user is within ~120px from bottom, we allow auto-scroll
//     shouldAutoScrollRef.current = distanceFromBottom < 120;
//   };

//   /* -------------------- REALTIME: PRESENCE + TYPING -------------------- */
//   // Presence gives online/offline, typing uses broadcast
//   useEffect(() => {
//     if (!session) return;

//     const timeoutsMap = typingTimeoutsRef.current;

//     const channel = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     // Helper: recompute online users from presence state
//     const recomputeOnline = () => {
//       const state = channel.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];

//       Object.values(state).forEach((arr) => {
//         arr.forEach((u) => list.push(u));
//       });

//       // Dedup by user_id
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     // Keep online list updated
//     channel.on("presence", { event: "sync" }, recomputeOnline);
//     channel.on("presence", { event: "join" }, recomputeOnline);
//     channel.on("presence", { event: "leave" }, recomputeOnline);

//     // Handle typing broadcast
//     channel.on("broadcast", { event: "typing" }, (evt) => {
//       const from = (evt?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       // Clear previous timeout for this user
//       const prevId = timeoutsMap.get(from);
//       if (prevId) window.clearTimeout(prevId);

//       // Create a new timeout
//       const tId = window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//         timeoutsMap.delete(from);
//       }, 2200);

//       timeoutsMap.set(from, tId);
//     });

//     // Subscribe and track ourselves as online
//     channel.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await channel.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });

//         void loadMembers();
//       }
//     });

//     presenceChannelRef.current = channel;

//     return () => {
//       // Clear all typing timers safely
//       timeoutsMap.forEach((id) => window.clearTimeout(id));
//       timeoutsMap.clear();

//       // Remove channel
//       supabase.removeChannel(channel);

//       if (presenceChannelRef.current === channel) {
//         presenceChannelRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- LEAVE GROUP (WITH ADMIN TRANSFER) -------------------- */
//   const confirmLeaveGroup = async () => {
//     if (!session) return;

//     setLeaveLoading(true);
//     setLeaveError(null);

//     try {
//       if (amIAdmin) {
//         // Admin must assign new admin first
//         if (nonAdminCandidates.length === 0) {
//           setLeaveError("You are the only active member. Add a member first.");
//           setLeaveLoading(false);
//           return;
//         }

//         if (!selectedNewAdmin) {
//           setLeaveError("Select a new admin first.");
//           setLeaveLoading(false);
//           return;
//         }

//         // ✅ Atomic: transfer admin + leave (RPC)
//         const { error } = await supabase.rpc("transfer_admin_and_leave", {
//           p_group_id: groupId,
//           p_new_admin_user_id: selectedNewAdmin,
//         });

//         if (error) {
//           setLeaveError(error.message);
//           setLeaveLoading(false);
//           return;
//         }

//         // After leaving, stop realtime and refresh
//         stopRealtime();
//         closeLeavePopup();
//         await loadMembers();
//         setLeaveLoading(false);
//         return;
//       }

//       // Non-admin leave
//       const nowIso = new Date().toISOString();
//       const { error } = await supabase
//         .from("group_members")
//         .update({ deleted_at: nowIso })
//         .eq("group_id", groupId)
//         .eq("user_id", session.user.id);

//       if (error) {
//         setLeaveError(error.message);
//         setLeaveLoading(false);
//         return;
//       }

//       // Stop realtime immediately
//       stopRealtime();

//       // Mark locally as left
//       setLeftAt(nowIso);

//       // Keep only messages up to leave time
//       setMessages((prev) =>
//         prev.filter(
//           (m) => new Date(m.created_at).getTime() <= new Date(nowIso).getTime()
//         )
//       );

//       closeLeavePopup();
//       await loadMembers();
//       setLeaveLoading(false);
//     } catch (e: unknown) {
//       setLeaveError(e instanceof Error ? e.message : "Leave failed.");
//       setLeaveLoading(false);
//     }
//   };

//   /* -------------------- SEND MESSAGE -------------------- */
//   // Insert message into DB; realtime will show it for everyone
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     // ✅ Block sending if not active
//     if (!amIActive) {
//       setError("You have left this group. You cannot send new messages.");
//       return;
//     }

//     const content = text.trim();
//     if (!content) return;

//     // Detect @AI or /ai
//     const isAI =
//       content.toLowerCase().startsWith("@ai") ||
//       content.toLowerCase().startsWith("/ai");

//     setSending(true);
//     setError(null);

//     try {
//       if (isAI) {
//         // 1) Save user's message normally
//         await supabase.from("messages").insert({
//           group_id: groupId,
//           sender_id: session.user.id,
//           role: "user",
//           content,
//         });

//         // 2) Build context
//         const context = messages.slice(-30).map((m) => ({
//           role: m.role,
//           content: m.content,
//           sender_id: m.sender_id,
//           created_at: m.created_at,
//         }));

//         // 3) Call FastAPI
//         await askAI({
//           groupId,
//           userQuestion: content.replace(/^(@ai|\/ai)\s*/i, ""),
//           context,
//         });

//         setText("");
//         setSending(false);
//         return;
//       }

//       // Normal message
//       const { error } = await supabase.from("messages").insert({
//         group_id: groupId,
//         sender_id: session.user.id,
//         role: "user",
//         content,
//       });

//       if (error) setError(error.message);
//       else setText("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "AI error");
//     } finally {
//       setSending(false);
//     }
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   // Send "typing" at most once every 700ms
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     const ch = presenceChannelRef.current;
//     if (!ch) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void ch.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   // ✅ Filter online users to only active members
//   const activeMemberSet = useMemo(
//     () => new Set(activeMembers.map((m) => m.user_id)),
//     [activeMembers]
//   );

//   const onlineActiveUsers = useMemo(
//     () => onlineUsers.filter((u) => activeMemberSet.has(u.user_id)),
//     [onlineUsers, activeMemberSet]
//   );

//   // Fast check for online members (based on active users only)
//   const onlineSet = useMemo(
//     () => new Set(onlineActiveUsers.map((u) => u.user_id)),
//     [onlineActiveUsers]
//   );

//   // Best display info comes from DB members; presence is only fallback
//   const displayByUserId = useMemo(() => {
//     const map = new Map<
//       string,
//       {
//         email?: string;
//         display_name?: string;
//         last_seen_at?: string | null;
//         role?: string;
//       }
//     >();

//     for (const m of members) {
//       map.set(m.user_id, {
//         email: m.email,
//         display_name: m.display_name,
//         last_seen_at: m.last_seen_at,
//         role: m.role,
//       });
//     }

//     for (const u of onlineActiveUsers) {
//       const existing = map.get(u.user_id) ?? {};
//       map.set(u.user_id, { ...existing, email: existing.email ?? u.email });
//     }

//     if (session?.user?.id && session.user.email) {
//       const existing = map.get(session.user.id) ?? {};
//       map.set(session.user.id, {
//         ...existing,
//         email: existing.email ?? session.user.email,
//       });
//     }

//     return map;
//   }, [members, onlineActiveUsers, session]);

//   // Build typing text using usernames
//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers.map((uid) => {
//       const info = displayByUserId.get(uid);
//       const dn = info?.display_name?.trim();
//       return dn ? dn : usernameFromEmail(info?.email);
//     });

//     const clean = names.filter((n) => n && n !== "unknown");
//     if (clean.length === 0) return "Someone is typing...";

//     const shown = clean.slice(0, 2);
//     if (clean.length === 1) return `${shown[0]} is typing...`;
//     if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, displayByUserId]);

//   /* -------------------- RENDER GUARDS -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   /* -------------------- RENDER -------------------- */
//   return (
//     <main style={{ padding: 24 }}>
//       {/* ================= HEADER ================= */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>
//       <hr style={{ margin: "16px 0" }} />

//       {/* ================= MAIN LAYOUT ================= */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 280px",
//           gap: 14,
//           alignItems: "start",
//         }}
//       >
//         {/* ================= CHAT COLUMN ================= */}
//         <div>
//           {/* ---------- Stats row ---------- */}
//           <div
//             style={{
//               marginBottom: 8,
//               display: "flex",
//               gap: 12,
//               flexWrap: "wrap",
//             }}
//           >
//             <span>
//               🟢 Online: <b>{onlineActiveUsers.length}</b>
//             </span>
//             <span>
//               👥 Members: <b>{activeMembers.length}</b>
//             </span>
//             {typingText && <span>✍️ {typingText}</span>}

//             {!shouldAutoScrollRef.current && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   shouldAutoScrollRef.current = true;
//                   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//                 }}
//                 style={{
//                   marginLeft: "auto",
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                 }}
//               >
//                 Jump to latest ↓
//               </button>
//             )}
//           </div>

//           {/* ✅ Show banner if user has left */}
//           {!amIActive && (
//             <p style={{ color: "#b45309", marginTop: 8 }}>
//               You have left this group. You can view old messages only.
//             </p>
//           )}

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           {/* ---------- Messages box ---------- */}
//           <div
//             ref={scrollContainerRef}
//             onScroll={onScrollMessages}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: 10,
//               padding: 12,
//               height: 420,
//               overflowY: "auto",
//               background: "#5c5959ff",
//             }}
//           >
//             {messages.length === 0 ? (
//               <p>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 const isMe = !!m.sender_id && m.sender_id === session.user.id;
//                 const info = m.sender_id
//                   ? displayByUserId.get(m.sender_id)
//                   : undefined;
//                 const email = info?.email;
//                 const displayName = info?.display_name?.trim();
//                 const senderName =
//                   m.role === "ai"
//                     ? "🤖 AI"
//                     : displayName || usernameFromEmail(email);

//                 return (
//                   <div
//                     key={m.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: isMe ? "flex-end" : "flex-start",
//                       marginBottom: 10,
//                     }}
//                   >
//                     <div
//                       style={{
//                         maxWidth: "70%",
//                         padding: "10px 12px",
//                         borderRadius: 12,
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       {/* ---------- Message header ---------- */}
//                       <div
//                         style={{
//                           fontSize: 12,
//                           opacity: 0.9,
//                           marginBottom: 4,
//                           display: "flex",
//                           gap: 8,
//                         }}
//                       >
//                         <b>{senderName}</b>
//                         <span>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       {/* ---------- Message content ---------- */}
//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

//                       {/* ---------- Explain button ---------- */}
//                       {m.role !== "ai" && (
//                         <button
//                           type="button"
//                           style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}
//                           onClick={async () => {
//                             try {
//                               setExplainOpen(true);
//                               setExplainText(null);
//                               setError(null);

//                               setExplainText("Thinking...");

//                               const ctx = messages.slice(-20).map((x) => ({
//                                 role: x.role,
//                                 content: x.content,
//                                 sender_id: x.sender_id ?? null,
//                                 created_at: x.created_at,
//                               }));

//                               const { reply } = await askAIExplain({
//                                 groupId,
//                                 userQuestion: `Explain this message in simple words (private popup only, do not post in group):\n"${m.content}"`,
//                                 context: ctx,
//                               });

//                               setExplainText(reply);
//                             } catch (e: unknown) {
//                               const msg =
//                                 e instanceof Error
//                                   ? e.message
//                                   : "Failed to explain.";
//                               setExplainText("❌ " + msg);
//                             }
//                           }}
//                         >
//                           Explain
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           {/* ---------- Send message ---------- */}
//           <form
//             onSubmit={sendMessage}
//             style={{ display: "flex", gap: 8, marginTop: 12 }}
//           >
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (use "@AI ...")'
//               style={{ flex: 1, padding: 12, borderRadius: 10 }}
//               disabled={!amIActive || sending}
//             />
//             <button
//               disabled={!amIActive || sending}
//               style={{ padding: "12px 16px", borderRadius: 10 }}
//             >
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* ================= MEMBERS PANEL ================= */}
//         <aside
//           style={{
//             border: "1px solid #ddd",
//             borderRadius: 12,
//             padding: 12,
//             background: "#4cd678ff",
//             height: 520,
//             overflowY: "auto",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: 8,
//             }}
//           >
//             <h3 style={{ margin: 0 }}>Members</h3>

//             <div style={{ display: "flex", gap: 8 }}>
//               <button
//                 type="button"
//                 onClick={() => void loadMembers()}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Refresh
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setLeaveOpen(true)}
//                 disabled={!amIActive}
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                   border: "1px solid #ddd",
//                   cursor: amIActive ? "pointer" : "not-allowed",
//                   opacity: amIActive ? 1 : 0.5,
//                 }}
//               >
//                 Leave Group
//               </button>
//             </div>
//           </div>

//           <p style={{ fontSize: 13, marginTop: 8 }}>🟢 Online / 🔴 Offline</p>

//           <div style={{ display: "grid", gap: 10 }}>
//             {activeMembers.map((m) => {
//               const info = displayByUserId.get(m.user_id);
//               const email = info?.email ?? m.email;
//               const name =
//                 info?.display_name?.trim() || usernameFromEmail(email);
//               const isOnline = onlineSet.has(m.user_id);
//               const isAdmin = m.role === "admin";

//               return (
//                 <div
//                   key={m.user_id}
//                   style={{
//                     display: "flex",
//                     gap: 10,
//                     padding: 10,
//                     borderRadius: 10,
//                     background: "rgba(255,255,255,0.4)",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: 10,
//                       height: 10,
//                       borderRadius: "50%",
//                       background: isOnline ? "green" : "red",
//                       marginTop: 6,
//                     }}
//                   />
//                   <div>
//                     <div style={{ fontWeight: 700 }}>
//                       {m.user_id === session.user.id ? `${name} (You)` : name}
//                       {isAdmin && (
//                         <span style={{ marginLeft: 6, fontSize: 11 }}>
//                           Admin
//                         </span>
//                       )}
//                     </div>
//                     <div style={{ fontSize: 12 }}>
//                       {isOnline ? "Online" : formatLastSeen(info?.last_seen_at)}
//                     </div>
//                     <div style={{ fontSize: 12, opacity: 0.7 }}>{email}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </aside>
//       </div>

//       {/* ================= EXPLAIN POPUP ================= */}
//       {explainOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 100,
//           }}
//           onClick={() => {
//             setExplainOpen(false);
//             setExplainText(null);
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#7d8dceff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "90%",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <h3 style={{ margin: 0 }}>AI Explanation</h3>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setExplainOpen(false);
//                   setExplainText(null);
//                 }}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Close
//               </button>
//             </div>

//             <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
//               {explainText ?? "—"}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ================= LEAVE GROUP POPUP ================= */}
//       {leaveOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 120,
//           }}
//           onClick={closeLeavePopup}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#7d8dceff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "92%",
//               border: "1px solid #ddd",
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>
//               {amIAdmin ? "Assign new admin & leave" : "Leave group"}
//             </h3>

//             {amIAdmin ? (
//               <>
//                 <p style={{ opacity: 0.8, marginTop: 6 }}>
//                   You are an admin. Select one active member to make admin before
//                   leaving.
//                 </p>

//                 {nonAdminCandidates.length === 0 ? (
//                   <p style={{ color: "red" }}>
//                     You are the only active member. Add a member first.
//                   </p>
//                 ) : (
//                   <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
//                     {nonAdminCandidates.map((m) => {
//                       const info = displayByUserId.get(m.user_id);
//                       const email = info?.email ?? m.email;
//                       const name =
//                         info?.display_name?.trim() || usernameFromEmail(email);

//                       return (
//                         <label
//                           key={m.user_id}
//                           style={{
//                             display: "flex",
//                             gap: 10,
//                             alignItems: "center",
//                             padding: 10,
//                             borderRadius: 10,
//                             border: "1px solid #eee",
//                             cursor: "pointer",
//                           }}
//                         >
//                           <input
//                             type="radio"
//                             name="newAdmin"
//                             checked={selectedNewAdmin === m.user_id}
//                             onChange={() => setSelectedNewAdmin(m.user_id)}
//                           />
//                           <div style={{ minWidth: 0 }}>
//                             <div style={{ fontWeight: 700 }}>{name}</div>
//                             <div style={{ fontSize: 12, opacity: 0.7 }}>
//                               {email ?? "—"}
//                             </div>
//                           </div>
//                         </label>
//                       );
//                     })}
//                   </div>
//                 )}
//               </>
//             ) : (
//               <p style={{ opacity: 0.8 }}>
//                 Are you sure you want to leave? You will still be able to view old
//                 messages only.
//               </p>
//             )}

//             {leaveError && <p style={{ color: "red" }}>❌ {leaveError}</p>}

//             <div
//               style={{
//                 display: "flex",
//                 gap: 10,
//                 justifyContent: "flex-end",
//                 marginTop: 14,
//               }}
//             >
//               <button type="button" onClick={closeLeavePopup}>
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={confirmLeaveGroup}
//                 disabled={
//                   leaveLoading ||
//                   (amIAdmin &&
//                     nonAdminCandidates.length > 0 &&
//                     !selectedNewAdmin)
//                 }
//                 style={{
//                   padding: "10px 14px",
//                   borderRadius: 10,
//                   cursor:
//                     leaveLoading ||
//                     (amIAdmin &&
//                       nonAdminCandidates.length > 0 &&
//                       !selectedNewAdmin)
//                       ? "not-allowed"
//                       : "pointer",
//                   opacity:
//                     leaveLoading ||
//                     (amIAdmin &&
//                       nonAdminCandidates.length > 0 &&
//                       !selectedNewAdmin)
//                       ? 0.5
//                       : 1,
//                 }}
//               >
//                 {leaveLoading
//                   ? "Working..."
//                   : amIAdmin
//                   ? "Assign & Leave"
//                   : "Leave"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import type { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { askAI } from "@/lib/ai";
// import { askAIExplain } from "@/lib/ai";

// /* -------------------- TYPES -------------------- */
// // Message row coming from `public.messages`
// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string | null;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// // Presence payload we track in the realtime presence channel
// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// // Group member row (joined with profiles)
// type Member = {
//   user_id: string;
//   role: string;
//   email?: string;
//   display_name?: string;
//   last_seen_at?: string | null;
//   deleted_at?: string | null;
// };

// /* -------------------- HELPERS -------------------- */
// // Convert email -> username (before @)
// function usernameFromEmail(email?: string): string {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// // Human readable last seen string
// function formatLastSeen(ts?: string | null): string {
//   if (!ts) return "Last seen: —";
//   return `Last seen: ${new Date(ts).toLocaleString()}`;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   /* -------------------- STATE -------------------- */
//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   // Explain popup
//   const [explainOpen, setExplainOpen] = useState(false);
//   const [explainText, setExplainText] = useState<string | null>(null);

//   // ✅ Track if I've left the group
//   const [leftAt, setLeftAt] = useState<string | null>(null);

//   /* -------------------- LEAVE GROUP (ADMIN TRANSFER) -------------------- */
//   const [leaveOpen, setLeaveOpen] = useState(false);
//   const [leaveLoading, setLeaveLoading] = useState(false);
//   const [leaveError, setLeaveError] = useState<string | null>(null);
//   const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);

//   const closeLeavePopup = () => {
//     setLeaveOpen(false);
//     setLeaveLoading(false);
//     setLeaveError(null);
//     setSelectedNewAdmin(null);
//   };

//   /* -------------------- REFS -------------------- */
//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   // Keep channel refs so we can cleanly unsubscribe on unmount / group change
//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   // Throttle typing events
//   const lastTypingSentRef = useRef<number>(0);

//   // Track typing timeouts per user so we can replace/clear them
//   const typingTimeoutsRef = useRef<Map<string, number>>(new Map());

//   // Avoid forcing auto-scroll when user is reading old messages
//   const shouldAutoScrollRef = useRef(true);
//   const scrollContainerRef = useRef<HTMLDivElement | null>(null);

//   /* -------------------- DERIVED HELPERS -------------------- */
//   // ✅ Active members only (not left)
//   const activeMembers = useMemo(() => {
//     return members.filter((m) => !m.deleted_at);
//   }, [members]);

//   // ✅ Find my member row
//   const myMemberRow = useMemo(() => {
//     if (!session) return null;
//     return members.find((m) => m.user_id === session.user.id) ?? null;
//   }, [members, session]);

//   // ✅ Am I an active member?
//   const amIActive = useMemo(() => {
//     return !!myMemberRow && !myMemberRow.deleted_at;
//   }, [myMemberRow]);

//   // ✅ Am I an admin?
//   const amIAdmin = useMemo(() => {
//     return (
//       !!myMemberRow &&
//       (myMemberRow.role ?? "").toLowerCase() === "admin" &&
//       !myMemberRow.deleted_at
//     );
//   }, [myMemberRow]);

//   // ✅ Non-admin candidates for transfer (active members except me)
//   const nonAdminCandidates = useMemo(() => {
//     if (!session) return [];
//     return activeMembers.filter((m) => m.user_id !== session.user.id);
//   }, [activeMembers, session]);

//   /* -------------------- AUTH GUARD -------------------- */
//   // If user is not logged in, redirect to login
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- DB: UPDATE LAST SEEN -------------------- */
//   // Update last_seen_at for the current user
//   const updateMyLastSeen = async () => {
//     if (!session) return;

//     const { error } = await supabase
//       .from("profiles")
//       .update({ last_seen_at: new Date().toISOString() })
//       .eq("id", session.user.id);

//     if (error) {
//       // Keep silent in UI; you can log if needed.
//     }
//   };

//   /* -------------------- MARK AS READ -------------------- */
//   // Mark group messages as read
//   const markAsRead = async () => {
//     if (!session) return;

//     await supabase
//       .from("group_members")
//       .update({ last_read_at: new Date().toISOString() })
//       .eq("group_id", groupId)
//       .eq("user_id", session.user.id);
//   };

//   /* -------------------- DB: LOAD MEMBERS -------------------- */
//   // Load all group members (with their profiles)
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         role,
//         deleted_at,
//         profiles:profiles (
//           email,
//           display_name,
//           last_seen_at
//         )
//       `
//       )
//       .eq("group_id", groupId);

//     if (error) {
//       setError(error.message);
//       setMembers([]);
//       return;
//     }

//     // Map the nested join result into a clean Member[]
//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as {
//         user_id: string;
//         role: string;
//         deleted_at?: string | null;
//         profiles?: {
//           email?: string;
//           display_name?: string;
//           last_seen_at?: string | null;
//         } | null;
//       };

//       return {
//         user_id: r.user_id,
//         role: r.role ?? "member",
//         deleted_at: r.deleted_at ?? null,
//         email: r.profiles?.email ?? undefined,
//         display_name: r.profiles?.display_name ?? undefined,
//         last_seen_at: r.profiles?.last_seen_at ?? null,
//       };
//     });

//     // Deduplicate just in case
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   /* -------------------- DB: LOAD INITIAL MESSAGES -------------------- */
//   // Load last 200 messages for the group
//   const loadMessages = async () => {
//     if (!session) return;

//     setLoadingMsgs(true);
//     setError(null);

//     const { data, error } = await supabase
//       .from("messages")
//       .select("id,group_id,sender_id,role,content,created_at")
//       .eq("group_id", groupId)
//       .order("created_at", { ascending: true })
//       .limit(200);

//     if (error) {
//       setError(error.message);
//       setMessages([]);
//     } else {
//       setMessages((data ?? []) as Msg[]);
//     }

//     setLoadingMsgs(false);
//   };

//   /* -------------------- INITIAL LOAD -------------------- */
//   // When session or group changes, load members + messages
//   useEffect(() => {
//     if (!session) return;
//     void loadMembers();
//     void loadMessages();
//     void updateMyLastSeen();

//     // ✅ mark unread as read when user opens group
//     void markAsRead();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- SYNC LEFT AT -------------------- */
//   // ✅ When members load, sync leftAt state
//   useEffect(() => {
//     if (!myMemberRow) return;
//     setLeftAt(myMemberRow.deleted_at ?? null);
//   }, [myMemberRow]);

//   /* -------------------- REFRESH: LAST SEEN + MEMBERS (LIGHT) -------------------- */
//   // Keep last seen updated and refresh members sometimes (not too often)
//   useEffect(() => {
//     if (!session) return;

//     const onVisibility = () => {
//       void updateMyLastSeen();
//     };

//     const onBeforeUnload = () => {
//       void updateMyLastSeen();
//     };

//     document.addEventListener("visibilitychange", onVisibility);
//     window.addEventListener("beforeunload", onBeforeUnload);

//     // Refresh members every 30s
//     const interval = window.setInterval(() => {
//       void loadMembers();
//       void updateMyLastSeen();
//     }, 30000);

//     return () => {
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.removeEventListener("beforeunload", onBeforeUnload);
//       window.clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- STOP REALTIME -------------------- */
//   // ✅ Stop all realtime channels (messages + presence)
//   const stopRealtime = () => {
//     // Stop messages realtime
//     if (msgChannelRef.current) {
//       supabase.removeChannel(msgChannelRef.current);
//       msgChannelRef.current = null;
//     }
//     // Stop presence realtime
//     if (presenceChannelRef.current) {
//       supabase.removeChannel(presenceChannelRef.current);
//       presenceChannelRef.current = null;
//     }
//     // ✅ Clear UI presence/typing immediately for leaver
//     setOnlineUsers([]);
//     setTypingUsers([]);

//     // ✅ clear typing timers
//     typingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
//     typingTimeoutsRef.current.clear();
//   };

//   /* -------------------- REALTIME: MESSAGES (INSERT) -------------------- */
//   // Listen for new messages and append locally (no full reload)
//   useEffect(() => {
//     if (!session) return;

//     const channel = supabase
//       .channel(`messages:${groupId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//           filter: `group_id=eq.${groupId}`,
//         },
//         (payload) => {
//           const newMsg = payload.new as Msg;

//           setMessages((prev) => {
//             // Avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });

//           // ✅ Mark as read if user is at bottom (actively reading)
//           if (shouldAutoScrollRef.current) {
//             void markAsRead();
//           }
//         }
//       )
//       .subscribe();

//     msgChannelRef.current = channel;

//     return () => {
//       if (msgChannelRef.current) {
//         supabase.removeChannel(msgChannelRef.current);
//         msgChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO-SCROLL (SMART) -------------------- */
//   // Only auto-scroll if user is already near bottom
//   useEffect(() => {
//     if (!shouldAutoScrollRef.current) return;
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Track if user is reading old messages (scrolling up)
//   const onScrollMessages = () => {
//     const el = scrollContainerRef.current;
//     if (!el) return;

//     const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
//     // If user is within ~120px from bottom, we allow auto-scroll
//     shouldAutoScrollRef.current = distanceFromBottom < 120;
//   };

//   /* -------------------- REALTIME: PRESENCE + TYPING -------------------- */
//   // Presence gives online/offline, typing uses broadcast
//   useEffect(() => {
//     if (!session) return;

//     const timeoutsMap = typingTimeoutsRef.current;

//     const channel = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     // Helper: recompute online users from presence state
//     const recomputeOnline = () => {
//       const state = channel.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];

//       Object.values(state).forEach((arr) => {
//         arr.forEach((u) => list.push(u));
//       });

//       // Dedup by user_id
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     // Keep online list updated
//     channel.on("presence", { event: "sync" }, recomputeOnline);
//     channel.on("presence", { event: "join" }, recomputeOnline);
//     channel.on("presence", { event: "leave" }, recomputeOnline);

//     // Handle typing broadcast
//     channel.on("broadcast", { event: "typing" }, (evt) => {
//       const from = (evt?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       // Clear previous timeout for this user
//       const prevId = timeoutsMap.get(from);
//       if (prevId) window.clearTimeout(prevId);

//       // Create a new timeout
//       const tId = window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//         timeoutsMap.delete(from);
//       }, 2200);

//       timeoutsMap.set(from, tId);
//     });

//     // Subscribe and track ourselves as online
//     channel.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await channel.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });

//         void loadMembers();
//       }
//     });

//     presenceChannelRef.current = channel;

//     return () => {
//       // Clear all typing timers safely
//       timeoutsMap.forEach((id) => window.clearTimeout(id));
//       timeoutsMap.clear();

//       // Remove channel
//       supabase.removeChannel(channel);

//       if (presenceChannelRef.current === channel) {
//         presenceChannelRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- LEAVE GROUP (WITH ADMIN TRANSFER) -------------------- */
//   const confirmLeaveGroup = async () => {
//     if (!session) return;

//     setLeaveLoading(true);
//     setLeaveError(null);

//     try {
//       if (amIAdmin) {
//         // Admin must assign new admin first
//         if (nonAdminCandidates.length === 0) {
//           setLeaveError("You are the only active member. Add a member first.");
//           setLeaveLoading(false);
//           return;
//         }

//         if (!selectedNewAdmin) {
//           setLeaveError("Select a new admin first.");
//           setLeaveLoading(false);
//           return;
//         }

//         // ✅ Atomic: transfer admin + leave (RPC)
//         const { error } = await supabase.rpc("transfer_admin_and_leave", {
//           p_group_id: groupId,
//           p_new_admin_user_id: selectedNewAdmin,
//         });

//         if (error) {
//           setLeaveError(error.message);
//           setLeaveLoading(false);
//           return;
//         }

//         // After leaving, stop realtime and refresh
//         stopRealtime();
//         closeLeavePopup();
//         await loadMembers();
//         setLeaveLoading(false);
//         return;
//       }

//       // Non-admin leave
//       const nowIso = new Date().toISOString();
//       const { error } = await supabase
//         .from("group_members")
//         .update({ deleted_at: nowIso })
//         .eq("group_id", groupId)
//         .eq("user_id", session.user.id);

//       if (error) {
//         setLeaveError(error.message);
//         setLeaveLoading(false);
//         return;
//       }

//       // Stop realtime immediately
//       stopRealtime();

//       // Mark locally as left
//       setLeftAt(nowIso);

//       // Keep only messages up to leave time
//       setMessages((prev) =>
//         prev.filter(
//           (m) => new Date(m.created_at).getTime() <= new Date(nowIso).getTime()
//         )
//       );

//       closeLeavePopup();
//       await loadMembers();
//       setLeaveLoading(false);
//     } catch (e: unknown) {
//       setLeaveError(e instanceof Error ? e.message : "Leave failed.");
//       setLeaveLoading(false);
//     }
//   };

//   /* -------------------- SEND MESSAGE -------------------- */
//   // Insert message into DB; realtime will show it for everyone
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     // ✅ Block sending if not active
//     if (!amIActive) {
//       setError("You have left this group. You cannot send new messages.");
//       return;
//     }

//     const content = text.trim();
//     if (!content) return;

//     // Detect @AI or /ai
//     const isAI =
//       content.toLowerCase().startsWith("@ai") ||
//       content.toLowerCase().startsWith("/ai");

//     setSending(true);
//     setError(null);

//     try {
//       if (isAI) {
//         // 1) Save user's message normally
//         await supabase.from("messages").insert({
//           group_id: groupId,
//           sender_id: session.user.id,
//           role: "user",
//           content,
//         });

//         // 2) Build context
//         const context = messages.slice(-30).map((m) => ({
//           role: m.role,
//           content: m.content,
//           sender_id: m.sender_id,
//           created_at: m.created_at,
//         }));

//         // 3) Call FastAPI
//         await askAI({
//           groupId,
//           userQuestion: content.replace(/^(@ai|\/ai)\s*/i, ""),
//           context,
//         });

//         setText("");
//         setSending(false);
//         return;
//       }

//       // Normal message
//       const { error } = await supabase.from("messages").insert({
//         group_id: groupId,
//         sender_id: session.user.id,
//         role: "user",
//         content,
//       });

//       if (error) setError(error.message);
//       else setText("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "AI error");
//     } finally {
//       setSending(false);
//     }
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   // Send "typing" at most once every 700ms
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     const ch = presenceChannelRef.current;
//     if (!ch) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void ch.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   // ✅ Filter online users to only active members
//   const activeMemberSet = useMemo(
//     () => new Set(activeMembers.map((m) => m.user_id)),
//     [activeMembers]
//   );

//   const onlineActiveUsers = useMemo(
//     () => onlineUsers.filter((u) => activeMemberSet.has(u.user_id)),
//     [onlineUsers, activeMemberSet]
//   );

//   // Fast check for online members (based on active users only)
//   const onlineSet = useMemo(
//     () => new Set(onlineActiveUsers.map((u) => u.user_id)),
//     [onlineActiveUsers]
//   );

//   // Best display info comes from DB members; presence is only fallback
//   const displayByUserId = useMemo(() => {
//     const map = new Map<
//       string,
//       {
//         email?: string;
//         display_name?: string;
//         last_seen_at?: string | null;
//         role?: string;
//       }
//     >();

//     for (const m of members) {
//       map.set(m.user_id, {
//         email: m.email,
//         display_name: m.display_name,
//         last_seen_at: m.last_seen_at,
//         role: m.role,
//       });
//     }

//     for (const u of onlineActiveUsers) {
//       const existing = map.get(u.user_id) ?? {};
//       map.set(u.user_id, { ...existing, email: existing.email ?? u.email });
//     }

//     if (session?.user?.id && session.user.email) {
//       const existing = map.get(session.user.id) ?? {};
//       map.set(session.user.id, {
//         ...existing,
//         email: existing.email ?? session.user.email,
//       });
//     }

//     return map;
//   }, [members, onlineActiveUsers, session]);

//   // Build typing text using usernames
//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers.map((uid) => {
//       const info = displayByUserId.get(uid);
//       const dn = info?.display_name?.trim();
//       return dn ? dn : usernameFromEmail(info?.email);
//     });

//     const clean = names.filter((n) => n && n !== "unknown");
//     if (clean.length === 0) return "Someone is typing...";

//     const shown = clean.slice(0, 2);
//     if (clean.length === 1) return `${shown[0]} is typing...`;
//     if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, displayByUserId]);

//   /* -------------------- RENDER GUARDS -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   /* -------------------- RENDER -------------------- */
//   return (
//     <main style={{ padding: 24 }}>
//       {/* ================= HEADER ================= */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//         }}
//       >
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>
//       <hr style={{ margin: "16px 0" }} />

//       {/* ================= MAIN LAYOUT ================= */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "1fr 280px",
//           gap: 14,
//           alignItems: "start",
//         }}
//       >
//         {/* ================= CHAT COLUMN ================= */}
//         <div>
//           {/* ---------- Stats row ---------- */}
//           <div
//             style={{
//               marginBottom: 8,
//               display: "flex",
//               gap: 12,
//               flexWrap: "wrap",
//             }}
//           >
//             <span>
//               🟢 Online: <b>{onlineActiveUsers.length}</b>
//             </span>
//             <span>
//               👥 Members: <b>{activeMembers.length}</b>
//             </span>
//             {typingText && <span>✍️ {typingText}</span>}

//             {!shouldAutoScrollRef.current && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   shouldAutoScrollRef.current = true;
//                   bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//                 }}
//                 style={{
//                   marginLeft: "auto",
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                 }}
//               >
//                 Jump to latest ↓
//               </button>
//             )}
//           </div>

//           {/* ✅ Show banner if user has left */}
//           {!amIActive && (
//             <p style={{ color: "#b45309", marginTop: 8 }}>
//               You have left this group. You can view old messages only.
//             </p>
//           )}

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           {/* ---------- Messages box ---------- */}
//           <div
//             ref={scrollContainerRef}
//             onScroll={onScrollMessages}
//             style={{
//               border: "1px solid #ddd",
//               borderRadius: 10,
//               padding: 12,
//               height: 420,
//               overflowY: "auto",
//               background: "#5c5959ff",
//             }}
//           >
//             {messages.length === 0 ? (
//               <p>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 const isMe = !!m.sender_id && m.sender_id === session.user.id;
//                 const info = m.sender_id
//                   ? displayByUserId.get(m.sender_id)
//                   : undefined;
//                 const email = info?.email;
//                 const displayName = info?.display_name?.trim();
//                 const senderName =
//                   m.role === "ai"
//                     ? "🤖 AI"
//                     : displayName || usernameFromEmail(email);

//                 return (
//                   <div
//                     key={m.id}
//                     style={{
//                       display: "flex",
//                       justifyContent: isMe ? "flex-end" : "flex-start",
//                       marginBottom: 10,
//                     }}
//                   >
//                     <div
//                       style={{
//                         maxWidth: "70%",
//                         padding: "10px 12px",
//                         borderRadius: 12,
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       {/* ---------- Message header ---------- */}
//                       <div
//                         style={{
//                           fontSize: 12,
//                           opacity: 0.9,
//                           marginBottom: 4,
//                           display: "flex",
//                           gap: 8,
//                         }}
//                       >
//                         <b>{senderName}</b>
//                         <span>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       {/* ---------- Message content ---------- */}
//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

//                       {/* ---------- Explain button ---------- */}
//                       {m.role !== "ai" && (
//                         <button
//                           type="button"
//                           style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}
//                           onClick={async () => {
//                             try {
//                               setExplainOpen(true);
//                               setExplainText(null);
//                               setError(null);

//                               setExplainText("Thinking...");

//                               const ctx = messages.slice(-20).map((x) => ({
//                                 role: x.role,
//                                 content: x.content,
//                                 sender_id: x.sender_id ?? null,
//                                 created_at: x.created_at,
//                               }));

//                               const { reply } = await askAIExplain({
//                                 groupId,
//                                 userQuestion: `Explain this message in simple words (private popup only, do not post in group):\n"${m.content}"`,
//                                 context: ctx,
//                               });

//                               setExplainText(reply);
//                             } catch (e: unknown) {
//                               const msg =
//                                 e instanceof Error
//                                   ? e.message
//                                   : "Failed to explain.";
//                               setExplainText("❌ " + msg);
//                             }
//                           }}
//                         >
//                           Explain
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           {/* ---------- Send message ---------- */}
//           <form
//             onSubmit={sendMessage}
//             style={{ display: "flex", gap: 8, marginTop: 12 }}
//           >
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (use "@AI ...")'
//               style={{ flex: 1, padding: 12, borderRadius: 10 }}
//               disabled={!amIActive || sending}
//             />
//             <button
//               disabled={!amIActive || sending}
//               style={{ padding: "12px 16px", borderRadius: 10 }}
//             >
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* ================= MEMBERS PANEL ================= */}
//         <aside
//           style={{
//             border: "1px solid #ddd",
//             borderRadius: 12,
//             padding: 12,
//             background: "#4cd678ff",
//             height: 520,
//             overflowY: "auto",
//           }}
//         >
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: 8,
//             }}
//           >
//             <h3 style={{ margin: 0 }}>Members</h3>

//             <div style={{ display: "flex", gap: 8 }}>
//               <button
//                 type="button"
//                 onClick={() => void loadMembers()}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Refresh
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setLeaveOpen(true)}
//                 disabled={!amIActive}
//                 style={{
//                   padding: "6px 10px",
//                   borderRadius: 10,
//                   border: "1px solid #ddd",
//                   cursor: amIActive ? "pointer" : "not-allowed",
//                   opacity: amIActive ? 1 : 0.5,
//                 }}
//               >
//                 Leave Group
//               </button>
//             </div>
//           </div>

//           <p style={{ fontSize: 13, marginTop: 8 }}>🟢 Online / 🔴 Offline</p>

//           <div style={{ display: "grid", gap: 10 }}>
//             {activeMembers.map((m) => {
//               const info = displayByUserId.get(m.user_id);
//               const email = info?.email ?? m.email;
//               const name =
//                 info?.display_name?.trim() || usernameFromEmail(email);
//               const isOnline = onlineSet.has(m.user_id);
//               const isAdmin = m.role === "admin";

//               return (
//                 <div
//                   key={m.user_id}
//                   style={{
//                     display: "flex",
//                     gap: 10,
//                     padding: 10,
//                     borderRadius: 10,
//                     background: "rgba(255,255,255,0.4)",
//                   }}
//                 >
//                   <span
//                     style={{
//                       width: 10,
//                       height: 10,
//                       borderRadius: "50%",
//                       background: isOnline ? "green" : "red",
//                       marginTop: 6,
//                     }}
//                   />
//                   <div>
//                     <div style={{ fontWeight: 700 }}>
//                       {m.user_id === session.user.id ? `${name} (You)` : name}
//                       {isAdmin && (
//                         <span style={{ marginLeft: 6, fontSize: 11 }}>
//                           Admin
//                         </span>
//                       )}
//                     </div>
//                     <div style={{ fontSize: 12 }}>
//                       {isOnline ? "Online" : formatLastSeen(info?.last_seen_at)}
//                     </div>
//                     <div style={{ fontSize: 12, opacity: 0.7 }}>{email}</div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </aside>
//       </div>

//       {/* ================= EXPLAIN POPUP ================= */}
//       {explainOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 100,
//           }}
//           onClick={() => {
//             setExplainOpen(false);
//             setExplainText(null);
//           }}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#7d8dceff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "90%",
//             }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <h3 style={{ margin: 0 }}>AI Explanation</h3>
//               <button
//                 type="button"
//                 onClick={() => {
//                   setExplainOpen(false);
//                   setExplainText(null);
//                 }}
//                 style={{ padding: "6px 10px", borderRadius: 10 }}
//               >
//                 Close
//               </button>
//             </div>

//             <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
//               {explainText ?? "—"}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* ================= LEAVE GROUP POPUP ================= */}
//       {leaveOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.45)",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             zIndex: 120,
//           }}
//           onClick={closeLeavePopup}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               background: "#ffffff",
//               padding: 16,
//               borderRadius: 12,
//               maxWidth: 520,
//               width: "92%",
//               border: "1px solid #ddd",
//             }}
//           >
//             <h3 style={{ marginTop: 0 }}>
//               {amIAdmin ? "Assign new admin & leave" : "Leave group"}
//             </h3>

//             {amIAdmin ? (
//               <>
//                 <p style={{ opacity: 0.8, marginTop: 6 }}>
//                   You are an admin. Select one active member to make admin before
//                   leaving.
//                 </p>

//                 {nonAdminCandidates.length === 0 ? (
//                   <p style={{ color: "red" }}>
//                     You are the only active member. Add a member first.
//                   </p>
//                 ) : (
//                   <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
//                     {nonAdminCandidates.map((m) => {
//                       const info = displayByUserId.get(m.user_id);
//                       const email = info?.email ?? m.email;
//                       const name =
//                         info?.display_name?.trim() || usernameFromEmail(email);

//                       return (
//                         <label
//                           key={m.user_id}
//                           style={{
//                             display: "flex",
//                             gap: 10,
//                             alignItems: "center",
//                             padding: 10,
//                             borderRadius: 10,
//                             border: "1px solid #eee",
//                             cursor: "pointer",
//                           }}
//                         >
//                           <input
//                             type="radio"
//                             name="newAdmin"
//                             checked={selectedNewAdmin === m.user_id}
//                             onChange={() => setSelectedNewAdmin(m.user_id)}
//                           />
//                           <div style={{ minWidth: 0 }}>
//                             <div style={{ fontWeight: 700 }}>{name}</div>
//                             <div style={{ fontSize: 12, opacity: 0.7 }}>
//                               {email ?? "—"}
//                             </div>
//                           </div>
//                         </label>
//                       );
//                     })}
//                   </div>
//                 )}
//               </>
//             ) : (
//               <p style={{ opacity: 0.8 }}>
//                 Are you sure you want to leave? You will still be able to view old
//                 messages only.
//               </p>
//             )}

//             {leaveError && <p style={{ color: "red" }}>❌ {leaveError}</p>}

//             <div
//               style={{
//                 display: "flex",
//                 gap: 10,
//                 justifyContent: "flex-end",
//                 marginTop: 14,
//               }}
//             >
//               <button type="button" onClick={closeLeavePopup}>
//                 Cancel
//               </button>

//               <button
//                 type="button"
//                 onClick={confirmLeaveGroup}
//                 disabled={
//                   leaveLoading ||
//                   (amIAdmin &&
//                     nonAdminCandidates.length > 0 &&
//                     !selectedNewAdmin)
//                 }
//                 style={{
//                   padding: "10px 14px",
//                   borderRadius: 10,
//                   cursor:
//                     leaveLoading ||
//                     (amIAdmin &&
//                       nonAdminCandidates.length > 0 &&
//                       !selectedNewAdmin)
//                       ? "not-allowed"
//                       : "pointer",
//                   opacity:
//                     leaveLoading ||
//                     (amIAdmin &&
//                       nonAdminCandidates.length > 0 &&
//                       !selectedNewAdmin)
//                       ? 0.5
//                       : 1,
//                 }}
//               >
//                 {leaveLoading
//                   ? "Working..."
//                   : amIAdmin
//                   ? "Assign & Leave"
//                   : "Leave"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }


"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client.ts";
import { useSession } from "@/lib/useSession";
import { askAI } from "@/lib/ai";
import { askAIExplain } from "@/lib/ai";

/* -------------------- TYPES -------------------- */
// Message row coming from `public.messages`
type Msg = {
  id: string;
  group_id: string;
  sender_id: string | null;
  role: "user" | "ai";
  content: string;
  created_at: string;
};

// Presence payload we track in the realtime presence channel
type PresenceUser = {
  user_id: string;
  email?: string;
  online_at: number;
};

// Group member row (joined with profiles)
type Member = {
  user_id: string;
  role: string;
  email?: string;
  display_name?: string;
  last_seen_at?: string | null;
  deleted_at?: string | null;
};

/* -------------------- HELPERS -------------------- */
// Convert email -> username (before @)
function usernameFromEmail(email?: string): string {
  if (!email) return "unknown";
  const at = email.indexOf("@");
  return at > 0 ? email.slice(0, at) : email;
}

// Human readable last seen string
function formatLastSeen(ts?: string | null): string {
  if (!ts) return "Last seen: —";
  return `Last seen: ${new Date(ts).toLocaleString()}`;
}

export default function GroupChatPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();
  const groupId = useMemo(() => String(params.groupId), [params.groupId]);

  const { session, loading } = useSession();

  /* -------------------- STATE -------------------- */
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  // Members + presence + typing
  const [members, setMembers] = useState<Member[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Explain popup
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState<string | null>(null);

  /* -------------------- LEAVE GROUP (ADMIN TRANSFER) -------------------- */
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string | null>(null);

  const closeLeavePopup = () => {
    setLeaveOpen(false);
    setLeaveLoading(false);
    setLeaveError(null);
    setSelectedNewAdmin(null);
  };

  /* -------------------- REFS -------------------- */
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Keep channel refs so we can cleanly unsubscribe on unmount / group change
  const msgChannelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // Throttle typing events
  const lastTypingSentRef = useRef<number>(0);

  // Track typing timeouts per user so we can replace/clear them
  const typingTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Avoid forcing auto-scroll when user is reading old messages
  const shouldAutoScrollRef = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  /* -------------------- DERIVED HELPERS -------------------- */
  // ✅ Active members only (not left)
  const activeMembers = useMemo(() => {
    return members.filter((m) => !m.deleted_at);
  }, [members]);

  // ✅ Find my member row
  const myMemberRow = useMemo(() => {
    if (!session) return null;
    return members.find((m) => m.user_id === session.user.id) ?? null;
  }, [members, session]);

  // ✅ Am I an active member?
  const amIActive = useMemo(() => {
    return !!myMemberRow && !myMemberRow.deleted_at;
  }, [myMemberRow]);

  // ✅ Am I an admin?
  const amIAdmin = useMemo(() => {
    return (
      !!myMemberRow &&
      (myMemberRow.role ?? "").toLowerCase() === "admin" &&
      !myMemberRow.deleted_at
    );
  }, [myMemberRow]);

  // ✅ Non-admin candidates for transfer (active members except me)
  const nonAdminCandidates = useMemo(() => {
    if (!session) return [];
    return activeMembers.filter((m) => m.user_id !== session.user.id);
  }, [activeMembers, session]);

  /* -------------------- AUTH GUARD -------------------- */
  // If user is not logged in, redirect to login
  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, session, router]);

  /* -------------------- DB: UPDATE LAST SEEN -------------------- */
  // Update last_seen_at for the current user
  const updateMyLastSeen = async () => {
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session.user.id);

    if (error) {
      // Keep silent in UI; you can log if needed.
    }
  };

  /* -------------------- MARK AS READ -------------------- */
  // Mark group messages as read
  const markAsRead = async () => {
    if (!session) return;

    await supabase
      .from("group_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .eq("user_id", session.user.id);
  };

  /* -------------------- DB: LOAD MEMBERS -------------------- */
  // Load all group members (with their profiles)
  const loadMembers = async () => {
    if (!session) return;

    setError(null);

    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        user_id,
        role,
        deleted_at,
        profiles:profiles (
          email,
          display_name,
          last_seen_at
        )
      `
      )
      .eq("group_id", groupId);

    if (error) {
      setError(error.message);
      setMembers([]);
      return;
    }

    // Map the nested join result into a clean Member[]
    const list: Member[] = (data ?? []).map((row) => {
      const r = row as unknown as {
        user_id: string;
        role: string;
        deleted_at?: string | null;
        profiles?: {
          email?: string;
          display_name?: string;
          last_seen_at?: string | null;
        } | null;
      };

      return {
        user_id: r.user_id,
        role: r.role ?? "member",
        deleted_at: r.deleted_at ?? null,
        email: r.profiles?.email ?? undefined,
        display_name: r.profiles?.display_name ?? undefined,
        last_seen_at: r.profiles?.last_seen_at ?? null,
      };
    });

    // Deduplicate just in case
    const map = new Map<string, Member>();
    for (const m of list) map.set(m.user_id, m);
    setMembers(Array.from(map.values()));
  };

  /* -------------------- DB: LOAD INITIAL MESSAGES -------------------- */
  // Load last 200 messages for the group
  const loadMessages = async () => {
    if (!session) return;

    setLoadingMsgs(true);
    setError(null);

    const { data, error } = await supabase
      .from("messages")
      .select("id,group_id,sender_id,role,content,created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      setError(error.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as Msg[]);
    }

    setLoadingMsgs(false);
  };

  /* -------------------- INITIAL LOAD -------------------- */
  // When session or group changes, load members + messages
  useEffect(() => {
    if (!session) return;
    void loadMembers();
    void loadMessages();
    void updateMyLastSeen();

    // ✅ mark unread as read when user opens group
    void markAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, groupId]);

  /* -------------------- REFRESH: LAST SEEN + MEMBERS (LIGHT) -------------------- */
  // Keep last seen updated and refresh members sometimes (not too often)
  useEffect(() => {
    if (!session) return;

    const onVisibility = () => {
      void updateMyLastSeen();
    };

    const onBeforeUnload = () => {
      void updateMyLastSeen();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    // Refresh members every 30s
    const interval = window.setInterval(() => {
      void loadMembers();
      void updateMyLastSeen();
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, groupId]);

  /* -------------------- STOP REALTIME -------------------- */
  // ✅ Stop all realtime channels (messages + presence)
  const stopRealtime = () => {
    // Stop messages realtime
    if (msgChannelRef.current) {
      supabase.removeChannel(msgChannelRef.current);
      msgChannelRef.current = null;
    }
    // Stop presence realtime
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    // ✅ Clear UI presence/typing immediately for leaver
    setOnlineUsers([]);
    setTypingUsers([]);

    // ✅ clear typing timers
    typingTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    typingTimeoutsRef.current.clear();
  };

  /* -------------------- REALTIME: MESSAGES (INSERT) -------------------- */
  // Listen for new messages and append locally (no full reload)
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`messages:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as Msg;

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // ✅ Mark as read if user is at bottom (actively reading)
          if (shouldAutoScrollRef.current) {
            void markAsRead();
          }
        }
      )
      .subscribe();

    msgChannelRef.current = channel;

    return () => {
      if (msgChannelRef.current) {
        supabase.removeChannel(msgChannelRef.current);
        msgChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, groupId]);

  /* -------------------- AUTO-SCROLL (SMART) -------------------- */
  // Only auto-scroll if user is already near bottom
  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track if user is reading old messages (scrolling up)
  const onScrollMessages = () => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user is within ~120px from bottom, we allow auto-scroll
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  };

  /* -------------------- REALTIME: PRESENCE + TYPING -------------------- */
  // Presence gives online/offline, typing uses broadcast
  useEffect(() => {
    if (!session) return;

    const timeoutsMap = typingTimeoutsRef.current;

    const channel = supabase.channel(`presence:${groupId}`, {
      config: { presence: { key: session.user.id } },
    });

    // Helper: recompute online users from presence state
    const recomputeOnline = () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>;
      const list: PresenceUser[] = [];

      Object.values(state).forEach((arr) => {
        arr.forEach((u) => list.push(u));
      });

      // Dedup by user_id
      const map = new Map<string, PresenceUser>();
      for (const u of list) map.set(u.user_id, u);
      setOnlineUsers(Array.from(map.values()));
    };

    // Keep online list updated
    channel.on("presence", { event: "sync" }, recomputeOnline);
    channel.on("presence", { event: "join" }, recomputeOnline);
    channel.on("presence", { event: "leave" }, recomputeOnline);

    // Handle typing broadcast
    channel.on("broadcast", { event: "typing" }, (evt) => {
      const from = (evt?.payload as { user_id?: string })?.user_id;
      if (!from || from === session.user.id) return;

      setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

      // Clear previous timeout for this user
      const prevId = timeoutsMap.get(from);
      if (prevId) window.clearTimeout(prevId);

      // Create a new timeout
      const tId = window.setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== from));
        timeoutsMap.delete(from);
      }, 2200);

      timeoutsMap.set(from, tId);
    });

    // Subscribe and track ourselves as online
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: session.user.id,
          email: session.user.email ?? undefined,
          online_at: Date.now(),
        });

        void loadMembers();
      }
    });

    presenceChannelRef.current = channel;

    return () => {
      // Clear all typing timers safely
      timeoutsMap.forEach((id) => window.clearTimeout(id));
      timeoutsMap.clear();

      // Remove channel
      supabase.removeChannel(channel);

      if (presenceChannelRef.current === channel) {
        presenceChannelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, groupId]);

  /* -------------------- LEAVE GROUP (WITH ADMIN TRANSFER) -------------------- */
  const confirmLeaveGroup = async () => {
    if (!session) return;

    setLeaveLoading(true);
    setLeaveError(null);

    try {
      if (amIAdmin) {
        // Admin must assign new admin first
        if (nonAdminCandidates.length === 0) {
          setLeaveError("You are the only active member. Add a member first.");
          setLeaveLoading(false);
          return;
        }

        if (!selectedNewAdmin) {
          setLeaveError("Select a new admin first.");
          setLeaveLoading(false);
          return;
        }

        // ✅ Atomic: transfer admin + leave (RPC)
        const { error } = await supabase.rpc("transfer_admin_and_leave", {
          p_group_id: groupId,
          p_new_admin_user_id: selectedNewAdmin,
        });

        if (error) {
          setLeaveError(error.message);
          setLeaveLoading(false);
          return;
        }

        // After leaving, stop realtime and refresh
        stopRealtime();
        closeLeavePopup();
        await loadMembers();
        setLeaveLoading(false);
        return;
      }

      // Non-admin leave
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("group_members")
        // .update({ deleted_at: nowIso })
        .update({
          left_at: nowIso,      // ✅ mark as left
          deleted_at: null,     // ✅ IMPORTANT: do NOT delete on leave
        })
        .eq("group_id", groupId)
        .eq("user_id", session.user.id);

      if (error) {
        setLeaveError(error.message);
        setLeaveLoading(false);
        return;
      }

      // Stop realtime immediately
      stopRealtime();

      // Keep only messages up to leave time
      setMessages((prev) =>
        prev.filter(
          (m) => new Date(m.created_at).getTime() <= new Date(nowIso).getTime()
        )
      );

      closeLeavePopup();
      await loadMembers();
      setLeaveLoading(false);
    } catch (e: unknown) {
      setLeaveError(e instanceof Error ? e.message : "Leave failed.");
      setLeaveLoading(false);
    }
  };

  /* -------------------- SEND MESSAGE -------------------- */
  // Insert message into DB; realtime will show it for everyone
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    // ✅ Block sending if not active
    if (!amIActive) {
      setError("You have left this group. You cannot send new messages.");
      return;
    }

    const content = text.trim();
    if (!content) return;

    // Detect @AI or /ai
    const isAI =
      content.toLowerCase().startsWith("@ai") ||
      content.toLowerCase().startsWith("/ai");

    setSending(true);
    setError(null);

    try {
      if (isAI) {
        // 1) Save user's message normally
        await supabase.from("messages").insert({
          group_id: groupId,
          sender_id: session.user.id,
          role: "user",
          content,
        });

        // 2) Build context
        const context = messages.slice(-30).map((m) => ({
          role: m.role,
          content: m.content,
          sender_id: m.sender_id,
          created_at: m.created_at,
        }));

        // 3) Call FastAPI
        await askAI({
          groupId,
          userQuestion: content.replace(/^(@ai|\/ai)\s*/i, ""),
          context,
        });

        setText("");
        setSending(false);
        return;
      }

      // Normal message
      const { error } = await supabase.from("messages").insert({
        group_id: groupId,
        sender_id: session.user.id,
        role: "user",
        content,
      });

      if (error) setError(error.message);
      else setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI error");
    } finally {
      setSending(false);
    }
  };

  /* -------------------- TYPING BROADCAST -------------------- */
  // Send "typing" at most once every 700ms
  const onChangeText = (value: string) => {
    setText(value);

    if (!session) return;
    const ch = presenceChannelRef.current;
    if (!ch) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < 700) return;
    lastTypingSentRef.current = now;

    void ch.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: session.user.id },
    });
  };

  /* -------------------- DERIVED MAPS -------------------- */
  // ✅ Filter online users to only active members
  const activeMemberSet = useMemo(
    () => new Set(activeMembers.map((m) => m.user_id)),
    [activeMembers]
  );

  const onlineActiveUsers = useMemo(
    () => onlineUsers.filter((u) => activeMemberSet.has(u.user_id)),
    [onlineUsers, activeMemberSet]
  );

  // Fast check for online members (based on active users only)
  const onlineSet = useMemo(
    () => new Set(onlineActiveUsers.map((u) => u.user_id)),
    [onlineActiveUsers]
  );

  // Best display info comes from DB members; presence is only fallback
  const displayByUserId = useMemo(() => {
    const map = new Map<
      string,
      {
        email?: string;
        display_name?: string;
        last_seen_at?: string | null;
        role?: string;
      }
    >();

    for (const m of members) {
      map.set(m.user_id, {
        email: m.email,
        display_name: m.display_name,
        last_seen_at: m.last_seen_at,
        role: m.role,
      });
    }

    for (const u of onlineActiveUsers) {
      const existing = map.get(u.user_id) ?? {};
      map.set(u.user_id, { ...existing, email: existing.email ?? u.email });
    }

    if (session?.user?.id && session.user.email) {
      const existing = map.get(session.user.id) ?? {};
      map.set(session.user.id, {
        ...existing,
        email: existing.email ?? session.user.email,
      });
    }

    return map;
  }, [members, onlineActiveUsers, session]);

  // Build typing text using usernames
  const typingText = useMemo(() => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.map((uid) => {
      const info = displayByUserId.get(uid);
      const dn = info?.display_name?.trim();
      return dn ? dn : usernameFromEmail(info?.email);
    });

    const clean = names.filter((n) => n && n !== "unknown");
    if (clean.length === 0) return "Someone is typing...";

    const shown = clean.slice(0, 2);
    if (clean.length === 1) return `${shown[0]} is typing...`;
    if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
    return `${shown[0]}, ${shown[1]} and others are typing...`;
  }, [typingUsers, displayByUserId]);

  /* -------------------- RENDER GUARDS -------------------- */
  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <p>Loading session...</p>
      </main>
    );
  }

  if (!session) return null;

  /* -------------------- RENDER -------------------- */
  return (
    <main style={{ padding: 24 }}>
      {/* ================= HEADER ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Group Chat</h1>
        <Link href="/groups">← Back to Groups</Link>
      </div>

      <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>
      <hr style={{ margin: "16px 0" }} />

      {/* ================= MAIN LAYOUT ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* ================= CHAT COLUMN ================= */}
        <div>
          {/* ---------- Stats row ---------- */}
          <div
            style={{
              marginBottom: 8,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span>
              🟢 Online: <b>{onlineActiveUsers.length}</b>
            </span>
            <span>
              👥 Members: <b>{activeMembers.length}</b>
            </span>
            {typingText && <span>✍️ {typingText}</span>}

            {!shouldAutoScrollRef.current && (
              <button
                type="button"
                onClick={() => {
                  shouldAutoScrollRef.current = true;
                  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  marginLeft: "auto",
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                Jump to latest ↓
              </button>
            )}
          </div>

          {/* ✅ Show banner if user has left */}
          {!amIActive && (
            <p style={{ color: "#b45309", marginTop: 8 }}>
              You have left this group. You can view old messages only.
            </p>
          )}

          {loadingMsgs && <p>Loading messages...</p>}
          {error && <p style={{ color: "red" }}>❌ {error}</p>}

          {/* ---------- Messages box ---------- */}
          <div
            ref={scrollContainerRef}
            onScroll={onScrollMessages}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
              height: 420,
              overflowY: "auto",
              background: "#5c5959ff",
            }}
          >
            {messages.length === 0 ? (
              <p>No messages yet.</p>
            ) : (
              messages.map((m) => {
                const isMe = !!m.sender_id && m.sender_id === session.user.id;
                const info = m.sender_id
                  ? displayByUserId.get(m.sender_id)
                  : undefined;
                const email = info?.email;
                const displayName = info?.display_name?.trim();
                const senderName =
                  m.role === "ai"
                    ? "🤖 AI"
                    : displayName || usernameFromEmail(email);

                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "70%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: isMe ? "#37a95bff" : "#6b6259ff",
                      }}
                    >
                      {/* ---------- Message header ---------- */}
                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.9,
                          marginBottom: 4,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <b>{senderName}</b>
                        <span>• {new Date(m.created_at).toLocaleString()}</span>
                      </div>

                      {/* ---------- Message content ---------- */}
                      <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>

                      {/* ---------- Explain button ---------- */}
                      {m.role !== "ai" && (
                        <button
                          type="button"
                          style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}
                          onClick={async () => {
                            try {
                              setExplainOpen(true);
                              setExplainText(null);
                              setError(null);

                              setExplainText("Thinking...");

                              const ctx = messages.slice(-20).map((x) => ({
                                role: x.role,
                                content: x.content,
                                sender_id: x.sender_id ?? null,
                                created_at: x.created_at,
                              }));

                              const { reply } = await askAIExplain({
                                groupId,
                                userQuestion: `Explain this message in simple words (private popup only, do not post in group):\n"${m.content}"`,
                                context: ctx,
                              });

                              setExplainText(reply);
                            } catch (e: unknown) {
                              const msg =
                                e instanceof Error
                                  ? e.message
                                  : "Failed to explain.";
                              setExplainText("❌ " + msg);
                            }
                          }}
                        >
                          Explain
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* ---------- Send message ---------- */}
          <form
            onSubmit={sendMessage}
            style={{ display: "flex", gap: 8, marginTop: 12 }}
          >
            <input
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder='Type message... (use "@AI ...")'
              style={{ flex: 1, padding: 12, borderRadius: 10 }}
              disabled={!amIActive || sending}
            />
            <button
              disabled={!amIActive || sending}
              style={{ padding: "12px 16px", borderRadius: 10 }}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>

        {/* ================= MEMBERS PANEL ================= */}
        <aside
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 12,
            background: "#4cd678ff",
            height: 520,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Members</h3>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => void loadMembers()}
                style={{ padding: "6px 10px", borderRadius: 10 }}
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setLeaveOpen(true)}
                disabled={!amIActive}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  cursor: amIActive ? "pointer" : "not-allowed",
                  opacity: amIActive ? 1 : 0.5,
                }}
              >
                Leave Group
              </button>
            </div>
          </div>

          <p style={{ fontSize: 13, marginTop: 8 }}>🟢 Online / 🔴 Offline</p>

          <div style={{ display: "grid", gap: 10 }}>
            {activeMembers.map((m) => {
              const info = displayByUserId.get(m.user_id);
              const email = info?.email ?? m.email;
              const name =
                info?.display_name?.trim() || usernameFromEmail(email);
              const isOnline = onlineSet.has(m.user_id);
              const isAdmin = m.role === "admin";

              return (
                <div
                  key={m.user_id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 10,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.4)",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: isOnline ? "green" : "red",
                      marginTop: 6,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {m.user_id === session.user.id ? `${name} (You)` : name}
                      {isAdmin && (
                        <span style={{ marginLeft: 6, fontSize: 11 }}>
                          Admin
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      {isOnline ? "Online" : formatLastSeen(info?.last_seen_at)}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* ================= EXPLAIN POPUP ================= */}
      {explainOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => {
            setExplainOpen(false);
            setExplainText(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#7d8dceff",
              padding: 16,
              borderRadius: 12,
              maxWidth: 520,
              width: "90%",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>AI Explanation</h3>
              <button
                type="button"
                onClick={() => {
                  setExplainOpen(false);
                  setExplainText(null);
                }}
                style={{ padding: "6px 10px", borderRadius: 10 }}
              >
                Close
              </button>
            </div>

            <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              {explainText ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* ================= LEAVE GROUP POPUP ================= */}
      {leaveOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 120,
          }}
          onClick={closeLeavePopup}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#7d8dceff",
              padding: 16,
              borderRadius: 12,
              maxWidth: 520,
              width: "92%",
              border: "1px solid #ddd",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {amIAdmin ? "Assign new admin & leave" : "Leave group"}
            </h3>

            {amIAdmin ? (
              <>
                <p style={{ opacity: 0.8, marginTop: 6 }}>
                  You are an admin. Select one active member to make admin before
                  leaving.
                </p>

                {nonAdminCandidates.length === 0 ? (
                  <p style={{ color: "red" }}>
                    You are the only active member. Add a member first.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {nonAdminCandidates.map((m) => {
                      const info = displayByUserId.get(m.user_id);
                      const email = info?.email ?? m.email;
                      const name =
                        info?.display_name?.trim() || usernameFromEmail(email);

                      return (
                        <label
                          key={m.user_id}
                          style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            padding: 10,
                            borderRadius: 10,
                            border: "1px solid #eee",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="newAdmin"
                            checked={selectedNewAdmin === m.user_id}
                            onChange={() => setSelectedNewAdmin(m.user_id)}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700 }}>{name}</div>
                            <div style={{ fontSize: 12, opacity: 0.7 }}>
                              {email ?? "—"}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p style={{ opacity: 0.8 }}>
                Are you sure you want to leave? You will still be able to view old
                messages only.
              </p>
            )}

            {leaveError && <p style={{ color: "red" }}>❌ {leaveError}</p>}

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                marginTop: 14,
              }}
            >
              <button type="button" onClick={closeLeavePopup}>
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLeaveGroup}
                disabled={
                  leaveLoading ||
                  (amIAdmin &&
                    nonAdminCandidates.length > 0 &&
                    !selectedNewAdmin)
                }
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  cursor:
                    leaveLoading ||
                    (amIAdmin &&
                      nonAdminCandidates.length > 0 &&
                      !selectedNewAdmin)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    leaveLoading ||
                    (amIAdmin &&
                      nonAdminCandidates.length > 0 &&
                      !selectedNewAdmin)
                      ? 0.5
                      : 1,
                }}
              >
                {leaveLoading
                  ? "Working..."
                  : amIAdmin
                  ? "Assign & Leave"
                  : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
