
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'master',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (role = 'master')
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),

    birth_date DATE,
    gender VARCHAR(30),

    status VARCHAR(20) NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL REFERENCES patients(id),

    visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    weight NUMERIC(6,2),
    height NUMERIC(5,2),

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    patient_id UUID NOT NULL REFERENCES patients(id),

    scheduled_at TIMESTAMPTZ NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (
        status IN (
            'scheduled',
            'completed',
            'cancelled'
        )
    )
);

CREATE INDEX idx_patients_created
ON patients(created_at);

CREATE INDEX idx_patients_status
ON patients(status);

CREATE INDEX idx_visits_date
ON visits(visit_date);

CREATE INDEX idx_appointments_date
ON appointments(scheduled_at);
