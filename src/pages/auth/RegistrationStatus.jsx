import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import { getMember } from "../../services/memberService";
import { storageUrl } from "../../services/api";

// Shown after an ALREADY-REGISTERED member verifies their OTP but has NOT yet
// paid. They can't enter a dashboard, so we show a READ-ONLY summary of the
// details they submitted plus where they are in the registration workflow.
// Details can be viewed but not edited until payment is complete.
//
// The basic member payload comes from /verify-otp via navigation state; we then
// fetch the full record (phones, address, NIC, photo, processes) from
// GET /api/members/{id} so every submitted field is visible.

const buildName = (initials, denoted, lastname) => {
  const lead = String(initials || denoted || "").trim();
  const tail = String(lastname || "").trim();
  return [lead, tail].filter(Boolean).join(" ") || "—";
};

const fmtDate = (v) => {
  if (!v) return "—";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

const isPaid = (m) => String(m?.payment_status || "").toLowerCase().includes("paid");

const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("active") || s.includes("paid") || s.includes("issued") || s.includes("approved"))
    return { bg: "#dcfce7", color: "#15803d" };
  if (s.includes("pending") || s.includes("await") || s.includes("verification"))
    return { bg: "#fef3c7", color: "#b45309" };
  if (s.includes("reject") || s.includes("fail")) return { bg: "#fee2e2", color: "#b91c1c" };
  return { bg: "#e5e7eb", color: "#4b5563" };
};

const Pill = ({ children }) => {
  const c = statusColor(children);
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: c.bg, color: c.color }}>
      {children || "—"}
    </span>
  );
};

const StepIcon = ({ state }) => {
  // state: "done" | "active" | "todo"
  const bg = state === "done" ? "#dcfce7" : state === "active" ? "#fef3c7" : "#f3f4f6";
  const color = state === "done" ? "#16a34a" : state === "active" ? "#d97706" : "#9ca3af";
  const d =
    state === "done"
      ? "M5 13l4 4L19 7"
      : state === "active"
      ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={state === "done" ? 3 : 2} d={d} />
      </svg>
    </div>
  );
};

export default function RegistrationStatus() {
  const navigate = useNavigate();
  const location = useLocation();

  const initial = location.state?.member || null;
  const email = location.state?.email || initial?.email || "";

  const [member, setMember] = useState(initial);
  const [loading, setLoading] = useState(Boolean(initial?.id));

  // No member in state (e.g. page opened directly) → back to login.
  useEffect(() => {
    if (!initial) navigate("/login", { replace: true });
  }, [initial, navigate]);

  // Enrich the basic payload with the full submitted record.
  useEffect(() => {
    if (!initial?.id) return;
    let on = true;
    getMember(initial.id)
      .then((full) => on && full && setMember((prev) => ({ ...prev, ...full })))
      .catch(() => {})
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [initial]);

  const isClubStudent = String(member?.member_type || "").toLowerCase().includes("club");
  const clubVerified = Boolean(member?.club_id);
  const paid = isPaid(member);

  // Workflow tracker — reflects the member's real status.
  const steps = useMemo(() => {
    const out = [
      { label: "Email verified", state: "done" },
      { label: "Registration form submitted", state: "done" },
    ];
    if (isClubStudent) {
      out.push({ label: "Club verification", state: clubVerified ? "done" : "active" });
    }
    out.push({
      label: "Payment",
      state: paid ? "done" : isClubStudent && !clubVerified ? "todo" : "active",
    });
    return out;
  }, [isClubStudent, clubVerified, paid]);

  if (!member) return null;

  const name = buildName(member.initials, member.name_denoted_by_initials, member.lastname);
  const photoUrl = storageUrl(member.photo_path) || member.photo_url || null;

  const rows = [
    ["Member ID", member.member_id],
    ["Title", member.title],
    ["Name", name],
    ["Gender", member.member_gender],
    ["Email Address", member.email || email],
    ["Student NIC / Guardian NIC", member.nic_number],
    ["Date of Birth", fmtDate(member.date_of_birth)],
    ["Primary Phone", member.primary_phone_number],
    ["Secondary Phone", member.secondary_phone_number],
    ["Address", member.address],
    ["Membership Type", member.member_type],
    ...(isClubStudent
      ? [["Club", member.club_name || member.requested_club_name]]
      : []),
  ];

  const Footer = () => (
    <p className="text-xs text-gray-400 text-center mt-8">
      © {new Date().getFullYear()} University of Sri Jayewardenepura
    </p>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-6 px-4">
      <div className="max-w-3xl mx-auto w-full">
        {/* Branding header (matches the login page) */}
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="USJ Logo" className="w-12 h-12 object-contain flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">University of Sri Jayewardenepura</p>
            <p className="text-xs text-blue-600">Sports Facility Portal</p>
          </div>
        </div>

        {/* Payment-pending banner */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-50">
              <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900">Payment Pending</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Welcome back, <span className="font-semibold text-blue-700">{name}</span>. Your registration is
                submitted but not yet active — complete your payment to continue.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Pill>{member.member_status}</Pill>
                <Pill>{member.payment_status}</Pill>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Submitted details (read-only) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-gray-900">Your Submitted Details</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                View only
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-32 h-36 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-300">No photo</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">Profile Photo</p>
              </div>

              <dl className="flex-1 divide-y divide-gray-100">
                {loading ? (
                  <p className="text-sm text-gray-400 py-6">Loading your details…</p>
                ) : (
                  rows.map(([label, value]) => (
                    <div key={label} className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                      <dt className="text-xs font-medium text-gray-400">{label}</dt>
                      <dd className="sm:col-span-2 min-w-0 text-sm text-gray-800 break-words [overflow-wrap:anywhere]">{value || "—"}</dd>
                    </div>
                  ))
                )}
              </dl>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Your details can't be changed until payment is complete.
            </p>
          </div>

          {/* Workflow tracker + actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
            <h2 className="font-bold text-sm mb-4 text-gray-900">Registration Progress</h2>
            <div className="space-y-3 flex-1">
              {steps.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <StepIcon state={s.state} />
                  <span className={`text-xs font-medium ${s.state === "todo" ? "text-gray-400" : "text-gray-700"}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {isClubStudent && !clubVerified ? (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-4">
                Your club must verify you before payment is enabled.
              </p>
            ) : (
              <button
                onClick={() => alert("Payment gateway — coming soon!")}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm mt-4 transition"
              >
                Proceed to Payment
              </button>
            )}
            <button
              onClick={() => navigate("/login", { replace: true })}
              className="w-full text-sm text-gray-400 hover:text-blue-600 transition mt-3"
            >
              Back to Login
            </button>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
