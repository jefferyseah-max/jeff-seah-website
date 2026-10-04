#!/usr/bin/env python3
"""Retry saved feedback email outbox entries. Never print tokens, URLs or client answers."""
import argparse
import json
import os
import sys
import time
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

ORIGIN = "https://reports.jeffseah.rocks"
ACCOUNT = "1c0411edfef5f2f1261593abd66fe799"
BUCKET = "jeffseah-annual-private"
API = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects"


def read_json(url, headers=None, method="GET"):
    with urlopen(Request(url, headers=headers or {}, method=method), timeout=40) as response:
        return json.load(response)


def process_record(record, now, retry):
    notice = record.get("notification") or {}
    if not record.get("submission") or notice.get("version") != "annual-feedback-alert-v1" or notice.get("state") == "sent":
        return "skip"
    if notice.get("origin") != ORIGIN or notice.get("test"):
        raise ValueError("Unexpected production outbox source")
    if max(notice.get("leaseUntil") or 0, notice.get("nextAttemptAt") or 0) > now:
        return "waiting"
    result = retry(f"{ORIGIN}/r/{record['route']}/__feedback-alert/{record['submission']['id']}/{notice['token']}")
    if result.get("state") == "sent":
        return "sent"
    if result.get("state") == "sending":
        return "waiting"
    raise RuntimeError("Email notification remains pending")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--alarm-test", action="store_true", help="Deliberate synthetic failure to verify monitoring")
    args = parser.parse_args()
    if args.alarm_test:
        print("TEST: deliberate feedback alert monitoring failure", file=sys.stderr)
        return 1
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    if not token:
        print("Feedback alerts: required service credential unavailable", file=sys.stderr)
        return 1
    headers = {"Authorization": "Bearer " + token}
    counts = {"skip": 0, "waiting": 0, "sent": 0, "failed": 0}
    cursor = ""
    try:
        while True:
            params = {"prefix": "feedback/", "per_page": 1000}
            if cursor:
                params["cursor"] = cursor
            listing = read_json(API + "?" + urlencode(params), headers)
            if not listing.get("success") or not isinstance(listing.get("result"), list):
                raise RuntimeError("Outbox list could not be verified")
            for item in listing["result"]:
                try:
                    record = read_json(API + "/" + quote(item["key"], safe="/"), headers)
                    outcome = process_record(record, int(time.time()), lambda url: read_json(url, method="POST"))
                    counts[outcome] += 1
                except Exception:
                    counts["failed"] += 1
                    print("Feedback alert retry failed for one saved response", file=sys.stderr)
            info = listing.get("result_info") or {}
            next_cursor = info.get("cursor")
            if not next_cursor:
                if len(listing["result"]) >= 1000 or info.get("is_truncated"):
                    raise RuntimeError("Outbox pagination could not be verified")
                break
            if next_cursor == cursor:
                raise RuntimeError("Outbox cursor did not advance")
            cursor = next_cursor
    except Exception:
        print("Feedback alerts: could not verify the private outbox", file=sys.stderr)
        return 1
    print(json.dumps(counts, sort_keys=True))
    return 1 if counts["failed"] else 0


if __name__ == "__main__":
    sys.exit(main())
