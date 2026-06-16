import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EmailStep from "../../components/auth/EmailStep";
import OtpStep from "../../components/auth/OtpStep";
import { sendOtp } from "../../services/authService";

// Role -> "dashboard under development" message. Dashboards are not built yet,
// so an existing user is NOT redirected — we just confirm login by role.
const DASHBOARD_MESSAGES = {
  student: "Student Dashboard is under development",
  club: "Club Dashboard is under development",
  independent: "Independent User Dashboard is under development",
};

export default function LoginPage() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSendOtp = (sentEmail) => {
    setEmail(sentEmail);
    setStep("otp");
  };

  const handleVerify = (data) => {
    // `data` is the /verify-otp response: { success, userExists, role? }.
    if (data?.userExists) {
      // Existing user: dashboards aren't ready, so show a role-based message
      // and stay on the login screen instead of redirecting.
      const message =
        DASHBOARD_MESSAGES[data.role] ||
        "Login successful. Your dashboard is currently under development.";
      toast.success(message);
      return;
    }

    // New user: let them choose whether to register as a Student or a Club.
    navigate("/select-registration", { state: { email } });
  };

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