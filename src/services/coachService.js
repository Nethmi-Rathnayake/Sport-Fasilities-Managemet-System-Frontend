import api from "./api";

// Coach dashboard data layer — wraps the existing backend endpoints
// (see SFMIS-Backend/routes/web.php). Some endpoints wrap their single result
// in an outer array ([[ ... ]]); those are unwrapped here so callers get a
// plain object.

// GET /api/coaches/{coachId}/club-verification-requests → array of pending requests
export const getClubVerificationRequests = (coachId) =>
  api.get(`/api/coaches/${coachId}/club-verification-requests`).then((r) => r.data);

// POST /api/club-verification-requests/{memberId}/approve { coach_id }
export const approveClubRequest = (memberId, coachId) =>
  api
    .post(`/api/club-verification-requests/${memberId}/approve`, { coach_id: coachId })
    .then((r) => (Array.isArray(r.data) ? r.data[0] : r.data));

// POST /api/club-verification-requests/{memberId}/reject { coach_id }
export const rejectClubRequest = (memberId, coachId) =>
  api
    .post(`/api/club-verification-requests/${memberId}/reject`, { coach_id: coachId })
    .then((r) => (Array.isArray(r.data) ? r.data[0] : r.data));

// GET /api/members?club_id=… → array of club members
export const getClubMembers = (clubId) =>
  api.get(`/api/members`, { params: { club_id: clubId } }).then((r) => r.data);

// GET /api/facilities → array of facilities (with slot_count + booking_fee)
export const getFacilities = () => api.get(`/api/facilities`).then((r) => r.data);

// GET /api/facilities/{id}/availability?date=YYYY-MM-DD → availability object
// (the endpoint returns [[ {…} ]], so unwrap the first element).
export const getFacilityAvailability = (facilityId, date) =>
  api
    .get(`/api/facilities/${facilityId}/availability`, { params: { date } })
    .then((r) => (Array.isArray(r.data) ? r.data[0] : r.data));
