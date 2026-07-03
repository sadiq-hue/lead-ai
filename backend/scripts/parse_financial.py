#!/usr/bin/env python3
"""
NSE Financial Statement Parser
Extracts financial metrics from PDF disclosures using regex first,
with optional GPT-4o-mini LLM fallback when regex doesn't find enough data.
Called by Express: python3 parse_financial.py --docId <id> --path <pdf_path> --webhook <url>
"""

import argparse
import json
import re
import sys
import os
import requests
from pypdf import PdfReader

KEY_METRICS = ["revenue", "net_profit", "eps", "total_assets"]
MIN_METRICS_FOR_SUCCESS = 2

TICKER_MAP = {
    "safaricom": "SCOM", "equity group": "EQTY", "kcb group": "KCB",
    "co-operative bank": "COOP", "absa bank": "ABSA", "stanbic": "STAN",
    "diamond trust": "DTK", "i&m holdings": "I&M", "ncba group": "NCBA",
    "britam": "BRCH", "jubilee": "JUBP", "cic insurance": "CIC",
    "totalenergies": "TPET", "east african portland": "EAPC",
    "kengen": "KEGN", "kenya power": "KPLC", "east african breweries": "EABL",
    "british american tobacco": "BAT", "liberty kenya": "LBTY",
    "centum": "CTUM", "bamburi": "BAMB", "kakuzi": "KUKZ",
    "sasini": "SASN", "sameer africa": "SMER", "nairobi securities exchange": "NSE",
}


def extract_text_from_pdf(pdf_path: str) -> str:
    reader = PdfReader(pdf_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages)


def normalize_text(text: str) -> str:
    lines = text.split("\n")
    cleaned = [line.strip() for line in lines if line.strip()]
    return "\n".join(cleaned)


def parse_number(val: str) -> float | None:
    if not val:
        return None
    val = val.strip()
    negative = False
    if val.startswith("(") and val.endswith(")"):
        negative = True
        val = val[1:-1]
    val = re.sub(r'[Kk][Ee][Ss]\s*', '', val)
    val = re.sub(r'[Kk][Ss][Hh][Ss]?\s*', '', val)
    val = re.sub(r'[Ss][Hh][Ss]?\s*', '', val)
    val = re.sub(r'[Kk][Ss]\s*', '', val)
    val = re.sub(r'[, ]', '', val)
    val = val.strip()
    if not val:
        return None
    multiplier = 1
    if re.search(r'[bB][nN]|[bB]illion', val):
        multiplier = 1_000_000_000
        val = re.sub(r'[bB][nN]|[bB]illion', '', val)
    elif re.search(r'[mM][nN]|[mM]illion', val):
        multiplier = 1_000_000
        val = re.sub(r'[mM][nN]|[mM]illion', '', val)
    elif re.search(r'[tT][hH]|[tT]housand', val):
        multiplier = 1_000
        val = re.sub(r'[tT][hH]|[tT]housand', '', val)
    val = val.strip()
    try:
        num = float(val)
        if negative:
            num = -num
        return num * multiplier
    except ValueError:
        return None


def find_value_on_line(text: str, patterns: list[str], line_after: int = 0) -> float | None:
    lines = text.split("\n")
    for i, line in enumerate(lines):
        for pat in patterns:
            if pat.lower() in line.lower():
                target_idx = min(i + line_after, len(lines) - 1)
                target_line = lines[target_idx]
                numbers = re.findall(
                    r'[(]?[\d,]+\.?\d*\s*(?:[mMnNbB][nN]?|illion|illion)?[)]?',
                    target_line
                )
                if numbers:
                    parsed = [parse_number(n) for n in numbers]
                    parsed = [p for p in parsed if p is not None]
                    if parsed:
                        return parsed[-1]
    return None


def find_company_name(text: str) -> tuple[str, str]:
    first_lines = "\n".join(text.split("\n")[:15])
    common_suffixes = r'(?:PLC|Ltd|Limited|Holdings|Group|Bank|Insurance)\s*(?:PLC|Ltd|Limited)?'
    match = re.search(rf'([A-Z][A-Za-z\s&.,]+{common_suffixes})', first_lines)
    name = match.group(1).strip() if match else "Unknown"
    name_lower = name.lower()
    for key, ticker in TICKER_MAP.items():
        if key in name_lower:
            return name, ticker
    ticker_match = re.search(r'\b([A-Z]{2,5})\b', first_lines)
    ticker = ticker_match.group(1) if ticker_match else "N/A"
    return name, ticker


def find_fiscal_period(text: str) -> tuple[int, str]:
    first_lines = "\n".join(text.split("\n")[:20])
    year_match = re.search(
        r'(?:year|period|quarter|half\s*year|six\s*months?)\s*'
        r'(?:ended|ending)?\s*\d{1,2}\s*(?:january|february|march|april|may|june|'
        r'july|august|september|october|november|december)\s*(\d{4})',
        first_lines, re.IGNORECASE
    )
    if year_match:
        year = int(year_match.group(1))
    else:
        years = re.findall(r'\b(20\d{2})\b', first_lines)
        year = max(int(y) for y in years) if years else 2025
    period = "FY"
    if re.search(r'\bhalf\s*year\b|\bsix\s*months?\b|\bH1\b|\binterim\b', first_lines, re.IGNORECASE):
        period = "H1"
    elif re.search(r'\bquarter\b|\bQ[1-4]\b|\bthree\s*months?\b', first_lines, re.IGNORECASE):
        period = "Q1"
    return year, period


def extract_financials_regex(text: str) -> dict:
    normalized = normalize_text(text)
    if len(normalized) < 50:
        return {"error": "Text too short, likely a scanned document"}

    company_name, ticker = find_company_name(normalized)
    fiscal_year, period = find_fiscal_period(normalized)

    revenue = find_value_on_line(normalized, [
        "total revenue", "total income", "gross revenue", "revenue from",
        "operating revenue", "turnover", "revenue"
    ])
    net_profit = find_value_on_line(normalized, [
        "profit for the year", "profit after tax", "net profit",
        "profit/(loss) for the year", "total comprehensive income",
        "profit attributable", "net income", "profit before tax"
    ])
    operating_profit = find_value_on_line(normalized, [
        "operating profit", "profit from operations", "ebit", "operating income"
    ])
    gross_profit = find_value_on_line(normalized, ["gross profit", "gross margin"])
    eps = find_value_on_line(normalized, [
        "earnings per share", "basic earnings per share", "eps", "basic eps"
    ])
    dps = find_value_on_line(normalized, [
        "dividend per share", "dps", "dividend declared",
        "proposed dividend", "final dividend", "interim dividend"
    ])
    total_assets = find_value_on_line(normalized, [
        "total assets", "total assets employed", "total assets/liabilities"
    ])
    total_liabilities = find_value_on_line(normalized, [
        "total liabilities", "total equity and liabilities",
        "total current liabilities", "total non-current liabilities",
        "total liabilities and equity"
    ])
    book_value = find_value_on_line(normalized, [
        "book value per share", "net asset value per share", "nav per share"
    ])

    return {
        "company_name": company_name, "ticker": ticker,
        "fiscal_year": fiscal_year, "period": period,
        "revenue": revenue, "net_profit": net_profit,
        "eps": eps, "dps": dps,
        "total_assets": total_assets, "total_liabilities": total_liabilities,
        "book_value": book_value,
        "operating_profit": operating_profit, "gross_profit": gross_profit,
    }


def extract_financials_llm(raw_text: str, api_key: str, model: str, base_url: str | None = None) -> dict:
    from openai import OpenAI

    client_kwargs = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url
    client = OpenAI(**client_kwargs)

    system_prompt = """Extract financial metrics from this NSE Kenya financial statement text. Return ONLY valid JSON with these fields (use null if not found):
{
  "company_name": "string",
  "ticker": "string (NSE ticker symbol)",
  "fiscal_year": 2025,
  "period": "FY|H1|H2|Q1|Q2|Q3|Q4",
  "revenue": 0,
  "net_profit": 0,
  "eps": 0,
  "dps": 0,
  "total_assets": 0,
  "total_liabilities": 0,
  "book_value": 0,
  "operating_profit": 0,
  "gross_profit": 0
}
Rules: Convert all amounts to absolute KES numbers (billion/million → full integers). Extract most recent period only. Return ONLY the JSON."""

    response = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Extract financial data:\n\n{raw_text[:15000]}"}
        ],
        temperature=0.1,
        max_tokens=2000
    )
    return json.loads(response.choices[0].message.content)


def post_to_webhook(webhook_url: str, payload: dict) -> bool:
    try:
        resp = requests.post(webhook_url, json=payload, timeout=30)
        resp.raise_for_status()
        print(f"Webhook response: {resp.status_code}")
        return True
    except requests.RequestException as e:
        print(f"Webhook error: {e}", file=sys.stderr)
        return False


def count_metrics(d: dict) -> int:
    return sum(1 for k in KEY_METRICS if d.get(k) is not None)


def main():
    parser = argparse.ArgumentParser(description="Parse NSE financial statement PDF")
    parser.add_argument("--docId", required=True)
    parser.add_argument("--path", required=True)
    parser.add_argument("--webhook", required=True)
    parser.add_argument("--apiKey", default=os.environ.get("OPENAI_API_KEY", ""))
    parser.add_argument("--model", default=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"))
    parser.add_argument("--baseUrl", default=os.environ.get("OPENAI_BASE_URL", ""))
    args = parser.parse_args()

    # Step 1: Extract text from PDF
    print(f"Extracting text from: {args.path}")
    raw_text = extract_text_from_pdf(args.path)
    if not raw_text.strip():
        post_to_webhook(args.webhook, {
            "docId": args.docId, "status": "failed",
            "error": "No text could be extracted from PDF"
        })
        sys.exit(1)
    print(f"Extracted {len(raw_text)} characters")

    # Step 2: Try regex first (free, zero cost)
    print("Attempting regex extraction...")
    extracted = extract_financials_regex(raw_text)
    found = count_metrics(extracted)
    print(f"Regex found {found}/{len(KEY_METRICS)} key metrics")

    # Step 3: Fall back to LLM if regex didn't find enough (and API key is available)
    used_llm = False
    if found < MIN_METRICS_FOR_SUCCESS and args.apiKey:
        print(f"Regex insufficient, falling back to LLM ({args.model})...")
        try:
            extracted = extract_financials_llm(raw_text, args.apiKey, args.model, args.baseUrl or None)
            used_llm = True
            print(f"LLM extraction complete")
        except Exception as e:
            print(f"LLM fallback failed: {e}", file=sys.stderr)

    # Step 4: Post results
    found = count_metrics(extracted)
    status = "completed" if found >= 1 or used_llm else "failed"

    payload = {
        "docId": args.docId,
        "status": status,
        "raw_text": raw_text[:5000],
        "extracted": extracted,
        "used_llm": used_llm,
        "error": None if found >= 1 else "Could not extract sufficient financial data"
    }
    print(f"Status: {status} | Metrics found: {found}/{len(KEY_METRICS)} | Used LLM: {used_llm}")
    success = post_to_webhook(args.webhook, payload)

    if success:
        print("Done.")
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
