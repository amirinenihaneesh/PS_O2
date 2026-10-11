# Technical Report: Prototype Status

## 1. Abstract

This folder contains a small, non-compliant prototype for the Qiskit Fall Fest 2026 Phase 1 PS-P2 title, Crypto Inventory & Migration Planner. It validates a documented demonstration inventory format, flags a narrow set of classical public-key algorithm names for human review, and exports a non-ranked worklist. It does not implement the unavailable official PS-P2 specification or Processor A/B benchmark.

## 2. Problem Statement And Scope

The participant instructions list PS-P2 under Post-Quantum Cryptography. The supplied general Phase 1 materials require a controlled A/B comparison, but the PS-P2 statement, exact inputs/outputs, scoring method, processor definitions, workload, and PS-specific metrics were not supplied. The prototype is therefore restricted to independent demonstration behavior and is not represented as a hackathon solution.

## 3. Requirements And Constraints

Confirmed general requirements and their sources are tracked in `requirements-traceability.md`. The exact organizer clarifications needed are listed in `organizer-questions.md`. No official inventory format, risk formula, migration mapping, dataset, processor file, or benchmark output has been assumed.

## 4. Architecture And Implementation

The CLI delegates to separate modules for input validation and serialization (`inventory_io.py`), prototype triage (`classification.py`), unranked worklist/report assembly (`planner.py`), and command handling (`cli.py`). `models.py` defines the temporary prototype record. Synthetic input is kept in `data/sample_inventory.csv` and is separate from official configuration, which is not present.

## 5. Method

The prototype checks four required text fields and an optional positive integer key size. It rejects duplicate identifiers and unknown fields. A short allowlist of recognized classical public-key names produces a potential-risk review finding with a human-review next step. Unknown or unmodeled names also require manual review. The method intentionally makes no numerical risk estimate, ordering, or replacement recommendation.

## 6. Results

No official PS-P2 result, Processor A/B result, or benchmark graph is available or claimed. The CSV in `data/sample_inventory.csv` is synthetic. If the CLI is run on it, its exported output remains a local prototype demonstration and must not be reported as an organizer benchmark.

## 7. Testing And Reproducibility

The tests use Python's built-in `unittest` framework and temporary files for file-format checks. Run them from this folder with `python -m unittest discover -s tests -v`. In the recorded local verification, Python 3.14 ran 12 tests successfully. This verifies only prototype behavior; it does not validate organizer compliance, cryptographic effectiveness, or the unavailable official benchmark.

## 8. Processor A/B Benchmark

**Blocked pending organizer materials.** The available IBM guideline provides only high-level processor summaries. The Challenge Guide explicitly labels its processor JSON as illustrative. Neither supplies the exact A/B definitions or the P2-to-processor workload. No substitute configuration, measurement, or result has been generated.

## 9. Limitations And Remaining Work

Obtain and review the official PS-P2 statement, starter pack, inventory contract, prioritization and migration rules, exact A/B configuration files, P2 benchmark protocol, required metrics, evaluation rubric, and submission template. Then update the traceability matrix, replace or extend provisional code to match mandatory requirements, add requirement-linked tests, run the official experiment, and write the report from measured outputs.

## 10. Conclusion

This is a testable beginner prototype, not a verified hackathon submission. Compliance, official migration recommendations, A/B measurements, and final submission readiness remain unverified until the missing organizer materials are provided.

## 11. Technical References

- NIST IR 8105, *Report on Post-Quantum Cryptography*, April 2016: <https://csrc.nist.gov/pubs/ir/8105/final>.
- NIST Post-Quantum Cryptography project FAQs: <https://csrc.nist.gov/projects/post-quantum-cryptography/faqs>.

These sources are technical background for the general public-key risk discussion, not sources for hackathon-specific rules.