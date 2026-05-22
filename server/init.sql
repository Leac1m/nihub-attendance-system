-- Initialize nihub database schema

-- Create tables
CREATE TABLE IF NOT EXISTS courses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_pin VARCHAR(10),
    verification_pin_expires_at TIMESTAMPTZ
);

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS verification_pin VARCHAR(10);

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS verification_pin_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS registrants (
    id VARCHAR(20) PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    matriculation_number VARCHAR(20) NOT NULL,
    image_url VARCHAR(255),
    CONSTRAINT fk_course FOREIGN KEY (course_code) REFERENCES courses(code) ON DELETE CASCADE,
    UNIQUE(course_code, email),
    UNIQUE(course_code, matriculation_number)
);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    registrant_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT true,
    CONSTRAINT fk_registrant FOREIGN KEY (registrant_id) REFERENCES registrants(id) ON DELETE CASCADE,
    UNIQUE(registrant_id, date)
);

-- Insert initial courses
INSERT INTO courses (code, name, description, duration) VALUES
    ('CS101', 'Computer Science', 'A course that covers the fundamentals of computer science, including programming, algorithms, and data structures.', '2 weeks'),
    ('DS201', 'Data Science', 'Learn to extract insights from complex data sets using statistical analysis and machine learning techniques.', '4 weeks'),
    ('SEC101', 'Cyber Security', 'Protect systems and networks from digital attacks, focusing on threat analysis and secure architecture.', '3 weeks'),
    ('UX301', 'UI/UX Design', 'Master the principles of user interface design and craft compelling user experiences for modern applications.', '4 weeks')
ON CONFLICT (code) DO NOTHING;

-- Insert initial staff
INSERT INTO staff (username, name, email, password) VALUES
    ('alice123', 'Alice Smith', 'alice.smith@example.com', 'password123'),
    ('admin', 'Admin Smith', 'admin@email.com', 'admin123')
ON CONFLICT (username) DO NOTHING;

UPDATE staff
SET is_verified = TRUE,
    verification_pin = NULL,
    verification_pin_expires_at = NULL
WHERE username IN ('alice123', 'admin');