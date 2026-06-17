import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/usjp-logo__1_-removebg-preview.png";
import poolImg from "../assets/swiming pool image.jpg";

const NAV_LINKS = ["Home", "About Us", "Facilities", "Membership", "How It Works", "Contact Us"];

const FEATURES = [
  {
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    title: "Facility Booking",
    desc: "Book pool lanes, gym and sports facilities online.",
  },
  {
    icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 000-2H5a1 1 0 000 2zm0 0v6a1 1 0 001 1h2",
    title: "QR Access",
    desc: "Secure and contactless entry with QR scanning.",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    title: "Memberships",
    desc: "Manage student, coach and independent memberships.",
  },
  {
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    title: "Attendance Tracking",
    desc: "Automatic attendance through gate scanning.",
  },
  {
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    title: "Online Payments",
    desc: "Pay membership and booking fees securely online.",
  },
];

const WHO_CAN_USE = [
  {
    icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    title: "Students",
    desc: "Register under a coach or as an independent user and access sports facilities.",
    color: "#1a56db",
    bg: "#e8f0fe",
  },
  {
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Coaches",
    desc: "Register clubs, manage members, approve students and book facilities.",
    color: "#1a56db",
    bg: "#e8f0fe",
  },
  {
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    title: "Independent Users",
    desc: "Register without a coach and enjoy access to selected facilities.",
    color: "#1a56db",
    bg: "#e8f0fe",
  },
];

const QUICK_LINKS = ["Home", "About Us", "Facilities", "Membership", "How It Works", "Contact Us"];
const FACILITIES_LIST = ["Swimming Pool", "Gym", "Indoor Courts", "Outdoor Fields", "Sports Complex"];
const HELP_LINKS = ["FAQs", "User Guide", "Terms & Conditions", "Privacy Policy", "Contact Support"];

const FOOTER_COLUMNS = [
  { title: "Quick Links", links: QUICK_LINKS },
  { title: "Facilities", links: FACILITIES_LIST },
  { title: "Help & Support", links: HELP_LINKS },
];

const SvgIcon = ({ path, className = "w-6 h-6", stroke = "currentColor", fill = "none" }) => (
  <svg className={className} fill={fill} viewBox="0 0 24 24" stroke={stroke}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
     className="min-h-screen font-sans bg-white"
     style={{
      fontFamily: "Inter, system-ui, sans-serif",
     }}
    >

      {/* ══ NAVBAR ══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{ backgroundColor: scrolled ? "rgba(10,20,50,0.97)" : "rgba(10,20,50,0.85)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src={logo} alt="USJ" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">University of Sri Jayewardenepura</p>
              <p className="text-xs leading-tight" style={{ color: "#e8a020" }}>Physical Education Unit</p>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link, i) => (
              <a key={link} href="#"
                className="text-sm font-medium transition-colors relative group"
                style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.75)" }}>
                {link}
                {i === 0 && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded" style={{ backgroundColor: "#e8a020" }} />
                )}
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                  style={{ backgroundColor: "#e8a020" }} />
              </a>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-lg text-sm font-semibold border transition-colors"
              style={{ borderColor: "#fff", color: "#fff" }}
              onMouseEnter={e => { e.target.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { e.target.style.backgroundColor = "transparent"; }}>
              Sign In
            </button>
            <button
              onClick={() => navigate("/select-registration")}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#1a56db", color: "#fff" }}
              onMouseEnter={e => e.target.style.backgroundColor = "#1648c8"}
              onMouseLeave={e => e.target.style.backgroundColor = "#1a56db"}>
              Register
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="lg:hidden text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden px-4 pb-4 space-y-2" style={{ backgroundColor: "rgba(10,20,50,0.97)" }}>
            {NAV_LINKS.map(link => (
              <a key={link} href="#" className="block text-sm py-2 text-white opacity-80 hover:opacity-100">{link}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate("/login")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold border border-white text-white">Sign In</button>
              <button onClick={() => navigate("/select-registration")}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "#1a56db" }}>Register</button>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO SECTION ══ */}
      <section className="relative h-[560px] overflow-hidden">

  {/* Background Image */}
  <img
    src={poolImg}
    alt="Swimming Pool"
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* Dark Overlay */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(90deg, rgba(7,20,45,0.95) 0%, rgba(7,20,45,0.88) 35%, rgba(7,20,45,0.55) 60%, rgba(7,20,45,0.05) 100%)",
    }}
  />

  {/* Content */}
  <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">

    <div className="max-w-xl mt-10">

      <p
        className="text-sm font-semibold tracking-widest mb-4"
        style={{ color: "#60a5fa" }}
      >
        WELCOME TO
      </p>

      <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
        Sports Facility
        <br />
        Management &
        <br />
        Access Control System
      </h1>

      <p
        className="mt-5 text-base leading-relaxed"
        style={{ color: "rgba(255,255,255,0.75)" }}
      >
        A smart, secure and centralized platform to manage sports
        facilities, memberships, bookings, access and payments
        for a better sports experience.
      </p>

      <div className="flex flex-wrap gap-4 mt-8">

        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-3 px-6 py-3 rounded-xl text-white"
          style={{ backgroundColor: "#2563eb" }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>

          <div className="text-left">
            <div className="font-semibold">Sign In</div>
            <div className="text-xs opacity-80">
              Access your account
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/select-registration")}
          className="flex items-center gap-3 px-6 py-3 rounded-xl border border-white/40 text-white bg-white/10 backdrop-blur-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>

          <div className="text-left">
            <div className="font-semibold">Register</div>
            <div className="text-xs opacity-80">
              Create a new account
            </div>
          </div>
        </button>

      </div>
    </div>

  </div>

</section>

      {/* ══ FEATURES STRIP ══ */}
      <section className="relative -mt-8 z-20">
       <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0">
            {FEATURES.map((f, i) => (
              <div key={i}
                className={`flex flex-col items-center text-center gap-3 px-4 py-2 group cursor-pointer ${i !== 0 ? "lg:border-l" : ""}`}
                style={{ borderColor: "#eef2f9" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ backgroundColor: "#eaf1fe" }}>
                  <SvgIcon path={f.icon} className="w-7 h-7" stroke="#2563eb" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1" style={{ color: "#0c43db" }}>{f.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
       </div>
      </section>

      {/* ══ WHO CAN USE ══ */}
      <section className="py-16 px-4 sm:px-6" style={{ backgroundColor: "rgba(15,28,63,0.55)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-10 text-white">
            Who Can Use This System?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {WHO_CAN_USE.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.bg }}>
                  <SvgIcon path={item.icon} className="w-7 h-7" stroke={item.color} />
                </div>
                <div>
                  <p className="font-bold text-sm mb-2" style={{ color: "#0f1c3f" }}>{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="pt-12 pb-6 px-4 sm:px-6" style={{ backgroundColor: "rgba(10,20,50,0.88)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white border-opacity-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src={logo} alt="USJ" className="w-10 h-10 object-contain" />
                <div>
                  <p className="text-white font-bold text-sm leading-tight">University of Sri Jayewardenepura</p>
                  <p className="text-xs" style={{ color: "#e8a020" }}>Physical Education Unit</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Empowering a healthy campus community through sports, technology and excellence.
              </p>
              {/* Social icons */}
              <div className="flex gap-3">
                {[
                  "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                  "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M6.5 6.5A11.5 11.5 0 0017.5 17.5",
                  "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.54C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
                  "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
                ].map((path, i) => (
                  <a key={i} href="#"
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.18)"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns: Quick Links, Facilities, Help & Support */}
            {FOOTER_COLUMNS.map(col => (
              <div key={col.title}>
                <p className="text-white font-bold text-sm mb-4">{col.title}</p>
                <div className="space-y-2">
                  {col.links.map(link => (
                    <a key={link} href="#"
                      className="block text-xs transition-colors hover:text-white"
                      style={{ color: "rgba(255,255,255,0.55)" }}>{link}</a>
                  ))}
                </div>
              </div>
            ))}

            {/* Contact */}
            <div>
              <p className="text-white font-bold text-sm mb-4">Contact Us</p>
              <div className="space-y-3">
                {[
                  { icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z", text: "Physical Education Unit\nUniversity of Sri Jayewardenepura\nNugegoda, Sri Lanka" },
                  { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", text: "011 275 0000" },
                  { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", text: "peu@sjp.ac.lk" },
                  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", text: "Mon - Fri : 8.00 AM - 5.00 PM" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#e8a020">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                    <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 text-center">
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              © 2026 University of Sri Jayewardenepura - Physical Education Unit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}