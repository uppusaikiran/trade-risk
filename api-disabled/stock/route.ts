import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const query = searchParams.get('q');

    // Handle stock search
    if (query) {
      try {
        const searchResults = await yahooFinance.search(query);
        
        // Debug logging to see what types are available
        if (searchResults.quotes && searchResults.quotes.length > 0) {
          const types = Array.from(new Set(searchResults.quotes.map((q: any) => q.typeDisp)));
          console.log('Available quote types:', types);
        }
        
        const results = searchResults.quotes
          .filter((quote: any) => {
            // Include Equities, ETFs, and other tradeable securities
            const allowedTypes = ['Equity', 'ETF', 'Fund', 'Index', 'Trust'];
            return allowedTypes.includes(quote.typeDisp) && quote.exchDisp && quote.symbol;
          })
          .slice(0, 10)
          .map((quote: any) => ({
            symbol: quote.symbol,
            name: quote.shortname || quote.longname || quote.symbol,
            type: quote.typeDisp
          }));
        
        return NextResponse.json(results);
      } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json([]);
      }
    }

    // Handle individual stock quote
    if (symbol) {
      try {
        const quote = await yahooFinance.quote(symbol);
        
        if (!quote) {
          return NextResponse.json(
            { error: `Stock ${symbol} not found` },
            { status: 404 }
          );
        }

        // Map Yahoo Finance data to our interface
        const stockData = {
          symbol: quote.symbol,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: (quote.regularMarketChangePercent || 0) * 100,
          regularMarketVolume: quote.regularMarketVolume || 0,
          marketCap: quote.marketCap || 0,
          trailingPE: quote.trailingPE,
          forwardPE: quote.forwardPE,
          dividendYield: (quote as any).dividendYield,
          beta: quote.beta,
          fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
          fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
          averageVolume: (quote as any).averageDailyVolume10Day || (quote as any).averageVolume || 0,
          shortName: quote.shortName || (quote as any).displayName || quote.symbol,
          longName: (quote as any).longName
        };

        return NextResponse.json(stockData);
      } catch (error) {
        console.error('Quote error:', error);
        return NextResponse.json(
          { error: `Failed to fetch data for ${symbol}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Missing symbol or query parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Stock API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 