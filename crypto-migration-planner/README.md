# PS-P2 Crypto Inventory & Migration Planner

> **Status: Non-compliant prototype.** The supplied PDFs identify PS-P2 and describe general Phase 1 rules, but the official PS-P2 specification, starter pack, Processor A/B configuration files, benchmark contract, and evaluation metrics were not available when this prototype was built. This project must not be presented as an official or compliant hackathon submission yet.

This small Python prototype reads a sample crypto inventory, validates it, applies a narrow and clearly explained public-key triage rule, and writes a review worklist. It is separate from the existing Next.js applications in the workspace.

## What It Does

- Reads CSV or JSON using the prototype schema below.
- Rejects missing required values, unsupported columns/fields, malformed key sizes, and duplicate asset IDs.
- Flags a small set of classical public-key algorithm names for human review.
- Sends unknown and unmodeled algorithms to manual review; it does **not** imply that unflagged algorithms are quantum-safe.
- Exports normalized inventory and a JSON triage report.
- Produces no numerical risk score, priority rank, or PQC replacement recommendation.

The sample file is synthetic demonstration data, not an organizer-provided dataset. Prototype results are not Processor A/B benchmark results.

## Project Files

- `main.py`: beginner-friendly command-line entry point.
- `crypto_migration_planner/models.py`: data record and field validation.
- `crypto_migration_planner/inventory_io.py`: CSV/JSON loading and inventory export.
- `crypto_migration_planner/classification.py`: deliberately narrow, non-scored triage rule.
- `crypto_migration_planner/planner.py`: unranked review worklist and report data.
- `crypto_migration_planner/cli.py`: command-line arguments, output, and error messages.
- `data/sample_inventory.csv`: synthetic input kept separate from official configuration.
- `tests/`: automated unit and CLI integration tests.
- `docs/requirements-traceability.md`: confirmed general requirements and blocked PS-P2 items.
- `docs/organizer-questions.md`: exact materials and clarifications to request.
- `docs/technical-report.md`: current method, evidence, limitations, and pending benchmark sections.

## Prototype Input Format

This is a temporary prototype schema, **not** an official PS-P2 input format.

| Field | Required | Meaning |
|---|---|---|
| `asset_id` | Yes | Unique inventory row identifier. |
| `system` | Yes | System or service label. |
| `algorithm` | Yes | Algorithm name as supplied by the inventory owner. |
| `purpose` | Yes | Reported use, such as signing or key exchange. |
| `key_size_bits` | No | Positive whole number if known. |

Example CSV is in `data/sample_inventory.csv`. JSON input must be a list of objects with those fields. Unknown fields are rejected rather than silently discarded. The official kit may define a different schema; replace this one only after reviewing that specification.

## Install And Run

Python 3.10 or newer is required. The prototype uses only the Python standard library.

In PowerShell, from this folder:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python main.py analyse data\sample_inventory.csv --output sample-report.json
```

To also export a normalized inventory:

```powershell
python main.py analyse data\sample_inventory.csv --output sample-report.json --export-inventory normalized.json
```

The report includes a notice that it is prototype output. Generated reports are written where the output path points; do not commit them as official results.

## Run Tests

```powershell
python -m unittest discover -s tests -v
```

The tests cover record validation, unsupported fields, algorithm triage, CSV/JSON loading, duplicate IDs, malformed JSON, export round trips, and CLI output. A passing prototype test suite does not verify the official challenge or benchmark.

## Assumptions And Limitations

- The schema and the small classification rule are provisional engineering choices for a demonstration, not organizer requirements.
- The prototype recognizes a narrow set of RSA, DSA, Diffie-Hellman, ECDH, and ECDSA names as potential public-key quantum-risk review items. It makes no claim about compromise probability or timeline.
- All other algorithms, including AES and unknown vendor names, are sent to manual review. They are not declared safe.
- The prototype does not choose a PQC replacement, score risk, rank migrations, scan live systems, change configurations, or handle secrets.
- No official A/B definitions, P2 benchmark workload, benchmark metrics, or evaluation rubric were supplied. Therefore no Processor A/B adapter, result, or benchmark graph is included.
- The organizer must confirm how a crypto-inventory workflow is meant to interact with the quantum processor comparison.
- See `docs/organizer-questions.md` before treating this project as a submission.

## Confirmed General References

- `QFF_2026_Hackathon_Phase1_Participant_Instructions (1).pdf`: P2 listing and general Phase 1 submission/benchmark instructions.
- `Challenge_Guide_Phase_1.pdf`: general processor and experiment guidance; its PS specification sheet is a blank template and its processor JSON is illustrative.
- `QFF_IBM_Hackathon_Guideline.pdf`: high-level Processor A/B descriptions, not complete configuration files.

These documents do not provide the missing PS-P2-specific rules. Follow the organizer's actual starter pack and requirements when obtained.

## Technical Background

- NIST IR 8105, *Report on Post-Quantum Cryptography* (April 2016), provides background on the potential impact of large-scale quantum computers on public-key cryptography: <https://csrc.nist.gov/pubs/ir/8105/final>.
- NIST's Post-Quantum Cryptography project FAQ provides current official context and is updated over time: <https://csrc.nist.gov/projects/post-quantum-cryptography/faqs>.

These references support only the general triage caveat. They do not establish PS-P2 scoring rules or authorize a particular migration mapping for an inventoried asset.