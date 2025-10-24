
// Background Service Worker for Browser Extension
class ExtensionBackground {
    constructor() {
        this.apiBaseUrl = 'https://api.sportscentral.app/v1';
        this.notificationQueue = [];
        this.lastUpdate = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupAlarms();
        this.setupNotifications();
    }

    setupEventListeners() {
        // Extension installed/updated
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onExtensionUpdate();
            }
        });

        // Extension startup
        chrome.runtime.onStartup.addListener(() => {
            this.initializeExtension();
        });

        // Alarm events
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });

        // Message handling from popup/content scripts
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Tab events for content script injection
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.isSportsWebsite(tab.url)) {
                this.injectEnhancements(tabId, tab.url);
            }
        });
    }

    setupAlarms() {
        // Create periodic alarms for data updates
        chrome.alarms.create('updatePredictions', { periodInMinutes: 5 });
        chrome.alarms.create('updateLiveScores', { periodInMinutes: 1 });
        chrome.alarms.create('updateOdds', { periodInMinutes: 2 });
        chrome.alarms.create('cleanupCache', { periodInMinutes: 30 });
    }

    setupNotifications() {
        // Clear existing notifications on startup
        chrome.notifications.getAll((notifications) => {
            Object.keys(notifications).forEach(id => {
                chrome.notifications.clear(id);
            });
        });
    }

    async onFirstInstall() {
        // Set default settings
        await chrome.storage.local.set({
            predictionsNotifications: true,
            liveScoreNotifications: true,
            oddsNotifications: false,
            refreshInterval: 60,
            defaultSport: 'all',
            confidenceThreshold: 70,
            welcomeShown: false
        });

        // Open welcome page
        chrome.tabs.create({
            url: 'https://sportscentral.app/extension-welcome'
        });

        // Show welcome notification
        this.showNotification('welcome', {
            title: 'SportsApp Extension Installed! 🎉',
            message: 'Get real-time predictions and odds on any sports website.',
            iconUrl: 'icons/icon-48.png',
            buttons: [
                { title: 'Open Dashboard' },
                { title: 'Configure Settings' }
            ]
        });
    }

    async onExtensionUpdate() {
        const manifest = chrome.runtime.getManifest();
        
        this.showNotification('update', {
            title: `SportsApp Updated to v${manifest.version}`,
            message: 'New features and improvements available!',
            iconUrl: 'icons/icon-48.png'
        });
    }

    async initializeExtension() {
        // Update badge with live data count
        this.updateBadge();
        
        // Start background monitoring
        this.startBackgroundUpdates();
    }

    async handleAlarm(alarm) {
        switch (alarm.name) {
            case 'updatePredictions':
                await this.checkPredictionUpdates();
                break;
            case 'updateLiveScores':
                await this.checkLiveScoreUpdates();
                break;
            case 'updateOdds':
                await this.checkOddsUpdates();
                break;
            case 'cleanupCache':
                await this.cleanupCache();
                break;
        }
    }

    async handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'getPredictions':
                const predictions = await this.fetchPredictions(request.params);
                sendResponse({ data: predictions });
                break;

            case 'getLiveScores':
                const scores = await this.fetchLiveScores(request.params);
                sendResponse({ data: scores });
                break;

            case 'getOdds':
                const odds = await this.fetchOdds(request.params);
                sendResponse({ data: odds });
                break;

            case 'updateSettings':
                await chrome.storage.local.set(request.settings);
                sendResponse({ success: true });
                break;

            case 'clearCache':
                await this.cleanupCache();
                sendResponse({ success: true });
                break;

            case 'showNotification':
                this.showNotification(request.id, request.options);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ error: 'Unknown action' });
        }
    }

    async checkPredictionUpdates() {
        const settings = await chrome.storage.local.get(['predictionsNotifications']);
        if (!settings.predictionsNotifications) return;

        try {
            const predictions = await this.fetchPredictions({ limit: 3, confidence: 80 });
            const newPredictions = this.filterNewContent(predictions, 'predictions');

            if (newPredictions.length > 0) {
                this.showNotification('new-predictions', {
                    title: `${newPredictions.length} New High-Confidence Predictions! 🎯`,
                    message: newPredictions[0].match || newPredictions[0].title,
                    iconUrl: 'icons/icon-48.png',
                    buttons: [
                        { title: 'View All' },
                        { title: 'Dismiss' }
                    ]
                });

                this.updateBadge(newPredictions.length);
            }
        } catch (error) {
            console.error('Failed to check prediction updates:', error);
        }
    }

    async checkLiveScoreUpdates() {
        const settings = await chrome.storage.local.get(['liveScoreNotifications']);
        if (!settings.liveScoreNotifications) return;

        try {
            const matches = await this.fetchLiveScores({ live_only: true, limit: 5 });
            const importantUpdates = matches.filter(match => 
                match.status === 'Goal!' || 
                match.status === 'Full Time' ||
                (match.homeScore + match.awayScore) > 3
            );

            if (importantUpdates.length > 0) {
                const match = importantUpdates[0];
                this.showNotification('live-update', {
                    title: `${match.homeTeam} ${match.homeScore} - ${match.awayScore} ${match.awayTeam}`,
                    message: `${match.status} • Live Update`,
                    iconUrl: 'icons/icon-48.png'
                });
            }
        } catch (error) {
            console.error('Failed to check live score updates:', error);
        }
    }

    async checkOddsUpdates() {
        const settings = await chrome.storage.local.get(['oddsNotifications']);
        if (!settings.oddsNotifications) return;

        try {
            const odds = await this.fetchOdds({ limit: 5 });
            const significantChanges = this.detectOddsChanges(odds);

            if (significantChanges.length > 0) {
                const change = significantChanges[0];
                this.showNotification('odds-change', {
                    title: 'Significant Odds Movement! 📈',
                    message: `${change.match}: ${change.change}`,
                    iconUrl: 'icons/icon-48.png'
                });
            }
        } catch (error) {
            console.error('Failed to check odds updates:', error);
        }
    }

    async fetchPredictions(params = {}) {
        return this.fetchFromAPI('/predictions', params);
    }

    async fetchLiveScores(params = {}) {
        return this.fetchFromAPI('/live-scores', params);
    }

    async fetchOdds(params = {}) {
        return this.fetchFromAPI('/odds', params);
    }

    async fetchFromAPI(endpoint, params = {}) {
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
            return data.data || data;

        } catch (error) {
            console.error(`API fetch error for ${endpoint}:`, error);
            return this.getFallbackData(endpoint);
        }
    }

    getFallbackData(endpoint) {
        switch (endpoint) {
            case '/predictions':
                return [
                    { match: "Real Madrid vs Barcelona", prediction: "Over 2.5 Goals", confidence: 85 },
                    { match: "Manchester United vs Arsenal", prediction: "Both Teams to Score", confidence: 78 }
                ];
            case '/live-scores':
                return [
                    { homeTeam: "Chelsea", awayTeam: "Liverpool", homeScore: 1, awayScore: 2, status: "Live", sport: "Soccer" }
                ];
            case '/odds':
                return [
                    { match: "Bayern vs Dortmund", odds: { home: 2.1, draw: 3.2, away: 2.8 } }
                ];
            default:
                return [];
        }
    }

    filterNewContent(content, type) {
        const lastUpdateKey = `lastUpdate_${type}`;
        const lastUpdate = this.lastUpdate[lastUpdateKey] || 0;
        const now = Date.now();

        const newContent = content.filter(item => {
            // For simplicity, consider content new if we haven't checked in the last 5 minutes
            return now - lastUpdate > 5 * 60 * 1000;
        });

        this.lastUpdate[lastUpdateKey] = now;
        return newContent;
    }

    detectOddsChanges(odds) {
        // Simple odds change detection - in production, compare with previous values
        return odds.filter(odd => 
            (odd.odds?.home && odd.odds.home > 3.0) || 
            (odd.odds?.away && odd.odds.away < 1.5)
        ).map(odd => ({
            match: odd.match,
            change: `Home odds: ${odd.odds?.home || 'N/A'}`
        }));
    }

    isSportsWebsite(url) {
        if (!url) return false;
        
        const sportsSites = [
            'flashscore.com',
            'espn.com',
            'goal.com',
            'bet365.com',
            'draftkings.com',
            'fanduel.com',
            'sportsbet.com',
            'betfair.com',
            'sky.com/sports',
            'bbc.com/sport'
        ];

        return sportsSites.some(site => url.includes(site));
    }

    async injectEnhancements(tabId, url) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });

            await chrome.scripting.insertCSS({
                target: { tabId },
                files: ['overlay.css']
            });

        } catch (error) {
            console.error('Failed to inject content script:', error);
        }
    }

    showNotification(id, options) {
        chrome.notifications.create(id, {
            type: 'basic',
            ...options
        });

        // Handle notification clicks
        chrome.notifications.onClicked.addListener((notificationId) => {
            if (notificationId === id) {
                chrome.tabs.create({ url: 'https://sportscentral.app' });
                chrome.notifications.clear(notificationId);
            }
        });

        // Handle button clicks
        chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
            if (notificationId === id) {
                if (buttonIndex === 0) {
                    chrome.tabs.create({ url: 'https://sportscentral.app' });
                }
                chrome.notifications.clear(notificationId);
            }
        });
    }

    async updateBadge(count = 0) {
        if (count > 0) {
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#00ff88' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    }

    async cleanupCache() {
        // Clear old cached data
        const storage = await chrome.storage.local.get(null);
        const keysToRemove = Object.keys(storage).filter(key => 
            key.startsWith('cache_') && 
            Date.now() - (storage[key].timestamp || 0) > 30 * 60 * 1000 // 30 minutes
        );

        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
        }
    }

    startBackgroundUpdates() {
        // Initial badge update
        this.updateBadge();

        // Check for important updates every 30 seconds
        setInterval(() => {
            this.updateBadge();
        }, 30000);
    }
}

// Initialize background script
const extensionBackground = new ExtensionBackground();
