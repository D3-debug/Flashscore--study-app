
import axios from "axios";
import * as cheerio from "cheerio";
import { Match, IOdds } from "../models/Match.js";
import { ErrorLog } from "../models/ErrorLog.js";

/**
 * Generic scraper utility
 */
const scrapeWithRetry = async (url: string, retries = 3): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      return data;
    } catch (error) {
      console.warn(`Scrape attempt ${i + 1} failed for ${url}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
};

/**
 * Mock scraper for development (replace with real scraping logic)
 */
export const scrapeStakeOdds = async () => {
  try {
    console.log("🔍 Scraping Stake.com odds...");
    
    // Mock data for development - replace with real scraping
    const mockMatches = [
      {
        homeTeam: "Manchester United",
        awayTeam: "Arsenal",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        competition: "Premier League",
        odds: [
          {
            home: 2.1,
            draw: 3.4,
            away: 3.2,
            source: "stake.com",
            timestamp: new Date()
          }
        ]
      },
      {
        homeTeam: "Barcelona",
        awayTeam: "Real Madrid",
        date: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        competition: "La Liga",
        odds: [
          {
            home: 1.9,
            draw: 3.1,
            away: 4.2,
            source: "stake.com",
            timestamp: new Date()
          }
        ]
      }
    ];

    console.log(`✅ Scraped ${mockMatches.length} matches from Stake`);
    return mockMatches;

  } catch (error: any) {
    await ErrorLog.create({
      type: 'scraper',
      message: `Stake scraping failed: ${error.message}`,
      source: 'scrapeStakeOdds',
      severity: 'medium',
      stack: error.stack
    });
    console.error("❌ Stake scraping error:", error);
    return [];
  }
};

/**
 * Mock predictions scraper
 */
export const scrapeBetTodayPredictions = async () => {
  try {
    console.log("🔍 Scraping BetToday predictions...");
    
    // Mock prediction data
    const mockPredictions = [
      {
        homeTeam: "Liverpool",
        awayTeam: "Chelsea",
        prediction: "Liverpool Win",
        confidence: 78,
        date: new Date(Date.now() + 72 * 60 * 60 * 1000),
        competition: "Premier League"
      }
    ];

    console.log(`✅ Scraped ${mockPredictions.length} predictions from BetToday`);
    return mockPredictions;

  } catch (error: any) {
    await ErrorLog.create({
      type: 'scraper',
      message: `BetToday scraping failed: ${error.message}`,
      source: 'scrapeBetTodayPredictions',
      severity: 'medium',
      stack: error.stack
    });
    console.error("❌ BetToday scraping error:", error);
    return [];
  }
};

/**
 * Save scraped data to database with duplicate checking
 */
export const saveScrapedMatches = async () => {
  try {
    const odds = await scrapeStakeOdds();
    const predictions = await scrapeBetTodayPredictions();

    let savedCount = 0;
    let updatedCount = 0;

    // Save/update matches with odds
    for (const matchData of odds) {
      const existingMatch = await Match.findOne({
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        date: {
          $gte: new Date(matchData.date.getTime() - 60 * 60 * 1000), // 1 hour before
          $lte: new Date(matchData.date.getTime() + 60 * 60 * 1000)  // 1 hour after
        }
      });

      if (existingMatch) {
        // Update odds if newer
        const hasNewerOdds = matchData.odds.some(newOdd => 
          !existingMatch.odds.some(existingOdd => 
            existingOdd.source === newOdd.source && 
            existingOdd.timestamp >= newOdd.timestamp
          )
        );

        if (hasNewerOdds) {
          existingMatch.odds.push(...matchData.odds);
          existingMatch.scrapedAt = new Date();
          await existingMatch.save();
          updatedCount++;
          console.log(`🔄 Updated odds: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
        }
      } else {
        await Match.create({
          ...matchData,
          status: "scheduled",
          scrapedAt: new Date()
        });
        savedCount++;
        console.log(`✅ Saved new match: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
      }
    }

    return {
      success: true,
      savedCount,
      updatedCount,
      totalProcessed: odds.length + predictions.length
    };

  } catch (error: any) {
    await ErrorLog.create({
      type: 'scraper',
      message: `Save scraped matches failed: ${error.message}`,
      source: 'saveScrapedMatches',
      severity: 'high',
      stack: error.stack
    });
    
    console.error("❌ Save scraped matches error:", error);
    throw error;
  }
};

/**
 * Get upcoming matches from database
 */
export const getUpcomingMatches = async (limit = 20) => {
  try {
    const matches = await Match.find({
      date: { $gte: new Date() },
      status: { $in: ["scheduled", "live"] }
    })
    .sort({ date: 1 })
    .limit(limit)
    .populate('predictions');

    return matches;
  } catch (error: any) {
    console.error("❌ Get upcoming matches error:", error);
    throw error;
  }
};
