let currentResults = [];
    let favorites = [];
    let recentSearches = [];
    let debounceTimer;
    const API_BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w300';

    // Polyfill for browser compatibility
    const storage = (typeof browser !== 'undefined' && browser.storage) ? browser.storage : chrome.storage;

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
      loadStoredData();
      setupEventListeners();
      updateFavoritesDisplay();
      updateRecentDisplay();
      document.querySelectorAll('.clear-btn').forEach((btn, idx) => {
        if (idx === 0) btn.addEventListener('click', clearFavorites);
        if (idx === 1) btn.addEventListener('click', clearRecent);
      });
      // Clear search button logic
      const searchInput = document.getElementById('searchInput');
      const clearBtn = document.getElementById('clearSearchBtn');
      function updateClearBtn() {
        if (searchInput.value) {
          clearBtn.style.display = '';
        } else {
          clearBtn.style.display = 'none';
        }
      }
      searchInput.addEventListener('input', updateClearBtn);
      updateClearBtn();
      clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        searchInput.value = '';
        updateClearBtn();
        clearResults();
        showSections();
        searchInput.focus();
        storage.local.remove('tmdbLastSearch');
      });

      // Restore last search if available
      storage.local.get(['tmdbLastSearch'], function(result) {
        if (result.tmdbLastSearch && result.tmdbLastSearch.query) {
          const { query, results } = result.tmdbLastSearch;
          searchInput.value = query;
          currentResults = results || [];
          showResults(currentResults);
          document.getElementById('tabsContainer').style.display = 'flex';
          hideSections();
          updateClearBtn();
        }
      });

      // the  API key logic
      let tmdbApiKey = '';
      const changeApiBtn = document.getElementById('changeApiBtn');
      const apiKeyInlineContainer = document.getElementById('apiKeyInlineContainer');
      const apiKeyInlineInput = document.getElementById('apiKeyInlineInput');
      const setApiBtn = document.getElementById('setApiBtn');
      function showApiKeyInline(show) {
        apiKeyInlineContainer.style.display = show ? '' : 'none';
        if (show) {
          apiKeyInlineInput.value = tmdbApiKey || '';
          apiKeyInlineInput.focus();
        }
      }
      function updateApiKeyUI() {
        storage.local.get(['tmdbApiKey'], function(result) {
          tmdbApiKey = result.tmdbApiKey || '';
          if (tmdbApiKey) {
            changeApiBtn.style.display = '';
            showApiKeyInline(false);
          } else {
            changeApiBtn.style.display = '';
            showApiKeyInline(true);
          }
        });
      }
      changeApiBtn.addEventListener('click', function() {
        // Toggle the API key input visibility
        const isVisible = apiKeyInlineContainer.style.display === '';
        showApiKeyInline(!isVisible);
        if (!isVisible) apiKeyInlineInput.focus();
      });
      setApiBtn.addEventListener('click', function() {
        const key = apiKeyInlineInput.value.trim();
        if (key) {
          tmdbApiKey = key;
          saveApiKey(tmdbApiKey);
          showApiKeyInline(false);
          updateApiKeyUI();
        }
      });
      apiKeyInlineInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') setApiBtn.click();
      });
      updateApiKeyUI();


      window.performSearch = function(query) {
        searchInput.value = query;
        updateClearBtn();
        searchMedia(query);
        hideSections();
      };
    });

    function setupEventListeners() {
      // search input
      document.getElementById('searchInput').addEventListener('input', function(e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          if (e.target.value.trim()) {
            searchMedia(e.target.value.trim());
            hideSections();
          } else {
            clearResults();
            showSections();
          }
        }, 500);
      });

      // tab filters
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          filterResults(this.dataset.type);
        });
      });
    }

    function loadStoredData() {
      storage.local.get(['tmdbApiKey', 'tmdbFavorites', 'tmdbRecent'], function(result) {
        if (result.tmdbApiKey) {
          apiKeyInlineInput.value = result.tmdbApiKey;
        }
        if (result.tmdbFavorites) {
          favorites = result.tmdbFavorites;
        }
        if (result.tmdbRecent) {
          recentSearches = result.tmdbRecent;
        }
        updateFavoritesDisplay();
        updateRecentDisplay();
      });
    }

    function saveApiKey(apiKey) {
      storage.local.set({tmdbApiKey: apiKey});
    }

    function saveFavorites() {
      storage.local.set({tmdbFavorites: favorites});
    }

    function saveRecent() {
      storage.local.set({tmdbRecent: recentSearches});
    }

    async function searchMedia(query) {
      const apiKey = apiKeyInlineInput.value.trim();
      if (!apiKey) {
        showToast('❌ Please enter your TMDB API key first');
        return;
      }

      showLoading();

      try {
        // Search both movies and TV shows
        const [movieResponse, tvResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`),
          fetch(`${API_BASE_URL}/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`)
        ]);

        if (!movieResponse.ok || !tvResponse.ok) {
          throw new Error('API request failed');
        }

        const [movieData, tvData] = await Promise.all([
          movieResponse.json(),
          tvResponse.json()
        ]);

        // Combine and mark results
        const movieResults = (movieData.results || []).map(item => ({...item, media_type: 'movie'}));
        const tvResults = (tvData.results || []).map(item => ({...item, media_type: 'tv'}));
        
        currentResults = [...movieResults, ...tvResults]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 20);

        // Add to recent searches
        addToRecent(query, currentResults.length);
        
        showResults(currentResults);
        document.getElementById('tabsContainer').style.display = 'flex';

        // Save last search
        storage.local.set({
          tmdbLastSearch: {
            query,
            results: currentResults
          }
        });
      } catch (error) {
        console.error('Search error:', error);
        showToast('❌ Search failed. Check your API key.');
        showResults([]);
      }
    }

    function showLoading() {
      const results = document.getElementById('results');
      results.classList.add('loading-parent');
      results.innerHTML = `
        <div class="loading">
          <div class="loading-spinner"></div>
          <div>Searching TMDB...</div>
        </div>
      `;
    }

    function clearResults() {
      const results = document.getElementById('results');
      results.classList.remove('loading-parent');
      results.innerHTML = '';
      document.getElementById('tabsContainer').style.display = 'none';
    }

    function hideSections() {
      document.getElementById('favoritesSection').style.display = 'none';
      document.getElementById('recentSection').style.display = 'none';
    }

    function showSections() {
      document.getElementById('favoritesSection').style.display = 'block';
      document.getElementById('recentSection').style.display = 'block';
    }

    function filterResults(type) {
      let filteredResults = currentResults;
      
      if (type === 'movie') {
        filteredResults = currentResults.filter(item => item.media_type === 'movie');
      } else if (type === 'tv') {
        filteredResults = currentResults.filter(item => item.media_type === 'tv');
      }
      
      showResults(filteredResults);
    }

    function showResults(results) {
      const resultsContainer = document.getElementById('results');
      resultsContainer.classList.remove('loading-parent');
      resultsContainer.textContent = '';
      if (results.length === 0) {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results';
        noResultsDiv.textContent = 'No results found';
        resultsContainer.appendChild(noResultsDiv);
        return;
      }
      results.forEach(item => {
        const title = item.title || item.name;
        const year = item.release_date || item.first_air_date;
        const posterPath = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '';
        const isFavorited = favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type);

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = item.id;
        card.dataset.type = item.media_type;
        card.dataset.title = title;

        const img = document.createElement('img');
        img.src = posterPath;
        img.alt = '';
        img.className = 'movie-poster';
        img.onerror = function() { this.style.background = '#2a2a2a'; };
        card.appendChild(img);

        const favBtn = document.createElement('button');
        favBtn.className = 'favorite-btn' + (isFavorited ? ' favorited' : '');
        favBtn.title = 'Favorite';
        favBtn.textContent = isFavorited ? '❤️' : '🤍';
        favBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleFavorite(event, item.id, item.media_type, title, posterPath);
        });
        card.appendChild(favBtn);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'movie-info';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'movie-title';
        titleSpan.textContent = title;
        infoDiv.appendChild(titleSpan);
        const infoRow = document.createElement('div');
        infoRow.className = 'movie-info-row';
        if (year) {
          const yearSpan = document.createElement('span');
          yearSpan.className = 'movie-year';
          yearSpan.textContent = year.substring(0, 4);
          infoRow.appendChild(yearSpan);
        }
        const typeSpan = document.createElement('span');
        typeSpan.className = 'media-type-tag';
        typeSpan.textContent = item.media_type;
        infoRow.appendChild(typeSpan);
        infoDiv.appendChild(infoRow);
        card.appendChild(infoDiv);

        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          copyToClipboard(item.id, title, item.media_type);
        });

        resultsContainer.appendChild(card);
      });
    }

    function toggleFavorite(event, id, type, title, poster) {
      event.stopPropagation();
      
      const existingIndex = favorites.findIndex(fav => fav.id === id && fav.media_type === type);
      
      if (existingIndex >= 0) {
        favorites.splice(existingIndex, 1);
        showToast('💔 Removed from favorites');
      } else {
        favorites.unshift({id, media_type: type, title, poster, timestamp: Date.now()});
        if (favorites.length > 10) favorites.pop(); // Keep only 10 favorites
        showToast('❤️ Added to favorites');
      }
      
      saveFavorites();
      updateFavoritesDisplay();
      
     
      const btn = event.target;
      const isFavorited = favorites.some(fav => fav.id === id && fav.media_type === type);
      btn.classList.toggle('favorited', isFavorited);
      btn.textContent = isFavorited ? '❤️' : '🤍';
    }

    function updateFavoritesDisplay() {
      const grid = document.getElementById('favoritesGrid');
      const clearBtn = document.querySelector('#favoritesSection .clear-btn');
      grid.textContent = '';
      favorites.slice(0, 6).forEach((fav, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'quick-item';
        itemDiv.dataset.id = fav.id;
        itemDiv.dataset.type = fav.media_type;
        itemDiv.dataset.title = fav.title;
        const titleDiv = document.createElement('div');
        titleDiv.className = 'quick-item-title';
        titleDiv.textContent = fav.title;
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-fav-btn';
        removeBtn.title = 'Remove';
        removeBtn.textContent = '\u00D7';
        removeBtn.dataset.index = idx;
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          favorites.splice(idx, 1);
          saveFavorites();
          updateFavoritesDisplay();
          showToast('💔 Removed from favorites');
        });
        titleDiv.appendChild(removeBtn);
        itemDiv.appendChild(titleDiv);
        const idDiv = document.createElement('div');
        idDiv.className = 'quick-item-id';
        idDiv.textContent = `ID: ${fav.id}`;
        itemDiv.appendChild(idDiv);
        itemDiv.addEventListener('click', () => {
          copyToClipboard(fav.id, fav.title, fav.media_type);
        });
        grid.appendChild(itemDiv);
      });
      if (clearBtn) clearBtn.style.display = favorites.length ? '' : 'none';
    }

    function addToRecent(query, resultCount) {
      const existing = recentSearches.findIndex(search => search.query === query);
      if (existing >= 0) {
        recentSearches.splice(existing, 1);
      }
      
      recentSearches.unshift({query, resultCount, timestamp: Date.now()});
      if (recentSearches.length > 8) recentSearches.pop();
      
      saveRecent();
      updateRecentDisplay();
    }

    function updateRecentDisplay() {
      const grid = document.getElementById('recentGrid');
      const clearBtn = document.querySelector('#recentSection .clear-btn');
      grid.textContent = '';
      recentSearches.slice(0, 6).forEach((search, idx) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'quick-item';
        itemDiv.dataset.query = search.query;
        const titleDiv = document.createElement('div');
        titleDiv.className = 'quick-item-title';
        titleDiv.textContent = search.query;
        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-recent-btn';
        removeBtn.title = 'Remove';
        removeBtn.textContent = '\u00D7';
        removeBtn.dataset.index = idx;
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          recentSearches.splice(idx, 1);
          saveRecent();
          updateRecentDisplay();
          showToast('🗑️ Removed from recent searches');
        });
        titleDiv.appendChild(removeBtn);
        itemDiv.appendChild(titleDiv);
        const idDiv = document.createElement('div');
        idDiv.className = 'quick-item-id';
        idDiv.textContent = `${search.resultCount} results`;
        itemDiv.appendChild(idDiv);
        itemDiv.addEventListener('click', () => {
          performSearch(search.query);
        });
        grid.appendChild(itemDiv);
      });
      if (clearBtn) clearBtn.style.display = recentSearches.length ? '' : 'none';
    }

    function performSearch(query) {
      document.getElementById('searchInput').value = query;
      searchMedia(query);
      hideSections();
    }

    function copyToClipboard(id, title, type) {
      navigator.clipboard.writeText(id.toString()).then(() => {
        const emoji = type === 'tv' ? '📺' : '🎬';
        showToast(`${emoji} Copied ID: ${id} (${title})`);
      }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('❌ Failed to copy ID');
      });
    }

    function clearFavorites() {
      favorites = [];
      saveFavorites();
      updateFavoritesDisplay();
      showToast('🗑️ Favorites cleared');
    }

    function clearRecent() {
      recentSearches = [];
      saveRecent();
      updateRecentDisplay();
      showToast('🗑️ Recent searches cleared');
    }

    function showToast(message) {
      const toast = document.getElementById('toast');
      toast.textContent = message;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }