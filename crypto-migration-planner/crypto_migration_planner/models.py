"""Validated data model for the prototype inventory format."""

from dataclasses import dataclass
from typing import Any


class InventoryError(ValueError):
    """Raised when an inventory record is incomplete or malformed."""


@dataclass(frozen=True, slots=True)
class CryptoAsset:
    """A single cryptographic asset using the prototype's documented schema."""

    asset_id: str
    system: str
    algorithm: str
    purpose: str
    key_size_bits: int | None = None


def parse_asset(record: dict[str, Any], record_number: int = 1) -> CryptoAsset:
    """Validate one dictionary and convert it to a typed asset record."""
    required_fields = ("asset_id", "system", "algorithm", "purpose")
    allowed_fields = {*required_fields, "key_size_bits"}
    missing = [field for field in required_fields if _text(record.get(field)) is None]
    if missing:
        names = ", ".join(missing)
        raise InventoryError(f"Record {record_number}: missing required field(s): {names}.")
    unknown = sorted(str(field) for field in record if field not in allowed_fields)
    if unknown:
        raise InventoryError(
            f"Record {record_number}: unsupported field(s): {', '.join(unknown)}."
        )

    key_size = record.get("key_size_bits")
    if key_size in (None, ""):
        parsed_key_size = None
    else:
        try:
            parsed_key_size = int(key_size)
        except (TypeError, ValueError) as error:
            raise InventoryError(
                f"Record {record_number}: key_size_bits must be a positive whole number."
            ) from error
        if parsed_key_size <= 0:
            raise InventoryError(
                f"Record {record_number}: key_size_bits must be a positive whole number."
            )

    return CryptoAsset(
        asset_id=_text(record["asset_id"]),
        system=_text(record["system"]),
        algorithm=_text(record["algorithm"]),
        purpose=_text(record["purpose"]),
        key_size_bits=parsed_key_size,
    )


def _text(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None