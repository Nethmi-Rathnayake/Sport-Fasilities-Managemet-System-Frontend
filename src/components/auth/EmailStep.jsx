import React, { useState } from "react";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import { sendOtp } from "../../services/authService";
import toast from "react-hot-toast";
// `beforeSend` (optional): async (email) => boolean. Runs before the OTP is
// sent; return false to abort (e.g. the email isn't registered). The login page
// uses it to block unregistered emails and prompt them to register instead.
export default function EmailStep({ onSend, beforeSend, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail);
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
    <div className="bg-white rounded-3xl shadow-xl p-12 w-full">

      {/* USJ Branding - logo  */}
      <div className="flex items-center gap-5 mb-10">
        <img
          src={logo}
          alt="USJ Logo"
          className="w-28 h-28 object-contain flex-shrink-0"
        />
        <div>
          <p className="font-semibold text-gray-800 text-2xl leading-tight">
            University of Sri Jayewardenepura
          </p>
          <p className="text-lg text-blue-600">Sports Facility Portal</p>
        </div>
      </div>

      <p className="text-center text-gray-500 text-lg mb-8">
        Enter your email to receive a<br />one time passcode (OTP)
      </p>

      <form onSubmit={handleSubmit}>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@sjp.ac.lk"
          className="w-full border border-gray-300 rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
        />
        {error && <p className="text-red-500 text-base mb-2">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold py-5 rounded-xl transition mt-4 text-lg"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>
      </form>
    </div>
  );
}