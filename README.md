# Image Gallery Web App

This project is a full-stack image gallery web application built with TypeScript, Node.js (Express), and vanilla JavaScript for the frontend. It allows users to upload, view, and resize images directly in the browser.

## Features
- **Image Upload:** Users can upload multiple images at once (up to 10 files, max 5MB each)
- **Image Gallery:** All uploaded images and placeholder images are shown in a responsive gallery layout
- **Image Resize:** Select an image and specify new dimensions to generate a resized version
- **Cached Resizing:** Resized images are cached for better performance
- **Shareable URLs:** Each resized image gets a unique, shareable URL
- **Drag-and-Drop UI:** Modern, user-friendly interface for managing images
- **Responsive Design:** Works on both desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm (comes with Node.js)

### Installation
1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Build the project:**
   ```sh
   npm run build
   ```

4. **Start the development server:**
   ```sh
   npm run dev
   ```

5. **Access the application:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure
```
├── public/                 # Frontend assets
│   ├── images/            # Uploaded and placeholder images
│   │   └── resized/      # Resized image cache
│   ├── dist/             # Compiled frontend TypeScript
│   ├── index.html        # Main HTML file
│   ├── style.css         # Styles
│   └── script.ts         # Frontend TypeScript code
│
├── server/                # Backend code
│   ├── controllers/      # Request handlers
│   ├── routes/          # API routes
│   ├── app.ts           # Express app setup
│   └── index.ts         # Server entry point
│
├── dist/                 # Compiled backend code
├── tsconfig.json         # Server TypeScript config
├── tsconfig.client.json  # Client TypeScript config
└── package.json         # Project dependencies and scripts
```

## Available Scripts
- `npm run build` - Builds both server and client TypeScript files
- `npm run dev` - Starts the development server with hot-reload
- `npm start` - Runs the production server
- `npm run watch-client` - Watches for client-side TypeScript changes

## API Endpoints
- `POST /upload` - Upload images (multipart/form-data)
- `POST /resize` - Resize an image with specified dimensions
- `GET /api/resize-image` - Get a resized image with query parameters

## Technical Details
- **Frontend:** Vanilla TypeScript/JavaScript, modern CSS
- **Backend:** Node.js with Express
- **Image Processing:** Sharp library for efficient image resizing
- **File Storage:** Local filesystem with organized directory structure
- **Caching:** Resized images are cached to improve performance

## File Storage
- Original images: `public/images/`
- Resized images: `public/images/resized/`
- Resized images follow the naming pattern: `resized-{width}x{height}-{originalname}`
- Cached resized images: `cache-{width}x{height}-{originalname}`

## Security Features
- File type validation (images only)
- File size limits (5MB per file)
- Upload count limits (10 files per request)
- Sanitized filenames
- Error handling middleware

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020 JavaScript features
- Modern CSS features (Grid, Flexbox)

## Contributing
Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License
This project is licensed under the ISC License.

---
Feel free to modify and extend the app for your own use! 