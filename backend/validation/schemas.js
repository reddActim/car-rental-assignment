const Joi = require('joi');

// Register schema
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('CUSTOMER', 'AGENCY').required()
});

// Car schema
const carSchema = Joi.object({
  vehicle_model: Joi.string().max(100).required(),
  vehicle_number: Joi.string().max(50).required(),
  seating_capacity: Joi.number().integer().min(1).required(),
  rent_per_day: Joi.number().precision(2).positive().required()
});

// Booking schema
const bookingSchema = Joi.object({
  car_id: Joi.number().integer().required(),
  start_date: Joi.date().required(),
  number_of_days: Joi.number().integer().min(1).required()
});

module.exports = { registerSchema, carSchema, bookingSchema };
