import requests

url = "http://127.0.0.1:8000/api/run"
payload = {
    "tickers": "AAPL,MSFT",
    "start_date": "2024-01-01",
    "end_date": "2024-04-30",
    "initial_cash": 100000
}
response = requests.post(url, json=payload)
print("Status Code:", response.status_code)
print("Response:", response.text)
