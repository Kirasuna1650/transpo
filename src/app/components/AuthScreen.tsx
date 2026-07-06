import { ArrowRight, Bus } from "lucide-react";
import type { OAuthProvider } from "../lib/supabase";
import googleLogo from "../assets/google-logo.png";

interface Props {
  onOAuth: (provider: OAuthProvider) => void;
  onGuest: () => void;
  authError?: string;
}

export function AuthScreen({ onOAuth, onGuest, authError }: Props) {
  return (
    <div className="w-full h-full flex flex-col overflow-y-auto" style={{ background: "#000" }}>
      <div className="relative pt-12 pb-8 px-6" style={{ background: "linear-gradient(180deg, #0A1520 0%, #000 100%)" }}>
        <div
          className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 200px 120px at 50% 0%, rgba(254,127,45,0.12), transparent)" }}
        />
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(145deg, #FF9442, #E05A00)", boxShadow: "0 0 24px rgba(254,127,45,0.4)" }}
        >
          <Bus size={24} color="#000" />
        </div>
        <h1 style={{ color: "#EAECF0", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
          Continue to Transpo
        </h1>
        <p style={{ color: "#4A6070", fontSize: 14, marginTop: 4 }}>
          Use OAuth or continue as a guest while setup is in progress.
        </p>
      </div>

      <div className="px-6 flex flex-col gap-3">
        {authError && (
          <div className="rounded-2xl px-4 py-3" style={{ background: "#2A1010", border: "1px solid #5C1D1D", color: "#FCA5A5", fontSize: 12 }}>
            {authError}
          </div>
        )}

        <button
          onClick={() => onOAuth("google")}
          className="w-full flex items-center justify-center gap-3 py-[17px] rounded-2xl"
          style={{ background: "#EAECF0", color: "#000", fontSize: 15, fontWeight: 800 }}
        >
          <img src={googleLogo} alt="" className="w-5 h-5 object-contain" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: "#1C3344" }} />
          <span style={{ color: "#2A4050", fontSize: 12 }}>or</span>
          <div className="flex-1 h-px" style={{ background: "#1C3344" }} />
        </div>

        <button
          onClick={onGuest}
          className="w-full flex items-center justify-center gap-2 py-[17px] rounded-2xl"
          style={{
            background: "#FE7F2D",
            color: "#000",
            fontSize: 16,
            fontWeight: 800,
          }}
        >
          Continue as Guest
          <ArrowRight size={19} />
        </button>
      </div>

      <p className="text-center my-6 px-6" style={{ color: "#2A4050", fontSize: 11 }}>
        OAuth user details will populate your profile once Supabase credentials and providers are configured.
      </p>
    </div>
  );
}
