"""CSV and JSON input/output for the explicitly provisional inventory schema."""

import csv
import json
from dataclasses import asdict
from pathlib import Path
from typing import Any

from .models import CryptoAsset, InventoryError, parse_asset


REQUIRED_FIELDS = ("asset_id", "system", "algorithm", "purpose")
EXPORT_FIELDS = (*REQUIRED_FIELDS, "key_size_bits")


def load_inventory(path: str | Path) -> list[CryptoAsset]:
    """Load a CSV or JSON inventory, rejecting malformed and duplicate records."""
    source = Path(path)
    suffix = source.suffix.casefold()

    try:
        if suffix == ".csv":
            with source.open("r", encoding="utf-8-sig", newline="") as stream:
                return _load_csv(stream)
        if suffix == ".json":
            with source.open("r", encoding="utf-8-sig") as stream:
                payload = json.load(stream)
            if not isinstance(payload, list):
                raise InventoryError("JSON inventory must contain a list of records.")
            return _validated_assets(payload)
    except json.JSONDecodeError as error:
        raise InventoryError(
            f"Could not parse JSON at line {error.lineno}, column {error.colno}: {error.msg}."
        ) from error
    except OSError as error:
        raise InventoryError(f"Could not read '{source}': {error.strerror or error}.") from error

    raise InventoryError("Inventory file must use the .csv or .json extension.")


def export_inventory(assets: list[CryptoAsset], path: str | Path) -> None:
    """Write normalized inventory records to a CSV or JSON file."""
    destination = Path(path)
    rows = [asdict(asset) for asset in assets]

    try:
        if destination.suffix.casefold() == ".json":
            with destination.open("w", encoding="utf-8", newline="") as stream:
                json.dump(rows, stream, indent=2)
                stream.write("\n")
            return
        if destination.suffix.casefold() == ".csv":
            with destination.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=EXPORT_FIELDS)
                writer.writeheader()
                writer.writerows(rows)
            return
    except OSError as error:
        raise InventoryError(
            f"Could not write '{destination}': {error.strerror or error}."
        ) from error

    raise InventoryError("Inventory export file must use the .csv or .json extension.")


def _load_csv(stream: Any) -> list[CryptoAsset]:
    reader = csv.DictReader(stream)
    if reader.fieldnames is None:
        raise InventoryError("CSV inventory is missing its header row.")
    missing = [field for field in REQUIRED_FIELDS if field not in reader.fieldnames]
    if missing:
        raise InventoryError(f"CSV is missing required column(s): {', '.join(missing)}.")
    return _validated_assets(list(reader), first_record_number=2)


def _validated_assets(records: list[Any], first_record_number: int = 1) -> list[CryptoAsset]:
    assets: list[CryptoAsset] = []
    seen_ids: set[str] = set()

    for offset, record in enumerate(records):
        record_number = first_record_number + offset
        if not isinstance(record, dict):
            raise InventoryError(f"Record {record_number}: expected an object of fields.")
        asset = parse_asset(record, record_number)
        if asset.asset_id in seen_ids:
            raise InventoryError(
                f"Record {record_number}: duplicate asset_id '{asset.asset_id}'."
            )
        seen_ids.add(asset.asset_id)
        assets.append(asset)

    if not assets:
        raise InventoryError("Inventory contains no records.")
    return assets