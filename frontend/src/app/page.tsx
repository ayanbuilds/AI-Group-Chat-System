// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

// test 1
// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase/client.ts";

// export default function Home() {
//   const [status, setStatus] = useState("Checking Supabase...");

//   useEffect(() => {
//     const check = async () => {
//       const { data, error } = await supabase.auth.getSession();

//       if (error) {
//         setStatus("❌ Supabase error: " + error.message);
//       } else {
//         setStatus("✅ Supabase connected. Session: " + (data.session ? "exists" : "none"));
//       }
//     };

//     check();
//   }, []);

//   return <h1>{status}</h1>;
// }

// test 2
// "use client";

// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase/client.ts";

// export default function Home() {
//   const [status, setStatus] = useState("Testing Supabase network...");

//   useEffect(() => {
//     const test = async () => {
//       // This MUST hit Supabase server
//       const { error } = await supabase.from("groups").select("id").limit(1);

//       if (error) {
//         setStatus("❌ Supabase network/permission error: " + error.message);
//       } else {
//         setStatus("✅ Supabase connected (DB query succeeded)");
//       }
//     };

//     test();
//   }, []);

//   return <h1>{status}</h1>;
// }

//Edit 1
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>AI Group Chat</h1>
      <p>Welcome. Please login to continue.</p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
        {/* <Link href="/groups">Groups</Link> */}
      </div>
    </main>
  );
}
