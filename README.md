# Nilambur Films – Movie Theatre Booking

Single-page style movie-ticketing experience with an admin back office. Built for quick demos and interview prep: vanilla HTML/CSS/JS on the client, PHP 8 + MySQL on the backend, and Razorpay for payments.

## What’s Included
- Landing site with movies, experiences, contact, and ticket view (`public/`).
- Auth flow with email/OTP + local sessions (`public/api/register.php`, `login.php`, `verify_otp.php`, `logout.php`).
- Seat selection, booking, payment capture, and ticket display (`booking`, `bookings`, `ticket`, `payments` modules).
- Admin dashboard for movies, screens, showtimes, users, and bookings management (`public/admin/`).
- Asset uploads (Cloudinary-ready) and email notifications (PHPMailer wiring in `public/api/phpmailer/` + `email_config.php`).

## Tech Stack
- Frontend: HTML5, CSS3, vanilla JS (no framework), responsive helpers in `shared/`.
- Backend: PHP 8, MySQL (mysqli), sessions.
- Payments: Razorpay (test keys prefilled in `public/api/config.php`).
- Media: Cloudinary hook in `public/api/cloudinary_config.php`.
- Mail: PHPMailer (`public/api/phpmailer/`).

## Project Structure
- `public/index.html` – landing and navigation shell.
- `public/**/` – page-specific HTML/CSS/JS (movies, booking, payments, profile, etc.).
- `public/admin/` – admin UI (HTML/CSS/JS).
- `public/api/` – PHP endpoints for auth, movies, screens, showtimes, bookings, payments, uploads, OTP.
- `public/api/database_setup.sql` – schema + seed data.
- `public/asset/` – static images and uploaded posters (for local dev).

## Local Setup (XAMPP-friendly)
1) Prereqs: PHP 8, MySQL, Apache (XAMPP is fine), Node not required.  
2) Clone/copy into your web root (e.g., `C:\xampp\htdocs\Movie-theatre`).  
3) Database:
   - Easiest: start MySQL, then hit any API; `public/api/db.php` will auto-create the `nilambur_films` DB and core tables.
   - Alternative: import `public/api/database_setup.sql` via phpMyAdmin/MySQL CLI.
4) Configure `public/api/config.php`:
   - Set `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`.
   - Replace Razorpay keys; toggle `session.cookie_secure` to `1` when using HTTPS.
   - Update `ALLOWED_ORIGINS` with your domain.
5) (Optional) Email/Media:
   - `public/api/email_config.php` for SMTP.
   - `public/api/cloudinary_config.php` for poster uploads.
6) Run: start Apache + MySQL, open `http://localhost/Movie-theatre/public/`.

## Key Flows
- User: register → OTP verify → login → browse movies → pick showtime → seat selection → pay via Razorpay → get ticket + booking history.
- Admin: login → CRUD movies/screens/showtimes → monitor bookings/payments → manage users/posters.

## Database Snapshot
Core tables: `users`, `screens`, `movies`, `showtimes`, `bookings`, `payments` (JSON seat blobs, status fields, price tiers). Indexes on movie status, showtime date, bookings by user, payment status. Seeds add 4 default screens.

## Notes for Interviews
- Strengths: clean separation of PHP APIs and static frontend; zero-build frontend; DB auto-bootstrap for demos.  
- Discuss: payment callback hardening, input validation, CSRF, HTTPS cookies, production-ready CORS, and rotating secrets.  
- Possible extensions: role-based auth, analytics on bookings, unit/integration tests, CI linting/formatting, and Dockerized local stack.

## Useful Paths
- User pages: `public/movies/movies.html`, `public/booking/booking.html`, `public/payments/payments.html`, `public/bookings/bookings.html`.
- Admin: `public/admin/admin.html` + `public/admin/admin.js`.
- APIs: `public/api/*.php` (auth, movies, showtimes, booking, payments, uploads).

## Running Tests
No automated tests are included; exercise flows manually in the browser. For interviews, call out how you would add PHPUnit for APIs and Playwright/Cypress for UI.

