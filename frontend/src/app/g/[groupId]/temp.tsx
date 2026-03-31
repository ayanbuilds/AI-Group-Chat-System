// // edit 1
// // export default function GroupChatPage() {
// //   return <h1>Group Chat Page</h1>;
// // }

// // edit 2

// // "use client";

// // import { useEffect, useMemo, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";

// // import { supabase } from "@/lib/supabase/client.ts";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   // ✅ Guard: must be logged in (UI level)
// //   useEffect(() => {
// //     if (!loading && !session) {
// //       router.replace("/login");
// //     }
// //   }, [loading, session, router]);

// //   const loadMessages = async () => {
// //     if (!session) return;

// //     setLoadingMsgs(true);
// //     setError(null);

// //     const { data, error } = await supabase
// //       .from("messages")
// //       .select("id,group_id,sender_id,role,content,created_at")
// //       .eq("group_id", groupId)
// //       .order("created_at", { ascending: true })
// //       .limit(200);

// //     if (error) {
// //       setError(error.message);
// //       setMessages([]);
// //     } else {
// //       setMessages((data ?? []) as Msg[]);
// //     }

// //     setLoadingMsgs(false);
// //   };

// //   useEffect(() => {
// //     if (session) void loadMessages();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [session, groupId]);

// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!session) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     const { error } = await supabase.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: session.user.id,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //       await loadMessages();
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           overflowY: "auto",
// //           background: "#fff",
// //         }}
// //       >
// //         {messages.length === 0 ? (
// //           <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //         ) : (
// //           messages.map((m) => {
// //             const isMe = m.sender_id === session.user.id;
// //             return (
// //               <div
// //                 key={m.id}
// //                 style={{
// //                   display: "flex",
// //                   justifyContent: isMe ? "flex-end" : "flex-start",
// //                   marginBottom: 10,
// //                 }}
// //               >
// //                 <div
// //                   style={{
// //                     maxWidth: "70%",
// //                     padding: "10px 12px",
// //                     borderRadius: 12,
// //                     border: "1px solid #eee",
// //                     background: isMe ? "#5ed584ff" : "#877d72ff",
// //                   }}
// //                 >
// //                   <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //                     {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //                     {new Date(m.created_at).toLocaleString()}
// //                   </div>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //                 </div>
// //               </div>
// //             );
// //           })
// //         )}
// //       </div>

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }

// // edit 3
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// // import { supabaseBrowser } from "@/lib/supabase/browser";
// import { useSession } from "@/lib/useSession";

// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const channelRef = useRef<RealtimeChannel | null>(null);

//   /* -------------------- AUTH GUARD -------------------- */
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
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

//   useEffect(() => {
//     if (session) void loadMessages();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
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
//             // 🚫 avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });
//         }
//       )
//       .subscribe();

//     channelRef.current = channel;

//     return () => {
//       if (channelRef.current) {
//         supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO SCROLL -------------------- */
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* -------------------- SEND MESSAGE -------------------- */
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     const content = text.trim();
//     if (!content) return;

//     setSending(true);
//     setError(null);

//     const { error } = await supabase.from("messages").insert({
//       group_id: groupId,
//       sender_id: session.user.id,
//       role: "user",
//       content,
//     });

//     if (error) {
//       setError(error.message);
//     } else {
//       setText("");
//       // ❌ loadMessages() REMOVED — realtime handles it
//     }

//     setSending(false);
//   };

//   /* -------------------- RENDER -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   return (
//     <main style={{ padding: 24, maxWidth: 900 }}>
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

//       {loadingMsgs && <p>Loading messages...</p>}
//       {error && <p style={{ color: "red" }}>❌ {error}</p>}

//       <div
//         style={{
//           border: "1px solid #ddd",
//           borderRadius: 10,
//           padding: 12,
//           height: 420,
//           overflowY: "auto",
//           background: "#fff",
//         }}
//       >
//         {messages.length === 0 ? (
//           <p style={{ opacity: 0.7 }}>No messages yet.</p>
//         ) : (
//           messages.map((m) => {
//             const isMe = m.sender_id === session.user.id;
//             return (
//               <div
//                 key={m.id}
//                 style={{
//                   display: "flex",
//                   justifyContent: isMe ? "flex-end" : "flex-start",
//                   marginBottom: 10,
//                 }}
//               >
//                 <div
//                   style={{
//                     maxWidth: "70%",
//                     padding: "10px 12px",
//                     borderRadius: 12,
//                     border: "1px solid #eee",
//                     background: isMe ? "#5ed584ff" : "#877d72ff",
//                   }}
//                 >
//                   <div
//                     style={{
//                       fontSize: 12,
//                       opacity: 0.65,
//                       marginBottom: 4,
//                     }}
//                   >
//                     {m.role === "ai"
//                       ? "🤖 AI"
//                       : isMe
//                       ? "You"
//                       : "Member"}{" "}
//                     • {new Date(m.created_at).toLocaleString()}
//                   </div>
//                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <form
//         onSubmit={sendMessage}
//         style={{ display: "flex", gap: 8, marginTop: 12 }}
//       >
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder='Type message... (later: "@AI ...")'
//           style={{
//             flex: 1,
//             padding: 12,
//             borderRadius: 10,
//             border: "1px solid #ddd",
//           }}
//         />
//         <button
//           disabled={sending}
//           style={{ padding: "12px 16px", borderRadius: 10 }}
//         >
//           {sending ? "Sending..." : "Send"}
//         </button>
//       </form>
//     </main>
//   );
// }
// // edit 4
// // "use client";

// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";
// // import type { RealtimeChannel } from "@supabase/supabase-js";

// // import { supabaseBrowser } from "@/lib/supabase/browser";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string | null;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   const bottomRef = useRef<HTMLDivElement | null>(null);
// //   const channelRef = useRef<RealtimeChannel | null>(null);

// //   // ✅ Guard: must be logged in
// //   useEffect(() => {
// //     if (!loading && !session) router.replace("/login");
// //   }, [loading, session, router]);

// //   // ✅ CRITICAL: Sync SSR session -> Browser client (so realtime gets JWT)
// //   useEffect(() => {
// //     if (!session) return;

// //     // Give realtime the JWT so it can pass RLS for events
// //     supabaseBrowser.realtime.setAuth(session.access_token);

// //     // Also set auth session for normal queries/inserts if needed
// //     // (safe even if already set)
// //     void supabaseBrowser.auth.setSession({
// //       access_token: session.access_token,
// //       refresh_token: session.refresh_token,
// //     });
// //   }, [session]);

// //   const loadMessages = async () => {
// //     if (!session) return;

// //     setLoadingMsgs(true);
// //     setError(null);

// //     const { data, error } = await supabaseBrowser
// //       .from("messages")
// //       .select("id,group_id,sender_id,role,content,created_at")
// //       .eq("group_id", groupId)
// //       .order("created_at", { ascending: true })
// //       .limit(200);

// //     if (error) {
// //       setError(error.message);
// //       setMessages([]);
// //     } else {
// //       setMessages((data ?? []) as Msg[]);
// //     }

// //     setLoadingMsgs(false);
// //   };

// //   useEffect(() => {
// //     if (session) void loadMessages();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [session, groupId]);

// //   // ✅ REALTIME: subscribe to INSERTs for this group
// //   useEffect(() => {
// //     if (!session) return;

// //     // cleanup old channel (if any)
// //     if (channelRef.current) {
// //       supabaseBrowser.removeChannel(channelRef.current);
// //       channelRef.current = null;
// //     }

// //     const channel = supabaseBrowser
// //       .channel(`messages:${groupId}`)
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "INSERT",
// //           schema: "public",
// //           table: "messages",
// //           filter: `group_id=eq.${groupId}`,
// //         },
// //         (payload) => {
// //           const newMsg = payload.new as Msg;

// //           setMessages((prev) => {
// //             if (prev.some((m) => m.id === newMsg.id)) return prev; // avoid duplicates
// //             return [...prev, newMsg];
// //           });
// //         }
// //       )
// //       .subscribe((status) => {
// //         // ✅ This should become "SUBSCRIBED"
// //         console.log("Realtime status:", status);
// //       });

// //     channelRef.current = channel;

// //     return () => {
// //       if (channelRef.current) {
// //         supabaseBrowser.removeChannel(channelRef.current);
// //         channelRef.current = null;
// //       }
// //     };
// //   }, [session, groupId]);

// //   // auto-scroll on new messages
// //   useEffect(() => {
// //     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
// //   }, [messages]);

// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!session) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     const { error } = await supabaseBrowser.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: session.user.id,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //       // ✅ NO loadMessages(); realtime will deliver the insert event
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           overflowY: "auto",
// //           background: "#fff",
// //         }}
// //       >
// //         {messages.length === 0 ? (
// //           <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //         ) : (
// //           messages.map((m) => {
// //             const isMe = m.sender_id === session.user.id;
// //             return (
// //               <div
// //                 key={m.id}
// //                 style={{
// //                   display: "flex",
// //                   justifyContent: isMe ? "flex-end" : "flex-start",
// //                   marginBottom: 10,
// //                 }}
// //               >
// //                 <div
// //                   style={{
// //                     maxWidth: "70%",
// //                     padding: "10px 12px",
// //                     borderRadius: 12,
// //                     border: "1px solid #eee",
// //                     background: isMe ? "#5ed584ff" : "#877d72ff",
// //                   }}
// //                 >
// //                   <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //                     {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //                     {new Date(m.created_at).toLocaleString()}
// //                   </div>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //                 </div>
// //               </div>
// //             );
// //           })
// //         )}
// //         <div ref={bottomRef} />
// //       </div>

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }

// // edit 5
// // "use client";

// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";
// // import type { RealtimeChannel } from "@supabase/supabase-js";

// // import { supabaseBrowser } from "@/lib/supabase/browser";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string | null;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   const listRef = useRef<HTMLDivElement | null>(null);
// //   const channelRef = useRef<RealtimeChannel | null>(null);

// //   // If user is near bottom, we auto-scroll; if user scrolls up, we stop auto-scroll.
// //   const [stickToBottom, setStickToBottom] = useState(true);

// //   /* -------------------- AUTH GUARD -------------------- */
// //   useEffect(() => {
// //     if (!loading && !session) router.replace("/login");
// //   }, [loading, session, router]);

// //   /* -------------------- SYNC JWT FOR REALTIME -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     supabaseBrowser.realtime.setAuth(session.access_token);
// //     void supabaseBrowser.auth.setSession({
// //       access_token: session.access_token,
// //       refresh_token: session.refresh_token,
// //     });
// //   }, [session]);

// //   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
// //   const loadMessages = async () => {
// //     if (!session) return;

// //     setLoadingMsgs(true);
// //     setError(null);

// //     const { data, error } = await supabaseBrowser
// //       .from("messages")
// //       .select("id,group_id,sender_id,role,content,created_at")
// //       .eq("group_id", groupId)
// //       .order("created_at", { ascending: true })
// //       .limit(200);

// //     if (error) {
// //       setError(error.message);
// //       setMessages([]);
// //     } else {
// //       setMessages((data ?? []) as Msg[]);
// //     }

// //     setLoadingMsgs(false);

// //     // After initial load, we usually want to be at bottom.
// //     // But do it once, not continuously.
// //     requestAnimationFrame(() => {
// //       if (listRef.current) {
// //         listRef.current.scrollTop = listRef.current.scrollHeight;
// //       }
// //     });
// //   };

// //   useEffect(() => {
// //     if (session) void loadMessages();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [session, groupId]);

// //   /* -------------------- TRACK USER SCROLL -------------------- */
// //   useEffect(() => {
// //     const el = listRef.current;
// //     if (!el) return;

// //     const onScroll = () => {
// //       // “near bottom” threshold (px)
// //       const threshold = 80;
// //       const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
// //       setStickToBottom(distanceFromBottom < threshold);
// //     };

// //     el.addEventListener("scroll", onScroll);
// //     // initialize
// //     onScroll();

// //     return () => el.removeEventListener("scroll", onScroll);
// //   }, []);

// //   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     // cleanup previous channel
// //     if (channelRef.current) {
// //       supabaseBrowser.removeChannel(channelRef.current);
// //       channelRef.current = null;
// //     }

// //     const channel = supabaseBrowser
// //       .channel(`messages:${groupId}`)
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "INSERT",
// //           schema: "public",
// //           table: "messages",
// //           filter: `group_id=eq.${groupId}`,
// //         },
// //         (payload) => {
// //           const newMsg = payload.new as Msg;

// //           setMessages((prev) => {
// //             if (prev.some((m) => m.id === newMsg.id)) return prev;
// //             return [...prev, newMsg];
// //           });

// //           // ✅ only auto-scroll if user is already near bottom
// //           requestAnimationFrame(() => {
// //             const el = listRef.current;
// //             if (!el) return;
// //             if (stickToBottom) {
// //               el.scrollTop = el.scrollHeight; // "auto" behavior (no smooth jerk)
// //             }
// //           });
// //         }
// //       )
// //       .subscribe();

// //     channelRef.current = channel;

// //     return () => {
// //       if (channelRef.current) {
// //         supabaseBrowser.removeChannel(channelRef.current);
// //         channelRef.current = null;
// //       }
// //     };
// //     // Important: include stickToBottom so callback uses latest value
// //   }, [session, groupId, stickToBottom]);

// //   /* -------------------- SEND MESSAGE -------------------- */
// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!session) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     const { error } = await supabaseBrowser.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: session.user.id,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //       // Do NOT force scroll here; realtime insert will arrive and scroll if needed
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         ref={listRef}
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           overflowY: "auto",
// //           background: "#fff",
// //         }}
// //       >
// //         {messages.length === 0 ? (
// //           <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //         ) : (
// //           messages.map((m) => {
// //             const isMe = m.sender_id === session.user.id;
// //             return (
// //               <div
// //                 key={m.id}
// //                 style={{
// //                   display: "flex",
// //                   justifyContent: isMe ? "flex-end" : "flex-start",
// //                   marginBottom: 10,
// //                 }}
// //               >
// //                 <div
// //                   style={{
// //                     maxWidth: "70%",
// //                     padding: "10px 12px",
// //                     borderRadius: 12,
// //                     border: "1px solid #eee",
// //                     background: isMe ? "#5ed584ff" : "#877d72ff",
// //                   }}
// //                 >
// //                   <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //                     {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //                     {new Date(m.created_at).toLocaleString()}
// //                   </div>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //                 </div>
// //               </div>
// //             );
// //           })
// //         )}
// //       </div>

// //       {!stickToBottom && (
// //         <button
// //           type="button"
// //           onClick={() => {
// //             const el = listRef.current;
// //             if (!el) return;
// //             el.scrollTop = el.scrollHeight;
// //             setStickToBottom(true);
// //           }}
// //           style={{ marginTop: 10, padding: "8px 10px", borderRadius: 10 }}
// //         >
// //           ↓ Jump to latest
// //         </button>
// //       )}

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }

// // edit 6
// // "use client";

// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";
// // import type { RealtimeChannel } from "@supabase/supabase-js";

// // import { supabaseBrowser } from "@/lib/supabase/browser";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string | null;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   const listRef = useRef<HTMLDivElement | null>(null);
// //   const channelRef = useRef<RealtimeChannel | null>(null);
  
// //   // ✅ Use ref instead of state to avoid re-renders
// //   const stickToBottomRef = useRef(true);
// //   const [showJumpButton, setShowJumpButton] = useState(false);

// //   /* -------------------- AUTH GUARD -------------------- */
// //   useEffect(() => {
// //     if (!loading && !session) router.replace("/login");
// //   }, [loading, session, router]);

// //   /* -------------------- SYNC JWT FOR REALTIME -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     supabaseBrowser.realtime.setAuth(session.access_token);
// //     void supabaseBrowser.auth.setSession({
// //       access_token: session.access_token,
// //       refresh_token: session.refresh_token,
// //     });
// //   }, [session]);

// //   /* -------------------- SMOOTH SCROLL HELPER -------------------- */
// //   const scrollToBottom = (smooth = false) => {
// //     const el = listRef.current;
// //     if (!el) return;
    
// //     if (smooth) {
// //       el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
// //     } else {
// //       el.scrollTop = el.scrollHeight;
// //     }
// //   };

// //   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
// //   const loadMessages = async () => {
// //     if (!session) return;

// //     setLoadingMsgs(true);
// //     setError(null);

// //     const { data, error } = await supabaseBrowser
// //       .from("messages")
// //       .select("id,group_id,sender_id,role,content,created_at")
// //       .eq("group_id", groupId)
// //       .order("created_at", { ascending: true })
// //       .limit(200);

// //     if (error) {
// //       setError(error.message);
// //       setMessages([]);
// //     } else {
// //       setMessages((data ?? []) as Msg[]);
// //     }

// //     setLoadingMsgs(false);

// //     // Scroll to bottom after load
// //     setTimeout(() => scrollToBottom(), 100);
// //   };

// //   useEffect(() => {
// //     if (session) void loadMessages();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [session, groupId]);

// //   /* -------------------- TRACK USER SCROLL -------------------- */
// //   useEffect(() => {
// //     const el = listRef.current;
// //     if (!el) return;

// //     const onScroll = () => {
// //       const threshold = 100;
// //       const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
// //       const nearBottom = distanceFromBottom < threshold;
      
// //       stickToBottomRef.current = nearBottom;
// //       setShowJumpButton(!nearBottom);
// //     };

// //     el.addEventListener("scroll", onScroll, { passive: true });
// //     onScroll();

// //     return () => el.removeEventListener("scroll", onScroll);
// //   }, []);

// //   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     // cleanup previous channel
// //     if (channelRef.current) {
// //       supabaseBrowser.removeChannel(channelRef.current);
// //       channelRef.current = null;
// //     }

// //     const channel = supabaseBrowser
// //       .channel(`messages:${groupId}`)
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "INSERT",
// //           schema: "public",
// //           table: "messages",
// //           filter: `group_id=eq.${groupId}`,
// //         },
// //         (payload) => {
// //           const newMsg = payload.new as Msg;

// //           setMessages((prev) => {
// //             // Avoid duplicates
// //             if (prev.some((m) => m.id === newMsg.id)) return prev;
// //             return [...prev, newMsg];
// //           });

// //           // ✅ Auto-scroll only if user was near bottom (using ref)
// //           requestAnimationFrame(() => {
// //             if (stickToBottomRef.current) {
// //               scrollToBottom();
// //             }
// //           });
// //         }
// //       )
// //       .subscribe();

// //     channelRef.current = channel;

// //     return () => {
// //       if (channelRef.current) {
// //         supabaseBrowser.removeChannel(channelRef.current);
// //         channelRef.current = null;
// //       }
// //     };
// //     // ✅ Remove stickToBottom from dependencies - no more jerk!
// //   }, [session, groupId]);

// //   /* -------------------- SEND MESSAGE -------------------- */
// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!session) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     const { error } = await supabaseBrowser.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: session.user.id,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         ref={listRef}
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           overflowY: "auto",
// //           background: "#fff",
// //         }}
// //       >
// //         {messages.length === 0 ? (
// //           <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //         ) : (
// //           messages.map((m) => {
// //             const isMe = m.sender_id === session.user.id;
// //             return (
// //               <div
// //                 key={m.id}
// //                 style={{
// //                   display: "flex",
// //                   justifyContent: isMe ? "flex-end" : "flex-start",
// //                   marginBottom: 10,
// //                 }}
// //               >
// //                 <div
// //                   style={{
// //                     maxWidth: "70%",
// //                     padding: "10px 12px",
// //                     borderRadius: 12,
// //                     border: "1px solid #eee",
// //                     background: isMe ? "#5ed584ff" : "#877d72ff",
// //                   }}
// //                 >
// //                   <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //                     {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //                     {new Date(m.created_at).toLocaleString()}
// //                   </div>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //                 </div>
// //               </div>
// //             );
// //           })
// //         )}
// //       </div>

// //       {showJumpButton && (
// //         <button
// //           type="button"
// //           onClick={() => {
// //             scrollToBottom(true);
// //             stickToBottomRef.current = true;
// //             setShowJumpButton(false);
// //           }}
// //           style={{ 
// //             marginTop: 10, 
// //             padding: "8px 10px", 
// //             borderRadius: 10,
// //             cursor: "pointer"
// //           }}
// //         >
// //           ↓ Jump to latest
// //         </button>
// //       )}

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }


// // edit 7
// // "use client";

// // import { useEffect, useMemo, useRef, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";
// // import type { RealtimeChannel } from "@supabase/supabase-js";

// // import { supabaseBrowser } from "@/lib/supabase/browser";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string | null;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   const listRef = useRef<HTMLDivElement | null>(null);
// //   const channelRef = useRef<RealtimeChannel | null>(null);
  
// //   // ✅ Use ref instead of state to avoid re-renders
// //   const stickToBottomRef = useRef(true);
// //   const [showJumpButton, setShowJumpButton] = useState(false);
// //   const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// //   /* -------------------- AUTH GUARD -------------------- */
// //   useEffect(() => {
// //     if (!loading && !session) router.replace("/login");
// //   }, [loading, session, router]);

// //   /* -------------------- SYNC JWT FOR REALTIME -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     supabaseBrowser.realtime.setAuth(session.access_token);
// //     void supabaseBrowser.auth.setSession({
// //       access_token: session.access_token,
// //       refresh_token: session.refresh_token,
// //     });
// //   }, [session]);

// //   /* -------------------- SMOOTH SCROLL HELPER -------------------- */
// //   const scrollToBottom = (smooth = false) => {
// //     if (scrollTimeoutRef.current) {
// //       clearTimeout(scrollTimeoutRef.current);
// //     }
    
// //     scrollTimeoutRef.current = setTimeout(() => {
// //       const el = listRef.current;
// //       if (!el) return;
      
// //       if (smooth) {
// //         el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
// //       } else {
// //         el.scrollTop = el.scrollHeight;
// //       }
// //     }, 0);
// //   };

// //   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
// //   const loadMessages = async () => {
// //     if (!session) return;

// //     setLoadingMsgs(true);
// //     setError(null);

// //     const { data, error } = await supabaseBrowser
// //       .from("messages")
// //       .select("id,group_id,sender_id,role,content,created_at")
// //       .eq("group_id", groupId)
// //       .order("created_at", { ascending: true })
// //       .limit(200);

// //     if (error) {
// //       setError(error.message);
// //       setMessages([]);
// //     } else {
// //       setMessages((data ?? []) as Msg[]);
// //     }

// //     setLoadingMsgs(false);

// //     // Scroll to bottom after load
// //     setTimeout(() => scrollToBottom(), 100);
// //   };

// //   useEffect(() => {
// //     if (session) void loadMessages();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [session, groupId]);

// //   /* -------------------- TRACK USER SCROLL -------------------- */
// //   useEffect(() => {
// //     const el = listRef.current;
// //     if (!el) return;

// //     const onScroll = () => {
// //       const threshold = 100;
// //       const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
// //       const nearBottom = distanceFromBottom < threshold;
      
// //       stickToBottomRef.current = nearBottom;
// //       setShowJumpButton(!nearBottom);
// //     };

// //     el.addEventListener("scroll", onScroll, { passive: true });
// //     onScroll();

// //     return () => el.removeEventListener("scroll", onScroll);
// //   }, []);

// //   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     // cleanup previous channel
// //     if (channelRef.current) {
// //       supabaseBrowser.removeChannel(channelRef.current);
// //       channelRef.current = null;
// //     }

// //     const channel = supabaseBrowser
// //       .channel(`messages:${groupId}`)
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "INSERT",
// //           schema: "public",
// //           table: "messages",
// //           filter: `group_id=eq.${groupId}`,
// //         },
// //         (payload) => {
// //           const newMsg = payload.new as Msg;

// //           setMessages((prev) => {
// //             // Avoid duplicates
// //             if (prev.some((m) => m.id === newMsg.id)) return prev;
            
// //             // Check if we should scroll BEFORE adding message
// //             const shouldScroll = stickToBottomRef.current;
            
// //             // Add message
// //             const updated = [...prev, newMsg];
            
// //             // Schedule scroll after DOM update
// //             if (shouldScroll) {
// //               setTimeout(() => {
// //                 const el = listRef.current;
// //                 if (el) {
// //                   el.scrollTop = el.scrollHeight;
// //                 }
// //               }, 0);
// //             }
            
// //             return updated;
// //           });
// //         }
// //       )
// //       .subscribe();

// //     channelRef.current = channel;

// //     return () => {
// //       if (channelRef.current) {
// //         supabaseBrowser.removeChannel(channelRef.current);
// //         channelRef.current = null;
// //       }
// //     };
// //   }, [session, groupId]);

// //   /* -------------------- SEND MESSAGE -------------------- */
// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!session) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     const { error } = await supabaseBrowser.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: session.user.id,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         ref={listRef}
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           overflowY: "auto",
// //           background: "#fff",
// //           willChange: "scroll-position",
// //           transform: "translateZ(0)", // GPU acceleration
// //         }}
// //       >
// //         {messages.length === 0 ? (
// //           <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //         ) : (
// //           messages.map((m) => {
// //             const isMe = m.sender_id === session.user.id;
// //             return (
// //               <div
// //                 key={m.id}
// //                 style={{
// //                   display: "flex",
// //                   justifyContent: isMe ? "flex-end" : "flex-start",
// //                   marginBottom: 10,
// //                 }}
// //               >
// //                 <div
// //                   style={{
// //                     maxWidth: "70%",
// //                     padding: "10px 12px",
// //                     borderRadius: 12,
// //                     border: "1px solid #eee",
// //                     background: isMe ? "#5ed584ff" : "#877d72ff",
// //                   }}
// //                 >
// //                   <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //                     {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //                     {new Date(m.created_at).toLocaleString()}
// //                   </div>
// //                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //                 </div>
// //               </div>
// //             );
// //           })
// //         )}
// //       </div>

// //       {showJumpButton && (
// //         <button
// //           type="button"
// //           onClick={() => {
// //             scrollToBottom(true);
// //             stickToBottomRef.current = true;
// //             setShowJumpButton(false);
// //           }}
// //           style={{ 
// //             marginTop: 10, 
// //             padding: "8px 10px", 
// //             borderRadius: 10,
// //             cursor: "pointer"
// //           }}
// //         >
// //           ↓ Jump to latest
// //         </button>
// //       )}

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }

// // "use client";

// // import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";
// // import type { RealtimeChannel } from "@supabase/supabase-js";

// // import { supabaseBrowser } from "@/lib/supabase/browser";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string | null;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   const listRef = useRef<HTMLDivElement | null>(null);
// //   const bottomRef = useRef<HTMLDivElement | null>(null);
// //   const channelRef = useRef<RealtimeChannel | null>(null);

// //   // prevents duplicates + prevents re-render loops
// //   const seenIdsRef = useRef<Set<string>>(new Set());

// //   // stick-to-bottom behavior (like room.html)
// //   const stickToBottomRef = useRef(true);
// //   const [showJumpButton, setShowJumpButton] = useState(false);

// //   // track whether component is mounted (safe async setState)
// //   const mountedRef = useRef(false);

// //   /* -------------------- AUTH GUARD -------------------- */
// //   useEffect(() => {
// //     if (!loading && !session) router.replace("/login");
// //   }, [loading, session, router]);

// //   /* -------------------- SYNC JWT FOR REALTIME -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     supabaseBrowser.realtime.setAuth(session.access_token);
// //     void supabaseBrowser.auth.setSession({
// //       access_token: session.access_token,
// //       refresh_token: session.refresh_token,
// //     });
// //   }, [session]);

// //   /* -------------------- SCROLL HELPERS -------------------- */
// //   const scrollToBottom = (smooth = false) => {
// //     // bottom anchor is the most stable (no jump)
// //     const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
// //     bottomRef.current?.scrollIntoView({ block: "end", behavior });
// //   };

// //   /* -------------------- TRACK USER SCROLL -------------------- */
// //   useEffect(() => {
// //     const el = listRef.current;
// //     if (!el) return;

// //     const onScroll = () => {
// //       const threshold = 100;
// //       const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
// //       const nearBottom = distanceFromBottom < threshold;

// //       stickToBottomRef.current = nearBottom;
// //       setShowJumpButton(!nearBottom);
// //     };

// //     el.addEventListener("scroll", onScroll, { passive: true });
// //     onScroll();

// //     return () => el.removeEventListener("scroll", onScroll);
// //   }, []);

// //   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
// //   useEffect(() => {
// //     mountedRef.current = true;
// //     return () => {
// //       mountedRef.current = false;
// //     };
// //   }, []);

// //   useEffect(() => {
// //     const load = async () => {
// //       if (!session) return;

// //       setLoadingMsgs(true);
// //       setError(null);

// //       const { data, error } = await supabaseBrowser
// //         .from("messages")
// //         .select("id,group_id,sender_id,role,content,created_at")
// //         .eq("group_id", groupId)
// //         .order("created_at", { ascending: true })
// //         .limit(200);

// //       if (!mountedRef.current) return;

// //       if (error) {
// //         setError(error.message);
// //         setMessages([]);
// //         seenIdsRef.current = new Set();
// //       } else {
// //         const msgs = (data ?? []) as Msg[];

// //         // refresh seenIds
// //         const s = new Set<string>();
// //         for (const m of msgs) s.add(m.id);
// //         seenIdsRef.current = s;

// //         setMessages(msgs);
// //       }

// //       setLoadingMsgs(false);

// //       // initial: jump to bottom (no smooth) – stable
// //       requestAnimationFrame(() => scrollToBottom(false));
// //     };

// //     if (session) void load();
// //   }, [session, groupId]);

// //   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
// //   useEffect(() => {
// //     if (!session) return;

// //     // cleanup previous channel (important)
// //     if (channelRef.current) {
// //       supabaseBrowser.removeChannel(channelRef.current);
// //       channelRef.current = null;
// //     }

// //     const channel = supabaseBrowser
// //       .channel(`messages:${groupId}`)
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "INSERT",
// //           schema: "public",
// //           table: "messages",
// //           filter: `group_id=eq.${groupId}`,
// //         },
// //         (payload) => {
// //           const newMsg = payload.new as Msg;

// //           // dedupe using Set (fast + stable)
// //           if (seenIdsRef.current.has(newMsg.id)) return;
// //           seenIdsRef.current.add(newMsg.id);

// //           // append-only (NO replace, NO refresh)
// //           setMessages((prev) => [...prev, newMsg]);
// //         }
// //       )
// //       .subscribe();

// //     channelRef.current = channel;

// //     return () => {
// //       if (channelRef.current) {
// //         supabaseBrowser.removeChannel(channelRef.current);
// //         channelRef.current = null;
// //       }
// //     };
// //   }, [session, groupId]);

// //   /* -------------------- AUTO-SCROLL (DOM update ke baad) -------------------- */
// //   useLayoutEffect(() => {
// //     // only auto-scroll if user is at bottom
// //     if (!stickToBottomRef.current) return;

// //     // allow layout to settle then scroll
// //     requestAnimationFrame(() => scrollToBottom(false));
// //   }, [messages.length]);

// //   /* -------------------- SEND MESSAGE -------------------- */
// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!session) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     // optimistic UX: set stickToBottom true when sending
// //     stickToBottomRef.current = true;
// //     setShowJumpButton(false);

// //     const { error } = await supabaseBrowser.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: session.user.id,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //       // scroll immediately to bottom (user expectation)
// //       requestAnimationFrame(() => scrollToBottom(true));
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           background: "#fff",
// //           display: "flex",
// //           flexDirection: "column",
// //           minHeight: 0, // IMPORTANT (prevents flex scroll jerk)
// //         }}
// //       >
// //         <div
// //           ref={listRef}
// //           style={{
// //             flex: 1,
// //             minHeight: 0, // IMPORTANT
// //             overflowY: "auto",
// //             paddingRight: 6,
// //             overflowAnchor: "none", // prevents browser anchoring jumps
// //             transform: "translateZ(0)",
// //             willChange: "scroll-position",
// //           }}
// //         >
// //           {messages.length === 0 ? (
// //             <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //           ) : (
// //             messages.map((m) => <MessageRow key={m.id} m={m} meId={session.user.id} />)
// //           )}

// //           {/* stable bottom anchor */}
// //           <div ref={bottomRef} />
// //         </div>
// //       </div>

// //       {showJumpButton && (
// //         <button
// //           type="button"
// //           onClick={() => {
// //             stickToBottomRef.current = true;
// //             setShowJumpButton(false);
// //             scrollToBottom(true);
// //           }}
// //           style={{
// //             marginTop: 10,
// //             padding: "8px 10px",
// //             borderRadius: 10,
// //             cursor: "pointer",
// //           }}
// //         >
// //           ↓ Jump to latest
// //         </button>
// //       )}

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }

// // /* -------------------- MEMOIZED MESSAGE ROW (reduces re-render jerk) -------------------- */
// // const MessageRow = React.memo(function MessageRow({ m, meId }: { m: Msg; meId: string }) {
// //   const isMe = m.sender_id === meId;

// //   return (
// //     <div
// //       style={{
// //         display: "flex",
// //         justifyContent: isMe ? "flex-end" : "flex-start",
// //         marginBottom: 10,
// //       }}
// //     >
// //       <div
// //         style={{
// //           maxWidth: "70%",
// //           padding: "10px 12px",
// //           borderRadius: 12,
// //           border: "1px solid #eee",
// //           background: isMe ? "#5ed584ff" : "#877d72ff",
// //         }}
// //       >
// //         <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //           {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //           {new Date(m.created_at).toLocaleString()}
// //         </div>
// //         <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //       </div>
// //     </div>
// //   );
// // });

// // working edit
// // "use client";

// // import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// // import { useParams, useRouter } from "next/navigation";
// // import Link from "next/link";
// // import type { RealtimeChannel } from "@supabase/supabase-js";

// // import { supabaseBrowser } from "@/lib/supabase/browser";
// // import { useSession } from "@/lib/useSession";

// // type Msg = {
// //   id: string;
// //   group_id: string;
// //   sender_id: string | null;
// //   role: "user" | "ai";
// //   content: string;
// //   created_at: string;
// // };

// // export default function GroupChatPage() {
// //   const router = useRouter();
// //   const params = useParams<{ groupId: string }>();
// //   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

// //   const { session, loading } = useSession();
// //   const userId = session?.user?.id ?? null;
// //   const accessToken = session?.access_token ?? null;

// //   const [messages, setMessages] = useState<Msg[]>([]);
// //   const [text, setText] = useState("");
// //   const [error, setError] = useState<string | null>(null);
// //   const [loadingMsgs, setLoadingMsgs] = useState(false);
// //   const [sending, setSending] = useState(false);

// //   const listRef = useRef<HTMLDivElement | null>(null);
// //   const bottomRef = useRef<HTMLDivElement | null>(null);

// //   const channelRef = useRef<RealtimeChannel | null>(null);

// //   // dedupe
// //   const seenIdsRef = useRef<Set<string>>(new Set());

// //   // scroll behavior
// //   const stickToBottomRef = useRef(true);
// //   const [showJumpButton, setShowJumpButton] = useState(false);

// //   // avoid setting state after unmount
// //   const mountedRef = useRef(false);

// //   /* -------------------- AUTH GUARD -------------------- */
// //   useEffect(() => {
// //     if (!loading && !session) router.replace("/login");
// //   }, [loading, session, router]);

// //   /* -------------------- MOUNT TRACK -------------------- */
// //   useEffect(() => {
// //     mountedRef.current = true;
// //     return () => {
// //       mountedRef.current = false;
// //     };
// //   }, []);

// //   /* -------------------- ✅ REALTIME AUTH (NO auth.setSession) -------------------- */
// //   const lastTokenRef = useRef<string | null>(null);
// //   useEffect(() => {
// //     if (!accessToken) return;

// //     // only if token actually changed
// //     if (lastTokenRef.current === accessToken) return;
// //     lastTokenRef.current = accessToken;

// //     supabaseBrowser.realtime.setAuth(accessToken);
// //   }, [accessToken]);

// //   /* -------------------- SCROLL HELPERS -------------------- */
// //   const scrollToBottom = (smooth = false) => {
// //     const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
// //     bottomRef.current?.scrollIntoView({ block: "end", behavior });
// //   };

// //   /* -------------------- TRACK USER SCROLL -------------------- */
// //   useEffect(() => {
// //     const el = listRef.current;
// //     if (!el) return;

// //     const onScroll = () => {
// //       const threshold = 100;
// //       const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
// //       const nearBottom = distanceFromBottom < threshold;

// //       stickToBottomRef.current = nearBottom;
// //       setShowJumpButton(!nearBottom);
// //     };

// //     el.addEventListener("scroll", onScroll, { passive: true });
// //     onScroll();

// //     return () => el.removeEventListener("scroll", onScroll);
// //   }, []);

// //   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
// //   const loadMessages = async () => {
// //     if (!userId) return;

// //     setLoadingMsgs(true);
// //     setError(null);

// //     // ✅ debug (optional)
// //     // console.log("loadMessages called", Date.now());

// //     const { data, error } = await supabaseBrowser
// //       .from("messages")
// //       .select("id,group_id,sender_id,role,content,created_at")
// //       .eq("group_id", groupId)
// //       .order("created_at", { ascending: true })
// //       .limit(200);

// //     if (!mountedRef.current) return;

// //     if (error) {
// //       setError(error.message);
// //       setMessages([]);
// //       seenIdsRef.current = new Set();
// //     } else {
// //       const msgs = (data ?? []) as Msg[];

// //       const s = new Set<string>();
// //       for (const m of msgs) s.add(m.id);
// //       seenIdsRef.current = s;

// //       setMessages(msgs);
// //     }

// //     setLoadingMsgs(false);

// //     requestAnimationFrame(() => scrollToBottom(false));
// //   };

// //   // ✅ important: depend on userId, not whole session object
// //   useEffect(() => {
// //     if (!userId) return;
// //     void loadMessages();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [userId, groupId]);

// //   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
// //   useEffect(() => {
// //     if (!userId) return;

// //     // cleanup previous channel
// //     if (channelRef.current) {
// //       supabaseBrowser.removeChannel(channelRef.current);
// //       channelRef.current = null;
// //     }

// //     // ✅ debug (optional)
// //     // console.log("SUBSCRIBE channel", groupId, Date.now());

// //     const channel = supabaseBrowser
// //       .channel(`messages:${groupId}`)
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "INSERT",
// //           schema: "public",
// //           table: "messages",
// //           filter: `group_id=eq.${groupId}`,
// //         },
// //         (payload) => {
// //           const newMsg = payload.new as Msg;

// //           // dedupe
// //           if (seenIdsRef.current.has(newMsg.id)) return;
// //           seenIdsRef.current.add(newMsg.id);

// //           // append only
// //           setMessages((prev) => [...prev, newMsg]);
// //         }
// //       )
// //       .subscribe();

// //     channelRef.current = channel;

// //     return () => {
// //       if (channelRef.current) {
// //         supabaseBrowser.removeChannel(channelRef.current);
// //         channelRef.current = null;
// //       }
// //     };
// //   }, [userId, groupId]);

// //   /* -------------------- AUTO-SCROLL AFTER DOM UPDATE -------------------- */
// //   useLayoutEffect(() => {
// //     if (!stickToBottomRef.current) return;
// //     requestAnimationFrame(() => scrollToBottom(false));
// //   }, [messages.length]);

// //   /* -------------------- SEND MESSAGE -------------------- */
// //   const sendMessage = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (!userId) return;

// //     const content = text.trim();
// //     if (!content) return;

// //     setSending(true);
// //     setError(null);

// //     // when user sends, they expect bottom
// //     stickToBottomRef.current = true;
// //     setShowJumpButton(false);

// //     const { error } = await supabaseBrowser.from("messages").insert({
// //       group_id: groupId,
// //       sender_id: userId,
// //       role: "user",
// //       content,
// //     });

// //     if (error) {
// //       setError(error.message);
// //     } else {
// //       setText("");
// //       requestAnimationFrame(() => scrollToBottom(true));
// //     }

// //     setSending(false);
// //   };

// //   if (loading) {
// //     return (
// //       <main style={{ padding: 24 }}>
// //         <p>Loading session...</p>
// //       </main>
// //     );
// //   }

// //   if (!session) return null;

// //   return (
// //     <main style={{ padding: 24, maxWidth: 900 }}>
// //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
// //         <h1 style={{ margin: 0 }}>Group Chat</h1>
// //         <Link href="/groups">← Back to Groups</Link>
// //       </div>

// //       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

// //       <hr style={{ margin: "16px 0" }} />

// //       {loadingMsgs && <p>Loading messages...</p>}
// //       {error && <p style={{ color: "red" }}>❌ {error}</p>}

// //       <div
// //         style={{
// //           border: "1px solid #ddd",
// //           borderRadius: 10,
// //           padding: 12,
// //           height: 420,
// //           background: "#fff",
// //           display: "flex",
// //           flexDirection: "column",
// //           minHeight: 0,
// //         }}
// //       >
// //         <div
// //           ref={listRef}
// //           style={{
// //             flex: 1,
// //             minHeight: 0,
// //             overflowY: "auto",
// //             paddingRight: 6,
// //             overflowAnchor: "none",
// //             transform: "translateZ(0)",
// //             willChange: "scroll-position",
// //           }}
// //         >
// //           {messages.length === 0 ? (
// //             <p style={{ opacity: 0.7 }}>No messages yet.</p>
// //           ) : (
// //             messages.map((m) => <MessageRow key={m.id} m={m} meId={userId} />)
// //           )}

// //           <div ref={bottomRef} />
// //         </div>
// //       </div>

// //       {showJumpButton && (
// //         <button
// //           type="button"
// //           onClick={() => {
// //             stickToBottomRef.current = true;
// //             setShowJumpButton(false);
// //             scrollToBottom(true);
// //           }}
// //           style={{
// //             marginTop: 10,
// //             padding: "8px 10px",
// //             borderRadius: 10,
// //             cursor: "pointer",
// //           }}
// //         >
// //           ↓ Jump to latest
// //         </button>
// //       )}

// //       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
// //         <input
// //           value={text}
// //           onChange={(e) => setText(e.target.value)}
// //           placeholder='Type message... (later: "@AI ...")'
// //           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
// //         />
// //         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
// //           {sending ? "Sending..." : "Send"}
// //         </button>
// //       </form>
// //     </main>
// //   );
// // }

// // const MessageRow = React.memo(function MessageRow({ m, meId }: { m: Msg; meId: string }) {
// //   const isMe = m.sender_id === meId;

// //   return (
// //     <div
// //       style={{
// //         display: "flex",
// //         justifyContent: isMe ? "flex-end" : "flex-start",
// //         marginBottom: 10,
// //       }}
// //     >
// //       <div
// //         style={{
// //           maxWidth: "70%",
// //           padding: "10px 12px",
// //           borderRadius: 12,
// //           border: "1px solid #eee",
// //           background: isMe ? "#5ed584ff" : "#877d72ff",
// //         }}
// //       >
// //         <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
// //           {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
// //           {new Date(m.created_at).toLocaleString()}
// //         </div>
// //         <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
// //       </div>
// //     </div>
// //   );
// // });

// // edit 2
// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";

// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   const bottomRef = useRef<HTMLDivElement | null>(null);
//   const channelRef = useRef<RealtimeChannel | null>(null);

//   /* -------------------- AUTH GUARD -------------------- */
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
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

//   useEffect(() => {
//     if (session) void loadMessages();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REALTIME SUBSCRIPTION -------------------- */
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
//             // 🚫 avoid duplicates
//             if (prev.some((m) => m.id === newMsg.id)) return prev;
//             return [...prev, newMsg];
//           });
//         }
//       )
//       .subscribe();

//     channelRef.current = channel;

//     return () => {
//       if (channelRef.current) {
//         supabase.removeChannel(channelRef.current);
//         channelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- AUTO SCROLL -------------------- */
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* -------------------- SEND MESSAGE -------------------- */
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     const content = text.trim();
//     if (!content) return;

//     setSending(true);
//     setError(null);

//     const { error } = await supabase.from("messages").insert({
//       group_id: groupId,
//       sender_id: session.user.id,
//       role: "user",
//       content,
//     });

//     if (error) {
//       setError(error.message);
//     } else {
//       setText("");
//       // ❌ loadMessages() REMOVED — realtime handles it
//     }

//     setSending(false);
//   };

//   /* -------------------- RENDER -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   return (
//     <main style={{ padding: 24, maxWidth: 900 }}>
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

//       {loadingMsgs && <p>Loading messages...</p>}
//       {error && <p style={{ color: "red" }}>❌ {error}</p>}

//       <div
//         style={{
//           border: "1px solid #ddd",
//           borderRadius: 10,
//           padding: 12,
//           height: 420,
//           overflowY: "auto",
//           background: "#fff",
//         }}
//       >
//         {messages.length === 0 ? (
//           <p style={{ opacity: 0.7 }}>No messages yet.</p>
//         ) : (
//           messages.map((m) => {
//             const isMe = m.sender_id === session.user.id;
//             return (
//               <div
//                 key={m.id}
//                 style={{
//                   display: "flex",
//                   justifyContent: isMe ? "flex-end" : "flex-start",
//                   marginBottom: 10,
//                 }}
//               >
//                 <div
//                   style={{
//                     maxWidth: "70%",
//                     padding: "10px 12px",
//                     borderRadius: 12,
//                     border: "1px solid #eee",
//                     background: isMe ? "#5ed584ff" : "#877d72ff",
//                   }}
//                 >
//                   <div
//                     style={{
//                       fontSize: 12,
//                       opacity: 0.65,
//                       marginBottom: 4,
//                     }}
//                   >
//                     {m.role === "ai"
//                       ? "🤖 AI"
//                       : isMe
//                       ? "You"
//                       : "Member"}{" "}
//                     • {new Date(m.created_at).toLocaleString()}
//                   </div>
//                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <form
//         onSubmit={sendMessage}
//         style={{ display: "flex", gap: 8, marginTop: 12 }}
//       >
//         <input
//           value={text}
//           onChange={(e) => setText(e.target.value)}
//           placeholder='Type message... (later: "@AI ...")'
//           style={{
//             flex: 1,
//             padding: 12,
//             borderRadius: 10,
//             border: "1px solid #ddd",
//           }}
//         />
//         <button
//           disabled={sending}
//           style={{ padding: "12px 16px", borderRadius: 10 }}
//         >
//           {sending ? "Sending..." : "Send"}
//         </button>
//       </form>
//     </main>
//   );
// }

// edit 3

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";

// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Presence + Typing
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   const typingTimeoutRef = useRef<number | null>(null);
//   const lastTypingSentRef = useRef<number>(0);

//   /* -------------------- AUTH GUARD -------------------- */
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
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

//   useEffect(() => {
//     if (session) void loadMessages();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REALTIME MESSAGES (INSERT) -------------------- */
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

//   /* -------------------- AUTO SCROLL -------------------- */
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* -------------------- PRESENCE + TYPING CHANNEL -------------------- */
//   useEffect(() => {
//     if (!session) return;

//     // One channel for presence + typing broadcasts
//     const ch = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     const recomputeOnline = () => {
//       const state = ch.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];
//       Object.values(state).forEach((arr) => arr.forEach((u) => list.push(u)));

//       // Deduplicate by user_id (safety)
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     ch.on("presence", { event: "sync" }, () => {
//       recomputeOnline();
//     });

//     ch.on("presence", { event: "join" }, () => {
//       recomputeOnline();
//     });

//     ch.on("presence", { event: "leave" }, () => {
//       recomputeOnline();
//     });

//     // Typing events
//     ch.on("broadcast", { event: "typing" }, (payload) => {
//       const from = (payload?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => {
//         if (prev.includes(from)) return prev;
//         return [...prev, from];
//       });

//       // Auto-remove typing after 2.5s
//       window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//       }, 2500);
//     });

//     ch.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         // Track yourself as online
//         await ch.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });
//       }
//     });

//     presenceChannelRef.current = ch;

//     return () => {
//       if (presenceChannelRef.current) {
//         supabase.removeChannel(presenceChannelRef.current);
//         presenceChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- SEND MESSAGE -------------------- */
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     const content = text.trim();
//     if (!content) return;

//     setSending(true);
//     setError(null);

//     const { error } = await supabase.from("messages").insert({
//       group_id: groupId,
//       sender_id: session.user.id,
//       role: "user",
//       content,
//     });

//     if (error) setError(error.message);
//     else setText("");

//     setSending(false);
//   };

//   /* -------------------- TYPING BROADCAST (throttled) -------------------- */
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     if (!presenceChannelRef.current) return;

//     // Throttle typing events (max 1 per 700ms)
//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     // Broadcast typing
//     void presenceChannelRef.current.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });

//     // optional: clear local timer (not required but neat)
//     if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
//     typingTimeoutRef.current = window.setTimeout(() => {}, 0);
//   };

//   /* -------------------- RENDER -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   return (
//     <main style={{ padding: 24, maxWidth: 900 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

//       {/* Online + Typing UI */}
//       <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
//         <span style={{ opacity: 0.8 }}>
//           🟢 Online: <b>{onlineUsers.length}</b>
//         </span>

//         {typingUsers.length > 0 && (
//           <span style={{ opacity: 0.8 }}>
//             ✍️ Someone is typing...
//           </span>
//         )}
//       </div>

//       <hr style={{ margin: "16px 0" }} />

//       {loadingMsgs && <p>Loading messages...</p>}
//       {error && <p style={{ color: "red" }}>❌ {error}</p>}

//       <div
//         style={{
//           border: "1px solid #ddd",
//           borderRadius: 10,
//           padding: 12,
//           height: 420,
//           overflowY: "auto",
//           background: "#fff",
//         }}
//       >
//         {messages.length === 0 ? (
//           <p style={{ opacity: 0.7 }}>No messages yet.</p>
//         ) : (
//           messages.map((m) => {
//             const isMe = m.sender_id === session.user.id;
//             return (
//               <div
//                 key={m.id}
//                 style={{
//                   display: "flex",
//                   justifyContent: isMe ? "flex-end" : "flex-start",
//                   marginBottom: 10,
//                 }}
//               >
//                 <div
//                   style={{
//                     maxWidth: "70%",
//                     padding: "10px 12px",
//                     borderRadius: 12,
//                     border: "1px solid #eee",
//                     background: isMe ? "#5ed584ff" : "#877d72ff",
//                   }}
//                 >
//                   <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>
//                     {m.role === "ai" ? "🤖 AI" : isMe ? "You" : "Member"} •{" "}
//                     {new Date(m.created_at).toLocaleString()}
//                   </div>
//                   <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
//                 </div>
//               </div>
//             );
//           })
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
//         <input
//           value={text}
//           onChange={(e) => onChangeText(e.target.value)}
//           placeholder='Type message... (later: "@AI ...")'
//           style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
//         />
//         <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
//           {sending ? "Sending..." : "Send"}
//         </button>
//       </form>
//     </main>
//   );
// }

// edit 4

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";

// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// type Member = {
//   user_id: string;
//   email?: string;
// };

// function usernameFromEmail(email?: string) {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   const lastTypingSentRef = useRef<number>(0);

//   /* -------------------- AUTH GUARD -------------------- */
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- LOAD MEMBERS (all group members) -------------------- */
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     // Fetch group_members + profiles(email)
//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         profiles:profiles ( email )
//       `
//       )
//       .eq("group_id", groupId);

//     if (error) {
//       setError(error.message);
//       setMembers([]);
//       return;
//     }

//     // data shape: [{ user_id, profiles: { email } | null }]
//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as { user_id: string; profiles?: { email?: string } | null };
//       return {
//         user_id: r.user_id,
//         email: r.profiles?.email ?? undefined,
//       };
//     });

//     // Dedup safety
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   useEffect(() => {
//     if (session) void loadMembers();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
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

//   useEffect(() => {
//     if (session) void loadMessages();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REALTIME MESSAGES (INSERT) -------------------- */
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

//   /* -------------------- AUTO SCROLL -------------------- */
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* -------------------- PRESENCE + TYPING CHANNEL -------------------- */
//   useEffect(() => {
//     if (!session) return;

//     const ch = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     const recomputeOnline = () => {
//       const state = ch.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];
//       Object.values(state).forEach((arr) => arr.forEach((u) => list.push(u)));

//       // Dedup by user_id
//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     ch.on("presence", { event: "sync" }, () => recomputeOnline());
//     ch.on("presence", { event: "join" }, () => recomputeOnline());
//     ch.on("presence", { event: "leave" }, () => recomputeOnline());

//     // typing broadcast (store user_id)
//     ch.on("broadcast", { event: "typing" }, (payload) => {
//       const from = (payload?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//       }, 2200);
//     });

//     ch.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await ch.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });
//       }
//     });

//     presenceChannelRef.current = ch;

//     return () => {
//       if (presenceChannelRef.current) {
//         supabase.removeChannel(presenceChannelRef.current);
//         presenceChannelRef.current = null;
//       }
//     };
//   }, [session, groupId]);

//   /* -------------------- SEND MESSAGE -------------------- */
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     const content = text.trim();
//     if (!content) return;

//     setSending(true);
//     setError(null);

//     const { error } = await supabase.from("messages").insert({
//       group_id: groupId,
//       sender_id: session.user.id,
//       role: "user",
//       content,
//     });

//     if (error) setError(error.message);
//     else setText("");

//     setSending(false);
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     if (!presenceChannelRef.current) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void presenceChannelRef.current.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   const onlineSet = useMemo(() => new Set(onlineUsers.map((u) => u.user_id)), [onlineUsers]);

//   const emailByUserId = useMemo(() => {
//     const map = new Map<string, string>();

//     // from members table
//     for (const m of members) {
//       if (m.email) map.set(m.user_id, m.email);
//     }

//     // fallback from presence
//     for (const u of onlineUsers) {
//       if (u.email) map.set(u.user_id, u.email);
//     }

//     // always include self
//     if (session?.user?.id && session.user.email) {
//       map.set(session.user.id, session.user.email);
//     }

//     return map;
//   }, [members, onlineUsers, session]);

//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers
//       .map((uid) => usernameFromEmail(emailByUserId.get(uid)))
//       .filter(Boolean);

//     if (names.length === 0) return "Someone is typing...";

//     // show 1-2 names max
//     const shown = names.slice(0, 2);
//     if (names.length === 1) return `${shown[0]} is typing...`;
//     if (names.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, emailByUserId]);

//   /* -------------------- RENDER -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;

//   return (
//     <main style={{ padding: 24 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

//       <hr style={{ margin: "16px 0" }} />

//       {/* Layout: chat + members panel */}
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>
//         {/* Chat column */}
//         <div>
//           <div style={{ marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
//             <span style={{ opacity: 0.85 }}>
//               🟢 Online: <b>{onlineUsers.length}</b>
//             </span>
//             <span style={{ opacity: 0.85 }}>
//               👥 Members: <b>{members.length}</b>
//             </span>
//             {typingText && <span style={{ opacity: 0.9 }}>✍️ {typingText}</span>}
//           </div>

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           <div
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
//               <p style={{ opacity: 0.7 }}>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 const isMe = m.sender_id === session.user.id;

//                 const senderEmail = emailByUserId.get(m.sender_id);
//                 const senderName = m.role === "ai" ? "AI" : usernameFromEmail(senderEmail);

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
//                         border: "1px solid #eee",
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, display: "flex", gap: 8 }}>
//                         <b>{m.role === "ai" ? "🤖 AI" : senderName}</b>
//                         <span style={{ opacity: 0.7 }}>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (later: "@AI ...")'
//               style={{
//                 flex: 1,
//                 padding: 12,
//                 borderRadius: 10,
//                 border: "1px solid #ddd",
//               }}
//             />
//             <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* Members panel */}
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
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <h3 style={{ margin: 0 }}>Members</h3>
//             <button
//               type="button"
//               onClick={() => void loadMembers()}
//               style={{ padding: "6px 10px", borderRadius: 10 }}
//             >
//               Refresh
//             </button>
//           </div>

//           <p style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
//             Green = online, Red = offline
//           </p>

//           <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
//             {members.length === 0 ? (
//               <p style={{ opacity: 0.7 }}>No members loaded.</p>
//             ) : (
//               members
//                 .slice()
//                 .sort((a, b) => {
//                   // online first, then alphabetical
//                   const ao = onlineSet.has(a.user_id) ? 0 : 1;
//                   const bo = onlineSet.has(b.user_id) ? 0 : 1;
//                   if (ao !== bo) return ao - bo;

//                   const an = usernameFromEmail(emailByUserId.get(a.user_id) ?? a.email);
//                   const bn = usernameFromEmail(emailByUserId.get(b.user_id) ?? b.email);
//                   return an.localeCompare(bn);
//                 })
//                 .map((m) => {
//                   const isOnline = onlineSet.has(m.user_id);
//                   const email = emailByUserId.get(m.user_id) ?? m.email;
//                   const name = usernameFromEmail(email);

//                   return (
//                     <div
//                       key={m.user_id}
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 10,
//                         padding: 8,
//                         borderRadius: 10,
//                         border: "1px solid #eee",
//                       }}
//                     >
//                       <span
//                         style={{
//                           width: 10,
//                           height: 10,
//                           borderRadius: 999,
//                           background: isOnline ? "green" : "red",
//                           display: "inline-block",
//                         }}
//                       />
//                       <div style={{ minWidth: 0 }}>
//                         <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
//                           {m.user_id === session.user.id ? `${name} (You)` : name}
//                         </div>
//                         <div style={{ fontSize: 12, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis" }}>
//                           {email ?? "—"}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })
//             )}
//           </div>
//         </aside>
//       </div>
//     </main>
//   );
// }


// edit 5 last

// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
// import { RealtimeChannel } from "@supabase/supabase-js";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";

// type Msg = {
//   id: string;
//   group_id: string;
//   sender_id: string;
//   role: "user" | "ai";
//   content: string;
//   created_at: string;
// };

// type PresenceUser = {
//   user_id: string;
//   email?: string;
//   online_at: number;
// };

// type Member = {
//   user_id: string;
//   role: string; // "admin" | "member"
//   email?: string;
//   display_name?: string;
//   last_seen_at?: string | null;
// };

// function usernameFromEmail(email?: string) {
//   if (!email) return "unknown";
//   const at = email.indexOf("@");
//   return at > 0 ? email.slice(0, at) : email;
// }

// function formatLastSeen(ts?: string | null) {
//   if (!ts) return "Last seen: —";
//   return `Last seen: ${new Date(ts).toLocaleString()}`;
// }

// export default function GroupChatPage() {
//   const router = useRouter();
//   const params = useParams<{ groupId: string }>();
//   const groupId = useMemo(() => String(params.groupId), [params.groupId]);

//   const { session, loading } = useSession();

//   const [messages, setMessages] = useState<Msg[]>([]);
//   const [text, setText] = useState("");
//   const [error, setError] = useState<string | null>(null);
//   const [loadingMsgs, setLoadingMsgs] = useState(false);
//   const [sending, setSending] = useState(false);

//   // Members + presence + typing
//   const [members, setMembers] = useState<Member[]>([]);
//   const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
//   const [typingUsers, setTypingUsers] = useState<string[]>([]);

//   const bottomRef = useRef<HTMLDivElement | null>(null);

//   const msgChannelRef = useRef<RealtimeChannel | null>(null);
//   const presenceChannelRef = useRef<RealtimeChannel | null>(null);

//   const lastTypingSentRef = useRef<number>(0);

//   /* -------------------- AUTH GUARD -------------------- */
//   useEffect(() => {
//     if (!loading && !session) router.replace("/login");
//   }, [loading, session, router]);

//   /* -------------------- LAST SEEN UPDATE -------------------- */
//   const updateMyLastSeen = async () => {
//     if (!session) return;

//     const { error } = await supabase
//       .from("profiles")
//       .update({ last_seen_at: new Date().toISOString() })
//       .eq("id", session.user.id);

//     // silent fail (optional)
//     if (error) {
//       // console.log("last_seen update error:", error.message);
//     }
//   };

//   /* -------------------- LOAD MEMBERS (DB) -------------------- */
//   const loadMembers = async () => {
//     if (!session) return;

//     setError(null);

//     const { data, error } = await supabase
//       .from("group_members")
//       .select(
//         `
//         user_id,
//         role,
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

//     const list: Member[] = (data ?? []).map((row) => {
//       const r = row as unknown as {
//         user_id: string;
//         role: string;
//         profiles?: { email?: string; display_name?: string; last_seen_at?: string | null } | null;
//       };

//       return {
//         user_id: r.user_id,
//         role: r.role ?? "member",
//         email: r.profiles?.email ?? undefined,
//         display_name: r.profiles?.display_name ?? undefined,
//         last_seen_at: r.profiles?.last_seen_at ?? null,
//       };
//     });

//     // Dedup safety
//     const map = new Map<string, Member>();
//     for (const m of list) map.set(m.user_id, m);
//     setMembers(Array.from(map.values()));
//   };

//   useEffect(() => {
//     if (!session) return;
//     void loadMembers();
//     void updateMyLastSeen();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   // keep last_seen reasonably updated + refresh members to show updated timestamps
//   useEffect(() => {
//     if (!session) return;

//     const onVisibility = () => {
//       void updateMyLastSeen();
//     };

//     window.addEventListener("beforeunload", updateMyLastSeen);
//     document.addEventListener("visibilitychange", onVisibility);

//     const interval = window.setInterval(() => {
//       void updateMyLastSeen();
//       void loadMembers();
//     }, 20000);

//     return () => {
//       window.removeEventListener("beforeunload", updateMyLastSeen);
//       document.removeEventListener("visibilitychange", onVisibility);
//       window.clearInterval(interval);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- LOAD INITIAL MESSAGES -------------------- */
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

//   useEffect(() => {
//     if (session) void loadMessages();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- REALTIME MESSAGES (INSERT) -------------------- */
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

//   /* -------------------- AUTO SCROLL -------------------- */
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* -------------------- PRESENCE + TYPING CHANNEL -------------------- */
//   useEffect(() => {
//     if (!session) return;

//     const ch = supabase.channel(`presence:${groupId}`, {
//       config: { presence: { key: session.user.id } },
//     });

//     const recomputeOnline = () => {
//       const state = ch.presenceState() as Record<string, PresenceUser[]>;
//       const list: PresenceUser[] = [];
//       Object.values(state).forEach((arr) => arr.forEach((u) => list.push(u)));

//       const map = new Map<string, PresenceUser>();
//       for (const u of list) map.set(u.user_id, u);
//       setOnlineUsers(Array.from(map.values()));
//     };

//     ch.on("presence", { event: "sync" }, () => recomputeOnline());
//     ch.on("presence", { event: "join" }, () => recomputeOnline());
//     ch.on("presence", { event: "leave" }, () => recomputeOnline());

//     // typing broadcast
//     ch.on("broadcast", { event: "typing" }, (payload) => {
//       const from = (payload?.payload as { user_id?: string })?.user_id;
//       if (!from || from === session.user.id) return;

//       setTypingUsers((prev) => (prev.includes(from) ? prev : [...prev, from]));

//       window.setTimeout(() => {
//         setTypingUsers((prev) => prev.filter((id) => id !== from));
//       }, 2200);
//     });

//     ch.subscribe(async (status) => {
//       if (status === "SUBSCRIBED") {
//         await ch.track({
//           user_id: session.user.id,
//           email: session.user.email ?? undefined,
//           online_at: Date.now(),
//         });
//         // refresh members once on subscribe (optional)
//         void loadMembers();
//       }
//     });

//     presenceChannelRef.current = ch;

//     return () => {
//       if (presenceChannelRef.current) {
//         supabase.removeChannel(presenceChannelRef.current);
//         presenceChannelRef.current = null;
//       }
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session, groupId]);

//   /* -------------------- SEND MESSAGE -------------------- */
//   const sendMessage = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!session) return;

//     const content = text.trim();
//     if (!content) return;

//     setSending(true);
//     setError(null);

//     const { error } = await supabase.from("messages").insert({
//       group_id: groupId,
//       sender_id: session.user.id,
//       role: "user",
//       content,
//     });

//     if (error) setError(error.message);
//     else setText("");

//     setSending(false);
//   };

//   /* -------------------- TYPING BROADCAST -------------------- */
//   const onChangeText = (value: string) => {
//     setText(value);

//     if (!session) return;
//     if (!presenceChannelRef.current) return;

//     const now = Date.now();
//     if (now - lastTypingSentRef.current < 700) return;
//     lastTypingSentRef.current = now;

//     void presenceChannelRef.current.send({
//       type: "broadcast",
//       event: "typing",
//       payload: { user_id: session.user.id },
//     });
//   };

//   /* -------------------- DERIVED MAPS -------------------- */
//   const onlineSet = useMemo(() => new Set(onlineUsers.map((u) => u.user_id)), [onlineUsers]);

//   // best display info comes from DB members; presence is only fallback
//   const displayByUserId = useMemo(() => {
//     const map = new Map<string, { email?: string; display_name?: string; last_seen_at?: string | null; role?: string }>();

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
//       map.set(u.user_id, {
//         ...existing,
//         email: existing.email ?? u.email,
//       });
//     }

//     if (session?.user?.id && session.user.email) {
//       const existing = map.get(session.user.id) ?? {};
//       map.set(session.user.id, { ...existing, email: existing.email ?? session.user.email });
//     }

//     return map;
//   }, [members, onlineUsers, session]);

//   const typingText = useMemo(() => {
//     if (typingUsers.length === 0) return null;

//     const names = typingUsers.map((uid) => {
//       const info = displayByUserId.get(uid);
//       const email = info?.email;
//       const dn = info?.display_name?.trim();
//       return dn ? dn : usernameFromEmail(email);
//     });

//     const clean = names.filter((n) => n && n !== "unknown");
//     if (clean.length === 0) return "Someone is typing...";

//     const shown = clean.slice(0, 2);
//     if (clean.length === 1) return `${shown[0]} is typing...`;
//     if (clean.length === 2) return `${shown[0]} and ${shown[1]} are typing...`;
//     return `${shown[0]}, ${shown[1]} and others are typing...`;
//   }, [typingUsers, displayByUserId]);

//   /* -------------------- RENDER -------------------- */
//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null;
// // ui starts from here
//   return (
//     <main style={{ padding: 24 }}>
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//         <h1 style={{ margin: 0 }}>Group Chat</h1>
//         <Link href="/groups">← Back to Groups</Link>
//       </div>

//       <p style={{ opacity: 0.7, marginTop: 8 }}>Group ID: {groupId}</p>

//       <hr style={{ margin: "16px 0" }} />

//       <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "start" }}>
//         {/* Chat column */}
//         <div>
//           <div style={{ marginBottom: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
//             <span style={{ opacity: 0.85 }}>
//               🟢 Online: <b>{onlineUsers.length}</b>
//             </span>
//             <span style={{ opacity: 0.85 }}>
//               👥 Members: <b>{members.length}</b>
//             </span>
//             {typingText && <span style={{ opacity: 0.9 }}>✍️ {typingText}</span>}
//           </div>

//           {loadingMsgs && <p>Loading messages...</p>}
//           {error && <p style={{ color: "red" }}>❌ {error}</p>}

//           <div
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
//               <p style={{ opacity: 0.7 }}>No messages yet.</p>
//             ) : (
//               messages.map((m) => {
//                 const isMe = m.sender_id === session.user.id;

//                 const info = displayByUserId.get(m.sender_id);
//                 const email = info?.email;
//                 const displayName = info?.display_name?.trim();
//                 const senderName = m.role === "ai" ? "AI" : displayName ? displayName : usernameFromEmail(email);

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
//                         border: "1px solid #eee",
//                         background: isMe ? "#37a95bff" : "#6b6259ff",
//                       }}
//                     >
//                       <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4, display: "flex", gap: 8 }}>
//                         <b>{m.role === "ai" ? "🤖 AI" : senderName}</b>
//                         <span style={{ opacity: 0.7 }}>• {new Date(m.created_at).toLocaleString()}</span>
//                       </div>

//                       <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//             <div ref={bottomRef} />
//           </div>

//           <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, marginTop: 12 }}>
//             <input
//               value={text}
//               onChange={(e) => onChangeText(e.target.value)}
//               placeholder='Type message... (later: "@AI ...")'
//               style={{
//                 flex: 1,
//                 padding: 12,
//                 borderRadius: 10,
//                 border: "1px solid #ddd",
//               }}
//             />
//             <button disabled={sending} style={{ padding: "12px 16px", borderRadius: 10 }}>
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </form>
//         </div>

//         {/* Members panel */}
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
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <h3 style={{ margin: 0 }}>Members</h3>
//             <button type="button" onClick={() => void loadMembers()} style={{ padding: "6px 10px", borderRadius: 10 }}>
//               Refresh
//             </button>
//           </div>

//           <p style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
//             🟢 Online / 🔴 Offline
//           </p>

//           <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
//             {members.length === 0 ? (
//               <p style={{ opacity: 0.8 }}>No members loaded.</p>
//             ) : (
//               members
//                 .slice()
//                 .sort((a, b) => {
//                   const ao = onlineSet.has(a.user_id) ? 0 : 1;
//                   const bo = onlineSet.has(b.user_id) ? 0 : 1;
//                   if (ao !== bo) return ao - bo;

//                   const anInfo = displayByUserId.get(a.user_id);
//                   const bnInfo = displayByUserId.get(b.user_id);

//                   const an =
//                     anInfo?.display_name?.trim() ||
//                     usernameFromEmail(anInfo?.email ?? a.email);
//                   const bn =
//                     bnInfo?.display_name?.trim() ||
//                     usernameFromEmail(bnInfo?.email ?? b.email);

//                   return an.localeCompare(bn);
//                 })
//                 .map((m) => {
//                   const isOnline = onlineSet.has(m.user_id);
//                   const info = displayByUserId.get(m.user_id);

//                   const email = info?.email ?? m.email;
//                   const displayName = info?.display_name?.trim() || m.display_name?.trim();
//                   const name = displayName ? displayName : usernameFromEmail(email);

//                   const isAdmin = (m.role ?? "").toLowerCase() === "admin";

//                   const lastSeenText = isOnline
//                     ? "Online"
//                     : formatLastSeen(info?.last_seen_at ?? m.last_seen_at);

//                   return (
//                     <div
//                       key={m.user_id}
//                       style={{
//                         display: "flex",
//                         alignItems: "flex-start",
//                         gap: 10,
//                         padding: 10,
//                         borderRadius: 12,
//                         border: "1px solid #eee",
//                         background: "rgba(255,255,255,0.35)",
//                       }}
//                     >
//                       <span
//                         style={{
//                           width: 10,
//                           height: 10,
//                           borderRadius: 999,
//                           background: isOnline ? "green" : "red",
//                           display: "inline-block",
//                           marginTop: 6,
//                         }}
//                       />
//                       <div style={{ minWidth: 0, width: "100%" }}>
//                         <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                           <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>
//                             {m.user_id === session.user.id ? `${name} (You)` : name}
//                           </div>

//                           {isAdmin && (
//                             <span
//                               style={{
//                                 fontSize: 11,
//                                 padding: "2px 8px",
//                                 borderRadius: 999,
//                                 border: "1px solid rgba(0,0,0,0.25)",
//                                 background: "rgba(123, 160, 224, 0.5)",
//                               }}
//                             >
//                               Admin
//                             </span>
//                           )}
//                         </div>

//                         <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
//                           {lastSeenText}
//                         </div>

//                         <div style={{ fontSize: 12, opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis" }}>
//                           {email ?? "—"}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })
//             )}
//           </div>
//         </aside>
//       </div>
//     </main>
//   );
// }
