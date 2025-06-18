import os
import pytest
from . import api
from datetime import datetime, timedelta

# Set up a valid API key for tests (if needed)
os.environ["FINANCIAL_DATASETS_API_KEY"] = os.environ.get("FINANCIAL_DATASETS_API_KEY", "demo")

def test_get_prices():
    ticker = "AAPL"
    end_date = datetime.today().strftime("%Y-%m-%d")
    start_date = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
    prices = api.get_prices(ticker, start_date, end_date)
    assert isinstance(prices, list)
    if prices:
        assert hasattr(prices[0], 'time')
        assert hasattr(prices[0], 'close')

def test_get_financial_metrics():
    ticker = "AAPL"
    end_date = datetime.today().strftime("%Y-%m-%d")
    metrics = api.get_financial_metrics(ticker, end_date)
    assert isinstance(metrics, list)
    if metrics:
        assert hasattr(metrics[0], 'report_period')
        assert hasattr(metrics[0], 'market_cap')

def test_get_company_news():
    ticker = "AAPL"
    end_date = datetime.today().strftime("%Y-%m-%d")
    news = api.get_company_news(ticker, end_date)
    assert isinstance(news, list)
    if news:
        assert hasattr(news[0], 'date')
        assert hasattr(news[0], 'title')

def test_get_insider_trades():
    ticker = "AAPL"
    end_date = datetime.today().strftime("%Y-%m-%d")
    trades = api.get_insider_trades(ticker, end_date)
    assert isinstance(trades, list)
    if trades:
        assert hasattr(trades[0], 'filing_date')
        assert hasattr(trades[0], 'issuer')

def test_search_line_items():
    ticker = "AAPL"
    end_date = datetime.today().strftime("%Y-%m-%d")
    line_items = ["revenue", "net_income"]
    results = api.search_line_items(ticker, line_items, end_date)
    assert isinstance(results, list)
    if results:
        assert hasattr(results[0], 'revenue')
        assert hasattr(results[0], 'net_income')

def test_get_market_cap():
    ticker = "AAPL"
    end_date = datetime.today().strftime("%Y-%m-%d")
    market_cap = api.get_market_cap(ticker, end_date)
    assert isinstance(market_cap, (int, float))
    assert market_cap > 0
