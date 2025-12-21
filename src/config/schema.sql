CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') DEFAULT 'student',
  school VARCHAR(255),
  affiliate_school VARCHAR(255),
  profile_picture VARCHAR(255),
  whatsapp_link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  fee DECIMAL(10,2) DEFAULT 0,
  whatsapp_link VARCHAR(255),
  status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
  thumbnail VARCHAR(255),
  start_date DATE,
  end_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  competition_id INT NOT NULL,
  media_path VARCHAR(255),
  notes TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS winners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  competition_id INT,
  student_name VARCHAR(120),
  school VARCHAR(255),
  media_path VARCHAR(255),
  highlight_text VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY CHECK (id = 1),
  logo_path VARCHAR(255),
  affiliate_text TEXT,
  about_content TEXT,
  features JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO site_settings (id, features)
VALUES (1, JSON_OBJECT('futureFeatureEnabled', true))
ON DUPLICATE KEY UPDATE id = id;

CREATE TABLE IF NOT EXISTS password_resets (
  user_id INT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(120) NOT NULL,
  payment_id VARCHAR(120),
  signature VARCHAR(255),
  student_id INT NOT NULL,
  competition_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('created', 'paid', 'failed') DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);
