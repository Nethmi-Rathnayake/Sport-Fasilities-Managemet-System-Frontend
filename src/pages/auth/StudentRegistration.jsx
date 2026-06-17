import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import api from "../../services/api";
import {
  sendOtp as sendOtpRequest,
  verifyOtp as verifyOtpRequest,
  registerMember,
} from "../../services/authService";

// =============================================
// All backend calls go through the shared axios instance (src/services/api.js)
// and the auth service (src/services/authService.js). withCredentials is enabled
// there so the Laravel session cookie carries the OTP-verified state across the
// send-otp → verify-otp → member-registration flow.
// =============================================

// Steps: "email" → "otp" → "form" → "submitted"

export default function StudentRegistration() {
  const navigate = useNavigate();

  // ── Step tracking ──────────────────────────
  const [step, setStep] = useState("email"); // "email" | "otp" | "form" | "submitted"

  // ── Email & OTP ────────────────────────────
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpSending, setOtpSending] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [timer, setTimer] = useState(165);
  const inputRefs = useRef([]);

  // ── Clubs ──────────────────────────────────
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState("");

  // ── Form ───────────────────────────────────
  const [membershipType, setMembershipType] = useState("");
  const [selectedClub, setSelectedClub] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoError, setPhotoError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    nameWithInitials: "",
    studentId: "",
    dob: "",
    primaryPhone: "",
    secondaryPhone: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Photo preview URL (memoized to avoid blob leak on every render) ──
  const photoPreviewUrl = useMemo(
    () => (photoFile ? URL.createObjectURL(photoFile) : null),
    [photoFile]
  );

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  // ── Timer countdown ────────────────────────
  useEffect(() => {
    if (step !== "otp" || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  // ── Load clubs ─────────────────────────────
  useEffect(() => {
    if (step !== "form") return;
    // =============================================
    // API CALL — GET /api/clubs
    // Response: [{ id: 1, club_name: "Cricket Club", ... }, ...]
    // =============================================
    api
      .get("/api/clubs")
      .then((res) => {
        setClubs(res.data);
        setClubsLoading(false);
      })
      .catch(() => {
        setClubsError("Failed to load clubs. Please refresh.");
        setClubsLoading(false);
      });
  }, [step]);

  // ── Handlers ───────────────────────────────

  // Send OTP — separated from resend to avoid double-reset.
  // Returns true on success so callers can decide whether to advance the step.
  const sendOtp = async () => {
    setOtpSending(true);
    // =============================================
    // API CALL — POST /send-otp   Body: { email }
    // =============================================
    try {
      await sendOtpRequest(email);
      return true;
    } catch (err) {
      return false;
    } finally {
      setOtpSending(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.includes("@")) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    const ok = await sendOtp();
    if (!ok) {
      setEmailError("Failed to send OTP. Please try again.");
      return;
    }
    setTimer(165);
    setOtp(["", "", "", "", "", ""]);
    setStep("otp");
  };

  const handleResendOtp = async () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    const ok = await sendOtp();
    if (!ok) {
      setOtpError("Failed to resend OTP. Please try again.");
      return;
    }
    setTimer(165);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((ch, i) => {
      newOtp[i] = ch;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Enter all 6 digits.");
      return;
    }
    setOtpError("");
    setOtpVerifying(true);
    // =============================================
    // API CALL — POST /verify-otp   Body: { email, otp: code }
    // =============================================
    try {
      await verifyOtpRequest(email, code);
      setStep("form");
    } catch (err) {
      setOtpError(
        err?.response?.data?.message || "Invalid OTP. Please try again."
      );
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      setPhotoError("Photo must be less than 1MB.");
      setPhotoFile(null);
      return;
    }
    setPhotoError("");
    setPhotoFile(file);
  };

  // Sri Lankan phone validation: 07X XXXXXXX (10 digits starting with 07)
  const isValidPhone = (phone) => /^0[1-9]\d{8}$/.test(phone.replace(/\s/g, ""));

  const handleSubmit = async () => {
    if (
      !form.fullName ||
      !form.nameWithInitials ||
      !form.primaryPhone ||
      !form.address
    ) {
      alert("Please fill all required fields.");
      return;
    }
    if (!isValidPhone(form.primaryPhone)) {
      alert("Enter a valid primary phone number (e.g. 071 234 5678).");
      return;
    }
    if (form.secondaryPhone && !isValidPhone(form.secondaryPhone)) {
      alert("Enter a valid secondary phone number or leave it empty.");
      return;
    }
    if (!membershipType) {
      alert("Please select a membership type.");
      return;
    }
    if (membershipType === "club" && !selectedClub) {
      alert("Please select a club.");
      return;
    }
    if (!photoFile) {
      alert("Please upload your profile photo.");
      return;
    }

    // =============================================
    // API CALL — POST /api/member-registrations (multipart/form-data).
    // Field names follow the live OpenAPI spec (source of truth):
    // fullName, nameWithInitials, nic, primaryPhone, dob, address,
    // membershipType (club|club_student|independent), clubId, photo.
    // =============================================
    const fd = new FormData();
    fd.append("email", email);
    fd.append("fullName", form.fullName);
    fd.append("nameWithInitials", form.nameWithInitials);
    // The "Student ID / NIC" input maps to the API's `nic` field.
    if (form.studentId) fd.append("nic", form.studentId);
    if (form.dob) fd.append("dob", form.dob);
    fd.append("primaryPhone", form.primaryPhone);
    if (form.secondaryPhone) fd.append("secondaryPhone", form.secondaryPhone);
    fd.append("address", form.address);
    fd.append("membershipType", membershipType);
    if (membershipType === "club") fd.append("clubId", selectedClub);
    fd.append("photo", photoFile);

    setSubmitError("");
    setSubmitting(true);
    try {
      await registerMember(fd);
      setStep("submitted");
    } catch (err) {
      const data = err?.response?.data;
      const firstError = data?.errors
        ? Object.values(data.errors)[0]?.[0]
        : null;
      setSubmitError(
        firstError || data?.message || "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared header ──────────────────────────
  const Header = () => (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#e8a020" }}
      >
        <img src={logo} alt="USJ" className="w-8 h-8 object-contain" />
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: "#0f1c3f" }}>
          University of Sri Jayewardenepura
        </p>
        <p className="text-xs text-gray-400">Sports Facility Management System</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════
  // STEP 1 — EMAIL
  // ══════════════════════════════════════════
  if (step === "email") {
    return (
      <div
        className="min-h-screen py-6 px-4 flex flex-col items-center justify-center"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        <div className="w-full max-w-sm">
          <Header />

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div
                className="text-white text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: "#0f1c3f" }}
              >
                REG
              </div>
              <h1 className="text-base font-bold" style={{ color: "#0f1c3f" }}>
                Student Registration
              </h1>
            </div>

            <p className="text-sm text-gray-500 mb-5 text-center">
              Enter your email to verify your identity before registering.
            </p>

            <label className="block text-xs font-medium text-gray-500 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="example@sjp.ac.lk"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
            />
            {emailError && (
              <p className="text-xs text-red-500 mb-2">{emailError}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={otpSending || !email}
              className="w-full text-white font-semibold py-2.5 rounded-xl text-sm mt-3 transition disabled:opacity-50"
              style={{ backgroundColor: "#1a56db" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1648c8")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#1a56db")}
            >
              {otpSending ? "Sending OTP…" : "Send OTP"}
            </button>

            <div className="flex items-center justify-center gap-1.5 mt-4">
              <svg
                className="w-3.5 h-3.5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xs text-gray-400">
                Email verification required to register
              </p>
            </div>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">
              Already registered?{" "}
              <button
                onClick={() => navigate("/")}
                className="font-semibold hover:underline"
                style={{ color: "#1a56db" }}
              >
                Login with Email OTP
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STEP 2 — OTP VERIFY
  // ══════════════════════════════════════════
  if (step === "otp") {
    return (
      <div
        className="min-h-screen py-6 px-4 flex flex-col items-center justify-center"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        <div className="w-full max-w-sm">
          <Header />

          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <h2 className="text-lg font-bold mb-1" style={{ color: "#0f1c3f" }}>
              Verify Your Email
            </h2>
            <p className="text-xs text-gray-400 mb-1">
              Enter the 6-digit code sent to
            </p>
            <p
              className="text-sm font-semibold mb-5"
              style={{ color: "#1a56db" }}
            >
              {email}
            </p>

            {/* OTP boxes */}
            <div
              className="flex justify-center gap-2 mb-3"
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 border-2 border-gray-200 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-blue-500 transition"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs text-red-500 mb-2">{otpError}</p>
            )}

            <p className="text-xs text-gray-400 mb-4">
              {timer > 0 ? (
                <>
                  Code expires in{" "}
                  <span className="font-semibold text-red-500">
                    {minutes}:{seconds}
                  </span>
                </>
              ) : (
                <span className="text-red-500 font-semibold">Code expired.</span>
              )}{" "}
              <button
                onClick={handleResendOtp}
                disabled={otpSending}
                className="font-semibold hover:underline ml-1 disabled:opacity-50"
                style={{ color: "#1a56db" }}
              >
                {otpSending ? "Sending…" : "Resend OTP"}
              </button>
            </p>

            <button
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otp.join("").length < 6}
              className="w-full text-white font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50"
              style={{ backgroundColor: "#1a56db" }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#1648c8")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#1a56db")}
            >
              {otpVerifying ? "Verifying…" : "Verify & Continue"}
            </button>

            <button
              onClick={() => setStep("email")}
              className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition w-full"
            >
              Change email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STEP 4 — SUBMITTED
  // ══════════════════════════════════════════
  if (step === "submitted") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#e8f0fe" }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#1a56db"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "#0f1c3f" }}
          >
            Registration Submitted!
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Complete your payment to activate your registration.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-3">
            {[
              { label: "Email verified", done: true, active: false },
              { label: "Registration form submitted", done: true, active: false },
              { label: "Payment pending", done: false, active: true },
              { label: "Admin approval", done: false, active: false },
              { label: "QR Card issued — Account active", done: false, active: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: s.done
                      ? "#dcfce7"
                      : s.active
                      ? "#fef3c7"
                      : "#f3f4f6",
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{
                      color: s.done
                        ? "#16a34a"
                        : s.active
                        ? "#d97706"
                        : "#9ca3af",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={s.done ? 3 : 2}
                      d={
                        s.done
                          ? "M5 13l4 4L19 7"
                          : s.active
                          ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      }
                    />
                  </svg>
                </div>
                <span
                  className={`text-xs font-medium ${
                    s.done || s.active ? "text-gray-700" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-5">
            Confirmation will be sent to{" "}
            <span className="font-semibold text-gray-600">{email}</span>
          </p>

          <button
            onClick={() => alert("Payment gateway — coming soon!")}
            className="w-full text-white font-semibold py-3 rounded-xl text-sm mb-3 transition"
            style={{ backgroundColor: "#1a56db" }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#1648c8")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#1a56db")}
          >
            Proceed to Payment
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STEP 3 — REGISTRATION FORM
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: "#f0f2f5" }}>
      <div className="max-w-xl mx-auto w-full">
        <Header />

        <div className="flex items-center gap-3 mb-4">
          <div
            className="text-white text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: "#0f1c3f" }}
          >
            REG
          </div>
          <h1 className="text-lg font-bold" style={{ color: "#0f1c3f" }}>
            Student Registration
          </h1>
        </div>

        {/* Verified email bar */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 mb-5">
          <svg
            className="w-4 h-4 text-green-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-green-700">
            Email verified: <span className="font-semibold">{email}</span>
          </p>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h2
            className="font-bold text-sm mb-4"
            style={{ color: "#0f1c3f" }}
          >
            Personal Information
          </h2>
          <div className="space-y-3">

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleFormChange}
                placeholder="Tharindu Nimesh Perera"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Name with Initials <span className="text-red-500">*</span>
              </label>
              <input
                name="nameWithInitials"
                value={form.nameWithInitials}
                onChange={handleFormChange}
                placeholder="T. N. Perera"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Student ID / NIC{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  name="studentId"
                  value={form.studentId}
                  onChange={handleFormChange}
                  placeholder="200012345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Date of Birth{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleFormChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Primary Phone <span className="text-red-500">*</span>
                </label>
                <input
                  name="primaryPhone"
                  value={form.primaryPhone}
                  onChange={handleFormChange}
                  placeholder="071 234 5678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Secondary Phone{" "}
                  <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  name="secondaryPhone"
                  value={form.secondaryPhone}
                  onChange={handleFormChange}
                  placeholder="077 234 5678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleFormChange}
                placeholder="No. 1, Main Street, Colombo"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* Membership Type */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h2 className="font-bold text-sm mb-1" style={{ color: "#0f1c3f" }}>
            Membership Type
          </h2>
          <p className="text-xs text-gray-400 mb-3">
            Select how you want to register
          </p>
          <div className="space-y-3">
            <label
              className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition"
              style={{
                borderColor:
                  membershipType === "club" ? "#1a56db" : "#e5e7eb",
                backgroundColor:
                  membershipType === "club" ? "#eff6ff" : "#fff",
              }}
            >
              <input
                type="radio"
                name="membershipType"
                value="club"
                checked={membershipType === "club"}
                onChange={(e) => setMembershipType(e.target.value)}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="font-semibold text-sm text-gray-800">
                  Student Under Club
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Register under a sports club. Requires payment and admin
                  approval.
                </p>
              </div>
            </label>

            <label
              className="flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition"
              style={{
                borderColor:
                  membershipType === "independent" ? "#1a56db" : "#e5e7eb",
                backgroundColor:
                  membershipType === "independent" ? "#eff6ff" : "#fff",
              }}
            >
              <input
                type="radio"
                name="membershipType"
                value="independent"
                checked={membershipType === "independent"}
                onChange={(e) => {
                  setMembershipType(e.target.value);
                  setSelectedClub("");
                }}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="font-semibold text-sm text-gray-800">
                  Independent User
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Book facilities independently. Requires payment and admin
                  approval.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Club Selection */}
        {membershipType === "club" && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
            <h2
              className="font-bold text-sm mb-1"
              style={{ color: "#0f1c3f" }}
            >
              Club Selection
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              Select your sports club
            </p>
            {clubsError ? (
              <p className="text-xs text-red-500">{clubsError}</p>
            ) : (
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                disabled={clubsLoading}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {clubsLoading ? "Loading clubs..." : "-- Select a Club --"}
                </option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.club_name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Your registration will be reviewed by the club and admin.
            </p>
          </div>
        )}

        {/* Profile Photo */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <h2 className="font-bold text-sm mb-1" style={{ color: "#0f1c3f" }}>
            Profile Photo
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            This photo will be used for your QR membership card
          </p>
          <div className="flex flex-col items-center">
            <div className="w-40 h-44 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center mb-3">
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-12 h-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-xs text-gray-300">No photo</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {["Min: 300 × 300 px", "Max: 1 MB", "PNG / JPG"].map((t) => (
                <span
                  key={t}
                  className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-0.5"
                >
                  {t}
                </span>
              ))}
            </div>

            <label className="cursor-pointer">
              <div className="px-6 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 hover:border-blue-500 hover:text-blue-600 transition text-center">
                Upload Photo
              </div>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>

            {photoFile && (
              <button
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoError("");
                }}
                className="mt-2 text-xs font-medium hover:underline"
                style={{ color: "#1a56db" }}
              >
                Remove Photo
              </button>
            )}

            {photoError && (
              <p className="text-xs text-red-500 mt-2">{photoError}</p>
            )}
          </div>
        </div>

        {submitError && (
          <p className="text-sm text-red-500 text-center mb-3">{submitError}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full text-white font-semibold py-3 rounded-xl text-sm mb-3 transition disabled:opacity-50"
          style={{ backgroundColor: "#1a56db" }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#1648c8")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#1a56db")}
        >
          {submitting ? "Submitting…" : "Proceed to Payment"}
        </button>

        <div className="text-center pb-6">
          <p className="text-xs text-gray-400">
            Already registered?{" "}
            <button
              onClick={() => navigate("/")}
              className="font-semibold hover:underline"
              style={{ color: "#1a56db" }}
            >
              Login with Email OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}