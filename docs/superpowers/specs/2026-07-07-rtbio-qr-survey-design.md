# RTBIO QR Survey and Redemption Design

## Goal

Build a QR-based event web app for RTBIO. Visitors scan a printed QR code, enter lead information, complete a 10-question survey, receive a completion code, and show that code to staff to redeem a product.

## Users

- Visitor: completes the lead form and survey on a mobile device.
- Staff: searches a completion code and marks product redemption complete.
- Admin: reviews all leads, survey answers, and redemption status, then exports CSV.

## MVP Flow

1. Visitor opens the event page from the printed QR URL.
2. Visitor agrees to privacy collection terms.
3. Visitor enters name, company, title, phone, and email.
4. Visitor answers 10 survey questions.
5. App generates a unique completion code.
6. Visitor shows the completion code to staff.
7. Staff searches the code and marks product redemption complete.
8. Admin reviews lead and redemption data and downloads CSV.

## Data Model

### Participant

- id
- name
- company
- title
- phone
- email
- privacyAgreed
- completionCode
- createdAt
- answers
- redemptionStatus
- redeemedAt
- redeemedBy

## Duplicate Policy

Survey submission can warn on duplicate phone or email. Product redemption must block already redeemed completion codes.

## MVP Technical Approach

The first implementation is a static browser app using localStorage so it can be run immediately in Cursor without installing dependencies. The app is structured so the data layer can later be replaced with Supabase.

## Future Production Upgrade

- Replace localStorage with Supabase tables.
- Add staff/admin authentication.
- Deploy with Vercel.
- Generate the printed QR from the deployed visitor URL.
