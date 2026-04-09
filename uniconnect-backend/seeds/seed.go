package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	fmt.Println("Seeding database...")

	// Seed admin users
	adminPass, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)

	_, err = pool.Exec(ctx, `
		INSERT INTO users (id, name, email, password_hash, country, university, role) VALUES
		('a0000000-0000-0000-0000-000000000001', 'Admin Almaty', 'admin@uniconnect.kz', $1, 'Kazakhstan', 'Al-Farabi KazNU', 'admin'),
		('a0000000-0000-0000-0000-000000000002', 'Admin Astana', 'admin2@uniconnect.kz', $1, 'Kazakhstan', 'Nazarbayev University', 'admin')
		ON CONFLICT (email) DO NOTHING
	`, string(adminPass))
	if err != nil {
		log.Printf("Warning: failed to seed admin users: %v", err)
	} else {
		fmt.Println("  ✓ Admin users seeded")
	}

	// Seed dormitories
	_, err = pool.Exec(ctx, `
		INSERT INTO dormitories (id, name, address, total_rooms, available_rooms, price_per_month, description) VALUES
		('d0000000-0000-0000-0000-000000000001', 'KazNU Student House №1', '71 Al-Farabi Ave, Almaty', 200, 45, 25000, 'Modern dormitory near the main campus of Al-Farabi KazNU. Includes Wi-Fi, laundry, and a shared kitchen on each floor.'),
		('d0000000-0000-0000-0000-000000000002', 'SDU Residence Hall', '1/1 Abylai Khan St, Kaskelen', 150, 30, 35000, 'Comfortable residence hall at Suleyman Demirel University. Single and double rooms available with private bathrooms.'),
		('d0000000-0000-0000-0000-000000000003', 'KBTU Dormitory', '59 Tole Bi St, Almaty', 180, 20, 30000, 'Located in the city center near KBTU campus. Fully furnished rooms with 24/7 security and study rooms.')
		ON CONFLICT DO NOTHING
	`)
	if err != nil {
		log.Printf("Warning: failed to seed dormitories: %v", err)
	} else {
		fmt.Println("  ✓ Dormitories seeded")
	}

	// Seed medical services
	_, err = pool.Exec(ctx, `
		INSERT INTO medical_services (id, name, type, address, phone, working_hours, description, is_free) VALUES
		('m0000000-0000-0000-0000-000000000001', 'University Clinic KazNU', 'clinic', '71 Al-Farabi Ave, Almaty', '+7 727 377 3333', 'Mon-Fri 08:00-18:00', 'Free clinic for registered students of Al-Farabi KazNU. General practitioner, dentist, and therapist available.', true),
		('m0000000-0000-0000-0000-000000000002', 'City Polyclinic #4', 'clinic', '105 Abai Ave, Almaty', '+7 727 292 5050', 'Mon-Sat 08:00-20:00', 'Public polyclinic accepting foreign students with valid health insurance. Walk-in and appointments.', false),
		('m0000000-0000-0000-0000-000000000003', 'Interteach Hospital', 'hospital', '30 Baitursynov St, Almaty', '+7 727 258 0000', '24/7', 'Private hospital with English-speaking staff. Emergency department open 24/7. Insurance accepted.', false),
		('m0000000-0000-0000-0000-000000000004', 'Europharma', 'pharmacy', '150 Dostyk Ave, Almaty', '+7 727 311 1111', 'Daily 08:00-22:00', 'Large pharmacy chain with a wide selection of medications. Pharmacists can provide consultations.', false),
		('m0000000-0000-0000-0000-000000000005', 'Student Mental Health Center', 'clinic', '15 Masanchi St, Almaty', '+7 727 250 4040', 'Mon-Fri 09:00-17:00', 'Free psychological consultations and mental health support for international students.', true)
		ON CONFLICT DO NOTHING
	`)
	if err != nil {
		log.Printf("Warning: failed to seed medical services: %v", err)
	} else {
		fmt.Println("  ✓ Medical services seeded")
	}

	// Seed jobs
	_, err = pool.Exec(ctx, `
		INSERT INTO jobs (id, title, company, description, salary, schedule, location, requirements, contact_email) VALUES
		('j0000000-0000-0000-0000-000000000001', 'English Tutor', 'LinguaCenter Almaty', 'Teach English to children and teenagers. Native or near-native English speakers preferred.', '3000-5000 KZT/hour', 'Part-time, flexible', 'Almaty, Dostyk Ave', 'Fluent English, B2+ level. Teaching experience is a plus.', 'hr@linguacenter.kz'),
		('j0000000-0000-0000-0000-000000000002', 'Barista', 'CoffeeBox', 'Join our team as a barista at a popular coffee shop near KazNU campus.', '150000 KZT/month', 'Part-time, shifts', 'Almaty, Al-Farabi Ave', 'No experience needed. Training provided. Must speak basic Russian or Kazakh.', 'jobs@coffeebox.kz'),
		('j0000000-0000-0000-0000-000000000003', 'Junior Frontend Developer', 'TechStart KZ', 'Work on web applications using React. Remote-friendly position for students.', '200000-300000 KZT/month', 'Part-time, remote', 'Remote / Almaty', 'Knowledge of HTML, CSS, JavaScript, React. Git basics.', 'careers@techstart.kz'),
		('j0000000-0000-0000-0000-000000000004', 'Content Writer (English)', 'Digital Nomad Agency', 'Write blog posts and social media content in English for international clients.', '2000-4000 KZT/article', 'Freelance', 'Remote', 'Excellent written English. Portfolio of writing samples preferred.', 'write@dna.agency'),
		('j0000000-0000-0000-0000-000000000005', 'Campus Ambassador', 'Kaspi Bank', 'Promote Kaspi products and services among students at your university.', '100000 KZT/month', 'Part-time, flexible', 'Almaty / Astana', 'Active student. Good communication skills. Social media presence.', 'ambassador@kaspi.kz')
		ON CONFLICT DO NOTHING
	`)
	if err != nil {
		log.Printf("Warning: failed to seed jobs: %v", err)
	} else {
		fmt.Println("  ✓ Jobs seeded")
	}

	// Seed guides
	_, err = pool.Exec(ctx, `
		INSERT INTO guides (id, title, category, content) VALUES
		('g0000000-0000-0000-0000-000000000001', 'Getting Around Almaty: Public Transport Guide', 'transport',
		'## Public Transport in Almaty

### Metro
Almaty has a single metro line with 11 stations running from north to south. Fare: 80 KZT per ride.
- Operating hours: 06:15 - 23:30
- Buy tokens at any station or use an Onay card

### Buses
City buses cover all major routes. Fare: 150 KZT (cash) or 80 KZT (Onay card).
- Download the 2GIS app for real-time routes and schedules
- Most buses run from 06:00 to 23:00

### Onay Card
The Onay card is a reloadable transport card accepted on all public transport.
- Buy at metro stations, bus terminals, or Kazpost offices
- Top up at terminals, the Onay app, or Kaspi.kz
- Cost: 500 KZT for the card + balance

### Taxi
- Yandex Go and inDrive are the most popular taxi apps
- Always use app-based taxis for safety and fair pricing
- Average ride within the city: 500-1500 KZT'),

		('g0000000-0000-0000-0000-000000000002', 'Opening a Bank Account in Kazakhstan', 'banking',
		'## Banking for International Students

### Recommended Banks
1. **Kaspi Bank** - Most popular, excellent mobile app
2. **Halyk Bank** - Largest bank, good international transfers
3. **Forte Bank** - Student-friendly accounts

### Documents Needed
- Passport with valid visa
- IIN (Individual Identification Number)
- Student ID or enrollment letter
- Phone number registered in Kazakhstan

### Getting Your IIN
1. Visit any Public Service Center (CON)
2. Bring your passport and migration card
3. Processing takes 1-3 business days
4. Free of charge

### Kaspi Bank (Recommended)
1. Download the Kaspi.kz app
2. Visit any Kaspi branch with your passport and IIN
3. Account opening takes 15-30 minutes
4. You will receive a Kaspi Gold card (free)
5. The app supports English language

### Tips
- Kaspi QR payments are accepted almost everywhere
- Set up Kaspi transfers for easy money exchange between students
- International transfers available via SWIFT through Halyk Bank'),

		('g0000000-0000-0000-0000-000000000003', 'Getting a Mobile SIM Card in Kazakhstan', 'mobile',
		'## Mobile Operators in Kazakhstan

### Main Operators
1. **Kcell/Activ** - Best coverage nationwide
2. **Beeline** - Good urban coverage, affordable plans
3. **Tele2** - Budget-friendly option

### How to Get a SIM Card
1. Visit any operator''s office or store
2. Bring your passport
3. SIM cards are free or cost 500-1000 KZT
4. Prepaid plans start from 1000 KZT/month

### Recommended Plans for Students
- **Kcell "Bala"**: 15GB + unlimited social media, ~3000 KZT/month
- **Beeline "Hype 7"**: 20GB + 500 min, ~3500 KZT/month
- **Tele2 "My Online+"**: 25GB, ~2500 KZT/month

### Tips
- Register your SIM card within 15 days of purchase (required by law)
- Top up via Kaspi app or terminal
- Wi-Fi is available in most cafes, universities, and dormitories
- Download 2GIS, Yandex Go, and Kaspi.kz apps immediately')
		ON CONFLICT DO NOTHING
	`)
	if err != nil {
		log.Printf("Warning: failed to seed guides: %v", err)
	} else {
		fmt.Println("  ✓ Guides seeded")
	}

	fmt.Println("Seeding complete!")
}
