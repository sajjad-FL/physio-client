import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { firebaseAuth } from '../firebase';

let recaptchaVerifier = null;

/**
 * Call once per OTP send attempt. Pass the id of a <div> in your DOM
 * where the invisible reCAPTCHA can anchor (e.g. "recaptcha-container").
 * Returns the confirmationResult.
 */
export async function sendFirebaseOtp(phoneE164, recaptchaContainerId = 'recaptcha-container') {
  // Reset any previous verifier
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, recaptchaContainerId, {
    size: 'invisible',
  });
  const confirmation = await signInWithPhoneNumber(firebaseAuth, phoneE164, recaptchaVerifier);
  return confirmation;
}

/**
 * Confirm the OTP the user typed. Returns the Firebase idToken string.
 */
export async function confirmFirebaseOtp(confirmation, otp) {
  const result = await confirmation.confirm(otp);
  const idToken = await result.user.getIdToken();
  return idToken;
}

export function toE164India(phone) {
  return '+91' + String(phone).replace(/\D/g, '').slice(-10);
}

/**
 * Translates Firebase Auth errors to user-friendly messages.
 */
export function friendlyFirebaseError(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-verification-code') return 'Incorrect OTP. Please try again.';
  if (code === 'auth/code-expired') return 'OTP expired. Request a new one.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment.';
  if (code === 'auth/invalid-phone-number') return 'Invalid phone number format.';
  if (code === 'auth/session-expired') return 'Session expired. Request a new OTP.';
  return err?.message || 'Something went wrong. Please try again.';
}
