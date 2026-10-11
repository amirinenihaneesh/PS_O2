"""Command-line entry point for the local inventory prototype."""

import argparse
import json
import sys
from pathlib import Path

from .inventory_io import export_inventory, load_inventory
from .models import InventoryError
from .planner import build_report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prototype crypto inventory triage (not official PS-P2 evaluation)."
    )
    commands = parser.add_subparsers(dest="command", required=True)
    analyse = commands.add_parser("analyse", help="validate an inventory and create a review report")
    analyse.add_argument("inventory", help="input .csv or .json file")
    analyse.add_argument("--output", required=True, help="output report .json file")
    analyse.add_argument(
        "--export-inventory",
        help="optional path to export the normalized inventory as .csv or .json",
    )
    return parser


def main(arguments: list[str] | None = None) -> int:
    parser = build_parser()
    options = parser.parse_args(arguments)

    if options.command == "analyse":
        try:
            assets = load_inventory(options.inventory)
            if options.export_inventory:
                export_inventory(assets, options.export_inventory)
            _write_report(build_report(assets), options.output)
        except InventoryError as error:
            print(f"Input/output error: {error}", file=sys.stderr)
            return 2

        print(f"Prototype triage complete: {len(assets)} record(s).")
        print(f"Review report written to {Path(options.output)}")
        print("This is not an official PS-P2 or Processor A/B result.")
        return 0

    parser.error("Unknown command.")
    return 2


def _write_report(report: dict[str, object], path: str | Path) -> None:
    destination = Path(path)
    if destination.suffix.casefold() != ".json":
        raise InventoryError("Report output must use the .json extension.")
    try:
        with destination.open("w", encoding="utf-8", newline="") as stream:
            json.dump(report, stream, indent=2)
            stream.write("\n")
    except OSError as error:
        raise InventoryError(
            f"Could not write report '{destination}': {error.strerror or error}."
        ) from error