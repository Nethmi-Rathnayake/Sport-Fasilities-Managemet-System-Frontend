import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import api from "../../services/api";
import {
  sendOtp as sendOtpRequest,
  verifyOtp as verifyOtpRequest,
} from "../../services/authService";

//const SPORTS = ["Cricket","Football","Badminton","Swimming","Athletics","Volleyball","Basketball","Tennis","Rugby","Netball","Table Tennis","Karate"];
const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Rev."];

const STEPS = [
  { num: 1, label: "Club Details", sub: "Basic information" },
  { num: 2, label: "Coach Details", sub: "Add coaches" },
  { num: 3, label: "Summary", sub: "Review & confirm" },
];

// ── Input helpers (module scope so their identity is STABLE across renders;
//    defining them inside the component remounts every <input> on each keystroke,
//    which makes fields lose focus while typing) ──
const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
      {!required && <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const Input = ({ icon, ...props }) => (
  <div className="relative">
    {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{icon}</span>}
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400 ${icon ? "pl-8 pr-3" : "px-3"}`}
    />
  </div>
);

const emptyCoach = () => ({
  id: Date.now() + Math.random(),
  title: "",
  initials: "",
  nameWithInitials: "", // Name denoted by initials
  lastName: "",
  memberGenderId: "",
  email: "",
  nationalId: "",
  primaryPhone: "",
  secondaryPhone: "",
  dob: "",
  address: "",
  photo: null,
  photoError: "",
});

export default function ClubRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  // ── Email verification gate (mirrors StudentRegistration) ──
  // phase "email" → "otp" → "wizard". The club details wizard (numeric `step`)
  // is only reachable once the email is OTP-verified.
  const [phase, setPhase] = useState("email"); // "email" | "otp" | "wizard"
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [timer, setTimer] = useState(165);
  const inputRefs = useRef([]);

  // ── Timer countdown for the OTP screen ──
  useEffect(() => {
    if (phase !== "otp" || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, timer]);

  const minutes = String(Math.floor(timer / 60)).padStart(2, "0");
  const seconds = String(timer % 60).padStart(2, "0");

  // ── OTP handlers ──
  const sendOtp = async () => {
    setOtpSending(true);
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
    setPhase("otp");
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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
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
    try {
      await verifyOtpRequest(email, code);
      setPhase("wizard");
    } catch (err) {
      setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  };

  // Club details
  const [club, setClub] = useState({
    name: "",
    sport: "",
    year: "",
    registerNumber: "",
    primaryPhone: "",
    secondaryPhone: "",
    address: "",
  });
  const [clubErrors, setClubErrors] = useState({});

  // Coaches
  const [coaches, setCoaches] = useState([emptyCoach()]);

  // ── Genders (category-driven; from GET /api/member-genders) ──
  const [genders, setGenders] = useState([]);
  useEffect(() => {
    if (phase !== "wizard") return;
    let active = true;
    api
      .get("/api/member-genders")
      .then((res) => active && setGenders(res.data))
      .catch(() => active && setGenders([]));
    return () => {
      active = false;
    };
  }, [phase]);

  // Submit state for POST /api/club-registrations
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Live fee preview — POST /api/club-registration-fee-preview { coach_count }.
  // Falls back to the local estimate if the call fails or the shape is unknown.
  const [feePreview, setFeePreview] = useState(null);
  useEffect(() => {
    if (phase !== "wizard") return;
    let active = true;
    api
      .post("/api/club-registration-fee-preview", { coach_count: coaches.length })
      .then((res) => active && setFeePreview(res.data))
      .catch(() => active && setFeePreview(null));
    return () => {
      active = false;
    };
  }, [phase, coaches.length]);

  const handleClubChange = (e) => {
    setClub({ ...club, [e.target.name]: e.target.value });
    setClubErrors({ ...clubErrors, [e.target.name]: "" });
  };

  const handleCoachChange = (id, field, value) => {
    setCoaches(coaches.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleCoachPhoto = (id, file) => {
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      setCoaches(coaches.map(c => c.id === id ? { ...c, photoError: "Max 1MB", photo: null } : c));
      return;
    }
    setCoaches(coaches.map(c => c.id === id ? { ...c, photo: file, photoError: "" } : c));
  };

  const addCoach = () => setCoaches([...coaches, emptyCoach()]);

  const removeCoach = (id) => {
    if (coaches.length === 1) return;
    setCoaches(coaches.filter(c => c.id !== id));
  };

  const validateClub = () => {
    const errs = {};
    if (!club.name) errs.name = "Required";
    if (!club.year) errs.year = "Required";
    if (!club.registerNumber) errs.registerNumber = "Required";
    if (!club.primaryPhone) errs.primaryPhone = "Required";
    if (!club.address) errs.address = "Required";
    setClubErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateCoaches = () => {
    for (let i = 0; i < coaches.length; i++) {
      const c = coaches[i];
      if (
        !c.title ||
        !c.initials ||
        !c.nameWithInitials ||
        !c.lastName ||
        !c.memberGenderId ||
        !c.nationalId ||
        !c.primaryPhone ||
        !c.address
      ) {
        alert("Please fill all required coach fields.");
        return false;
      }
      // The primary coach (index 0) uses the OTP-verified email automatically.
      // Additional coaches must supply a valid email — no OTP verification needed.
      if (i > 0 && (!c.email || !c.email.includes("@"))) {
        alert("Please enter a valid email for every additional coach.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateClub()) return;
    if (step === 2 && !validateCoaches()) return;
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    // Every coach needs a photo — the API requires coach_photos[].
    if (coaches.some((c) => !c.photo)) {
      setSubmitError("Please upload a photo for every coach.");
      return;
    }

    // =============================================
    // API CALL — POST /api/club-registrations (multipart/form-data).
    // Documented fields (live OpenAPI): clubName, regNo, primaryPhoneNumber,
    // address, coaches (JSON string array), coach_photos[] (files, same order
    // as the coaches array). Gated by the OTP-verified session cookie, which
    // `api` carries via withCredentials.
    // =============================================
    const fd = new FormData();
    fd.append("email", email);
    fd.append("clubName", club.name);
    fd.append("regNo", club.registerNumber);
    fd.append("primaryPhoneNumber", club.primaryPhone);
    fd.append("address", club.address);

    const coachPayload = coaches.map((c, i) => ({
      fullName: c.fullName,
      nameWithInitials: c.nameWithInitials,
      // Primary coach (index 0) is the OTP-verified email; the backend also
      // overrides coaches[0].email with the verified session email. Additional
      // coaches send the email typed in the form (stored only, no OTP).
      email: i === 0 ? email : c.email,
      nic: c.nationalId,
      primaryPhone: c.primaryPhone,
      secondaryPhone: c.secondaryPhone || null,
      dob: c.dob || null,
      address: c.address,
    }));
    fd.append("coaches", JSON.stringify(coachPayload));
    // Photos in the SAME order as the coaches array so the backend can pair them.
    coaches.forEach((c) => {
      if (c.photo) fd.append("coach_photos[]", c.photo);
    });

    setSubmitError("");
    setSubmitting(true);
    try {
      await api.post("/api/club-registrations", fd);
      setSubmitted(true);
    } catch (err) {
      const data = err?.response?.data;
      const firstError = data?.errors
        ? Object.values(data.errors)[0]?.[0]
        : null;
      setSubmitError(
        firstError ||
          data?.message ||
          "Club registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Header (branding, matches the login page) ──────────────
  const Header = () => (
    <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
      <img src={logo} alt="USJ Logo" className="w-12 h-12 object-contain flex-shrink-0" />
      <div>
        <p className="font-semibold text-gray-800 text-sm leading-tight">University of Sri Jayewardenepura</p>
        <p className="text-xs text-blue-600">Sports Facility Portal</p>
      </div>
    </div>
  );

  // Footer copyright shared by every step (matches the login page).
  const Footer = () => (
    <p className="text-xs text-gray-400 text-center py-6">
      © {new Date().getFullYear()} University of Sri Jayewardenepura
    </p>
  );

  // ── Step indicator ───────────────────────────
  const StepBar = () => (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.num}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => step > s.num && setStep(s.num)}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 flex-shrink-0 transition-all ${
              step > s.num
                ? "bg-green-500 text-white border-green-500"
                : step === s.num
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-400 border-gray-300"
            }`}>
              {step > s.num ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : s.num}
            </div>
            <div className="hidden sm:block">
              <p className={`text-xs font-semibold ${step === s.num ? "text-blue-700" : step > s.num ? "text-green-600" : "text-gray-400"}`}>{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-3 ${step > s.num ? "bg-green-500" : "bg-gray-200"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Shared branding block for the email/OTP gate cards (matches the login page).
  const GateHeader = () => (
    <div className="flex items-center gap-3 mb-6">
      <img src={logo} alt="USJ Logo" className="w-12 h-12 object-contain flex-shrink-0" />
      <div>
        <p className="font-semibold text-gray-800 text-sm leading-tight">University of Sri Jayewardenepura</p>
        <p className="text-xs text-blue-600">Sports Facility Portal</p>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════
  // GATE STEP 1 — EMAIL
  // ══════════════════════════════════════════════
  if (phase === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-6 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
            <GateHeader />

            <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Club Registration</h1>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Enter the club's email to verify your identity before registering.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              placeholder="club@sjp.ac.lk"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
            />
            {emailError && <p className="text-xs text-red-500 mb-2">{emailError}</p>}

            <button
              onClick={handleSendOtp}
              disabled={otpSending || !email}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg text-sm mt-2 transition">
              {otpSending ? "Sending OTP…" : "Send OTP"}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Email verification required to register
            </p>
          </div>

          <div className="text-center mt-5">
            <button onClick={() => navigate("/select-registration")} className="text-sm text-blue-600 font-semibold hover:underline">
              ← Back to registration options
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // GATE STEP 2 — OTP VERIFY
  // ══════════════════════════════════════════════
  if (phase === "otp") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-6 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full text-center">
            <GateHeader />

            <h2 className="text-xl font-bold text-gray-900 mb-1">Verify Your Email</h2>
            <p className="text-sm text-gray-500 mb-1">Enter the 6 digit code sent to</p>
            <p className="text-sm font-semibold text-blue-700 mb-6">{email}</p>

            <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
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
                  className="w-11 h-13 border-2 border-gray-300 rounded-lg text-center text-xl font-bold focus:outline-none focus:border-blue-600 transition py-2"
                />
              ))}
            </div>

            {otpError && <p className="text-xs text-red-500 mb-2">{otpError}</p>}

            <p className="text-xs text-gray-500 mb-4">
              {timer > 0 ? (
                <>Code expires in <span className="font-semibold text-red-500">{minutes}:{seconds}</span></>
              ) : (
                <span className="text-red-500 font-semibold">Code expired.</span>
              )}{" "}
              <button onClick={handleResendOtp} disabled={otpSending}
                className="text-blue-600 font-semibold hover:underline ml-1 disabled:opacity-50">
                {otpSending ? "Sending…" : "Resend OTP"}
              </button>
            </p>

            <button
              onClick={handleVerifyOtp}
              disabled={otpVerifying || otp.join("").length < 6}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg text-sm transition">
              {otpVerifying ? "Verifying…" : "Verify & Continue"}
            </button>

            <button onClick={() => setPhase("email")} className="mt-3 text-xs text-gray-400 hover:text-blue-600 transition w-full">
              Change email
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // SUBMITTED
  // ══════════════════════════════════════════════
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-50">
            <svg className="w-8 h-8 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Club Registration Submitted!</h2>
          <p className="text-sm text-gray-500 mb-5">Complete your payment to activate your club registration.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left space-y-3">
            {[
              { label: "Registration submitted", done: true },
              { label: "Payment pending", active: true },
              { label: "Admin verification" },
              { label: "Club activated" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: s.done ? "#dcfce7" : s.active ? "#fef3c7" : "#f3f4f6" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: s.done ? "#16a34a" : s.active ? "#d97706" : "#9ca3af" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={s.done ? 3 : 2}
                      d={s.done ? "M5 13l4 4L19 7" : s.active ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                </div>
                <span className={`text-xs font-medium ${s.done || s.active ? "text-gray-700" : "text-gray-400"}`}>{s.label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => alert("Payment gateway — coming soon!")}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg text-sm mb-3 transition">
            Proceed to Payment
          </button>
          <button onClick={() => navigate("/")} className="w-full text-sm text-gray-400 hover:text-blue-600">
            Back to Login
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // FEE CALCULATION (right panel)
  // ══════════════════════════════════════════════
  const baseFee = 5000;
  const extraCoaches = Math.max(0, coaches.length - 2);
  const extraFee = extraCoaches * 2500;
  const localTotal = baseFee + extraFee;
  // Prefer the server-calculated fee when the preview endpoint responds; the
  // exact key isn't pinned in the spec, so accept the common ones, else fall
  // back to the local estimate.
  const apiTotal =
    feePreview != null
      ? feePreview.total ??
        feePreview.total_fee ??
        feePreview.totalFee ??
        feePreview.fee ??
        feePreview.amount
      : null;
  const totalFee = apiTotal != null ? Number(apiTotal) : localTotal;

  // ══════════════════════════════════════════════
  // SUMMARY PANEL (right)
  // ══════════════════════════════════════════════
  const SummaryPanel = () => (
    <div className="space-y-4">
      {/* Club Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-blue-700">Club Information</p>
          {step !== 3 && (
            <button onClick={() => setStep(1)} className="text-xs flex items-center gap-1 text-blue-600">

              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          )}
        </div>
        {[
          ["Club Name", club.name || "—"],
          ["Register Year", club.year || "—"],
          ["Register Number", club.registerNumber || "—"],
          ["Primary Phone", club.primaryPhone || "—"],
          ["Secondary Phone", club.secondaryPhone || "—"],
          ["Address", club.address || "—"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400">{k}</span>
            <span className="text-xs font-medium text-gray-700 text-right max-w-32 truncate">{v}</span>
          </div>
        ))}
      </div>

      {/* Coach List */}
      {coaches.some(c => c.fullName) && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-blue-700">
              Coach List ({coaches.length} Coach{coaches.length > 1 ? "es" : ""})
            </p>
            {step !== 3 && (
              <button onClick={() => setStep(2)} className="text-xs flex items-center gap-1 text-blue-600">

                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
          {coaches.map((c, i) => (
            <div key={c.id} className="py-3 border-b border-gray-50 last:border-0">
              {/* Coach header row */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {c.photo ? (
                    <img src={URL.createObjectURL(c.photo)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-semibold text-gray-800">{c.fullName || "—"}</p>
                    {c.nameWithInitials && (
                      <span className="text-xs text-gray-400">({c.nameWithInitials})</span>
                    )}
                    {i === 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Primary Coach
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coach details grid */}
              <div className="space-y-1 pl-1">
                {[
                  ["Email", i === 0 ? email : c.email],
                  ["National ID", c.nationalId],
                  ["Primary Phone", c.primaryPhone],
                  ["Secondary Phone", c.secondaryPhone],
                  ["Date of Birth", c.dob],
                  ["Address", c.address],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-xs text-gray-400 flex-shrink-0 w-28">{k}</span>
                    <span className="text-xs font-medium text-gray-700 break-words">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fee Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-bold mb-3 text-blue-700">Registration Fee</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-xs text-gray-500">Base fee (Club + 2 Coaches)</span>
            <span className="text-xs font-medium text-gray-700">LKR 5,000</span>
          </div>
          {extraCoaches > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Extra coaches ({extraCoaches} × LKR 2,500)</span>
              <span className="text-xs font-medium text-gray-700">LKR {extraFee.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-xs font-bold text-gray-700">Total</span>
            <span className="text-sm font-bold text-blue-700">LKR {totalFee.toLocaleString()}</span>
          </div>
        </div>

        {step === 3 && (
          <div className="mt-3">
            <div className="bg-green-50 border border-green-100 rounded-lg p-2 mb-3 text-center">
              <p className="text-xs text-green-700">After review, proceed to payment</p>
            </div>
            {submitError && (
              <p className="text-xs text-red-500 mb-2 text-center">{submitError}</p>
            )}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2">
              {submitting ? "Submitting…" : "Proceed to Payment"}
              {!submitting && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <Header />

      <div className="flex flex-1">
        {/* Main content */}
        <div className="flex-1 p-4 sm:p-6 min-w-0">
          <StepBar />

          {/* ── STEP 1: Club Details ── */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-base mb-1 text-gray-900">Club Details</h2>
              <p className="text-xs text-gray-400 mb-4">Enter the basic information about your club.</p>

              <div className="bg-white rounded-xl shadow-sm p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="Club Name" required error={clubErrors.name}>
                    <Input name="name" value={club.name} onChange={handleClubChange} placeholder="Enter club name" />
                  </Field>
                  <Field label="Register Year" required error={clubErrors.year}>
                    <select name="year" value={club.year} onChange={handleClubChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
                      <option value="">Select year</option>
                      {YEARS.map(y => <option key={y}>{y}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Register Number" required error={clubErrors.registerNumber}>
                    <Input icon="#" name="registerNumber" value={club.registerNumber} onChange={handleClubChange} placeholder="Enter register number" />
                  </Field>
                  <Field label="Primary Phone Number" required error={clubErrors.primaryPhone}>
                    <Input icon="📞" name="primaryPhone" value={club.primaryPhone} onChange={handleClubChange} placeholder="Enter primary phone number" />
                  </Field>
                  <Field label="Secondary Phone Number">
                    <Input icon="📞" name="secondaryPhone" value={club.secondaryPhone} onChange={handleClubChange} placeholder="Enter secondary phone number (optional)" />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label="Address" required error={clubErrors.address}>
                    <Input name="address" value={club.address} onChange={handleClubChange} placeholder="Sports Complex, University of Sri Jayewardenepura" />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Coach Details ── */}
          {step === 2 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
                <div>
                  <h2 className="font-bold text-base text-gray-900">Coach Details</h2>
                  <p className="text-xs text-gray-400">Add one or more coaches to your club.</p>
                </div>
                <button onClick={addCoach}
                  className="flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border-2 border-blue-700 text-blue-700 hover:bg-blue-50 transition flex-shrink-0 self-start sm:self-auto">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Coach
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-4 mt-2">
                You can reorder coaches by order added. The first coach will be the primary coach.
              </p>

              <div className="space-y-4">
                {coaches.map((coach, idx) => (
                  <div key={coach.id} className="relative bg-white rounded-xl shadow-sm p-5">
                    {/* Remove */}
                    {coaches.length > 1 && (
                      <button onClick={() => removeCoach(coach.id)}
                        aria-label="Remove coach"
                        className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                      {/* Photo */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                          {coach.photo ? (
                            <img src={URL.createObjectURL(coach.photo)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <label className="cursor-pointer text-xs font-medium text-blue-600 hover:underline">
                          {coach.photo ? "Change" : "Upload"}
                          <input type="file" accept=".png,.jpg,.jpeg" className="hidden"
                            onChange={e => handleCoachPhoto(coach.id, e.target.files[0])} />
                        </label>
                        {coach.photoError && <p className="text-xs text-red-500">{coach.photoError}</p>}
                      </div>

                      {/* Fields */}
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <Field label="Full Name" required>
                          <Input value={coach.fullName} onChange={e => handleCoachChange(coach.id, "fullName", e.target.value)} placeholder="Full name" />
                        </Field>
                        <Field label="Name with Initials" required>
                          <Input value={coach.nameWithInitials} onChange={e => handleCoachChange(coach.id, "nameWithInitials", e.target.value)} placeholder="N. Perera" />
                        </Field>
                        <Field label="Email" required>
                          {idx === 0 ? (
                            <Input
                              icon="📧"
                              type="email"
                              value={email}
                              readOnly
                              title="Verified email (auto-filled from OTP verification)"
                              style={{ backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                            />
                          ) : (
                            <Input
                              icon="📧"
                              type="email"
                              value={coach.email}
                              onChange={e => handleCoachChange(coach.id, "email", e.target.value)}
                              placeholder="coach@example.com"
                            />
                          )}
                        </Field>
                        <Field label="National ID Number" required>
                          <Input value={coach.nationalId} onChange={e => handleCoachChange(coach.id, "nationalId", e.target.value)} placeholder="812345678V" />
                        </Field>
                        <Field label="Primary Phone" required>
                          <Input icon="📞" value={coach.primaryPhone} onChange={e => handleCoachChange(coach.id, "primaryPhone", e.target.value)} placeholder="077 123 4567" />
                        </Field>
                        <Field label="Secondary Phone">
                          <Input icon="📞" value={coach.secondaryPhone} onChange={e => handleCoachChange(coach.id, "secondaryPhone", e.target.value)} placeholder="Enter secondary (optional)" />
                        </Field>
                        <Field label="Date of Birth">
                          <input type="date" value={coach.dob}
                            onChange={e => handleCoachChange(coach.id, "dob", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" />
                        </Field>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <Field label="Address" required>
                            <Input value={coach.address} onChange={e => handleCoachChange(coach.id, "address", e.target.value)} placeholder="123, Lake View Road, Nugegoda" />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {idx === 0 && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Primary Coach · Verified</span>
                        <span className="text-xs text-gray-400">Uses your OTP-verified email — already verified.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Summary (centered in main area) ── */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <h2 className="font-bold text-base mb-1 text-center text-gray-900">Registration Summary</h2>
              <p className="text-xs text-gray-400 mb-4 text-center">Review your details before proceeding.</p>
              <SummaryPanel />
            </div>
          )}

          {/* Bottom nav */}
          <div className={`flex items-center justify-between mt-6 ${step === 3 ? "max-w-2xl mx-auto" : ""}`}>
            <button
              onClick={() => step === 1 ? navigate("/") : setStep(s => s - 1)}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              {step === 1 ? "Cancel" : "Back"}
            </button>
            {step < 3 && (
              <button onClick={handleNext}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                {step === 2 ? "Next: Review Summary" : "Next"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right summary panel — live preview during steps 1–2 only.
            On step 3 the summary moves into the centered main area instead. */}
        {step !== 3 && (
          <div className="hidden lg:block w-72 xl:w-80 p-4 pt-6 flex-shrink-0">
            <p className="font-bold text-sm mb-1 text-gray-900">Registration Summary</p>
            <p className="text-xs text-gray-400 mb-4">Review your details before proceeding.</p>
            <SummaryPanel />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}