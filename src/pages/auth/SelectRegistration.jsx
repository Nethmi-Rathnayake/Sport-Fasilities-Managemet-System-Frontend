import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";

// Shown after OTP verification when the email is NOT yet registered.
// Asks the user whether they want to register as a Student or as a Club,
// then routes to the matching registration page.
export default function SelectRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  // The verified email is forwarded from LoginPage so the registration pages
  // can pre-use it if they want (they currently re-collect/verify it).
  const email = location.state?.email;

  const goToStudent = () =>
    navigate("/student-registration", { state: { email } });

  const goToClub = () =>
    navigate("/club-registration", { state: { email } });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full">
          {/* USJ Branding */}
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

          <h2 className="text-xl font-bold text-gray-900 mb-1 text-center">
            Register as Student or Club?
          </h2>
          {email && (
            <p className="text-sm font-semibold text-blue-700 mb-1 text-center">
              {email}
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={goToStudent}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Register as Student
            </button>
            <button
              onClick={goToClub}
              className="w-full border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-semibold py-2.5 rounded-lg transition text-sm"
            >
              Register as Club
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-xs text-gray-400 hover:text-blue-600 mt-4 transition"
          >
            Back to login
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} University of Sri Jayewardenepura
      </p>
    </div>
  );
}
