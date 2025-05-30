# TMDB ID Search Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue)](https://developer.chrome.com/docs/extensions/)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-Add--on-orange)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
[![GitHub Repo stars](https://img.shields.io/github/stars/papi028/TMDB-ID-SEARCH-extension?style=social)](https://github.com/papi028/TMDB-ID-SEARCH-extension/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/papi028/TMDB-ID-SEARCH-extension)](https://github.com/papi028/TMDB-ID-SEARCH-extension/commits/main)

---

A browser extension to quickly search for movies and TV shows on TMDB, copy their IDs, and manage your favorites and recent searches—all with a clean, user-friendly interface.

---

## Features

- **Search TMDB**: Instantly search for movies and TV shows using the TMDB API.
- **Copy TMDB IDs**: Click on any result to copy its TMDB ID to your clipboard, with a visual confirmation.
- **Favorites**: Save up to 10 favorite titles for quick access and copying.
- **Recent Searches**: Keep track of your last 8 search queries for easy repeat searches.
- **Filter Results**: Toggle between movies and TV shows using tabs.
- **API Key Management**: Securely store your TMDB API key locally. Prompted on first use.
- **Responsive UI**: Clean, modern, and fast interface for both Chrome and Firefox.
- **No Account Required**: All data is stored locally in your browser.

---

## Getting Started

### 1. Get Your TMDB API Key

1. Go to [TMDB Account Settings](https://www.themoviedb.org/settings/api).
2. Sign up or log in.
3. Apply for an API key (free for personal use).
4. Copy your API key—you'll need it the first time you use the extension.

---

### 2. Install on Chrome

1. **Download the Source**:  
   - Download this repository as a ZIP (or clone it).
   - **Extract** the ZIP file as a folder.
   

2. **Enable Developer Mode**:  
   - Open Chrome and go to `chrome://extensions/`.
   - Toggle **Developer mode** (top right).

3. **Load the Extension**:  
   - Click **Load unpacked**.
   - Select the `chrome-extension` folder from the extracted files.

4. **Start Using**:  
   - Click the extension icon.
   - Enter your TMDB API key when prompted.
   - Search for any movie or TV show, click to copy the TMDB ID, and manage your favorites and recent searches.

---

### 3. Install on Firefox

1. **Download the XPI File**:  
   - The `.xpi` file is provided at the root of this repository (not in the `firefox-extension` folder).

2. **Install the Extension**:  
   - Open Firefox.
   - Drag and drop the `.xpi` file into the browser window, or open `about:addons` and select "Install Add-on From File...".
   - Confirm the installation.

3. **Start Using**:  
   - Click the extension icon.
   - Enter your TMDB API key when prompted.
   - Enjoy searching, copying IDs, and managing favorites/recent searches.

---

## How to Use

- **Search**: Type a movie or TV show name in the search bar.
- **Copy ID**: Click on a result card to copy its TMDB ID (with a toest).
- **Favorite**: Click the heart icon to add/remove from favorites (max 10).
- **Recent**: Your last 8 searches are saved for quick access.
- **Clear**: Use the clear buttons to remove all favorites or recent searches.
- **API Key**: Change your TMDB API key anytime from the extension popup using the "Change API Key button" you only need to set it once.



## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change also feature requests are welcomeds.

---

## License

MIT

---

## Credits

- [TMDB API](https://www.themoviedb.org/documentation/api)
- UI and logic by me [papi028](https://github.com/papi028)

---

## Repository

[https://github.com/papi028/TMDB-ID-SEARCH-extension](https://github.com/papi028/TMDB-ID-SEARCH-extension)
