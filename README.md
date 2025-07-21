# Cricket RSS Reader

A minimal, clean RSS feed reader specifically designed for cricket updates and news. Built with React and featuring a simple, distraction-free interface with organized categories.

## Features

- 🏏 **Cricket-focused**: Pre-configured with 22 popular cricket RSS feeds organized into categories
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- ⚡ **Fast & Lightweight**: Built with Vite for optimal performance
- 🔄 **Real-time Updates**: Fetch latest cricket news from RSS feeds
- 🎨 **Minimal UI**: Clean, simple interface without distractions
- 📖 **Native Reading**: Read articles directly in the app
- 🔗 **External Links**: Easy access to full articles on source websites
- 📂 **Category Management**: Organize feeds into custom categories
- ➕ **Feed Management**: Add and remove custom RSS feeds within categories

## Pre-configured Cricket Feeds by Category

### News & Media
- BBC Sport - Cricket
- Cricket news from ESPN Cricinfo.com
- Cricket - The Guardian
- Cricket – The Roar
- NDTV Sports - Cricket
- Wisden

### Podcasts
- Can't Bowl Can't Throw Cricket Show
- Cricket Unfiltered
- Sky Sports Cricket Podcast
- Stumped
- Switch Hit Podcast
- Tailenders
- Test Match Special
- The Analyst Inside Cricket
- The Grade Cricketer
- Wisden Cricket Weekly

### YouTube Channels
- Cricbuzz
- England & Wales Cricket Board
- Pakistan Cricket
- Sri Lanka Cricket
- cricket.com.au

### Community
- Cricket (Reddit)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cricket-rss-reader
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage

1. **Select a Category**: Use the dropdown to switch between different feed categories
2. **Load a Feed**: Click on any feed within the selected category to load its content
3. **Add New Category**: Click "Add Category" to create a new category for organizing feeds
4. **Add Custom Feed**: Click "Add Feed" to add a new RSS feed to the current category
5. **Remove Feeds/Categories**: Use the remove buttons to delete unwanted feeds or categories
6. **Read Articles**: Click on any article to read the full content or use the "Read Full Article" button

## Category Management

### Adding Categories
- Click the "Add Category" button
- Enter a descriptive name for the new category
- Click "Add Category" to create it
- The new category will be automatically selected

### Adding Feeds to Categories
- Select the desired category from the dropdown
- Click "Add Feed" button
- Enter a descriptive name for the feed
- Paste the RSS feed URL
- Click "Add Feed" to save it to the current category

### Removing Categories
- Select the category you want to remove
- Click "Remove Category" button
- The category and all its feeds will be deleted
- If it was the selected category, the app will switch to the first available category

### Removing Feeds
- Click the "×" button next to any feed to remove it from the current category
- Custom feeds can be removed permanently
- Default feeds can be removed but will reappear on page refresh

## Technology Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **date-fns**: Date formatting utilities
- **CSS3**: Minimal styling with clean typography

## Project Structure

```
cricket-rss-reader/
├── public/
│   └── cricket-icon.svg
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md           # This file
```

## Features in Detail

### RSS Feed Parsing
- Native XML parsing using DOMParser
- CORS proxy integration for cross-origin requests
- Error handling for invalid feeds

### User Interface
- Clean, minimal design with focus on content
- Monochromatic color scheme
- Category-based organization
- Responsive grid layout for feeds
- Simple hover effects

### Content Display
- Clean article formatting
- Date and author information
- Truncated descriptions with "Read More" functionality
- Direct links to source articles

### Category Management
- Organize feeds into logical categories
- Add custom categories with descriptive names
- Remove categories and their associated feeds
- Switch between categories using dropdown
- Add feeds to specific categories

### Feed Management
- Add custom RSS feeds with names to any category
- Remove unwanted feeds from categories
- Persistent category structure (resets to default on refresh)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the repository. 