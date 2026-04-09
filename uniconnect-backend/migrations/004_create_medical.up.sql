CREATE TABLE medical_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    type VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    working_hours VARCHAR(100),
    description TEXT,
    is_free BOOLEAN DEFAULT false
);

CREATE TABLE medical_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES medical_services(id) ON DELETE CASCADE,
    date DATE,
    time TIME,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
