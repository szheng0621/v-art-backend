🎨 V-Art Backend API
The V-Art Backend API is a RESTful service that powers the V-Art platform—allowing users to explore, search, and curate exhibitions from a combined collection of visual artworks. It delivers a rich, interactive experience through paginated and filterable data sourced from renowned museum APIs.

🚀 Features
🖼️ Artworks Exploration
Fetch artwork details including title, artist, date of creation, location, and dimensions.

Filter artworks by collection, title, or location.

View detailed information for individual artworks.

🧑‍🎨 User-Curated Exhibitions
Users can create and manage personal exhibitions.

Add or remove artworks to/from exhibitions.

View curated exhibitions organized by the user.

🌐 External API Integration
Artworks are sourced from:

Rijksmuseum API

Europeana API

For MVP purposes, a subset of 26 artworks (including 6 mock entries) is used.

🛠️ Tech Stack
Node.js & Express – Backend and routing

PostgreSQL – Relational database

JavaScript – Application logic

MVC Architecture – For separation of concerns

.env – Secure storage for API keys and credentials

TDD (Test-Driven Development) – Ensures reliability and maintainability

🌍 Deployment
Backend: Hosted on Render

Database: Managed via Supabase

✅ Getting Started
Clone the repository
git clone https://github.com/szheng0621/v-art-backend
cd v-art-backend-app-directory-here

Install dependencies: npm install

Create a .env file with required keys (API keys, DB credentials)

Run dev server: npm run dev

Run tests: npm test

