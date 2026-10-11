"""Non-ranked review worklist for the prototype."""

from dataclasses import asdict, dataclass

from .classification import classify_asset
from .models import CryptoAsset


@dataclass(frozen=True, slots=True)
class WorkItem:
    """A next-step reminder; it intentionally contains no score or rank."""

    asset_id: str
    finding_status: str
    next_step: str


def create_worklist(assets: list[CryptoAsset]) -> list[WorkItem]:
    """Create review actions without choosing replacement algorithms or priority."""
    items = []
    for asset in assets:
        finding = classify_asset(asset)
        items.append(
            WorkItem(
                asset_id=asset.asset_id,
                finding_status=finding.status,
                next_step=finding.next_step,
            )
        )
    return items


def build_report(assets: list[CryptoAsset]) -> dict[str, object]:
    """Build a serializable report clearly marked as prototype output."""
    records = []
    for asset in assets:
        finding = classify_asset(asset)
        records.append(
            {
                "asset": asdict(asset),
                "finding": asdict(finding),
                "work_item": asdict(
                    WorkItem(
                        asset_id=asset.asset_id,
                        finding_status=finding.status,
                        next_step=finding.next_step,
                    )
                ),
            }
        )
    return {
        "report_type": "local_prototype_triage_not_official_hackathon_result",
        "notice": (
            "Prototype output only. No official PS-P2 scoring, migration mapping, "
            "or Processor A/B benchmark has been applied."
        ),
        "record_count": len(records),
        "records": records,
    }