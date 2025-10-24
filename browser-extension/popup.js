
// Popup JavaScript for Browser Extension
class SportsExtension {
    constructor() {
        this.apiBaseUrl = 'https://api.sportscentral.app/v1';
        this.cache = new Map();
        this.cacheExpiry = 60 * 1000; // 1 minute
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.setupTabNavigation();
        await this.loadInitialData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Refresh buttons
        document.getElementById('refreshPredictions')?.addEventListener('click', () => {
            this.loadPredictions();
        });

        // Settings
        document.getElementById('predictionsNotifications')?.addEventListener('change', (e) => {
            this.saveSetting('predictionsNotifications', e.target.checked);
        });

        document.getElementById('liveScoreNotifications')?.addEventListener('change', (e) => {
            this.saveSetting('liveScoreNotifications', e.target.checked);
        });

        document.getElementById('oddsNotifications')?.addEventListener('change', (e) => {
            this.saveSetting('oddsNotifications', e.target.checked);
        });

        document.getElementById('refreshInterval')?.addEventListener('change', (e) => {
            this.saveSetting('refreshInterval', parseInt(e.target.value));
            this.startAutoRefresh();
        });

        document.getElementById('defaultSport')?.addEventListener('change', (e) => {
            this.saveSetting('defaultSport', e.target.value);
        });

        document.getElementById('confidenceThreshold')?.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('confidenceValue').textContent = `${value}%`;
            this.saveSetting('confidenceThreshold', parseInt(value));
        });

        // Sport filter
        document.getElementById('sportFilter')?.addEventListener('change', (e) => {
            this.loadLiveScores(e.target.value);
        });

        // Action buttons
        document.getElementById('viewAllPredictions')?.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sportscentral.app/predictions' });
        });

        document.getElementById('openFullApp')?.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sportscentral.app' });
        });

        document.getElementById('clearCache')?.addEventListener('click', () => {
            this.clearCache();
        });

        // Footer links
        document.getElementById('aboutLink')?.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sportscentral.app/about' });
        });

        document.getElementById('supportLink')?.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sportscentral.app/support' });
        });

        document.getElementById('privacyLink')?.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sportscentral.app/privacy' });
        });
    }

    setupTabNavigation() {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Add active class to current
                tab.classList.add('active');
                const targetContent = document.getElementById(`${tab.dataset.tab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    switchTab(tabName) {
        const tabs = document.querySelectorAll('.tab-btn');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data for the active tab
        switch (tabName) {
            case 'predictions':
                this.loadPredictions();
                break;
            case 'live':
                this.loadLiveScores();
                break;
            case 'odds':
                this.loadOdds();
                break;
        }
    }

    async loadInitialData() {
        await Promise.all([
            this.loadPredictions(),
            this.loadLiveScores(),
            this.loadOdds()
        ]);
    }

    async loadPredictions() {
        const container = document.getElementById('predictionsList');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading-spinner"></div>';

            const predictions = await this.fetchWithCache('/predictions', {
                confidence: await this.getSetting('confidenceThreshold', 70),
                sport: await this.getSetting('defaultSport', 'all'),
                limit: 5
            });

            if (predictions && predictions.length > 0) {
                container.innerHTML = predictions.map(pred => this.renderPrediction(pred)).join('');
            } else {
                container.innerHTML = '<div class="loading-placeholder">No predictions available</div>';
            }

        } catch (error) {
            console.error('Failed to load predictions:', error);
            container.innerHTML = '<div class="loading-placeholder">Failed to load predictions</div>';
        }
    }

    async loadLiveScores(sport = 'all') {
        const container = document.getElementById('liveMatches');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading-spinner"></div>';

            const matches = await this.fetchWithCache('/live-scores', {
                sport: sport !== 'all' ? sport : undefined,
                limit: 8
            });

            if (matches && matches.length > 0) {
                container.innerHTML = matches.map(match => this.renderLiveMatch(match)).join('');
            } else {
                container.innerHTML = '<div class="loading-placeholder">No live matches</div>';
            }

        } catch (error) {
            console.error('Failed to load live scores:', error);
            container.innerHTML = '<div class="loading-placeholder">Failed to load live scores</div>';
        }
    }

    async loadOdds() {
        const container = document.getElementById('oddsList');
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading-spinner"></div>';

            const odds = await this.fetchWithCache('/odds', {
                sport: await this.getSetting('defaultSport', 'all'),
                limit: 6
            });

            if (odds && odds.length > 0) {
                container.innerHTML = odds.map(odd => this.renderOdds(odd)).join('');
            } else {
                container.innerHTML = '<div class="loading-placeholder">No odds available</div>';
            }

        } catch (error) {
            console.error('Failed to load odds:', error);
            container.innerHTML = '<div class="loading-placeholder">Failed to load odds</div>';
        }
    }

    renderPrediction(prediction) {
        return `
            <div class="prediction-item">
                <div class="prediction-match">${prediction.match || prediction.title}</div>
                <div class="prediction-details">
                    <span class="prediction-tip">${prediction.prediction || prediction.content}</span>
                    <span class="confidence-badge">${prediction.confidence}%</span>
                </div>
            </div>
        `;
    }

    renderLiveMatch(match) {
        const isLive = match.status === 'Live' || match.status === 'In Progress';
        return `
            <div class="live-match">
                ${isLive ? '<div class="live-indicator"></div>' : ''}
                <div class="match-teams">
                    <span class="team-name">${match.homeTeam}</span>
                    <span class="match-score">${match.homeScore || 0} - ${match.awayScore || 0}</span>
                    <span class="team-name">${match.awayTeam}</span>
                </div>
                <div class="match-status">${match.status} • ${match.sport}</div>
            </div>
        `;
    }

    renderOdds(odd) {
        return `
            <div class="odds-item">
                <div class="odds-match">${odd.match || `${odd.homeTeam} vs ${odd.awayTeam}`}</div>
                <div class="odds-values">
                    <div class="odds-option">
                        <span class="odds-label">Home</span>
                        <span class="odds-value">${odd.homeOdds || odd.odds?.home || 'N/A'}</span>
                    </div>
                    <div class="odds-option">
                        <span class="odds-label">Draw</span>
                        <span class="odds-value">${odd.drawOdds || odd.odds?.draw || 'N/A'}</span>
                    </div>
                    <div class="odds-option">
                        <span class="odds-label">Away</span>
                        <span class="odds-value">${odd.awayOdds || odd.odds?.away || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async fetchWithCache(endpoint, params = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            const url = new URL(this.apiBaseUrl + endpoint);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, value);
                }
            });

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, { data: data.data || data, timestamp: Date.now() });
            
            return data.data || data;
        } catch (error) {
            console.error('API fetch error:', error);
            
            // Return cached data if available, even if expired
            if (cached) {
                return cached.data;
            }
            
            // Return fallback data
            return this.getFallbackData(endpoint);
        }
    }

    getFallbackData(endpoint) {
        switch (endpoint) {
            case '/predictions':
                return [
                    { match: "Real Madrid vs Barcelona", prediction: "Over 2.5 Goals", confidence: 85 },
                    { match: "Manchester United vs Arsenal", prediction: "Both Teams to Score", confidence: 78 },
                    { match: "Lakers vs Warriors", prediction: "Lakers Win", confidence: 72 }
                ];
            case '/live-scores':
                return [
                    { homeTeam: "Chelsea", awayTeam: "Liverpool", homeScore: 1, awayScore: 2, status: "Live", sport: "Soccer" },
                    { homeTeam: "Heat", awayTeam: "Celtics", homeScore: 98, awayScore: 102, status: "Final", sport: "Basketball" }
                ];
            case '/odds':
                return [
                    { match: "Bayern vs Dortmund", odds: { home: 2.1, draw: 3.2, away: 2.8 } },
                    { match: "Yankees vs Red Sox", odds: { home: 1.85, away: 2.0 } }
                ];
            default:
                return [];
        }
    }

    async startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        const interval = await this.getSetting('refreshInterval', 60);
        if (interval > 0) {
            this.refreshInterval = setInterval(() => {
                this.loadInitialData();
            }, interval * 1000);
        }
    }

    clearCache() {
        this.cache.clear();
        this.loadInitialData();
        
        // Show success message
        const container = document.querySelector('.extension-container');
        const message = document.createElement('div');
        message.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #00ff88;
            color: #000;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 1000;
        `;
        message.textContent = 'Cache cleared!';
        container.appendChild(message);
        
        setTimeout(() => {
            container.removeChild(message);
        }, 2000);
    }

    async loadSettings() {
        const settings = await chrome.storage.local.get([
            'predictionsNotifications',
            'liveScoreNotifications',
            'oddsNotifications',
            'refreshInterval',
            'defaultSport',
            'confidenceThreshold'
        ]);

        // Apply settings to UI
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value !== false;
                } else {
                    element.value = value || (key === 'refreshInterval' ? 60 : key === 'confidenceThreshold' ? 70 : 'all');
                }
            }
        });

        // Update confidence display
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceValue) {
            confidenceValue.textContent = `${settings.confidenceThreshold || 70}%`;
        }
    }

    async saveSetting(key, value) {
        await chrome.storage.local.set({ [key]: value });
    }

    async getSetting(key, defaultValue) {
        const result = await chrome.storage.local.get([key]);
        return result[key] !== undefined ? result[key] : defaultValue;
    }
}

// Initialize extension when popup opens
document.addEventListener('DOMContentLoaded', () => {
    new SportsExtension();
});

// Handle extension icon badge updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        chrome.action.setBadgeText({ text: request.text });
        chrome.action.setBadgeBackgroundColor({ color: '#00d4ff' });
    }
});
