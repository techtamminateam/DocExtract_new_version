import requests

def test_webhook():
    url = "https://hooks.zapier.com/hooks/catch/27482305/uv7rvag/"

    payload = {
        "event": "extraction.completed",
        "document_id": 101,
        "template": "invoice",
        "data": {
            "invoice_number": "INV-001",
            "vendor": "ABC Ltd",
            "amount": 5000
        }
    }

    response = requests.post(url, json=payload)
    print("Status:", response.status_code)
    print("Response:", response.text)

if __name__ == "__main__":
    test_webhook()