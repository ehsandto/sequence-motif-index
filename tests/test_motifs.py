import hashlib
import json
import re
import sys
from collections import Counter
from itertools import product
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
PREFIX = "ehsandto/sequence-motif-index/" + "a" * 40 + "/fixtures/"
BENCH_A = ["CHECK", "REPAIR", "CHECK", "REPAIR", "CHECK"]
BENCH_B = ["CHECK", "REPAIR", "CHECK", "OTHER", "REPAIR", "CHECK"]
TRIPLE = "CHECK/REPAIR/CHECK"


@pytest.fixture
def index(direct_deploy):
    instance = direct_deploy(str(ROOT / "contracts/SequenceMotifIndex.py"))
    return instance, sys.modules[type(instance._instance).__module__]


def mock(vm, name, labels, tampered=False):
    body = (ROOT / "fixtures" / (name + ".json")).read_bytes()
    path = PREFIX + name + ".json"
    vm.clear_mocks()
    vm.mock_web(re.escape("https://raw.githubusercontent.com/" + path) + "$", {
        "method": "GET", "response": {"status": 200, "headers": {}, "body": body + (b" " if tampered else b"")},
    })
    vm.mock_llm(r".*SEQUENCE MOTIF EXTRACTION.*", json.dumps({"labels": labels}))
    return path, hashlib.sha256(body).hexdigest()


def test_counts_accumulate_and_replay_is_idempotent(index, direct_vm):
    contract, _ = index
    args_a = mock(direct_vm, "bench-a", BENCH_A)
    assert contract.index_trace(*args_a) == args_a[1]
    assert direct_vm.run_validator()
    assert contract.get_trace(args_a[1])["labels"] == BENCH_A
    assert contract.get_motif(TRIPLE) == {"occurrences": 2, "documents": 1}

    args_b = mock(direct_vm, "bench-b", BENCH_B)
    assert contract.index_trace(*args_b) == args_b[1]
    assert direct_vm.run_validator()
    assert contract.get_motif(TRIPLE) == {"occurrences": 3, "documents": 2}
    assert contract.get_motif("REPAIR/CHECK/REPAIR") == {"occurrences": 1, "documents": 1}
    assert contract.index_trace(*args_a) == args_a[1]
    assert contract.get_motif(TRIPLE) == {"occurrences": 3, "documents": 2}


def test_validator_rejects_changed_event_and_tampered_source(index, direct_vm):
    contract, _ = index
    args = mock(direct_vm, "bench-b", BENCH_B)
    contract.index_trace(*args)
    mock(direct_vm, "bench-b", BENCH_B[:3] + ["REPAIR"] + BENCH_B[4:])
    assert not direct_vm.run_validator()
    mock(direct_vm, "bench-b", BENCH_B, tampered=True)
    assert not direct_vm.run_validator()


def test_unknown_events_break_motifs_and_queries_are_bounded(index, direct_vm):
    contract, _ = index
    labels = ["CHECK", "UNKNOWN", "REPAIR", "OTHER", "CHECK"]
    contract.index_trace(*mock(direct_vm, "bench-a", labels))
    assert contract.get_motif("CHECK/REPAIR") == {"occurrences": 0, "documents": 0}
    with direct_vm.expect_revert("Expected two to four qualifying event labels"):
        contract.get_motif("CHECK/UNKNOWN/REPAIR")
    with direct_vm.expect_revert("Expected two to four qualifying event labels"):
        contract.get_motif("CHECK")


def test_count_all_windows_against_independent_enumeration(index):
    _, module = index
    labels = ("CHECK", "REPAIR", "ARRIVE", "OTHER", "UNKNOWN")
    eligible = {"CHECK", "REPAIR", "ARRIVE"}
    for trace in product(labels, repeat=5):
        expected = Counter(
            "/".join(trace[start:start + size])
            for size in range(2, 5)
            for start in range(len(trace) - size + 1)
            if set(trace[start:start + size]) <= eligible
        )
        assert module.motif_counts(trace) == expected
