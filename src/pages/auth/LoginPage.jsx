import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EmailStep from "../../components/auth/EmailStep";
import OtpStep from "../../components/auth/OtpStep";
import { sendOtp } from "../../services/authService";

// Map the authenticated user's role (from the /verify-otp "account routing
// details") to a placeholder message. The real dashboards aren't built yet, so
// an already-registered user is NOT redirected — we show a "Next to ..." message
// instead. Matching is keyword-based so it tolerates backend role variants
// (e.g. "club_student" / "Club Student", "coach" / "Coach", "independent").
function rolePlaceholderMessage(role) {
  const r = String(role || "").toLowerCase();
  if (r.includes("coach")) return "Next to Coach Dashboard";
  if (r.includes("independent")) return "Next to Independent Student Dashboard";
  if (r.includes("club")) return "Next to Club Student Dashboard";
  return null;
}

export default function LoginPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  // Placeholder message shown after a registered user verifies their OTP.
  const [loginMessage, setLoginMessage] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = (sentEmail) => {
    setEmail(sentEmail);
    setStep("otp");
  };

  const handleVerify = (data) => {
    // `data` is the /verify-otp response ("account routing details"). Resolve
    // the user's role and whether the email is already registered, tolerating
    // different backend key names.
    const role =
      data?.role ??
      data?.member_type ??
      data?.user_type ??
      data?.type ??
      data?.account_type ??
      data?.user?.role ??
      data?.member?.member_type;
    const message = rolePlaceholderMessage(role);
    const registered =
      data?.userExists ??
      data?.registered ??
      data?.exists ??
      data?.is_registered ??
      Boolean(message);

    // Coaches now have a real dashboard — route them there with their member
    // record (the /verify-otp "member" payload). Other roles keep the
    // placeholder until their dashboards are built.
    const isCoach =
      data?.redirect_to === "coach_dashboard" || String(role || "").toLowerCase().includes("coach");
    if (registered && isCoach && data?.member) {
      toast.success("Welcome back, Coach!");
      navigate("/coach-dashboard", { state: { member: data.member } });
      return;
    }

    if (registered) {
      // Already-registered user: show the role-based placeholder immediately
      // after OTP verification instead of navigating to a (not-yet-built) dashboard.
      const text =
        message || "Login successful. Your dashboard is under development.";
      setLoginMessage(text);
      toast.success(text);
      return;
    }

    // New user: let them choose whether to register as a Student or a Club.
    navigate("/select-registration", { state: { email } });
  };

  // ── Post-login placeholder (registered user) ──────────────────────────────
  if (loginMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-50">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Login Successful</h2>
          <p className="text-sm text-gray-500 mb-1">Signed in as</p>
          <p className="text-sm font-semibold text-blue-700 mb-5">{email}</p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-4 mb-5">
            <p className="text-base font-semibold text-blue-700">{loginMessage}</p>
          </div>
          <button
            onClick={() => {
              setLoginMessage("");
              setStep("email");
              setEmail("");
            }}
            className="w-full text-blue-600 font-semibold text-sm hover:underline"
          >
            Back to Login
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} University of Sri Jayewardenepura
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-4">

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
            step === "email"
              ? "bg-blue-700 text-white border-blue-700"
              : "bg-green-500 text-white border-green-500"
          }`}>
            {step === "otp" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : "1"}
          </div>
          <span className={`text-sm font-semibold ${step === "email" ? "text-blue-700" : "text-gray-400"}`}>
            Email OTP Login
          </span>
        </div>

        <div className={`h-px w-10 ${step === "otp" ? "bg-blue-600" : "bg-gray-300"}`} />

        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
            step === "otp"
              ? "bg-blue-700 text-white border-blue-700"
              : "bg-gray-200 text-gray-400 border-gray-200"
          }`}>
            2
          </div>
          <span className={`text-sm font-semibold ${step === "otp" ? "text-blue-700" : "text-gray-400"}`}>
            OTP Verification
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        {step === "email"
          ? <EmailStep onSend={handleSendOtp} />
          : <OtpStep email={email} onVerify={handleVerify} onResend={() => sendOtp(email)} />
        }

        {step === "otp" && (
          <button onClick={() => setStep("email")}
            className="w-full text-center text-xs text-gray-400 hover:text-blue-600 mt-3 transition">
            Change email
          </button>
        )}

        <div className="text-center mt-5">
          <p className="text-sm text-gray-500">
            New student?{" "}
            <button onClick={() => navigate("/select-registration")}
              className="text-blue-600 font-semibold hover:underline">
              Register here
            </button>
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} University of Sri Jayewardenepura
      </p>
    </div>
  );
}