const validator = require('validator');

function validateEmail(email) {
  return typeof email === 'string' && validator.isEmail(email.trim());
}

function validateRequiredFields(fields = {}) {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${key} is required.`;
    }
  }
  return null;
}

module.exports = {
  validateEmail,
  validateRequiredFields
};
