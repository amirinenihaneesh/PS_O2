import unittest

from crypto_migration_planner.classification import classify_asset
from crypto_migration_planner.models import InventoryError, parse_asset


class AssetParsingTests(unittest.TestCase):
    def test_parses_required_fields_and_optional_key_size(self):
        asset = parse_asset(
            {
                "asset_id": "key-1",
                "system": "payments-api",
                "algorithm": " RSA ",
                "purpose": "TLS certificate",
                "key_size_bits": "3072",
            }
        )

        self.assertEqual(asset.algorithm, "RSA")
        self.assertEqual(asset.key_size_bits, 3072)

    def test_rejects_missing_required_fields(self):
        with self.assertRaisesRegex(InventoryError, "algorithm, purpose"):
            parse_asset({"asset_id": "key-1", "system": "payments-api"}, 4)

    def test_rejects_unsupported_fields_instead_of_dropping_them(self):
        with self.assertRaisesRegex(InventoryError, "unsupported field.*owner"):
            parse_asset(
                {
                    "asset_id": "key-1",
                    "system": "payments-api",
                    "algorithm": "RSA",
                    "purpose": "TLS certificate",
                    "owner": "unmodeled field",
                }
            )

    def test_rejects_non_positive_or_invalid_key_size(self):
        record = {
            "asset_id": "key-1",
            "system": "payments-api",
            "algorithm": "RSA",
            "purpose": "TLS certificate",
            "key_size_bits": "large",
        }
        with self.assertRaisesRegex(InventoryError, "positive whole number"):
            parse_asset(record)

        record["key_size_bits"] = 0
        with self.assertRaisesRegex(InventoryError, "positive whole number"):
            parse_asset(record)


class ClassificationTests(unittest.TestCase):
    def test_flags_recognized_rsa_for_review_without_a_score(self):
        asset = parse_asset(
            {
                "asset_id": "key-1",
                "system": "payments-api",
                "algorithm": "RSA-3072",
                "purpose": "TLS certificate",
            }
        )

        finding = classify_asset(asset)

        self.assertEqual(finding.status, "potential_public_key_quantum_risk")
        self.assertIn("triage flag", finding.rationale)
        self.assertFalse(hasattr(finding, "score"))

    def test_unknown_and_unmodeled_algorithms_remain_manual_review(self):
        for algorithm in ("AES-256", "vendor-magic-crypto"):
            with self.subTest(algorithm=algorithm):
                asset = parse_asset(
                    {
                        "asset_id": "asset-1",
                        "system": "demo",
                        "algorithm": algorithm,
                        "purpose": "data protection",
                    }
                )
                self.assertEqual(classify_asset(asset).status, "manual_review")


if __name__ == "__main__":
    unittest.main()