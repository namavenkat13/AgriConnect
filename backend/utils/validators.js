// backend/utils/validators.js
// Validation helpers for legitimate phone numbers and 12-digit Aadhaar numbers

function validatePhoneNumber(phoneNumber, allowDemo = false) {
  if (!phoneNumber) {
    return { valid: false, message: 'Phone number is required.' };
  }

  let clean = String(phoneNumber).trim().replace(/[^0-9]/g, '');

  if (clean.length === 12 && clean.startsWith('91')) {
    clean = clean.substring(2);
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  if (clean.length !== 10) {
    return {
      valid: false,
      message: 'Please provide a valid 10-digit mobile number. Given: ' + clean.length + ' digits.'
    };
  }

  if (!/^[6-9]/.test(clean)) {
    return {
      valid: false,
      message: 'Invalid mobile number. Mobile numbers must start with 6, 7, 8, or 9. Numbers starting with 0 or 1 (like 0000000000, 1000000000) are not allowed.'
    };
  }

  // Reject all identical repeating digits
  if (/^(\d)\1{9}$/.test(clean)) {
    return {
      valid: false,
      message: 'Dummy phone numbers with repeated digits are not allowed.'
    };
  }

  const dummyList = ['1234567890', '0123456789', '9898989898', '9090909090', '8989898989', '7878787878'];
  if (!allowDemo) {
    dummyList.push('9876543210');
  }

  if (dummyList.includes(clean)) {
    return {
      valid: false,
      message: 'Dummy or test phone numbers are not allowed. Please provide a legitimate mobile number.'
    };
  }

  return { valid: true, cleanPhone: clean };
}

function validateAadhaarNumber(aadhaarNumber, required = true) {
  if (!aadhaarNumber || !String(aadhaarNumber).trim()) {
    if (required) {
      return { valid: false, message: 'Aadhaar number is required and must consist of 12 digits.' };
    }
    return { valid: true, cleanAadhaar: null };
  }

  const clean = String(aadhaarNumber).trim().replace(/[^0-9]/g, '');

  if (clean.length !== 12) {
    return {
      valid: false,
      message: 'Aadhaar number must consist of exactly 12 digits. Provided: ' + clean.length + ' digits.'
    };
  }

  if (!/^[2-9]/.test(clean)) {
    return {
      valid: false,
      message: 'Invalid Aadhaar number. Aadhaar numbers cannot start with 0 or 1. Dummy numbers are not allowed.'
    };
  }

  if (/^(\d)\1{11}$/.test(clean)) {
    return {
      valid: false,
      message: 'Invalid Aadhaar number. All digits cannot be identical.'
    };
  }

  const dummySequences = ['123456789012', '234567890123', '987654321098'];
  if (dummySequences.includes(clean)) {
    return {
      valid: false,
      message: 'Dummy Aadhaar numbers are not allowed. Please enter your valid 12-digit Aadhaar number.'
    };
  }

  return { valid: true, cleanAadhaar: clean };
}

module.exports = {
  validatePhoneNumber,
  validateAadhaarNumber
};
