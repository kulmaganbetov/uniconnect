CREATE TABLE dormitories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    address TEXT,
    total_rooms INT,
    available_rooms INT,
    price_per_month DECIMAL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
