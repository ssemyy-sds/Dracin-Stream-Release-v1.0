# Dracin Stream 🐉

Dracin Stream is a premium, mobile-first web application for streaming Chinese Dramas. It features an ultra-dark UI, seamless HLS streaming, and a robust proxy architecture to handle content delivery securely.

## 🚀 Features

- **Mobile-First Design**: Optimized for touch interaction and small screens.
- **Ultra-Dark Mode**: True black (#000000) background for OLED displays.
- **HLS Streaming**: Native support for `.m3u8` playlists using `hls.js`.
- **Serverless Proxy**: secure API integration using Vercel Serverless Functions to bypass CORS.
- **Lazy Loading**: Optimized image and component loading for performance.

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite (TypeScript)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Player**: Custom HTML5 Video Player with HLS support
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/username/dracin-stream.git
   cd dracin-stream
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   UPSTREAM_API_URL=https://api.sansekai.my.id/api/dramabox
   ```

4. **Run Local Development**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## 🚀 Deployment (Vercel)

1. Push your code to GitHub.
2. Import the repository in Vercel.
3. In the Vercel Project Settings, go to **Environment Variables**.
4. Add the following variable:
   - **Key**: `UPSTREAM_API_URL`
   - **Value**: `https://api.sansekai.my.id/api/dramabox`
5. Click **Deploy**.

## 🔒 Security Note

This project uses a server-side proxy (`api/index.js`) to fetch data from the upstream API. The actual API URL is stored in environment variables and is never exposed to the client-side browser, ensuring the upstream source remains protected.

## 📄 License

© 2026 Dracin Stream. All rights reserved.
