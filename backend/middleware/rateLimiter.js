const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many OTP requests. Try again after 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: 'Too many payment attempts. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  otpLimiter,
  paymentLimiter
};
