import React, { useState } from "react";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import { sendOtp } from "../../services/authService";
import toast from "react-hot-toast";
// `beforeSend` (optional): async (email) => boolean. Runs before the OTP is
// sent; return false to abort (e.g. the email isn't registered). The login page
// uses it to block unregistered emails and prompt them to register instead.
export default function EmailStep({ onSend, beforeSend }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (beforeSend) {
        const proceed = await beforeSend(email);
        if (!proceed) return; // aborted (caller shows its own message)
      }
      await sendOtp(email);
      toast.success("OTP sent successfully!");
      onSend(email);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
      
      {/* USJ Branding - logo  */}
      <div className="flex items-center gap-3 mb-6">
        <img
          src={logo}
          alt="USJ Logo"
          className="w-12 h-12 object-contain flex-shrink-0"
        />
        <div>
          <p className="font-semibold text-gray-800 text-sm leading-tight">
            University of Sri Jayewardenepura
          </p>
          <p className="text-xs text-blue-600">Sports Facility Portal</p>
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mb-6">
        Enter your email to receive a<br />one time passcode (OTP)
      </p>

      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@sjp.ac.lk"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
        />
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <button 
          type="submit"
          disabled={loading || !email}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg transition mt-2 text-sm"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </form>

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Passwordless login. No password required.
      </p>
    </div>
  );
}