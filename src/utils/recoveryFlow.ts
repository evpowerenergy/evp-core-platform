const RECOVERY_FLOW_LOCK_KEY = "auth_recovery_flow_locked";
const RECOVERY_FLOW_EVENT = "recovery-flow-changed";

export const isRecoveryTypeInUrl = () => {
  if (typeof window === "undefined") return false;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get("type") === "recovery" || hashParams.get("type") === "recovery";
};

export const lockRecoveryFlow = () => {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECOVERY_FLOW_LOCK_KEY, "1");
  window.dispatchEvent(new Event(RECOVERY_FLOW_EVENT));
};

export const unlockRecoveryFlow = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RECOVERY_FLOW_LOCK_KEY);
  window.dispatchEvent(new Event(RECOVERY_FLOW_EVENT));
};

export const isRecoveryFlowLocked = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(RECOVERY_FLOW_LOCK_KEY) === "1";
};

export const getRecoveryFlowLockKey = () => RECOVERY_FLOW_LOCK_KEY;
export const getRecoveryFlowEventName = () => RECOVERY_FLOW_EVENT;
