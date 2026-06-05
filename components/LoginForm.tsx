"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <form className="loginRealForm" onSubmit={handleSubmit} noValidate>
      <div className="loginFormHeader">
        <ShieldCheck size={20} />
        <span>Connexion securisee</span>
      </div>

      {error && (
        <div className="loginError" role="alert">
          {error}
        </div>
      )}

      <div className="loginField">
        <label htmlFor="email">Adresse email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre.email@entreprise.ci"
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="loginField">
        <label htmlFor="password">Mot de passe</label>
        <div className="loginPasswordWrap">
          <input
            id="password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            className="loginPasswordToggle"
            onClick={() => setShowPwd((v) => !v)}
            aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button type="submit" className="loginSubmitBtn" disabled={loading || !email || !password}>
        {loading ? (
          <><Loader2 size={16} className="spin" /> Connexion en cours…</>
        ) : (
          <><LogIn size={16} /> Se connecter</>
        )}
      </button>
    </form>
  );
}
