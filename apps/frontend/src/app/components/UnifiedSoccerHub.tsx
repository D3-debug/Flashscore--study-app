
"use client";
import React, { useState, useEffect } from 'react';
import { useMobile } from '@hooks/useMobile';

interface SoccerMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  prediction?: string;
  confidence?: number;
}

interface DailyBet {
  id: string;
  match: string;
  prediction: string;
  odds: number;
  status: 'pending' | 'won' | 'lost';
  amount: number;
}

const UnifiedSoccerHub: React.FC = () => {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState('live');
  const [matches, setMatches] = useState<SoccerMatch[]>([]);
  const [dailyBets, setDailyBets] = useState<DailyBet[]>([]);
  const [aiPredictions, setAIPredictions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Simulated data - replace with real API calls
  useEffect(() => {
    setMatches([
      {
        id: '1',
        homeTeam: 'Manchester United',
        awayTeam: 'Chelsea',
        time: '15:30',
        odds: { home: 2.1, draw: 3.4, away: 3.2 },
        prediction: 'Home Win',
        confidence: 78
      },
      {
        id: '2',
        homeTeam: 'Liverpool',
        awayTeam: 'Arsenal',
        time: '18:00',
        odds: { home: 1.8, draw: 3.6, away: 4.2 },
        prediction: 'Over 2.5 Goals',
        confidence: 85
      }
    ]);

    setDailyBets([
      {
        id: '1',
        match: 'Real Madrid vs Barcelona',
        prediction: 'Both Teams to Score',
        odds: 1.85,
        status: 'pending',
        amount: 50
      }
    ]);
  }, []);

  const containerStyle = {
    minHeight: '100vh',
    background: isMobile 
      ? 'linear-gradient(145deg, #000000 0%, #1a1a2e 50%, #16213e 100%)'
      : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(20px)',
    borderRadius: isMobile ? '16px' : '20px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: isMobile 
      ? '0 8px 32px rgba(0, 255, 136, 0.15)' 
      : '0 16px 64px rgba(0, 255, 136, 0.2)',
    padding: isMobile ? '16px' : '24px',
    margin: '12px',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  };

  const TabButton = ({ id, label, icon, isActive }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        background: isActive 
          ? 'linear-gradient(135deg, #00ff88, #00a2ff)' 
          : 'rgba(255, 255, 255, 0.1)',
        color: isActive ? '#000' : '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: isMobile ? '60px' : '80px',
        justifyContent: 'center'
      }}
    >
      <span>{icon}</span>
      {!isMobile && <span>{label}</span>}
    </button>
  );

  const MatchCard = ({ match }: { match: SoccerMatch }) => (
    <div style={{
      ...glassCardStyle,
      background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 162, 255, 0.05) 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60px',
        height: '60px',
        background: 'radial-gradient(circle, rgba(0, 255, 136, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 2s infinite'
      }} />
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #00ff88, #ffffff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {match.homeTeam} vs {match.awayTeam}
          </h3>
          <p style={{ 
            margin: '4px 0 0 0', 
            color: '#a0a0a0',
            fontSize: '14px'
          }}>
            ⏰ {match.time} | 🎯 {match.prediction} ({match.confidence}%)
          </p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '8px' 
      }}>
        {[
          { label: match.homeTeam.split(' ')[0], odds: match.odds.home, type: 'home' },
          { label: 'Draw', odds: match.odds.draw, type: 'draw' },
          { label: match.awayTeam.split(' ')[0], odds: match.odds.away, type: 'away' }
        ].map((bet, idx) => (
          <button
            key={idx}
            style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              padding: '10px 8px',
              color: '#00ff88',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 136, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '10px', opacity: 0.8 }}>{bet.label}</div>
            <div style={{ fontSize: '14px', fontWeight: '700' }}>{bet.odds}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const AIInsightCard = () => (
    <div style={{
      ...glassCardStyle,
      background: 'linear-gradient(135deg, rgba(0, 162, 255, 0.1) 0%, rgba(138, 43, 226, 0.05) 100%)'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #00a2ff, #8a2be2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🤖 AI Soccer Insights
      </h3>
      
      <div style={{ 
        background: 'rgba(0, 162, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(0, 162, 255, 0.2)'
      }}>
        <p style={{ margin: '0 0 12px 0', color: '#00a2ff', fontWeight: '600' }}>
          🎯 Today's Top Prediction
        </p>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', lineHeight: '1.6' }}>
          Manchester City vs Tottenham: <strong>Over 2.5 Goals</strong> (89% confidence)
        </p>
        <p style={{ margin: '0', fontSize: '12px', color: '#a0a0a0' }}>
          Based on recent form, head-to-head, and statistical analysis
        </p>
      </div>
    </div>
  );

  const DailyBetTracker = () => (
    <div style={glassCardStyle}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: '#fbbf24',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📊 Today's Bets
      </h3>
      
      {dailyBets.map(bet => (
        <div key={bet.id} style={{
          background: 'rgba(251, 191, 36, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '8px',
          border: '1px solid rgba(251, 191, 36, 0.3)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>{bet.match}</span>
            <span style={{
              background: bet.status === 'pending' ? '#f59e0b' : bet.status === 'won' ? '#22c55e' : '#ef4444',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {bet.status}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#a0a0a0' }}>
            {bet.prediction} @ {bet.odds} | Amount: π{bet.amount}
          </div>
        </div>
      ))}
    </div>
  );

  const LiveNotifications = () => (
    <div style={{
      position: 'fixed',
      top: isMobile ? '80px' : '20px',
      right: '20px',
      zIndex: 1000,
      width: isMobile ? 'calc(100% - 40px)' : '300px'
    }}>
      {notifications.map((notification, idx) => (
        <div key={idx} style={{
          background: 'rgba(0, 255, 136, 0.95)',
          color: '#000',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 16px rgba(0, 255, 136, 0.3)',
          animation: 'slideInRight 0.3s ease'
        }}>
          {notification}
        </div>
      ))}
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(20px)',
        padding: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #00ff88, #00a2ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          ⚽ Soccer Central Hub
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        padding: '16px',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <TabButton id="live" label="Live" icon="🔴" isActive={activeTab === 'live'} />
        <TabButton id="predictions" label="AI" icon="🤖" isActive={activeTab === 'predictions'} />
        <TabButton id="bets" label="Bets" icon="📊" isActive={activeTab === 'bets'} />
        <TabButton id="stats" label="Stats" icon="📈" isActive={activeTab === 'stats'} />
        <TabButton id="news" label="News" icon="📰" isActive={activeTab === 'news'} />
      </div>

      {/* Content Area */}
      <div style={{ padding: '0 4px 100px 4px' }}>
        {activeTab === 'live' && (
          <div>
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {activeTab === 'predictions' && <AIInsightCard />}
        {activeTab === 'bets' && <DailyBetTracker />}

        {activeTab === 'stats' && (
          <div style={glassCardStyle}>
            <h3 style={{ color: '#22c55e', marginBottom: '16px' }}>📈 Performance Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#00ff88' }}>78%</div>
                <div style={{ fontSize: '12px', color: '#a0a0a0' }}>Win Rate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#00a2ff' }}>+245π</div>
                <div style={{ fontSize: '12px', color: '#a0a0a0' }}>This Week</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div style={glassCardStyle}>
            <h3 style={{ color: '#fbbf24', marginBottom: '16px' }}>📰 Latest Soccer News</h3>
            <div style={{ space: '12px 0' }}>
              <div style={{ 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                paddingBottom: '12px',
                marginBottom: '12px'
              }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff' }}>
                  Transfer Window Update
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#a0a0a0' }}>
                  Latest transfers affecting betting odds...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <LiveNotifications />

      {/* Floating Action Button for Quick Bet */}
      {isMobile && (
        <button
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00ff88, #00a2ff)',
            border: 'none',
            color: '#000',
            fontSize: '24px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 255, 136, 0.4)',
            zIndex: 1000,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ⚡
        </button>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default UnifiedSoccerHub;
