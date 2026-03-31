// edit 1
// export default function LoginPage() {
//   return <h1>Login Page</h1>;
// }

// edit 2

// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { loginWithEmail } from "@/lib/auth";

// export default function LoginPage() {
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
//       await loginWithEmail(email.trim(), password);
//       router.push("/groups");
//     } catch (err: unknown) {
//       if (err instanceof Error) {
//         setMsg("❌ " + err.message);
//       } else {
//         setMsg("❌ Login failed");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main style={{ padding: 24, maxWidth: 420 }}>
//       <h1>Login</h1>

//       <form onSubmit={onSubmit} style={{ marginTop: 16, display: "grid", gap: 12 }}>
//         <label>
//           Email
//           <input
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             type="email"
//             required
//             style={{ width: "100%", padding: 10, marginTop: 6 }}
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
//           />
//         </label>

//         <button disabled={loading} style={{ padding: 10 }}>
//           {loading ? "Logging in..." : "Login"}
//         </button>

//         {msg && <p>{msg}</p>}
//       </form>
//     </main>
//   );
// }

// edit 3
// Login UI + Controller Page
// This page authenticates the user using auth.ts and, after a successful login, redirects them to the groups page.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      await loginWithEmail(email.trim(), password);
      router.push("/groups");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMsg("❌ " + err.message);
      } else {
        setMsg("❌ Login failed");
      }
    } finally {
      setLoading(false);
    }
  };
  // UI Work starts from here
    return (
      <main style={{ padding: 24, maxWidth: 420 }}>
        <h1>Login</h1>

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
                placeholder="Your password"
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
            {loading ? "Logging in..." : "Login"}
          </button>

          {msg && <p>{msg}</p>}
        </form>
      </main>
    );
  }
  
  // with good design
//   return (
//     <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
//       <div className="w-full max-w-md">
//         {/* Card Container */}
//         <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
//           {/* Header Section */}
//           <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-10 text-center">
//             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
//               <svg
//                 className="w-8 h-8 text-indigo-600"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
//                 />
//               </svg>
//             </div>
//             <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
//             <p className="text-indigo-100 text-sm">
//               Sign in to continue to your account
//             </p>
//           </div>

//           {/* Form Section */}
//           <div className="px-8 py-10">
//             <form onSubmit={onSubmit} className="space-y-6">
//               {/* Email Field */}
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                     <svg
//                       className="h-5 w-5 text-slate-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
//                       />
//                     </svg>
//                   </div>
//                   <input
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     type="email"
//                     required
//                     className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none text-slate-700 placeholder-slate-400 bg-slate-50 focus:bg-white"
//                     placeholder="you@example.com"
//                   />
//                 </div>
//               </div>

//               {/* Password Field */}
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-2">
//                   Password
//                 </label>
//                 <div className="relative">
//                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                     <svg
//                       className="h-5 w-5 text-slate-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
//                       />
//                     </svg>
//                   </div>
//                   <input
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     type={showPassword ? "text" : "password"}
//                     required
//                     className="w-full pl-12 pr-14 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none text-slate-700 placeholder-slate-400 bg-slate-50 focus:bg-white"
//                     placeholder="Enter your password"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword((s) => !s)}
//                     className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors duration-200"
//                     aria-label={
//                       showPassword ? "Hide password" : "Show password"
//                     }
//                   >
//                     {showPassword ? (
//                       <svg
//                         className="h-5 w-5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
//                         />
//                       </svg>
//                     ) : (
//                       <svg
//                         className="h-5 w-5"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
//                         />
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
//                         />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Remember & Forgot Password */}
//               <div className="flex items-center justify-between text-sm">
//                 <label className="flex items-center cursor-pointer group">
//                   <input
//                     type="checkbox"
//                     className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
//                   />
//                   <span className="ml-2 text-slate-600 group-hover:text-slate-800 transition-colors">
//                     Remember me
//                   </span>
//                 </label>
//                 <a
//                   href="#"
//                   className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
//                 >
//                   Forgot password?
//                 </a>
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//               >
//                 {loading ? (
//                   <span className="flex items-center justify-center">
//                     <svg
//                       className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Signing in...
//                   </span>
//                 ) : (
//                   "Sign In"
//                 )}
//               </button>

//               {/* Error/Success Message */}
//               {msg && (
//                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start">
//                   <svg
//                     className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                   <span>{msg}</span>
//                 </div>
//               )}
//             </form>

//             {/* Divider */}
//             <div className="relative my-8">
//               <div className="absolute inset-0 flex items-center">
//                 <div className="w-full border-t border-slate-200"></div>
//               </div>
//               <div className="relative flex justify-center text-sm">
//                 <span className="px-4 bg-white text-slate-500 font-medium">
//                   Or continue with
//                 </span>
//               </div>
//             </div>

//             {/* Social Login Buttons */}
//             <div className="grid grid-cols-2 gap-4">
//               <button className="flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium text-slate-700">
//                 <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
//                   <path
//                     fill="#4285F4"
//                     d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                   />
//                   <path
//                     fill="#34A853"
//                     d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                   />
//                   <path
//                     fill="#FBBC05"
//                     d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                   />
//                   <path
//                     fill="#EA4335"
//                     d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                   />
//                 </svg>
//                 Google
//               </button>
//               <button className="flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors duration-200 font-medium text-slate-700">
//                 <svg
//                   className="w-5 h-5 mr-2"
//                   fill="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
//                 </svg>
//                 GitHub
//               </button>
//             </div>

//             {/* Sign Up Link */}
//             <p className="mt-8 text-center text-sm text-slate-600">
//               Don&apos;t have an account?{" "}
//               <a
//                 href="#"
//                 className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
//               >
//                 Sign up for free
//               </a>
//             </p>
//           </div>
//         </div>

//         {/* Footer */}
//         <p className="mt-8 text-center text-xs text-slate-500">
//           Protected by enterprise-grade security. By continuing, you agree to
//           our{" "}
//           <a href="#" className="underline hover:text-slate-700">
//             Terms
//           </a>{" "}
//           and{" "}
//           <a href="#" className="underline hover:text-slate-700">
//             Privacy Policy
//           </a>
//         </p>
//       </div>
//     </main>
//   );
// }
