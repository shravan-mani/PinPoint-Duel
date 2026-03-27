# Pinpoint Duel

A multiplayer location discovery challenge game built with React, Vite, and the Google Maps API.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   - Copy `.env.example` to `.env`
   - Add your Google Maps API key to the `.env` file:
     ```env
     VITE_GOOGLE_MAPS_API_KEY="your_actual_api_key_here"
     ```
   - **Important:** You *must* enable Billing on your Google Cloud Project for the Maps API to work. Learn more at [Google Maps Platform Get Started](https://developers.google.com/maps/gmp-get-started).

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Deployment (GitHub Pages)

This project is configured to deploy easily to GitHub Pages.

1. Ensure your code is pushed to a GitHub repository.
2. Run the deployment script:
   ```bash
   npm run deploy
   ```
3. Go to your repository's **Settings > Pages**.
4. Set the source to **Deploy from a branch**, select the `gh-pages` branch, and select the `/ (root)` folder.
5. Save, and your site will be live shortly!

## Security Note

The Google Maps JavaScript API key must be exposed to the client to load map tiles. To prevent quota abuse, you **must** restrict this key in the Google Cloud Console to only allow requests from your specific domain (HTTP referrers) once deployed.
