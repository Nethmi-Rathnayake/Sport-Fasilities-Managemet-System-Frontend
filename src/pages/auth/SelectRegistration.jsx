import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/usjp-logo__1_-removebg-preview.png";
import AuthShell from "../../components/auth/AuthShell";

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
    <AuthShell>
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl p-12 w-full">
          {/* USJ Branding */}
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

          <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
            Register as Student or Club?
          </h2>
          {email && (
            <p className="text-lg font-semibold text-blue-700 mb-3 text-center">
              {email}
            </p>
          )}
          <div className="flex flex-col gap-5 mt-8">
            <button
              onClick={goToStudent}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-5 rounded-xl transition text-lg"
            >
              Register as Student
            </button>
            <button
              onClick={goToClub}
              className="w-full border-2 border-blue-700 text-blue-700 hover:bg-blue-50 font-semibold py-5 rounded-xl transition text-lg"
            >
              Register as Club
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-base text-gray-500 hover:text-blue-600 mt-8 transition"
          >
            Back to login
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-8">
        © {new Date().getFullYear()} University of Sri Jayewardenepura
      </p>
    </AuthShell>
  );
}
