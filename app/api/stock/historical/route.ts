import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Suppress the historical deprecation notice since we've migrated to chart()
yahooFinance.suppressNotices(['ripHistorical']);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '1y';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing symbol parameter' },
        { status: 400 }
      );
    }

    try {
      // Convert period to Yahoo Finance format
      const periodMap: Record<string, string> = {
        '1m': '1mo',
        '3m': '3mo',
        '6m': '6mo',
        '1y': '1y'
      };

      const yahooApiPeriod = periodMap[period] || '1y';

      const chartData = await yahooFinance.chart(symbol, {
        period1: getStartDate(period),
        period2: new Date(),
        interval: '1d'
      });

      // Extract the quotes data from the chart response
      const quotes = chartData.quotes || [];
      
      const formattedData = quotes.map((item: any) => ({
        date: item.date.toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        period,
        data: formattedData
      });
    } catch (error) {
      console.error('Historical data fetch error:', error);
      return NextResponse.json(
        { error: `Failed to fetch historical data for ${symbol}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Historical data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getStartDate(period: string): Date {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setFullYear(endDate.getFullYear() - 1);
  }

  return startDate;
} 