const SESSION_KEY = "rtbio-auth-role";

const PASSWORDS = {
  operator: "1111",
  staff: "1111",
  admin: "1111",
};

export function verifyPassword(role, password) {
  return PASSWORDS[role] === String(password ?? "");
}

export function canAccessRole(currentRole, requiredRole) {
  if (requiredRole !== "operator") {
    return currentRole === requiredRole;
  }

  return ["operator", "staff", "admin"].includes(currentRole);
}

export function getCurrentRole(storage = window.sessionStorage) {
  return storage.getItem(SESSION_KEY) || "";
}

export function signIn(role, password, storage = window.sessionStorage) {
  if (!verifyPassword(role, password)) {
    return false;
  }

  storage.setItem(SESSION_KEY, "operator");
  return true;
}

export function signOut(storage = window.sessionStorage) {
  storage.removeItem(SESSION_KEY);
}
