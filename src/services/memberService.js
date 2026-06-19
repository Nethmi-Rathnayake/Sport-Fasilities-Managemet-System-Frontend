import api from "./api";

// Member data layer — wraps the existing backend endpoints
// (see SFMIS-Backend/routes/web.php). The show endpoint wraps its single
// result in an outer array ([[ … ]]); it is unwrapped here so callers get a
// plain object.

// GET /api/members/{id} → full member record (+ registration process rows).
export const getMember = (id) =>
  api.get(`/api/members/${id}`).then((r) => (Array.isArray(r.data) ? r.data[0] : r.data));

// Returns true if a member account exists for this exact email. Used by the
// login page to decide — BEFORE sending an OTP — whether the person is
// registered. There is no dedicated "exists" endpoint, so we reuse the members
// search (LIKE match) and confirm an exact, case-insensitive email match so a
// partial hit (e.g. "a@b.com" inside "xa@b.com") can't be a false positive.
export const isEmailRegistered = (email) => {
  const target = String(email || "").trim().toLowerCase();
  if (!target) return Promise.resolve(false);
  return api
    .get(`/api/members`, { params: { search: target } })
    .then((r) => (Array.isArray(r.data) ? r.data : []))
    .then((members) => members.some((m) => String(m.email || "").toLowerCase() === target));
};
