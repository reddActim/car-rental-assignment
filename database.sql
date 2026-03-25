-- Create database
CREATE DATABASE IF NOT EXISTS car_rental;
USE car_rental;

-- --------------------
-- Users Table
-- --------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('CUSTOMER','AGENCY') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------
-- Cars Table
-- --------------------
CREATE TABLE cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agency_id INT NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  seating_capacity INT NOT NULL,
  rent_per_day DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------
-- Bookings Table
-- --------------------
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_id INT NOT NULL,
  customer_id INT NOT NULL,
  start_date DATE NOT NULL,
  number_of_days INT NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);