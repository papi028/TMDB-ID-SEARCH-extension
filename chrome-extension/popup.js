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
      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
        return;
      }
      resultsContainer.innerHTML = results.map(item => {
        const title = item.title || item.name;
        const year = item.release_date || item.first_air_date;
        const posterPath = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '';
        const isFavorited = favorites.some(fav => fav.id === item.id && fav.media_type === item.media_type);
        return `
          <div class="movie-card" data-id="${item.id}" data-type="${item.media_type}" data-title="${title.replace(/\"/g, '&quot;')}">
            <img src="${posterPath}" alt="" class="movie-poster" onerror="this.style.background='#2a2a2a'">
            <button class="favorite-btn${isFavorited ? ' favorited' : ''}" title="Favorite">${isFavorited ? '❤️' : '🤍'}</button>
            <div class="movie-info">
              <span class="movie-title">${title}</span>
              <div class="movie-info-row">
                ${year ? `<span class="movie-year">${year.substring(0, 4)}</span>` : ''}
                <span class="media-type-tag">${item.media_type}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

    
      results.forEach(item => {
        const card = resultsContainer.querySelector(`.movie-card[data-id='${item.id}'][data-type='${item.media_type}']`);
        if (!card) return;
        // Favorite button
        const favBtn = card.querySelector('.favorite-btn');
        if (favBtn) {
          favBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleFavorite(event, item.id, item.media_type, (item.title || item.name), item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : '');
          });
        }
      
        card.addEventListener('click', (e) => {
        
          if (e.target.closest('button')) return;
          copyToClipboard(item.id, (item.title || item.name), item.media_type);
        });
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
      grid.innerHTML = favorites.slice(0, 6).map((fav, idx) => `
        <div class="quick-item" data-id="${fav.id}" data-type="${fav.media_type}" data-title="${fav.title.replace(/'/g, "\\'")}">
          <div class="quick-item-title">${fav.title}
            <button class="remove-fav-btn" title="Remove" data-index="${idx}">&times;</button>
          </div>
          <div class="quick-item-id">ID: ${fav.id}</div>
        </div>
      `).join('');
      if (clearBtn) clearBtn.style.display = favorites.length ? '' : 'none';
      grid.querySelectorAll('.quick-item').forEach(item => {
        item.addEventListener('click', () => {
          copyToClipboard(item.getAttribute('data-id'), item.getAttribute('data-title'), item.getAttribute('data-type'));
        });
      });
      grid.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'));
          favorites.splice(idx, 1);
          saveFavorites();
          updateFavoritesDisplay();
          showToast('💔 Removed from favorites');
        });
      });
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
      grid.innerHTML = recentSearches.slice(0, 6).map((search, idx) => `
        <div class="quick-item" data-query="${search.query.replace(/'/g, "\\'")}">
          <div class="quick-item-title">${search.query}
            <button class="remove-recent-btn" title="Remove" data-index="${idx}">&times;</button>
          </div>
          <div class="quick-item-id">${search.resultCount} results</div>
        </div>
      `).join('');
      if (clearBtn) clearBtn.style.display = recentSearches.length ? '' : 'none';
      grid.querySelectorAll('.quick-item').forEach(item => {
        item.addEventListener('click', () => {
          performSearch(item.getAttribute('data-query'));
        });
      });
      grid.querySelectorAll('.remove-recent-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.getAttribute('data-index'));
          recentSearches.splice(idx, 1);
          saveRecent();
          updateRecentDisplay();
          showToast('🗑️ Removed from recent searches');
        });
      });
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