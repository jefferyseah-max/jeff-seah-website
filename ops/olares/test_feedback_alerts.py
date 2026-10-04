import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("alerts", Path(__file__).with_name("jeffseah-feedback-alerts.py"))
alerts = importlib.util.module_from_spec(spec)
spec.loader.exec_module(alerts)


class OutboxTest(unittest.TestCase):
    def record(self, **changes):
        n = {"version": "annual-feedback-alert-v1", "state": "pending", "origin": alerts.ORIGIN, "token": "private-token", "test": False}
        n.update(changes)
        return {"route": "sample-2027-abcdef1234", "submission": {"id": "response-id"}, "notification": n}

    def test_pending_is_retried_and_sent_is_not(self):
        sent=[]
        def retry(url):
            sent.append(url)
            return {"state": "sent"}
        self.assertEqual(alerts.process_record(self.record(), 100, retry), "sent")
        self.assertEqual(len(sent), 1)
        self.assertEqual(alerts.process_record(self.record(state="sent"), 100, retry), "skip")
        self.assertEqual(len(sent), 1)

    def test_backoff_and_claim_are_respected_but_expired_claim_recovers(self):
        def retry(url): return {"state": "sent"}
        self.assertEqual(alerts.process_record(self.record(nextAttemptAt=200), 100, retry), "waiting")
        self.assertEqual(alerts.process_record(self.record(leaseUntil=200), 100, retry), "waiting")
        self.assertEqual(alerts.process_record(self.record(state="sending", leaseUntil=90), 100, retry), "sent")

    def test_pending_failure_and_unexpected_host_surface(self):
        with self.assertRaises(RuntimeError): alerts.process_record(self.record(), 100, lambda url: {"state": "pending"})
        with self.assertRaises(ValueError): alerts.process_record(self.record(origin="https://evil.example"), 100, lambda url: {"state": "sent"})
        self.assertEqual(alerts.process_record({"submission": {"id": "legacy"}}, 100, None), "skip")


if __name__ == "__main__": unittest.main()
