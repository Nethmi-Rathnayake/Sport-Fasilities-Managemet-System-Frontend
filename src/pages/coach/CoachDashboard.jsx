import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import {
  getClubVerificationRequests,
  approveClubRequest,
  rejectClubRequest,
  getClubMembers,
  getFacilities,
  getFacilityAvailability,
} from "../../services/coachService";

// ── Design tokens (shared across the app) ──
const NAVY = "#0f1c3f";
const BLUE = "#1a56db";
const BLUE_HOVER = "#1648c8";
const GOLD = "#e8a020";
const LIGHT = "#e8f0fe";
const STORAGE_KEY = "sfmis_coach";

const todayStr = () => new Date().toISOString().slice(0, 10);

const Icon = ({ path, className = "w-5 h-5", stroke = "currentColor", width = 1.8 }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke}>
    {path.split("|").map((d, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" strokeWidth={width} d={d} />
    ))}
  </svg>
);

const ICONS = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  approvals: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  members: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  book: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  profile: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-14h.01M11 7h.01M15 7h.01M7 11h.01M11 11h.01M15 11h.01",
  check: "M5 13l4 4L19 7",
  x: "M6 18L18 6M6 6l12 12",
  card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
};

const NAV = [
  { key: "dashboard", label: "Dashboard" },
  { key: "approvals", label: "Approvals" },
  { key: "members", label: "Club Members" },
  { key: "book", label: "Book Facility" },
  { key: "profile", label: "Profile" },
];

// Small status-pill helper.
const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("active") || s.includes("paid") || s.includes("issued") || s.includes("approved")) return { bg: "#dcfce7", color: "#15803d" };
  if (s.includes("pending")) return { bg: "#fef3c7", color: "#b45309" };
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

const Avatar = ({ name, url, size = 40 }) => {
  const initials = String(name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return url ? (
    <img src={url} alt={name} className="rounded-full object-cover flex-shrink-0" style={{ width: size, height: size }} />
  ) : (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white" style={{ width: size, height: size, backgroundColor: BLUE, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
};

export default function CoachDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Resolve the logged-in coach from navigation state (set by LoginPage) or the
  // session fallback so a refresh keeps us signed in.
  const [coach] = useState(() => {
    const fromState = location.state?.member;
    if (fromState) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fromState));
      return fromState;
    }
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  });

  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  // Book Facility state
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  const [bookDate, setBookDate] = useState(todayStr());
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  useEffect(() => {
    if (!coach) navigate("/login", { replace: true });
  }, [coach, navigate]);

  const refreshRequests = useCallback(async () => {
    if (!coach?.id || !coach?.club_id) {
      setRequests([]);
      return;
    }
    try {
      setRequests(await getClubVerificationRequests(coach.id));
    } catch {
      setRequests([]);
    }
  }, [coach]);

  const refreshMembers = useCallback(async () => {
    if (!coach?.club_id) {
      setMembers([]);
      return;
    }
    try {
      setMembers(await getClubMembers(coach.club_id));
    } catch {
      setMembers([]);
    }
  }, [coach]);

  useEffect(() => {
    if (!coach) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [reqs, mems, facs] = await Promise.allSettled([
        coach.club_id ? getClubVerificationRequests(coach.id) : Promise.resolve([]),
        coach.club_id ? getClubMembers(coach.club_id) : Promise.resolve([]),
        getFacilities(),
      ]);
      if (!active) return;
      setRequests(reqs.status === "fulfilled" ? reqs.value : []);
      setMembers(mems.status === "fulfilled" ? mems.value : []);
      const facList = facs.status === "fulfilled" ? facs.value : [];
      setFacilities(facList);
      if (facList.length) setSelectedFacilityId((id) => id ?? facList[0].id);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [coach]);

  // Load availability whenever the Book Facility tab is open with a selection.
  useEffect(() => {
    if (active !== "book" || !selectedFacilityId) return;
    let on = true;
    setAvailLoading(true);
    getFacilityAvailability(selectedFacilityId, bookDate)
      .then((data) => on && setAvailability(data))
      .catch(() => {
        if (on) {
          setAvailability(null);
          toast.error("Could not load availability.");
        }
      })
      .finally(() => on && setAvailLoading(false));
    return () => {
      on = false;
    };
  }, [active, selectedFacilityId, bookDate]);

  const handleApprove = async (memberId) => {
    setActingId(memberId);
    try {
      await approveClubRequest(memberId, coach.id);
      toast.success("Member approved as a club student.");
      await Promise.all([refreshRequests(), refreshMembers()]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not approve member.");
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (memberId) => {
    setActingId(memberId);
    try {
      await rejectClubRequest(memberId, coach.id);
      toast.success("Member rejected and moved to Independent.");
      await Promise.all([refreshRequests(), refreshMembers()]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not reject member.");
    } finally {
      setActingId(null);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const stats = useMemo(
    () => [
      { label: "Club Members", value: members.length, icon: ICONS.members, accent: BLUE },
      { label: "Pending Approvals", value: requests.length, icon: ICONS.approvals, accent: GOLD },
      { label: "Facilities", value: facilities.length, icon: ICONS.book, accent: "#0891b2" },
      { label: "Membership", value: coach?.member_status || "—", icon: ICONS.check, accent: "#16a34a", isText: true },
    ],
    [members.length, requests.length, facilities.length, coach]
  );

  if (!coach) return null;

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  // ════════════════════════════════════════════
  // VIEWS
  // ════════════════════════════════════════════
  const DashboardView = () => (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: LIGHT }}>
              <Icon path={s.icon} className="w-6 h-6" stroke={s.accent} width={2} />
            </div>
            <div className="min-w-0">
              <p className={`font-extrabold truncate ${s.isText ? "text-base" : "text-2xl"}`} style={{ color: NAVY }}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending approvals preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: NAVY }}>Pending Club Verifications</h3>
            {requests.length > 0 && (
              <button onClick={() => setActive("approvals")} className="text-xs font-semibold" style={{ color: BLUE }}>View all</button>
            )}
          </div>
          {requests.length === 0 ? (
            <EmptyState icon={ICONS.check} text="No pending verification requests." />
          ) : (
            <div className="space-y-3">
              {requests.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <Avatar name={r.fullname} url={r.photo_url} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: NAVY }}>{r.fullname}</p>
                    <p className="text-xs text-gray-400 truncate">{r.member_id} · {r.email}</p>
                  </div>
                  <Pill>{r.member_status}</Pill>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Club info */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Your Club</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <Icon path={ICONS.building} className="w-6 h-6" stroke="#fff" width={1.8} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: NAVY }}>{coach.club_name || "Not linked to a club"}</p>
              <p className="text-xs text-gray-400">{coach.club_code || "—"}</p>
            </div>
          </div>
          <InfoRow label="Coach" value={coach.fullname} />
          <InfoRow label="Member ID" value={coach.member_id} />
          <InfoRow label="Payment" value={<Pill>{coach.payment_status}</Pill>} />
        </div>
      </div>
    </>
  );

  const ApprovalsView = () => (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: NAVY }}>Club Verification Requests ({requests.length})</h3>
        <button onClick={refreshRequests} className="text-xs font-semibold" style={{ color: BLUE }}>Refresh</button>
      </div>
      {!coach.club_id ? (
        <EmptyState icon={ICONS.building} text="You are not linked to a club yet." />
      ) : requests.length === 0 ? (
        <EmptyState icon={ICONS.check} text="No students are waiting for verification." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-gray-100">
              <Avatar name={r.fullname} url={r.photo_url} size={44} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: NAVY }}>{r.fullname}</p>
                <p className="text-xs text-gray-400 break-words">
                  {r.member_id} · {r.email}{r.nic_number ? ` · NIC ${r.nic_number}` : ""}
                </p>
                <p className="text-xs text-gray-400">Requested: {r.requested_club_name || coach.club_name}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(r.id)}
                  disabled={actingId === r.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "#16a34a" }}>
                  <Icon path={ICONS.check} className="w-4 h-4" stroke="#fff" width={2.5} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(r.id)}
                  disabled={actingId === r.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}>
                  <Icon path={ICONS.x} className="w-4 h-4" stroke="#b91c1c" width={2.5} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const MembersView = () => (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm" style={{ color: NAVY }}>Club Members ({members.length})</h3>
        <button onClick={refreshMembers} className="text-xs font-semibold" style={{ color: BLUE }}>Refresh</button>
      </div>
      {members.length === 0 ? (
        <EmptyState icon={ICONS.members} text="No members in your club yet." />
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="py-2 pr-3 font-medium">Member</th>
                <th className="py-2 px-3 font-medium">Member ID</th>
                <th className="py-2 px-3 font-medium">Type</th>
                <th className="py-2 px-3 font-medium">Status</th>
                <th className="py-2 pl-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.fullname} url={m.photo_url} size={36} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: NAVY }}>{m.fullname}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600">{m.member_id}</td>
                  <td className="py-3 px-3 text-xs text-gray-600">{m.member_type}</td>
                  <td className="py-3 px-3"><Pill>{m.member_status}</Pill></td>
                  <td className="py-3 pl-3"><Pill>{m.payment_status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const BookFacilityView = () => {
    const timeCols = availability?.slots?.[0]?.time_slots || [];
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="font-bold text-sm mb-4" style={{ color: NAVY }}>Book a Facility</h3>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select
            value={selectedFacilityId || ""}
            onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700">
            {facilities.length === 0 && <option>No facilities available</option>}
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.facility_name}</option>
            ))}
          </select>
          <input
            type="date"
            value={bookDate}
            min={todayStr()}
            onChange={(e) => setBookDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
          <LegendDot color="#dcfce7" border="#16a34a" label="Available" />
          <LegendDot color="#fee2e2" border="#ef4444" label="Full" />
          <LegendDot color="#fef3c7" border="#f59e0b" label="Blocked" />
        </div>

        {availLoading ? (
          <p className="text-sm text-gray-400 py-10 text-center">Loading availability…</p>
        ) : !availability ? (
          <EmptyState icon={ICONS.book} text="Select a facility and date to see availability." />
        ) : !availability.facility_available_for_booking ? (
          <EmptyState icon={ICONS.clock} text="This facility is currently not available for booking." />
        ) : timeCols.length === 0 ? (
          <EmptyState icon={ICONS.clock} text="No time slots configured for this facility." />
        ) : (
          <>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="border-separate" style={{ borderSpacing: "4px" }}>
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-white" />
                    {timeCols.map((t) => (
                      <th key={t.time_slot_id} className="text-[10px] font-medium text-gray-500 px-1 whitespace-nowrap">
                        {String(t.start_time).slice(0, 5)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {availability.slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="sticky left-0 bg-white text-xs font-semibold pr-2 whitespace-nowrap" style={{ color: NAVY }}>
                        {slot.slot_code}
                      </td>
                      {slot.time_slots.map((ts) => {
                        const style = ts.available
                          ? { backgroundColor: "#dcfce7", borderColor: "#16a34a", color: "#15803d" }
                          : ts.is_blocked
                          ? { backgroundColor: "#fef3c7", borderColor: "#f59e0b", color: "#b45309" }
                          : { backgroundColor: "#fee2e2", borderColor: "#ef4444", color: "#b91c1c" };
                        const title = ts.is_blocked
                          ? `Blocked${ts.block_reason ? `: ${ts.block_reason}` : ""}`
                          : ts.is_full
                          ? "Full"
                          : `Available · LKR ${ts.fee}`;
                        return (
                          <td key={ts.facility_slot_time_slot_id}>
                            <button
                              disabled={!ts.available}
                              title={title}
                              onClick={() => toast.success(`${slot.slot_code} ${String(ts.start_time).slice(0, 5)} selected — booking checkout coming soon.`)}
                              className="w-10 h-8 rounded border text-[10px] font-semibold transition disabled:cursor-not-allowed"
                              style={style}>
                              {ts.available ? "✓" : ts.is_blocked ? "✕" : "•"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Showing live availability for <span className="font-semibold">{selectedFacility?.facility_name}</span> on {bookDate}. Booking fee: LKR {selectedFacility?.booking_fee ?? "—"}.
            </p>
          </>
        )}
      </div>
    );
  };

  const ProfileView = () => (
    <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={coach.fullname} url={coach.photo_url} size={64} />
        <div>
          <h3 className="font-bold text-lg" style={{ color: NAVY }}>{coach.fullname}</h3>
          <p className="text-sm text-gray-400">Coach · {coach.club_name || "No club"}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
        <InfoRow label="Member ID" value={coach.member_id} />
        <InfoRow label="Email" value={coach.email} />
        <InfoRow label="Club" value={coach.club_name || "—"} />
        <InfoRow label="Club Code" value={coach.club_code || "—"} />
        <InfoRow label="Membership Status" value={<Pill>{coach.member_status}</Pill>} />
        <InfoRow label="Payment Status" value={<Pill>{coach.payment_status}</Pill>} />
      </div>
    </div>
  );

  const VIEW_TITLES = { dashboard: "Dashboard", approvals: "Approvals", members: "Club Members", book: "Book Facility", profile: "Profile" };

  const renderView = () => {
    if (loading) return <p className="text-sm text-gray-400 py-20 text-center">Loading dashboard…</p>;
    switch (active) {
      case "approvals": return <ApprovalsView />;
      case "members": return <MembersView />;
      case "book": return <BookFacilityView />;
      case "profile": return <ProfileView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f0f2f5", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ══ SIDEBAR ══ */}
      <aside
        className={`fixed lg:static z-40 inset-y-0 left-0 w-64 flex flex-col transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ backgroundColor: NAVY }}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD }}>
            <img src={logo} alt="USJ" className="w-7 h-7 object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm">USJ SPORTS</p>
            <p className="text-[10px]" style={{ color: GOLD }}>Coach Portal</p>
          </div>
        </div>

        {/* Coach card */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Avatar name={coach.fullname} url={coach.photo_url} size={40} />
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{coach.fullname}</p>
            <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{coach.club_name || "Coach"}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const on = active === n.key;
            const badge = n.key === "approvals" && requests.length > 0 ? requests.length : null;
            return (
              <button
                key={n.key}
                onClick={() => { setActive(n.key); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: on ? BLUE : "transparent", color: on ? "#fff" : "rgba(255,255,255,0.7)" }}>
                <Icon path={ICONS[n.key]} className="w-5 h-5" width={1.8} />
                <span className="flex-1 text-left">{n.label}</span>
                {badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: GOLD, color: "#3b2a00" }}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors" style={{ color: "rgba(255,255,255,0.7)" }}>
            <Icon path={ICONS.logout} className="w-5 h-5" width={1.8} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══ MAIN ══ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Icon path="M4 6h16M4 12h16M4 18h16" stroke={NAVY} width={2} />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg truncate" style={{ color: NAVY }}>{VIEW_TITLES[active]}</h1>
              <p className="text-xs text-gray-400 truncate">Welcome back, {coach.fullname}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="relative text-gray-500" aria-label="Notifications">
              <Icon path={ICONS.bell} className="w-5 h-5" stroke="#6b7280" width={1.8} />
              {requests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#ef4444" }}>{requests.length}</span>}
            </button>
            <Avatar name={coach.fullname} url={coach.photo_url} size={36} />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">{renderView()}</main>
      </div>
    </div>
  );
}

// ── Small presentational helpers ──
function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 gap-3">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-700 text-right break-words">{value || "—"}</span>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: LIGHT }}>
        <Icon path={icon} className="w-7 h-7" stroke={BLUE} width={1.6} />
      </div>
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

function LegendDot({ color, border, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3.5 h-3.5 rounded border" style={{ backgroundColor: color, borderColor: border }} />
      {label}
    </span>
  );
}
