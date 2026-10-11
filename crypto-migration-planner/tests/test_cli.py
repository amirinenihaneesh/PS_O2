import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path

from crypto_migration_planner.cli import main


class CommandLineTests(unittest.TestCase):
    def test_analyse_writes_labeled_report_and_optional_inventory_export(self):
        sample = Path(__file__).parents[1] / "data" / "sample_inventory.csv"
        with tempfile.TemporaryDirectory() as temporary_directory:
            report_path = Path(temporary_directory) / "report.json"
            export_path = Path(temporary_directory) / "normalized.json"
            standard_output = io.StringIO()
            standard_error = io.StringIO()

            with contextlib.redirect_stdout(standard_output), contextlib.redirect_stderr(
                standard_error
            ):
                exit_code = main(
                    [
                        "analyse",
                        str(sample),
                        "--output",
                        str(report_path),
                        "--export-inventory",
                        str(export_path),
                    ]
                )

            report = json.loads(report_path.read_text(encoding="utf-8"))
            exported_inventory = json.loads(export_path.read_text(encoding="utf-8"))
            self.assertEqual(exit_code, 0)
            self.assertEqual(report["record_count"], 3)
            self.assertEqual(len(exported_inventory), 3)
            self.assertIn("not an official", standard_output.getvalue())
            self.assertEqual(standard_error.getvalue(), "")

    def test_invalid_inventory_returns_helpful_error_code(self):
        standard_output = io.StringIO()
        standard_error = io.StringIO()
        with contextlib.redirect_stdout(standard_output), contextlib.redirect_stderr(
            standard_error
        ):
            exit_code = main(
                ["analyse", "missing.csv", "--output", "unused.json"]
            )

        self.assertEqual(exit_code, 2)
        self.assertIn("Could not read", standard_error.getvalue())


if __name__ == "__main__":
    unittest.main()