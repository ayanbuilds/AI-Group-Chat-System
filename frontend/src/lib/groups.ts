// edit 1

// import { supabase } from "@/lib/supabase/client.ts";

// export type Group = {
//   id: string;
//   name: string;
//   invite_code: string;
//   created_at: string;
// };

// type GroupMemberRow = {
//   groups: Group[] | null;
// };

// export async function fetchMyGroups(): Promise<Group[]> {
//   const { data, error } = await supabase
//     .from("group_members")
//     .select(`
//       groups (
//         id,
//         name,
//         invite_code,
//         created_at
//       )
//     `)
//     .order("joined_at", { ascending: false });

//   if (error) {
//     throw error;
//   }

//   const rows = data as GroupMemberRow[] | null;

//   if (!rows) return [];

//   // Flatten groups[] safely
//   return rows.flatMap((row) => row.groups ?? []);
// }

// edit 2
// import { supabase } from "@/lib/supabase/client.ts";

// export type Group = {
//   id: string;
//   name: string;
//   invite_code: string;
//   created_at: string;
// };

// type GroupMemberRow = {
//   groups: Group[] | null;
// };

// function generateInviteCode(length = 6): string {
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing I/O/1/0
//   let out = "";
//   for (let i = 0; i < length; i++) {
//     out += chars[Math.floor(Math.random() * chars.length)];
//   }
//   return out;
// }

// export async function fetchMyGroups(): Promise<Group[]> {
//   const { data, error } = await supabase
//     .from("group_members")
//     .select(
//       `
//       groups (
//         id,
//         name,
//         invite_code,
//         created_at
//       )
//     `
//     )
//     .order("joined_at", { ascending: false });

//   if (error) throw error;

//   const rows = (data ?? []) as GroupMemberRow[];
//   return rows.flatMap((row) => row.groups ?? []);
// }

// // export async function createGroup(groupName: string): Promise<Group> {
// //   const name = groupName.trim();
// //   if (!name) throw new Error("Group name is required");

// //   const { data: userData, error: userError } = await supabase.auth.getUser();
// //   if (userError) throw userError;
// //   if (!userData.user) throw new Error("Not authenticated");

// //   // Retry invite code if extremely rare unique collision happens
// //   for (let attempt = 1; attempt <= 5; attempt++) {
// //     const invite_code = generateInviteCode(6);

// //     const { data, error } = await supabase
// //       .from("groups")
// //       .insert({
// //         name,
// //         invite_code,
// //         created_by: userData.user.id,
// //       })
// //       .select("id,name,invite_code,created_at")
// //       .single();

// //     if (!error && data) {
// //       // DB trigger will auto-add creator as admin member
// //       return data as Group;
// //     }

// //     // Unique constraint collision (invite_code unique)
// //     if (error && error.code === "23505" && attempt < 5) {
// //       continue;
// //     }

// //     throw error ?? new Error("Failed to create group");
// //   }

// //   throw new Error("Failed to create group (invite code collision)");
// // }
// // export async function createGroup(groupName: string): Promise<void> {
// //   const name = groupName.trim();
// //   if (!name) throw new Error("Group name is required");

// //   const { data: userData, error: userError } = await supabase.auth.getUser();
// //   if (userError) throw userError;
// //   if (!userData.user) throw new Error("Not authenticated");

// //   for (let attempt = 1; attempt <= 5; attempt++) {
// //     const invite_code = generateInviteCode(6);

// //     const { error } = await supabase
// //       .from("groups")
// //       .insert({
// //         name,
// //         invite_code,
// //         created_by: userData.user.id,
// //       });

// //     if (!error) {
// //       // ✅ Group created
// //       // Admin membership will be added by DB trigger
// //       return;
// //     }

// //     // Unique invite code collision → retry
// //     if (error.code === "23505" && attempt < 5) {
// //       continue;
// //     }

// //     throw error;
// //   }

// //   throw new Error("Failed to create group");
// // }
// export async function createGroup(groupName: string): Promise<{ invite_code: string }> {
//   const name = groupName.trim();
//   if (!name) throw new Error("Group name is required");

//   const { data: userData, error: userError } = await supabase.auth.getUser();
//   if (userError) throw userError;
//   if (!userData.user) throw new Error("Not authenticated");

//   for (let attempt = 1; attempt <= 5; attempt++) {
//     const invite_code = generateInviteCode(6);

//     const { error } = await supabase
//       .from("groups")
//       .insert({
//         name,
//         invite_code,
//         created_by: userData.user.id,
//       });

//     if (!error) {
//       // ✅ Group created, trigger will add admin membership
//       return { invite_code };
//     }

//     // Unique constraint violation (invite_code already exists)
//     if (error.code === "23505" && attempt < 5) {
//       continue;
//     }

//     throw error;
//   }

//   throw new Error("Failed to create group");
// }

// export async function joinGroupByInvite(inviteCode: string): Promise<{ groupId: string }> {
//   const code = inviteCode.trim().toUpperCase();
//   if (!code) throw new Error("Invite code is required");

//   const { data, error } = await supabase.rpc("join_group_by_invite", { p_invite: code });

//   if (error) throw error;
//   if (!data) throw new Error("Join failed");

//   return { groupId: String(data) };
// }


// edit 3
// Groups Data Service (Supabase Queries)”
// simply: groups backend-logic layer (frontend side)
// import { supabase } from "@/lib/supabase/client.ts";

// export type Group = {
//   id: string;
//   name: string;
//   invite_code: string;
//   created_at: string;
// };

// // type GroupMemberRow = {
// //   groups: Group[] | null;
// // };

// function generateInviteCode(length = 6): string {
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
//   let out = "";
//   for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
//   return out;
// }

// // export async function fetchMyGroups(): Promise<Group[]> {
// //   const { data, error } = await supabase
// //     .from("group_members")
// //     .select(
// //       `
// //       groups (
// //         id,
// //         name,
// //         invite_code,
// //         created_at
// //       )
// //     `
// //     )
// //     .order("joined_at", { ascending: false });

// //   if (error) throw error;

// //   const rows = (data ?? []) as GroupMemberRow[];

// //   // Flatten to groups list
// //   const flat = rows.flatMap((row) => row.groups ?? []);

// //   // ✅ Deduplicate by group.id (fix duplicate UI + React key warning)
// //   const uniqueMap = new Map<string, Group>();
// //   for (const g of flat) {
// //     uniqueMap.set(g.id, g);
// //   }

// //   return Array.from(uniqueMap.values());
// // }

// export async function createGroup(groupName: string): Promise<{ invite_code: string }> {
//   const name = groupName.trim();
//   if (!name) throw new Error("Group name is required");

//   const { data: userData, error: userError } = await supabase.auth.getUser();
//   if (userError) throw userError;
//   if (!userData.user) throw new Error("Not authenticated");

//   for (let attempt = 1; attempt <= 5; attempt++) {
//     const invite_code = generateInviteCode(6);

//     const { error } = await supabase.from("groups").insert({
//       name,
//       invite_code,
//       created_by: userData.user.id,
//     });

//     if (!error) return { invite_code };

//     if (error.code === "23505" && attempt < 5) continue;
//     throw error;
//   }

//   throw new Error("Failed to create group");
// }

// export async function joinGroupByInvite(inviteCode: string): Promise<{ groupId: string }> {
//   const code = inviteCode.trim().toUpperCase();
//   if (!code) throw new Error("Invite code is required");

//   const { data, error } = await supabase.rpc("join_group_by_invite", { p_invite: code });

//   if (error) throw error;
//   if (!data) throw new Error("Join failed");

//   return { groupId: String(data) };
// }

// edit 4
import { supabase } from "@/lib/supabase/client.ts";

// ✅ This type is ONLY for `groups` table responses (create group etc.)
// Groups page list is now coming from RPC, so it has a different shape.
export type GroupRow = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

function generateInviteCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createGroup(groupName: string): Promise<{ invite_code: string }> {
  const name = groupName.trim();
  if (!name) throw new Error("Group name is required");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Not authenticated");

  for (let attempt = 1; attempt <= 5; attempt++) {
    const invite_code = generateInviteCode(6);

    const { error } = await supabase.from("groups").insert({
      name,
      invite_code,
      created_by: userData.user.id,
    });

    if (!error) return { invite_code };

    // Unique invite collision retry
    if (error.code === "23505" && attempt < 5) continue;
    throw error;
  }

  throw new Error("Failed to create group");
}

export async function joinGroupByInvite(inviteCode: string): Promise<{ groupId: string }> {
  const code = inviteCode.trim().toUpperCase();
  if (!code) throw new Error("Invite code is required");

  const { data, error } = await supabase.rpc("join_group_by_invite", { p_invite: code });

  if (error) throw error;
  if (!data) throw new Error("Join failed");

  return { groupId: String(data) };
}
