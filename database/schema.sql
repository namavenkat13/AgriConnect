-- AgriConnect Database Schema (MySQL Compatible)
-- Created for Farmer Procurement Management Platform

-- 1. USERS (farmers + admins/staff)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_hint VARCHAR(255),
    role ENUM('farmer', 'staff', 'admin') DEFAULT 'farmer',
    village VARCHAR(100),
    id_proof_number VARCHAR(50),
    centre_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FARMER CROPS (what each farmer grows)
CREATE TABLE IF NOT EXISTS farmer_crops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    crop_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. PROCUREMENT CENTRES
CREATE TABLE IF NOT EXISTS procurement_centres (
    centre_id INT AUTO_INCREMENT PRIMARY KEY,
    centre_name VARCHAR(120) NOT NULL,
    state VARCHAR(60) NOT NULL,
    city VARCHAR(60) NOT NULL,
    location VARCHAR(150),
    daily_capacity INT DEFAULT 60,
    opening_time TIME DEFAULT '08:00:00',
    closing_time TIME DEFAULT '17:00:00'
);

-- 4. CROP RATES (drives the live stock-style ticker)
CREATE TABLE IF NOT EXISTS crop_rates (
    rate_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(50) NOT NULL,
    price_per_quintal DECIMAL(10,2) NOT NULL,
    previous_price DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3b. CENTRE STAFF (Mandi Admins & Mandi Members)
CREATE TABLE IF NOT EXISTS centre_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    centre_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    password_hint VARCHAR(255),
    role ENUM('mandi_admin','mandi_member') DEFAULT 'mandi_member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id)
);

-- 3c. SLOTS (Hourly Capacity and Occupancy Management)
CREATE TABLE IF NOT EXISTS slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    centre_id INT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_bookings INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id)
);

-- 4. CROP RATES (drives the live stock-style ticker)
CREATE TABLE IF NOT EXISTS crop_rates (
    rate_id INT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(50) NOT NULL,
    price_per_quintal DECIMAL(10,2) NOT NULL,
    previous_price DECIMAL(10,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. SLOT BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NULL,
    centre_id INT NOT NULL,
    slot_id INT NULL,
    crop_name VARCHAR(50) NOT NULL,
    estimated_quantity_kg DECIMAL(10,2),
    slot_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    queue_number INT,
    channel ENUM('online','offline') DEFAULT 'online',
    approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    booking_status ENUM('booked','in_queue','completed','cancelled') DEFAULT 'booked',
    procurement_status ENUM('pending','weighed','graded','accepted','rejected') DEFAULT 'pending',
    payment_status ENUM('pending','processing','paid') DEFAULT 'pending',
    registered_by_staff_id INT NULL,
    walkin_name VARCHAR(100) NULL,
    walkin_phone VARCHAR(15) NULL,
    final_quantity_kg DECIMAL(10,2),
    final_amount DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id),
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id),
    FOREIGN KEY (slot_id) REFERENCES slots(slot_id),
    FOREIGN KEY (registered_by_staff_id) REFERENCES centre_staff(id)
);

-- 5b. PROCUREMENT RECORDS (Detailed Quality Grading & Weighed Harvest)
CREATE TABLE IF NOT EXISTS procurement_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    actual_quantity_kg DECIMAL(10,2) NOT NULL,
    quality_grade VARCHAR(20) NOT NULL,
    agreed_price_per_unit DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(12,2) NOT NULL,
    adjustment_reason VARCHAR(255),
    recorded_by_staff_id INT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- 5c. PAYMENTS (Disbursement & Settlement Records)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    payment_status ENUM('pending','processing','paid') DEFAULT 'paid',
    transaction_ref VARCHAR(100),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- 5d. RECEIPTS (Stored Base64 PNG Procurement Certificates)
CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_data LONGTEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- 6. LIVE QUEUE STATE (one active row per centre per day)
CREATE TABLE IF NOT EXISTS queue_status (
    queue_id INT AUTO_INCREMENT PRIMARY KEY,
    centre_id INT NOT NULL,
    slot_date DATE NOT NULL,
    now_serving_number INT DEFAULT 0,
    FOREIGN KEY (centre_id) REFERENCES procurement_centres(centre_id)
);

-- 7. NOTIFICATIONS LOG
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NULL,
    booking_id INT,
    message TEXT NOT NULL,
    channel ENUM('sms','app') DEFAULT 'app',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- SEED DATA: Procurement Centres (5 Centres)
INSERT INTO procurement_centres (centre_id, centre_name, location, daily_capacity, opening_time, closing_time) VALUES
(1, 'Nashik APMC Mandi (District Hub)', 'Panchavati, Nashik, Maharashtra', 60, '08:00:00', '17:00:00'),
(2, 'Pune Grain Procurement Centre', 'Gultekdi Market Yard, Pune, Maharashtra', 50, '08:30:00', '17:30:00'),
(3, 'Nagpur Cotton & Grain Terminal', 'Kalamna Market, Nagpur, Maharashtra', 75, '08:00:00', '18:00:00'),
(4, 'Kolhapur Agro Mandi Centre', 'Shahupuri, Kolhapur, Maharashtra', 45, '08:00:00', '16:30:00'),
(5, 'Amravati Regional Procurement Centre', 'Cotton Market Yard, Amravati, Maharashtra', 55, '08:30:00', '17:00:00')
ON DUPLICATE KEY UPDATE centre_name=VALUES(centre_name);

-- SEED DATA: Crop Rates (30 Benchmark Mandi Crops for Stock Ticker)
INSERT INTO crop_rates (rate_id, crop_name, price_per_quintal, previous_price) VALUES
(1, 'Wheat (Sharbati)', 2450.00, 2410.00),
(2, 'Paddy (Basmati)', 3850.00, 3900.00),
(3, 'Tomato (Hybrid)', 1850.00, 1720.00),
(4, 'Onion (Red Nashik)', 2200.00, 2280.00),
(5, 'Potato (Jyoti)', 1650.00, 1600.00),
(6, 'Cotton (Medium Staple)', 7120.00, 7050.00),
(7, 'Soybean (Yellow)', 4680.00, 4720.00),
(8, 'Maize (Kharif)', 2150.00, 2100.00),
(9, 'Mustard (Black)', 5450.00, 5380.00),
(10, 'Green Gram (Moong)', 8550.00, 8620.00),
(11, 'Sugarcane', 350.00, 340.00),
(12, 'Red Chilli (Guntur)', 18500.00, 18200.00),
(13, 'Gram (Chana / Chickpea)', 5600.00, 5520.00),
(14, 'Tur Dal (Arhar / Pigeon Pea)', 7400.00, 7350.00),
(15, 'Groundnut (Peanut)', 6450.00, 6380.00),
(16, 'Turmeric (Haldi)', 13800.00, 14100.00),
(17, 'Cumin Seeds (Jeera)', 28500.00, 28900.00),
(18, 'Banana (Robusta)', 2100.00, 2050.00),
(19, 'Apple (Royal Delicious)', 7800.00, 7650.00),
(20, 'Mango (Alphonso / Kesar)', 6500.00, 6400.00),
(21, 'Jute (Raw Jute)', 5050.00, 4980.00),
(22, 'Tea (Assam Green Leaf)', 4200.00, 4150.00),
(23, 'Arecanut (Supari)', 38000.00, 37500.00),
(24, 'Coffee (Arabica / Robusta)', 22000.00, 21800.00),
(25, 'Garlic (Lahsun)', 11500.00, 11200.00),
(26, 'Ginger (Adrak)', 8200.00, 8350.00),
(27, 'Barley (Jau)', 1950.00, 1920.00),
(28, 'Jowar (Sorghum)', 3200.00, 3180.00),
(29, 'Bajra (Pearl Millet)', 2550.00, 2500.00),
(30, 'Litchi (Shahi)', 4800.00, 4650.00)
ON DUPLICATE KEY UPDATE price_per_quintal=VALUES(price_per_quintal);

-- SEED DATA: Default Admin/Staff and Farmer users
INSERT INTO users (user_id, full_name, phone_number, password_hash, role, village, id_proof_number) VALUES
(1, 'Mandi Officer Rajesh Sharma', '9999999999', '$2a$10$XxhGih/x7H.LOMIZ4IA4QOKWtn49HwhgbpNJuUw0LIu7g.k9gXgey', 'staff', 'Central Mandi Complex', 'OFFICER-MH-8821'),
(2, 'Ramesh Kumar Patil', '9876543210', '$2a$10$gehYsdOeHuhy1jNokpSYgOXiYr9bAGjVP0iXa9/G4bybk47zViTaW', 'farmer', 'Dindori, Nashik', 'AADHAAR-8921-4412-9018')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- SEED DATA: Farmer registered crops
INSERT INTO farmer_crops (id, farmer_id, crop_name) VALUES
(1, 2, 'Tomato (Hybrid)'),
(2, 2, 'Onion (Red Nashik)'),
(3, 2, 'Wheat (Sharbati)')
ON DUPLICATE KEY UPDATE crop_name=VALUES(crop_name);
