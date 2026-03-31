// edit 1
// export default function GroupsPage() {
//   return <h1>Groups Page</h1>;
// }

// edit 2

// "use client";

// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { useEffect, useState } from "react";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();
//   const [email, setEmail] = useState<string>("");

//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     } else if (session?.user?.email) {
//       setEmail(session.user.email);
//     }
//   }, [loading, session, router]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   if (loading) return <main style={{ padding: 24 }}><p>Loading...</p></main>;
//   if (!session) return null; // redirect happening

//   return (
//     <main style={{ padding: 24 }}>
//       <h1>Groups</h1>
//       <p>Logged in as: <b>{email}</b></p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />
//       <p>(Next step: Create/Join group UI)</p>
//     </main>
//   );
// }

// edit 3
// "use client";

// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { useEffect } from "react";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();

//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading...</p>
//       </main>
//     );
//   }

//   if (!session) return null; // redirect in progress

//   return (
//     <main style={{ padding: 24 }}>
//       <h1>Groups</h1>

//       <p>
//         Logged in as: <b>{session.user.email}</b>
//       </p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />
//       <p>(Next step: Create / Join group UI)</p>
//     </main>
//   );
// }

// edit 4
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { fetchMyGroups, type Group } from "@/lib/groups";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();

//   const [groups, setGroups] = useState<Group[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [loadingGroups, setLoadingGroups] = useState(false);

//   // Protect route
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   // Load groups
//   useEffect(() => {
//     if (!session) return;

//     const loadGroups = async () => {
//       setLoadingGroups(true);
//       setError(null);

//       try {
//         const data = await fetchMyGroups();
//         setGroups(data);
//       } catch (err: unknown) {
//         setError(err instanceof Error ? err.message : "Failed to load groups");
//       } finally {
//         setLoadingGroups(false);
//       }
//     };

//     loadGroups();
//   }, [session]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null; // redirect in progress

//   return (
//     <main style={{ padding: 24 }}>
//       <h1>Groups</h1>

//       <p>
//         Logged in as: <b>{session.user.email}</b>
//       </p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Your Groups</h2>

//       {loadingGroups && <p>Loading groups...</p>}

//       {error && <p style={{ color: "red" }}>❌ {error}</p>}

//       {!loadingGroups && groups.length === 0 && (
//         <p>No groups yet. (Next step: Create / Join group)</p>
//       )}

//       {!loadingGroups && groups.length > 0 && (
//         <ul style={{ marginTop: 12 }}>
//           {groups.map((group) => (
//             <li key={group.id} style={{ marginBottom: 8 }}>
//               <Link href={`/g/${group.id}`}>{group.name}</Link>{" "}
//               <span style={{ opacity: 0.6 }}>
//                 ({group.invite_code})
//               </span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

// edit 5
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import { fetchMyGroups, createGroup, type Group } from "@/lib/groups";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();

//   const [groups, setGroups] = useState<Group[]>([]);
//   const [loadingGroups, setLoadingGroups] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const [groupName, setGroupName] = useState("");
//   const [creating, setCreating] = useState(false);
//   const [createdInfo, setCreatedInfo] = useState<string | null>(null);

//   // Protect route
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   const loadGroups = async () => {
//     if (!session) return;
//     setLoadingGroups(true);
//     setError(null);

//     try {
//       const data = await fetchMyGroups();
//       setGroups(data);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to load groups");
//     } finally {
//       setLoadingGroups(false);
//     }
//   };

//   // Load groups when session arrives
//   useEffect(() => {
//     if (session) {
//       void loadGroups();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   const onCreateGroup = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setError(null);
//   setCreatedInfo(null);

//   const name = groupName.trim();
//   if (!name) {
//     setError("Group name is required");
//     return;
//   }

//   setCreating(true);
//   try {
//     const { invite_code } = await createGroup(name);
//     setGroupName("");
//     setCreatedInfo(`✅ Group created. Invite code: ${invite_code}`);
//     await loadGroups();
//   } catch (err: unknown) {
//     setError(err instanceof Error ? err.message : "Failed to create group");
//   } finally {
//     setCreating(false);
//   }
// };

//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null; // redirect in progress

//   return (
//     <main style={{ padding: 24, maxWidth: 700 }}>
//       <h1>Groups</h1>

//       <p>
//         Logged in as: <b>{session.user.email}</b>
//       </p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Create a group</h2>

//       <form onSubmit={onCreateGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={groupName}
//           onChange={(e) => setGroupName(e.target.value)}
//           placeholder="e.g., Friends Hangout"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={50}
//         />
//         <button disabled={creating} style={{ padding: "10px 14px" }}>
//           {creating ? "Creating..." : "Create"}
//         </button>
//       </form>

//       {createdInfo && <p style={{ marginTop: 10 }}>{createdInfo}</p>}
//       {error && <p style={{ marginTop: 10, color: "red" }}>❌ {error}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Your Groups</h2>

//       {loadingGroups && <p>Loading groups...</p>}

//       {!loadingGroups && groups.length === 0 && (
//         <p>No groups yet. Create one above.</p>
//       )}

//       {!loadingGroups && groups.length > 0 && (
//         <ul style={{ marginTop: 12 }}>
//           {groups.map((group) => (
//             <li key={group.id} style={{ marginBottom: 10 }}>
//               <Link href={`/g/${group.id}`}>{group.name}</Link>{" "}
//               <span style={{ opacity: 0.6 }}>(Invite: {group.invite_code})</span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

// edit 6
// // Groups Dashboard Page
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import {
//   fetchMyGroups,
//   createGroup,
//   joinGroupByInvite,
//   type Group,
// } from "@/lib/groups";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();

//   const [groups, setGroups] = useState<Group[]>([]);
//   const [loadingGroups, setLoadingGroups] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // Create group UI state
//   const [groupName, setGroupName] = useState("");
//   const [creating, setCreating] = useState(false);
//   const [createdInfo, setCreatedInfo] = useState<string | null>(null);

//   // Join group UI state
//   const [inviteCode, setInviteCode] = useState("");
//   const [joining, setJoining] = useState(false);
//   const [joinedInfo, setJoinedInfo] = useState<string | null>(null);

//   // Protect route
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   const loadGroups = async () => {
//     if (!session) return;
//     setLoadingGroups(true);
//     setError(null);

//     try {
//       const data = await fetchMyGroups();
//       setGroups(data);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to load groups");
//     } finally {
//       setLoadingGroups(false);
//     }
//   };

//   // Load groups when session arrives
//   useEffect(() => {
//     if (session) void loadGroups();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   const onCreateGroup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setCreatedInfo(null);
//     setJoinedInfo(null);

//     const name = groupName.trim();
//     if (!name) {
//       setError("Group name is required");
//       return;
//     }

//     setCreating(true);
//     try {
//       const { invite_code } = await createGroup(name);
//       setGroupName("");
//       setCreatedInfo(`✅ Group created. Invite code: ${invite_code}`);
//       await loadGroups();
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to create group");
//     } finally {
//       setCreating(false);
//     }
//   };

//   const onJoinGroup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setJoinedInfo(null);
//     setCreatedInfo(null);

//     const code = inviteCode.trim();
//     if (!code) {
//       setError("Invite code is required");
//       return;
//     }

//     setJoining(true);
//     try {
//       const { groupId } = await joinGroupByInvite(code);
//       setInviteCode("");
//       setJoinedInfo("✅ Joined successfully.");
//       await loadGroups();

//       // Optional: auto-open the group chat
//       router.push(`/g/${groupId}`);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to join group");
//     } finally {
//       setJoining(false);
//     }
//   };

//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null; // redirect in progress

//   // ui work starts from here
//   return (
//     <main style={{ padding: 24, maxWidth: 750 }}>
//       <h1>Groups</h1>

//       <p>
//         Logged in as: <b>{session.user.email}</b>
//       </p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Create a group</h2>

//       <form onSubmit={onCreateGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={groupName}
//           onChange={(e) => setGroupName(e.target.value)}
//           placeholder="e.g., Friends Hangout"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={50}
//         />
//         <button disabled={creating} style={{ padding: "10px 14px" }}>
//           {creating ? "Creating..." : "Create"}
//         </button>
//       </form>

//       {createdInfo && <p style={{ marginTop: 10 }}>{createdInfo}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Join a group</h2>

//       <form onSubmit={onJoinGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={inviteCode}
//           onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
//           placeholder="Enter invite code (e.g., VSA3P2)"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={12}
//         />
//         <button disabled={joining} style={{ padding: "10px 14px" }}>
//           {joining ? "Joining..." : "Join"}
//         </button>
//       </form>

//       {joinedInfo && <p style={{ marginTop: 10 }}>{joinedInfo}</p>}
//       {error && <p style={{ marginTop: 10, color: "red" }}>❌ {error}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Your Groups</h2>

//       {loadingGroups && <p>Loading groups...</p>}

//       {!loadingGroups && groups.length === 0 && <p>No groups yet.</p>}

//       {!loadingGroups && groups.length > 0 && (
//         <ul style={{ marginTop: 12 }}>
//           {groups.map((group) => (
//             <li key={group.id} style={{ marginBottom: 10 }}>
//               <Link href={`/g/${group.id}`}>{group.name}</Link>{" "}
//               <span style={{ opacity: 0.6 }}>(Invite: {group.invite_code})</span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

// edit 7
// // Groups Dashboard Page

// "use client";

// import { useEffect, useState} from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import {
//   fetchMyGroups,
//   createGroup,
//   joinGroupByInvite,
//   type Group,
// } from "@/lib/groups";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();

//   const [groups, setGroups] = useState<Group[]>([]);
//   const [loadingGroups, setLoadingGroups] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // cache invite codes (groupId -> code)
//   const [inviteByGroupId, setInviteByGroupId] = useState<Record<string, string>>({});

//   // cache admin status (groupId -> true/false)
//   const [isAdminByGroupId, setIsAdminByGroupId] = useState<Record<string, boolean>>({});

//   // Create group UI state
//   const [groupName, setGroupName] = useState("");
//   const [creating, setCreating] = useState(false);
//   const [createdInfo, setCreatedInfo] = useState<string | null>(null);

//   // Join group UI state
//   const [inviteCode, setInviteCode] = useState("");
//   const [joining, setJoining] = useState(false);
//   const [joinedInfo, setJoinedInfo] = useState<string | null>(null);

//   // Protect route
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   const loadGroups = async () => {
//     if (!session) return;
//     setLoadingGroups(true);
//     setError(null);

//     try {
//       const data = await fetchMyGroups();
//       setGroups(data);

//       // ✅ Check admin status for all groups automatically
//       for (const group of data) {
//         await ensureAdminStatus(group.id);
//       }
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to load groups");
//     } finally {
//       setLoadingGroups(false);
//     }
//   };

//   // Load groups when session arrives
//   useEffect(() => {
//     if (session) void loadGroups();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   const onCreateGroup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setCreatedInfo(null);
//     setJoinedInfo(null);

//     const name = groupName.trim();
//     if (!name) {
//       setError("Group name is required");
//       return;
//     }

//     setCreating(true);
//     try {
//       const { invite_code } = await createGroup(name);
//       setGroupName("");
//       setCreatedInfo(`✅ Group created. Invite code: ${invite_code}`);
//       await loadGroups();
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to create group");
//     } finally {
//       setCreating(false);
//     }
//   };

//   const onJoinGroup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setJoinedInfo(null);
//     setCreatedInfo(null);

//     const code = inviteCode.trim();
//     if (!code) {
//       setError("Invite code is required");
//       return;
//     }

//     setJoining(true);
//     try {
//       const { groupId } = await joinGroupByInvite(code);
//       setInviteCode("");
//       setJoinedInfo("✅ Joined successfully.");
//       await loadGroups();

//       // Optional: auto-open the group chat
//       router.push(`/g/${groupId}`);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to join group");
//     } finally {
//       setJoining(false);
//     }
//   };

//   // Checks if current user is admin of a group (uses group_members.role)
//   const ensureAdminStatus = async (groupId: string) => {
//     if (!session) return false;

//     // Already known?
//     if (typeof isAdminByGroupId[groupId] === "boolean") return isAdminByGroupId[groupId];

//     const { data, error } = await supabase
//       .from("group_members")
//       .select("role")
//       .eq("group_id", groupId)
//       .eq("user_id", session.user.id)
//       .maybeSingle();

//     const isAdmin = !error && (data?.role ?? "").toLowerCase() === "admin";

//     setIsAdminByGroupId((prev) => ({ ...prev, [groupId]: isAdmin }));
//     return isAdmin;
//   };

//   // Fetch invite code ONLY if user is admin (RLS also enforces this)
//   const loadInviteCodeIfAdmin = async (groupId: string) => {
//     // If already loaded, don't re-fetch
//     if (inviteByGroupId[groupId]) return;

//     const isAdmin = await ensureAdminStatus(groupId);
//     if (!isAdmin) return;

//     const { data, error } = await supabase
//       .from("group_invites")
//       .select("invite_code")
//       .eq("group_id", groupId)
//       // .eq("group_id", "b9832109-f990-4ef3-b5ef-6845adaeb1ad")
//       .maybeSingle();

//     // If RLS blocks, we just do nothing (non-admin)
//     if (error || !data?.invite_code) return;

//     setInviteByGroupId((prev) => ({ ...prev, [groupId]: data.invite_code }));
//   };

//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null; // redirect in progress

//   // ui work starts from here
//   return (
//     <main style={{ padding: 24, maxWidth: 750 }}>
//       <h1>Groups</h1>

//       <p>
//         Logged in as: <b>{session.user.email}</b>
//       </p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Create a group</h2>

//       <form onSubmit={onCreateGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={groupName}
//           onChange={(e) => setGroupName(e.target.value)}
//           placeholder="e.g., Friends Hangout"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={50}
//         />
//         <button disabled={creating} style={{ padding: "10px 14px" }}>
//           {creating ? "Creating..." : "Create"}
//         </button>
//       </form>

//       {createdInfo && <p style={{ marginTop: 10 }}>{createdInfo}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Join a group</h2>

//       <form onSubmit={onJoinGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={inviteCode}
//           onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
//           placeholder="Enter invite code (e.g., WRE3P4)"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={12}
//         />
//         <button disabled={joining} style={{ padding: "10px 14px" }}>
//           {joining ? "Joining..." : "Join"}
//         </button>
//       </form>

//       {joinedInfo && <p style={{ marginTop: 10 }}>{joinedInfo}</p>}
//       {error && <p style={{ marginTop: 10, color: "red" }}>❌ {error}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Your Groups</h2>

//       {loadingGroups && <p>Loading groups...</p>}

//       {!loadingGroups && groups.length === 0 && <p>No groups yet.</p>}

//       {!loadingGroups && groups.length > 0 && (
//         <ul style={{ marginTop: 12 }}>
//           {groups.map((group) => (
//             <li key={group.id} style={{ marginBottom: 10 }}>
//               <Link href={`/g/${group.id}`}>{group.name}</Link>

//               {/* Admin-only invite code (lazy load on demand) */}
//               <span style={{ marginLeft: 10 }}>
//                 {isAdminByGroupId[group.id] ? (
//                   inviteByGroupId[group.id] ? (
//                     <span style={{ opacity: 0.7 }}>(Invite: {inviteByGroupId[group.id]})</span>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={() => void loadInviteCodeIfAdmin(group.id)}
//                       style={{
//                         padding: "4px 8px",
//                         borderRadius: 8,
//                         border: "1px solid #ddd",
//                         cursor: "pointer",
//                         fontSize: 12,
//                       }}
//                     >
//                       Show Invite
//                     </button>
//                   )
//                 ) : null}
//               </span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

// "use client";

// import { useEffect, useState} from "react";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// import { supabase } from "@/lib/supabase/client.ts";
// import { useSession } from "@/lib/useSession";
// import {
//   fetchMyGroups,
//   createGroup,
//   joinGroupByInvite,
//   type Group,
// } from "@/lib/groups";

// export default function GroupsPage() {
//   const router = useRouter();
//   const { session, loading } = useSession();

//   const [groups, setGroups] = useState<Group[]>([]);
//   const [loadingGroups, setLoadingGroups] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // cache invite codes (groupId -> code)
//   const [inviteByGroupId, setInviteByGroupId] = useState<Record<string, string>>({});

//   // cache admin status (groupId -> true/false)
//   const [isAdminByGroupId, setIsAdminByGroupId] = useState<Record<string, boolean>>({});

//   // Create group UI state
//   const [groupName, setGroupName] = useState("");
//   const [creating, setCreating] = useState(false);
//   const [createdInfo, setCreatedInfo] = useState<string | null>(null);

//   // Join group UI state
//   const [inviteCode, setInviteCode] = useState("");
//   const [joining, setJoining] = useState(false);
//   const [joinedInfo, setJoinedInfo] = useState<string | null>(null);

//   // Protect route
//   useEffect(() => {
//     if (!loading && !session) {
//       router.replace("/login");
//     }
//   }, [loading, session, router]);

//   const loadGroups = async () => {
//     if (!session) return;
//     setLoadingGroups(true);
//     setError(null);

//     try {
//       const data = await fetchMyGroups();
//       setGroups(data);

//       // ✅ Check admin status for all groups automatically
//       for (const group of data) {
//         await ensureAdminStatus(group.id);
//       }
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to load groups");
//     } finally {
//       setLoadingGroups(false);
//     }
//   };

//   // Load groups when session arrives
//   useEffect(() => {
//     if (session) void loadGroups();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [session]);

//   const logout = async () => {
//     await supabase.auth.signOut();
//     router.replace("/login");
//   };

//   const onCreateGroup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setCreatedInfo(null);
//     setJoinedInfo(null);

//     const name = groupName.trim();
//     if (!name) {
//       setError("Group name is required");
//       return;
//     }

//     setCreating(true);
//     try {
//       const { invite_code } = await createGroup(name);
//       setGroupName("");
//       setCreatedInfo(`✅ Group created. Invite code: ${invite_code}`);
//       await loadGroups();
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to create group");
//     } finally {
//       setCreating(false);
//     }
//   };

//   const onJoinGroup = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setJoinedInfo(null);
//     setCreatedInfo(null);

//     const code = inviteCode.trim();
//     if (!code) {
//       setError("Invite code is required");
//       return;
//     }

//     setJoining(true);
//     try {
//       const { groupId } = await joinGroupByInvite(code);
//       setInviteCode("");
//       setJoinedInfo("✅ Joined successfully.");
//       await loadGroups();

//       // Optional: auto-open the group chat
//       router.push(`/g/${groupId}`);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Failed to join group");
//     } finally {
//       setJoining(false);
//     }
//   };

//   // ✅ Checks if current user is ACTIVE admin of a group (deleted_at NULL)
//   const ensureAdminStatus = async (groupId: string) => {
//     if (!session) return false;

//     const { data, error } = await supabase
//       .from("group_members")
//       .select("role, deleted_at")
//       .eq("group_id", groupId)
//       .eq("user_id", session.user.id)
//       .maybeSingle();

//     if (error || !data) return false;

//     const isActive = data.deleted_at == null;
//     const isAdmin = (data.role ?? "").toLowerCase() === "admin";

//     const ok = isActive && isAdmin;

//     // ✅ Update admin cache
//     setIsAdminByGroupId((prev) => ({ ...prev, [groupId]: ok }));

//     // ✅ IMPORTANT: if not admin anymore, remove cached invite code
//     if (!ok) {
//       setInviteByGroupId((prev) => {
//         const next = { ...prev };
//         delete next[groupId];
//         return next;
//       });
//     }

//     return ok;
//   };

//   // ✅ Fetch invite code ONLY if user is ACTIVE admin (RLS also enforces this)
//   const loadInviteCodeIfAdmin = async (groupId: string) => {
//     // ✅ First, re-check admin status (active admin only)
//     const isAdmin = await ensureAdminStatus(groupId);
//     if (!isAdmin) return;

//     // ✅ Only then allow cached value
//     if (inviteByGroupId[groupId]) return;

//     const { data, error } = await supabase
//       .from("group_invites")
//       .select("invite_code")
//       .eq("group_id", groupId)
//       .maybeSingle();

//     // If RLS blocks, we just do nothing (non-admin)
//     if (error || !data?.invite_code) return;

//     setInviteByGroupId((prev) => ({ ...prev, [groupId]: data.invite_code }));
//   };

//   if (loading) {
//     return (
//       <main style={{ padding: 24 }}>
//         <p>Loading session...</p>
//       </main>
//     );
//   }

//   if (!session) return null; // redirect in progress

//   // ui work starts from here
//   return (
//     <main style={{ padding: 24, maxWidth: 750 }}>
//       <h1>Groups</h1>

//       <p>
//         Logged in as: <b>{session.user.email}</b>
//       </p>

//       <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
//         Logout
//       </button>

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Create a group</h2>

//       <form onSubmit={onCreateGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={groupName}
//           onChange={(e) => setGroupName(e.target.value)}
//           placeholder="e.g., Friends Hangout"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={50}
//         />
//         <button disabled={creating} style={{ padding: "10px 14px" }}>
//           {creating ? "Creating..." : "Create"}
//         </button>
//       </form>

//       {createdInfo && <p style={{ marginTop: 10 }}>{createdInfo}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Join a group</h2>

//       <form onSubmit={onJoinGroup} style={{ display: "flex", gap: 8, marginTop: 10 }}>
//         <input
//           value={inviteCode}
//           onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
//           placeholder="Enter invite code (e.g., WRE3P4)"
//           style={{ flex: 1, padding: 10 }}
//           maxLength={12}
//         />
//         <button disabled={joining} style={{ padding: "10px 14px" }}>
//           {joining ? "Joining..." : "Join"}
//         </button>
//       </form>

//       {joinedInfo && <p style={{ marginTop: 10 }}>{joinedInfo}</p>}
//       {error && <p style={{ marginTop: 10, color: "red" }}>❌ {error}</p>}

//       <hr style={{ margin: "16px 0" }} />

//       <h2>Your Groups</h2>

//       {loadingGroups && <p>Loading groups...</p>}

//       {!loadingGroups && groups.length === 0 && <p>No groups yet.</p>}

//       {!loadingGroups && groups.length > 0 && (
//         <ul style={{ marginTop: 12 }}>
//           {groups.map((group) => (
//             <li key={group.id} style={{ marginBottom: 10 }}>
//               <Link href={`/g/${group.id}`}>{group.name}</Link>

//               {/* Admin-only invite code (lazy load on demand) */}
//               <span style={{ marginLeft: 10 }}>
//                 {isAdminByGroupId[group.id] ? (
//                   inviteByGroupId[group.id] ? (
//                     <span style={{ opacity: 0.7 }}>(Invite: {inviteByGroupId[group.id]})</span>
//                   ) : (
//                     <button
//                       type="button"
//                       onClick={() => void loadInviteCodeIfAdmin(group.id)}
//                       style={{
//                         padding: "4px 8px",
//                         borderRadius: 8,
//                         border: "1px solid #ddd",
//                         cursor: "pointer",
//                         fontSize: 12,
//                       }}
//                     >
//                       Show Invite
//                     </button>
//                   )
//                 ) : null}
//               </span>
//             </li>
//           ))}
//         </ul>
//       )}
//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase/client.ts";
import { useSession } from "@/lib/useSession";
import {
  createGroup,
  joinGroupByInvite,
  // type Group,
} from "@/lib/groups";
// ✅ Group shape returned by my_groups_with_unread() RPC
type Group = {
  id: string;
  name: string;

  role: "admin" | "member";

  // null = active member
  // timestamp = user has left
  left_at: string | null;

  // unread messages count
  unread_count: number;
};

/* -------------------- TYPES -------------------- */
type GroupRow = {
  group_id: string;
  group_name: string;
  role: string; // admin/member
  left_at: string | null; // timestamptz
  unread_count: number;
};

/* -------------------- HELPER FUNCTIONS -------------------- */
async function fetchMyGroupsWithUnread() {
  const { data, error } = await supabase.rpc("my_groups_with_unread");

  if (error) throw new Error(error.message);

  // normalize
  const rows = (data ?? []) as GroupRow[];

  // return rows.map((r) => ({
  //   id: r.group_id,
  //   name: r.group_name,
  //   role: r.role,
  //   left_at: r.left_at,
  //   unread_count: r.unread_count ?? 0,
  // }));
  return rows.map((r) => {
    const role = (r.role ?? "member").toLowerCase();
    const safeRole: "admin" | "member" = role === "admin" ? "admin" : "member";

    return {
      id: r.group_id,
      name: r.group_name,
      role: safeRole,
      left_at: r.left_at,
      unread_count: Number(r.unread_count ?? 0),
    };
  });
}

export default function GroupsPage() {
  const router = useRouter();
  const { session, loading } = useSession();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // cache invite codes (groupId -> code)
  const [inviteByGroupId, setInviteByGroupId] = useState<
    Record<string, string>
  >({});

  // cache admin status (groupId -> true/false)
  const [isAdminByGroupId, setIsAdminByGroupId] = useState<
    Record<string, boolean>
  >({});

  // Create group UI state
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<string | null>(null);

  // Join group UI state
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinedInfo, setJoinedInfo] = useState<string | null>(null);

  // Protect route
  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  const loadGroups = async () => {
    if (!session) return;
    setLoadingGroups(true);
    setError(null);

    try {
      const data = await fetchMyGroupsWithUnread();
      setGroups(data);

      // ✅ Check admin status for all groups automatically
      for (const group of data) {
        await ensureAdminStatus(group.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setLoadingGroups(false);
    }
  };

  // Load groups when session arrives
  useEffect(() => {
    if (session) void loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const onCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedInfo(null);
    setJoinedInfo(null);

    const name = groupName.trim();
    if (!name) {
      setError("Group name is required");
      return;
    }

    setCreating(true);
    try {
      const { invite_code } = await createGroup(name);
      setGroupName("");
      setCreatedInfo(`✅ Group created. Invite code: ${invite_code}`);
      await loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const onJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setJoinedInfo(null);
    setCreatedInfo(null);

    const code = inviteCode.trim();
    if (!code) {
      setError("Invite code is required");
      return;
    }

    setJoining(true);
    try {
      const { groupId } = await joinGroupByInvite(code);
      setInviteCode("");
      setJoinedInfo("✅ Joined successfully.");
      await loadGroups();

      // ✅ Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 500));

      // Optional: auto-open the group chat
      router.push(`/g/${groupId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  // ✅ Checks if current user is ACTIVE admin of a group (deleted_at NULL)
  const ensureAdminStatus = async (groupId: string) => {
    if (!session) return false;

    const { data, error } = await supabase
      .from("group_members")
      .select("role, deleted_at")
      .eq("group_id", groupId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error || !data) return false;

    const isActive = data.deleted_at == null;
    const isAdmin = (data.role ?? "").toLowerCase() === "admin";

    const ok = isActive && isAdmin;

    // ✅ Update admin cache
    setIsAdminByGroupId((prev) => ({ ...prev, [groupId]: ok }));

    // ✅ IMPORTANT: if not admin anymore, remove cached invite code
    if (!ok) {
      setInviteByGroupId((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    }

    return ok;
  };

  // ✅ Fetch invite code ONLY if user is ACTIVE admin (RLS also enforces this)
  const loadInviteCodeIfAdmin = async (groupId: string) => {
    // ✅ First, re-check admin status (active admin only)
    const isAdmin = await ensureAdminStatus(groupId);
    if (!isAdmin) return;

    // ✅ Only then allow cached value
    if (inviteByGroupId[groupId]) return;

    const { data, error } = await supabase
      .from("group_invites")
      .select("invite_code")
      .eq("group_id", groupId)
      .maybeSingle();

    // If RLS blocks, we just do nothing (non-admin)
    if (error || !data?.invite_code) return;

    setInviteByGroupId((prev) => ({ ...prev, [groupId]: data.invite_code }));
  };

  const deleteLeftGroup = async (groupId: string) => {
    if (!session) return;

    const ok = window.confirm(
      "This group will be removed from your list permanently. Continue?"
    );
    if (!ok) return;

    const { error } = await supabase
      .from("group_members")
      .update({ deleted_at: new Date().toISOString() })
      // .update({
      //   left_at: new Date().toISOString(),
      //   deleted_at: null, // ✅ IMPORTANT: do NOT delete on leave
      // })
      .eq("group_id", groupId)
      .eq("user_id", session.user.id);

    if (error) {
      setError(error.message);
      return;
    }

    // refresh list
    await loadGroups();
  };

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <p>Loading session...</p>
      </main>
    );
  }

  if (!session) return null; // redirect in progress

  // ui work starts from here
  return (
    <main style={{ padding: 24, maxWidth: 750 }}>
      <h1>Groups</h1>

      <p>
        Logged in as: <b>{session.user.email}</b>
      </p>

      <button onClick={logout} style={{ marginTop: 12, padding: 10 }}>
        Logout
      </button>

      <hr style={{ margin: "16px 0" }} />

      <h2>Create a group</h2>

      <form
        onSubmit={onCreateGroup}
        style={{ display: "flex", gap: 8, marginTop: 10 }}
      >
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Friends Hangout"
          style={{ flex: 1, padding: 10 }}
          maxLength={50}
        />
        <button disabled={creating} style={{ padding: "10px 14px" }}>
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      {createdInfo && <p style={{ marginTop: 10 }}>{createdInfo}</p>}

      <hr style={{ margin: "16px 0" }} />

      <h2>Join a group</h2>

      <form
        onSubmit={onJoinGroup}
        style={{ display: "flex", gap: 8, marginTop: 10 }}
      >
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Enter invite code (e.g., WRE3P4)"
          style={{ flex: 1, padding: 10 }}
          maxLength={12}
        />
        <button disabled={joining} style={{ padding: "10px 14px" }}>
          {joining ? "Joining..." : "Join"}
        </button>
      </form>

      {joinedInfo && <p style={{ marginTop: 10 }}>{joinedInfo}</p>}
      {error && <p style={{ marginTop: 10, color: "red" }}>❌ {error}</p>}

      <hr style={{ margin: "16px 0" }} />

      <h2>Your Groups</h2>

      {loadingGroups && <p>Loading groups...</p>}

      {!loadingGroups && groups.length === 0 && <p>No groups yet.</p>}

      {!loadingGroups && groups.length > 0 && (
        <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
          {groups.map((group) => (
            <li
              key={group.id}
              style={{
                marginBottom: 10,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Link href={`/g/${group.id}`} style={{ flex: 1 }}>
                {group.name}
              </Link>

              {/* ✅ Unread badge */}
              {group.unread_count > 0 && (
                <span
                  style={{
                    minWidth: 28,
                    height: 22,
                    padding: "0 8px",
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    background: "#111",
                    color: "#fff",
                  }}
                  title={`${group.unread_count} unread`}
                >
                  {group.unread_count}
                </span>
              )}

              {/* ✅ Left group indicator */}
              {/* {group.left_at && (
                <span style={{ fontSize: 12, opacity: 0.65 }}>Left</span>
              )} */}
              {group.left_at && (
                <>
                  <span style={{ fontSize: 12, opacity: 0.65 }}>Left</span>

                  <button
                    onClick={() => deleteLeftGroup(group.id)}
                    style={{
                      marginLeft: 6,
                      padding: "4px 8px",
                      fontSize: 12,
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      cursor: "pointer",
                      background: "#fff",
                    }}
                  >
                    Delete
                  </button>
                </>
              )}

              {/* Admin-only invite code (lazy load on demand) */}
              <span>
                {isAdminByGroupId[group.id] ? (
                  inviteByGroupId[group.id] ? (
                    <span style={{ opacity: 0.7 }}>
                      (Invite: {inviteByGroupId[group.id]})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void loadInviteCodeIfAdmin(group.id)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Show Invite
                    </button>
                  )
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
