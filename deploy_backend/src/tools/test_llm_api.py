import os
import pytest
try:
    from dotenv import load_dotenv, find_dotenv
    env_path = find_dotenv()
    load_dotenv(env_path, override=True)
    print('Loaded .env from:', env_path)
    print('OPENAI_API_KEY:', os.environ.get('OPENAI_API_KEY'))
    print('ANTHROPIC_API_KEY:', os.environ.get('ANTHROPIC_API_KEY'))
    print('GOOGLE_API_KEY:', os.environ.get('GOOGLE_API_KEY'))
    print('FINANCIAL_DATASETS_API_KEY:', os.environ.get('FINANCIAL_DATASETS_API_KEY'))
except ImportError:
    print('python-dotenv not installed')
from utils.llm import call_llm
from llm.models import get_model, ModelProvider
from pydantic import BaseModel

class DummyResponse(BaseModel):
    text: str

def skip_if_no_key(env_var):
    if not os.environ.get(env_var):
        pytest.skip(f"{env_var} not set")

def test_openai_llm():
    skip_if_no_key("OPENAI_API_KEY")
    model = get_model("gpt-3.5-turbo", ModelProvider.OPENAI)
    prompt = "Say hello from OpenAI"
    response = model.invoke(prompt)
    assert isinstance(response, str) or hasattr(response, 'content')

def test_anthropic_llm():
    skip_if_no_key("ANTHROPIC_API_KEY")
    model = get_model("claude-3-haiku-20240307", ModelProvider.ANTHROPIC)
    prompt = "Say hello from Anthropic"
    response = model.invoke(prompt)
    assert isinstance(response, str) or hasattr(response, 'content')

# def test_google_llm():
#     skip_if_no_key("GOOGLE_API_KEY")
#     model = get_model("gemini-pro", ModelProvider.GEMINI)
#     prompt = "Say hello from Gemini (Google)"
#     response = model.invoke(prompt)
#     assert isinstance(response, str) or hasattr(response, 'content')

def test_financialdatasets_api():
    skip_if_no_key("FINANCIAL_DATASETS_API_KEY")
    from tools import api
    ticker = "AAPL"
    end_date = "2024-12-31"
    start_date = "2024-12-01"
    prices = api.get_prices(ticker, start_date, end_date)
    assert isinstance(prices, list)
    if prices:
        assert hasattr(prices[0], 'time')
