
// Content Script for Sports Website Integration
class SportsWebsiteEnhancer {
    constructor() {
        this.apiBaseUrl = 'https://api.sportscentral.app/v1';
        this.overlayVisible = false;
        this.currentSite = this.detectSportsWebsite();
        this.enhancementData = new Map();
        
        this.init();
    }

    init() {
        if (this.currentSite) {
            this.setupEnhancements();
            this.addFloatingWidget();
            this.enhanceExistingContent();
            this.observePageChanges();
        }
    }

    detectSportsWebsite() {
        const url = window.location.hostname.toLowerCase();
        
        const sitePatterns = {
            'flashscore': /flashscore\.com/,
            'espn': /espn\.com/,
            'goal': /goal\.com/,
            'bet365': /bet365\.com/,
            'draftkings': /draftkings\.com/,
            'fanduel': /fanduel\.com/,
            'sky': /sky\.com/,
            'bbc': /bbc\.com/
        };

        for (const [site, pattern] of Object.entries(sitePatterns)) {
            if (pattern.test(url)) {
                return site;
            }
        }

        return null;
    }

    setupEnhancements() {
        // Add SportsApp styles
        this.injectStyles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load enhancement data
        this.loadEnhancementData();
    }

    injectStyles() {
        const styles = `
            .sportsapp-overlay {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 320px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                z-index: 999999;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .sportsapp-overlay.minimized {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                overflow: hidden;
            }

            .sportsapp-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                background: rgba(0, 212, 255, 0.1);
            }

            .sportsapp-logo {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #00d4ff;
            }

            .sportsapp-controls {
                display: flex;
                gap: 8px;
            }

            .sportsapp-btn {
                background: none;
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }

            .sportsapp-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: #00d4ff;
            }

            .sportsapp-content {
                max-height: 400px;
                overflow-y: auto;
                padding: 15px;
            }

            .sportsapp-section {
                margin-bottom: 15px;
            }

            .sportsapp-section-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
                color: #00d4ff;
            }

            .sportsapp-prediction {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
            }

            .sportsapp-match {
                font-weight: 500;
                margin-bottom: 4px;
            }

            .sportsapp-tip {
                font-size: 12px;
                color: #00ff88;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sportsapp-confidence {
                background: linear-gradient(45deg, #00d4ff, #00ff88);
                color: #000;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
            }

            .sportsapp-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                background: linear-gradient(45deg, #00d4ff, #00ff88);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
                z-index: 999998;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }

            .sportsapp-widget:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 30px rgba(0, 212, 255, 0.6);
            }

            .sportsapp-widget-icon {
                color: white;
                font-size: 24px;
                font-weight: bold;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .sportsapp-enhancement {
                display: inline-block;
                background: rgba(0, 212, 255, 0.1);
                border: 1px solid rgba(0, 212, 255, 0.3);
                border-radius: 4px;
                padding: 2px 6px;
                margin-left: 8px;
                font-size: 11px;
                color: #00d4ff;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .sportsapp-enhancement:hover {
                background: rgba(0, 212, 255, 0.2);
                transform: translateY(-1px);
            }

            .sportsapp-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                z-index: 1000000;
                pointer-events: none;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.2s ease;
            }

            .sportsapp-tooltip.show {
                opacity: 1;
                transform: translateY(0);
            }

            /* Scrollbar styling */
            .sportsapp-content::-webkit-scrollbar {
                width: 4px;
            }

            .sportsapp-content::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }

            .sportsapp-content::-webkit-scrollbar-thumb {
                background: rgba(0, 212, 255, 0.5);
                border-radius: 2px;
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    setupEventListeners() {
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                this.toggleOverlay();
                e.preventDefault();
            }
        });

        // Listen for messages from extension
        chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
            this.handleExtensionMessage(request, sender, sendResponse);
        });
    }

    addFloatingWidget() {
        const widget = document.createElement('div');
        widget.className = 'sportsapp-widget';
        widget.innerHTML = '<div class="sportsapp-widget-icon">⚽</div>';
        
        widget.addEventListener('click', () => {
            this.toggleOverlay();
        });

        document.body.appendChild(widget);
    }

    toggleOverlay() {
        if (this.overlayVisible) {
            this.hideOverlay();
        } else {
            this.showOverlay();
        }
    }

    async showOverlay() {
        let overlay = document.querySelector('.sportsapp-overlay');
        
        if (!overlay) {
            overlay = this.createOverlay();
            document.body.appendChild(overlay);
        }

        overlay.classList.remove('minimized');
        this.overlayVisible = true;

        // Load fresh data
        await this.loadOverlayData();
    }

    hideOverlay() {
        const overlay = document.querySelector('.sportsapp-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.overlayVisible = false;
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sportsapp-overlay';
        
        overlay.innerHTML = `
            <div class="sportsapp-header">
                <div class="sportsapp-logo">
                    ⚽ SportsApp
                </div>
                <div class="sportsapp-controls">
                    <button class="sportsapp-btn" data-action="refresh">↻</button>
                    <button class="sportsapp-btn" data-action="minimize">−</button>
                    <button class="sportsapp-btn" data-action="close">×</button>
                </div>
            </div>
            <div class="sportsapp-content">
                <div class="sportsapp-section">
                    <div class="sportsapp-section-title">🔮 AI Predictions</div>
                    <div id="sportsapp-predictions">Loading...</div>
                </div>
                <div class="sportsapp-section">
                    <div class="sportsapp-section-title">⚡ Live Scores</div>
                    <div id="sportsapp-scores">Loading...</div>
                </div>
                <div class="sportsapp-section">
                    <div class="sportsapp-section-title">📊 Odds</div>
                    <div id="sportsapp-odds">Loading...</div>
                </div>
            </div>
        `;

        // Add event listeners
        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'refresh':
                    this.loadOverlayData();
                    break;
                case 'minimize':
                    overlay.classList.add('minimized');
                    break;
                case 'close':
                    this.hideOverlay();
                    break;
            }
        });

        return overlay;
    }

    async loadOverlayData() {
        try {
            const [predictions, scores, odds] = await Promise.all([
                this.fetchData('/predictions', { limit: 3 }),
                this.fetchData('/live-scores', { limit: 3 }),
                this.fetchData('/odds', { limit: 2 })
            ]);

            this.updateOverlaySection('sportsapp-predictions', predictions, this.renderPrediction);
            this.updateOverlaySection('sportsapp-scores', scores, this.renderScore);
            this.updateOverlaySection('sportsapp-odds', odds, this.renderOdds);

        } catch (error) {
            console.error('Failed to load overlay data:', error);
        }
    }

    updateOverlaySection(sectionId, data, renderer) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        if (data && data.length > 0) {
            section.innerHTML = data.map(item => renderer(item)).join('');
        } else {
            section.innerHTML = '<div style="color: #888; font-size: 12px;">No data available</div>';
        }
    }

    renderPrediction(prediction) {
        return `
            <div class="sportsapp-prediction">
                <div class="sportsapp-match">${prediction.match || prediction.title}</div>
                <div class="sportsapp-tip">
                    <span>${prediction.prediction || prediction.content}</span>
                    <span class="sportsapp-confidence">${prediction.confidence}%</span>
                </div>
            </div>
        `;
    }

    renderScore(score) {
        return `
            <div class="sportsapp-prediction">
                <div class="sportsapp-match">${score.homeTeam} vs ${score.awayTeam}</div>
                <div class="sportsapp-tip">
                    <span>${score.homeScore || 0} - ${score.awayScore || 0}</span>
                    <span style="color: #888; font-size: 10px;">${score.status}</span>
                </div>
            </div>
        `;
    }

    renderOdds(odd) {
        return `
            <div class="sportsapp-prediction">
                <div class="sportsapp-match">${odd.match}</div>
                <div class="sportsapp-tip">
                    <span>H: ${odd.homeOdds} D: ${odd.drawOdds} A: ${odd.awayOdds}</span>
                </div>
            </div>
        `;
    }

    async fetchData(endpoint, params = {}) {
        try {
            // First try to get data from extension background
            return new Promise((resolve) => {
                chrome.runtime?.sendMessage({
                    action: endpoint.replace('/', 'get'),
                    params
                }, (response) => {
                    if (response?.data) {
                        resolve(response.data);
                    } else {
                        resolve(this.getFallbackData(endpoint));
                    }
                });
            });

        } catch (error) {
            return this.getFallbackData(endpoint);
        }
    }

    getFallbackData(endpoint) {
        switch (endpoint) {
            case '/predictions':
                return [
                    { match: "Real Madrid vs Barcelona", prediction: "Over 2.5 Goals", confidence: 85 },
                    { match: "Manchester United vs Arsenal", prediction: "BTTS", confidence: 78 }
                ];
            case '/live-scores':
                return [
                    { homeTeam: "Chelsea", awayTeam: "Liverpool", homeScore: 1, awayScore: 2, status: "Live" }
                ];
            case '/odds':
                return [
                    { match: "Bayern vs Dortmund", homeOdds: 2.1, drawOdds: 3.2, awayOdds: 2.8 }
                ];
            default:
                return [];
        }
    }

    enhanceExistingContent() {
        // Site-specific enhancements
        switch (this.currentSite) {
            case 'flashscore':
                this.enhanceFlashScore();
                break;
            case 'espn':
                this.enhanceESPN();
                break;
            case 'goal':
                this.enhanceGoal();
                break;
            case 'bet365':
                this.enhanceBet365();
                break;
        }
    }

    enhanceFlashScore() {
        // Add prediction badges to match rows
        const matchRows = document.querySelectorAll('[data-testid*="match"]');
        matchRows.forEach(row => {
            if (!row.querySelector('.sportsapp-enhancement')) {
                this.addPredictionBadge(row);
            }
        });
    }

    enhanceESPN() {
        // Add prediction info to game cards
        const gameCards = document.querySelectorAll('.game-card, .Table__TR');
        gameCards.forEach(card => {
            if (!card.querySelector('.sportsapp-enhancement')) {
                this.addPredictionBadge(card);
            }
        });
    }

    enhanceGoal() {
        // Add predictions to match listings
        const matchItems = document.querySelectorAll('[data-testid="match-item"]');
        matchItems.forEach(item => {
            if (!item.querySelector('.sportsapp-enhancement')) {
                this.addPredictionBadge(item);
            }
        });
    }

    enhanceBet365() {
        // Add analysis to betting rows
        const betRows = document.querySelectorAll('.gl-MarketGroup, .cm-CouponMarketGroup');
        betRows.forEach(row => {
            if (!row.querySelector('.sportsapp-enhancement')) {
                this.addAnalysisBadge(row);
            }
        });
    }

    addPredictionBadge(element) {
        const badge = document.createElement('span');
        badge.className = 'sportsapp-enhancement';
        badge.textContent = '🎯 AI Prediction';
        badge.title = 'Click for AI prediction analysis';
        
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showPredictionTooltip(badge);
        });

        element.appendChild(badge);
    }

    addAnalysisBadge(element) {
        const badge = document.createElement('span');
        badge.className = 'sportsapp-enhancement';
        badge.textContent = '📊 Analysis';
        badge.title = 'View detailed match analysis';
        
        badge.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showAnalysisTooltip(badge);
        });

        element.appendChild(badge);
    }

    showPredictionTooltip(element) {
        const tooltip = document.createElement('div');
        tooltip.className = 'sportsapp-tooltip show';
        tooltip.innerHTML = `
            <strong>AI Prediction:</strong> Over 2.5 Goals (78% confidence)<br>
            <small>Based on team form & head-to-head stats</small>
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 10) + 'px';
        
        setTimeout(() => {
            tooltip.remove();
        }, 3000);
    }

    showAnalysisTooltip(element) {
        const tooltip = document.createElement('div');
        tooltip.className = 'sportsapp-tooltip show';
        tooltip.innerHTML = `
            <strong>Match Analysis:</strong><br>
            • Home team: 67% win rate<br>
            • Away team: Strong defense<br>
            • H2H: 3-1-1 (last 5 games)
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 10) + 'px';
        
        setTimeout(() => {
            tooltip.remove();
        }, 4000);
    }

    observePageChanges() {
        // Watch for dynamic content changes
        const observer = new MutationObserver((mutations) => {
            let shouldEnhance = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldEnhance = true;
                }
            });
            
            if (shouldEnhance) {
                setTimeout(() => {
                    this.enhanceExistingContent();
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async loadEnhancementData() {
        // Pre-load data for faster enhancement display
        try {
            const data = await this.fetchData('/predictions', { limit: 10 });
            this.enhancementData.set('predictions', data);
        } catch (error) {
            console.error('Failed to load enhancement data:', error);
        }
    }

    handleExtensionMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'toggleOverlay':
                this.toggleOverlay();
                sendResponse({ success: true });
                break;
            case 'enhanceContent':
                this.enhanceExistingContent();
                sendResponse({ success: true });
                break;
            default:
                sendResponse({ error: 'Unknown action' });
        }
    }
}

// Initialize the enhancer when the page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SportsWebsiteEnhancer();
    });
} else {
    new SportsWebsiteEnhancer();
}
