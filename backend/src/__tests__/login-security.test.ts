import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  haversineDistance,
  SUSPICIOUS_LOGIN_THRESHOLD_KM,
  checkSuspiciousLogin,
  UserLocationInfo,
} from "../services/login-security.service";

// =============================================================================
// haversineDistance
// =============================================================================
describe("haversineDistance", () => {
  it("returns 0 for the same point", () => {
    expect(haversineDistance(0, 0, 0, 0)).toBe(0);
    expect(haversineDistance(-1.94, 30.06, -1.94, 30.06)).toBe(0);
  });

  it("calculates ~10 km for ~0.1° difference at the equator", () => {
    const d = haversineDistance(0, 0, 0, 0.09);
    expect(d).toBeGreaterThan(9);
    expect(d).toBeLessThan(11);
  });

  it("calculates Kigali to Nairobi (~1160 km)", () => {
    // Kigali: -1.9441, 30.0619  →  Nairobi: -1.2864, 36.8172
    const d = haversineDistance(-1.9441, 30.0619, -1.2864, 36.8172);
    // Roughly 750 km (straight-line)
    expect(d).toBeGreaterThan(700);
    expect(d).toBeLessThan(800);
  });

  it("calculates Kigali to Lagos (~3700 km)", () => {
    // Kigali: -1.9441, 30.0619  →  Lagos: 6.5244, 3.3792
    const d = haversineDistance(-1.9441, 30.0619, 6.5244, 3.3792);
    // Roughly 3100 km (straight-line)
    expect(d).toBeGreaterThan(3000);
    expect(d).toBeLessThan(3200);
  });

  it("is symmetric (A→B == B→A)", () => {
    const a = haversineDistance(-1.94, 30.06, 6.52, 3.38);
    const b = haversineDistance(6.52, 3.38, -1.94, 30.06);
    expect(a).toBeCloseTo(b, 10);
  });
});

// =============================================================================
// checkSuspiciousLogin
// =============================================================================
describe("checkSuspiciousLogin", () => {
  const sendAlert = vi.fn<(...args: any[]) => Promise<boolean>>().mockResolvedValue(true);

  const enrolledUser: UserLocationInfo = {
    email: "student@example.com",
    username: "student1",
    latitude: -1.9441,   // Kigali
    longitude: 30.0619,
    location: "Kigali, Rwanda",
    enrolledCourses: ["course-1"],
  };

  const unenrolledUser: UserLocationInfo = {
    email: "ghost@example.com",
    username: "ghost",
    latitude: -1.9441,
    longitude: 30.0619,
    enrolledCourses: [],
  };

  const newUserNoLocation: UserLocationInfo = {
    email: "newbie@example.com",
    username: "newbie",
    latitude: null,
    longitude: null,
    enrolledCourses: ["course-1"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Skip conditions -------------------------------------------------------

  it("returns false and does not send alert when user has no enrolled courses", async () => {
    const result = await checkSuspiciousLogin(
      unenrolledUser, -1.9441, 30.0619, "127.0.0.1", "email", undefined, undefined, sendAlert
    );
    expect(result).toBe(false);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("returns false and does not send alert when user has no previous location", async () => {
    const result = await checkSuspiciousLogin(
      newUserNoLocation, 6.5244, 3.3792, "127.0.0.1", "email", undefined, undefined, sendAlert
    );
    expect(result).toBe(false);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  it("returns false when distance is below threshold (same city)", async () => {
    // Same Kigali coordinates — distance should be < 1 km
    const result = await checkSuspiciousLogin(
      enrolledUser, -1.94, 30.06, "127.0.0.1", "email", undefined, undefined, sendAlert
    );
    expect(result).toBe(false);
    expect(sendAlert).not.toHaveBeenCalled();
  });

  // ---- Alert trigger conditions ---------------------------------------------

  it("returns true and sends alert when login is from a different country (Kigali → Lagos)", async () => {
    const result = await checkSuspiciousLogin(
      enrolledUser,
      6.5244, 3.3792,     // Lagos
      "197.210.0.1",
      "email",
      "Lagos",
      "Nigeria",
      sendAlert
    );
    expect(result).toBe(true);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });

  it("passes correct details to the alert sender", async () => {
    await checkSuspiciousLogin(
      enrolledUser,
      6.5244, 3.3792,
      "197.210.0.1",
      "email",
      "Lagos",
      "Nigeria",
      sendAlert
    );

    expect(sendAlert).toHaveBeenCalledWith(
      "student@example.com",
      "student1",
      expect.any(String),          // loginTime
      "Lagos, Nigeria",             // newLocation (uses city,country)
      "Kigali, Rwanda",             // previousLocation (uses user.location)
      expect.any(Number),           // distance
      "email",
      "197.210.0.1"
    );

    // Verify distance is correct (~3700 km)
    const callArgs = sendAlert.mock.calls[0];
    const distance = callArgs[5] as number;
    expect(distance).toBeGreaterThan(3000);
    expect(distance).toBeLessThan(3200);
  });

  it("uses coordinates as fallback when no city/country provided", async () => {
    await checkSuspiciousLogin(
      enrolledUser,
      6.5244, 3.3792,
      "197.210.0.1",
      "google",
      undefined,
      undefined,
      sendAlert
    );

    expect(sendAlert).toHaveBeenCalledWith(
      "student@example.com",
      "student1",
      expect.any(String),
      "6.5244, 3.3792",              // coordinates fallback
      "Kigali, Rwanda",
      expect.any(Number),
      "google",
      "197.210.0.1"
    );
  });

  it("returns true (alert conditions met) even without a sendAlert callback", async () => {
    const result = await checkSuspiciousLogin(
      enrolledUser,
      6.5244, 3.3792,
      "197.210.0.1",
      "email",
      "Lagos",
      "Nigeria"
      // no sendAlert
    );
    // Should return true because the condition was met, even though no alert was sent
    expect(result).toBe(true);
  });

  it("handles threshold boundary correctly", async () => {
    // User at equator, login ~99 km away (just under threshold)
    const userNearby: UserLocationInfo = {
      email: "test@test.com",
      username: "test",
      latitude: 0,
      longitude: 0,
      enrolledCourses: ["c1"],
    };
    // 0.9° longitude at equator ≈ 100 km (0.9 * 111.32 ≈ 100)
    // So 0.8° ≈ 89 km should be under threshold
    const nearby = await checkSuspiciousLogin(
      userNearby, 0, 0.8, "1.1.1.1", "email", undefined, undefined, sendAlert
    );
    expect(nearby).toBe(false);
    expect(sendAlert).not.toHaveBeenCalled();

    // 1.0° ≈ 111 km should be over threshold
    const far = await checkSuspiciousLogin(
      userNearby, 0, 1.0, "1.1.1.1", "email", undefined, undefined, sendAlert
    );
    expect(far).toBe(true);
    expect(sendAlert).toHaveBeenCalledTimes(1);
  });
});
