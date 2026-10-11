import json
import tempfile
import unittest
from pathlib import Path

from crypto_migration_planner.inventory_io import export_inventory, load_inventory
from crypto_migration_planner.models import InventoryError
from crypto_migration_planner.planner import build_report, create_worklist


class InventoryIoTests(unittest.TestCase):
    def test_loads_csv_and_rejects_duplicate_identifiers(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            source = Path(temporary_directory) / "inventory.csv"
            source.write_text(
                "asset_id,system,algorithm,purpose\n"
                "one,demo,RSA,key exchange\n"
                "one,other,ECDSA,signing\n",
                encoding="utf-8",
            )
            with self.assertRaisesRegex(InventoryError, "duplicate asset_id 'one'"):
                load_inventory(source)

    def test_loads_json_and_reports_malformed_json(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            source = Path(temporary_directory) / "inventory.json"
            source.write_text(
                json.dumps(
                    [
                        {
                            "asset_id": "one",
                            "system": "demo",
                            "algorithm": "ECDSA",
                            "purpose": "signing",
                        }
                    ]
                ),
                encoding="utf-8",
            )
            self.assertEqual(load_inventory(source)[0].asset_id, "one")
            source.write_text("{not json", encoding="utf-8")
            with self.assertRaisesRegex(InventoryError, "Could not parse JSON"):
                load_inventory(source)

    def test_export_round_trip_preserves_normalized_inventory(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            source = Path(temporary_directory) / "source.json"
            exported = Path(temporary_directory) / "export.csv"
            source.write_text(
                json.dumps(
                    [
                        {
                            "asset_id": "one",
                            "system": "demo",
                            "algorithm": " RSA ",
                            "purpose": "signing",
                            "key_size_bits": "2048",
                        }
                    ]
                ),
                encoding="utf-8",
            )
            assets = load_inventory(source)
            export_inventory(assets, exported)

            self.assertEqual(load_inventory(exported), assets)

    def test_worklist_has_no_invented_rank_or_replacement(self):
        asset = load_inventory(
            Path(__file__).parents[1] / "data" / "sample_inventory.csv"
        )[0]

        work_item = create_worklist([asset])[0]
        report = build_report([asset])

        self.assertEqual(work_item.finding_status, "potential_public_key_quantum_risk")
        self.assertFalse(hasattr(work_item, "priority"))
        self.assertFalse(hasattr(work_item, "replacement_algorithm"))
        self.assertIn("not_official_hackathon_result", report["report_type"])


if __name__ == "__main__":
    unittest.main()