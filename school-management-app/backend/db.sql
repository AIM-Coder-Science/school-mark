-- Création de la base de données
CREATE DATABASE IF NOT EXISTS school_management;
USE school_management;

-- Table des utilisateurs (base commune)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des administrateurs
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des enseignants
CREATE TABLE teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    photo VARCHAR(255),
    phone VARCHAR(20),
    specialties TEXT, -- JSON ou texte séparé par virgules
    score INT DEFAULT 0,
    created_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- Table des classes
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    teacher_principal_id INT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_principal_id) REFERENCES teachers(id),
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- Table des matières
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    coefficient INT DEFAULT 1,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- Table de relation enseignants-classes-matières
CREATE TABLE teacher_class_subject (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    UNIQUE KEY unique_assignment (teacher_id, class_id, subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Table des apprenants
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    photo VARCHAR(255),
    birth_date DATE,
    class_id INT,
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    created_by INT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES admins(id)
);

-- Table des notes
CREATE TABLE grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    exam_type ENUM('interro', 'devoir', 'composition') NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 20.00,
    coefficient DECIMAL(3,2) DEFAULT 1.00,
    semester INT DEFAULT 1,
    academic_year YEAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_student_subject (student_id, subject_id, semester, academic_year)
);

-- Table des publications
CREATE TABLE publications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    author_role ENUM('admin', 'teacher') NOT NULL,
    target_roles JSON, -- ['teacher', 'student'] ou ['teacher'] etc.
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Table historique (bulletins, emplois du temps)
CREATE TABLE history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    class_id INT,
    document_type ENUM('bulletin', 'emploi_temps', 'info'),
    file_path VARCHAR(500) NOT NULL,
    semester INT,
    academic_year YEAR,
    generated_by INT, -- admin ou teacher principal
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Table des moyennes
CREATE TABLE averages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT,
    semester INT NOT NULL,
    academic_year YEAR NOT NULL,
    average DECIMAL(5,2),
    general_average DECIMAL(5,2),
    rank_in_class INT,
    appreciation TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student_subject_semester (student_id, subject_id, semester, academic_year),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Insertion d'un admin par défaut
INSERT INTO users (email, password, role) 
VALUES ('admin@school.com', '$2a$10$YourHashedPasswordHere', 'admin');

INSERT INTO admins (user_id, first_name, last_name) 
VALUES (1, 'Admin', 'Principal');