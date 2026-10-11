"""Small, non-scoring prototype rules for manual quantum-risk triage."""

from dataclasses import dataclass
import re

from .models import CryptoAsset


@dataclass(frozen=True, slots=True)
class Finding:
    """A transparent finding that avoids numerical risk or priority scores."""

    asset_id: str
    status: str
    rationale: str
    next_step: str


_POTENTIALLY_VULNERABLE_PUBLIC_KEY_NAMES = {
    "rsa",
    "dsa",
    "dh",
    "diffiehellman",
    "ecdh",
    "ellipticcurveDiffieHellman".casefold(),
    "ecdsa",
    "ellipticcurvedigitalsignaturealgorithm",
}


def classify_asset(asset: CryptoAsset) -> Finding:
    """Flag a narrow set of public-key families; leave all others for review.

    The rule is a prototype triage hint, not an official PS-P2 classification.
    It does not infer that unlisted algorithms are quantum-safe.
    """
    normalized_name = re.sub(r"[^a-z0-9]", "", asset.algorithm.casefold())
    normalized_name = re.sub(r"\d+$", "", normalized_name)
    if normalized_name in _POTENTIALLY_VULNERABLE_PUBLIC_KEY_NAMES:
        return Finding(
            asset_id=asset.asset_id,
            status="potential_public_key_quantum_risk",
            rationale=(
                "This recognized classical public-key family relies on a problem "
                "that could be threatened by a sufficiently capable fault-tolerant "
                "quantum computer. This is a triage flag, not a compromise prediction."
            ),
            next_step=(
                "Confirm the algorithm's actual use and dependencies, then obtain "
                "an approved migration mapping from the organizers or a qualified reviewer."
            ),
        )

    return Finding(
        asset_id=asset.asset_id,
        status="manual_review",
        rationale=(
            "This prototype does not have a verified classification rule for this "
            "algorithm; no conclusion about quantum safety is implied."
        ),
        next_step="Verify the algorithm, purpose, and approved assessment rule manually.",
    )