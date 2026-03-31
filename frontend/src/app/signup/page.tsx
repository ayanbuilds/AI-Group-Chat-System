// edit 1
// export default function SignupPage() {
//   return <h1>Signup Page</h1>;
// }

// edit 2
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signUpWithEmail } from "@/lib/auth";

// export default function SignupPage() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [msg, setMsg] = useState<string | null>(null);

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setMsg(null);
//     setLoading(true);
//     try {
//       await signUpWithEmail(email.trim(), password);

//       setMsg("✅ Signup successful. You can now login.");

//       // You can redirect immediately, or let user click login
//       setTimeout(() => router.push("/login"), 800);
//     } catch (err: unknown) {
//         if (err instanceof Error) {
//           setMsg("❌ " + err.message);
//         }
//         else {
//           setMsg("❌ Signup failed");
//         }

//     } finally {
//         setLoading(false);
//     }
//   };

//   return (
//     <main style={{ padding: 24, maxWidth: 420 }}>
//       <h1>Signup</h1>

//       <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
//         <label>
//           Email
//           <input
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             type="email"
//             required
//             style={{ width: "100%", padding: 10, marginTop: 6 }}
//             placeholder="you@example.com"
//           />
//         </label>

//         <label>
//           Password
//           <input
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             type="password"
//             required
//             minLength={6}
//             style={{ width: "100%", padding: 10, marginTop: 6 }}
//             placeholder="min 6 chars"
//           />
//         </label>

//         <button disabled={loading} style={{ padding: 10 }}>
//           {loading ? "Creating..." : "Create account"}
//         </button>

//         {msg && <p>{msg}</p>}
//       </form>
//     </main>
//   );
// }
// edit 3
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signUpWithEmail } from "@/lib/auth";

// export default function SignupPage() {
//   const router = useRouter();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [msg, setMsg] = useState<string | null>(null);

//   // ✅ Password validation function
//   const isPasswordValid = (password: string): string | null => {
//     if (password.length < 6) {
//       return "Password must be at least 6 characters long";
//     }
//     if (!/[A-Z]/.test(password)) {
//       return "Password must contain at least one capital letter";
//     }
//     if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
//       return "Password must contain at least one special character";
//     }
//     return null;
//   };

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setMsg(null);

//     const passwordError = isPasswordValid(password);
//     if (passwordError) {
//       setMsg("❌ " + passwordError);
//       return;
//     }

//     setLoading(true);

//     try {
//       await signUpWithEmail(email.trim(), password);
//       setMsg("✅ Signup successful. You can now login.");
//       setTimeout(() => router.push("/login"), 800);
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         setMsg("❌ " + err.message);
//       } else {
//         setMsg("❌ Signup failed");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main style={{ padding: 24, maxWidth: 420 }}>
//       <h1>Signup</h1>

//       <form
//         onSubmit={onSubmit}
//         style={{ marginTop: 16, display: "grid", gap: 12 }}
//       >
//         <label>
//           Email
//           <input
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             type="email"
//             required
//             style={{ width: "100%", padding: 10, marginTop: 6 }}
//             placeholder="you@example.com"
//           />
//         </label>

//         <label>
//           Password
//           <input
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             type="password"
//             required
//             style={{ width: "100%", padding: 10, marginTop: 6 }}
//             placeholder="Min 6 chars, 1 capital, 1 special"
//           />
//         </label>

//         <button disabled={loading} style={{ padding: 10 }}>
//           {loading ? "Creating..." : "Create account"}
//         </button>

//         {msg && <p>{msg}</p>}
//       </form>
//     </main>
//   );
// }

// edit 4
// Signup UI + Form Controller Page
// This file takes input from the user and performs the signup through auth.ts.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithEmail } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ Password validation function
  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return "Password must be at least 6 characters long";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one capital letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const passwordError = validatePassword(password);
    if (passwordError) {
      setMsg("❌ " + passwordError);
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email.trim(), password);
      setMsg("✅ Signup successful. You can now login.");
      setTimeout(() => router.push("/login"), 800);
    } catch (err: unknown) {
      if (err instanceof Error) setMsg("❌ " + err.message);
      else setMsg("❌ Signup failed");
    } finally {
      setLoading(false);
    }
  };
// UI Work starts from here
  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Signup</h1>

      <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <div style={{ position: "relative", marginTop: 6 }}>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              required
              style={{ width: "100%", padding: "10px 44px 10px 10px" }}
              placeholder="Min 6, 1 capital, 1 number, 1 special"
            />

            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "6px 10px",
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
                borderRadius: 6,
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </label>

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Creating..." : "Create account"}
        </button>

        {msg && <p>{msg}</p>}
      </form>
    </main>
  );
}
