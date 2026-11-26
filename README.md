# SequenceMotifIndex

SequenceMotifIndex counts recurring contiguous sequences in public, ordered event logs. Anyone can index a commit-pinned trace or query the corpus.

`index_trace(coordinate, commitment)` takes a full GitHub commit path and the trace's exact SHA-256. A trace contains two to twelve ordered event descriptions. The leader and validators independently fetch the full body, check its hash, and classify each entry with an LLM. Agreement compares the full evidence and all ordered labels exactly.

The labels ARRIVE, CHECK, REPAIR, and RELEASE form the searchable vocabulary. OTHER and UNKNOWN break a sequence. Each successful registration updates two counters for every two- to four-event motif. The occurrence count includes overlapping windows. The document count adds one per distinct trace digest containing the motif. A replay of the same bytes returns the existing digest. Motifs cannot cross trace boundaries.

`get_trace(commitment)` returns the source and labels. `get_motif("CHECK/REPAIR/CHECK")` returns the occurrence and document counts. The index measures the descriptions published in its corpus. The fictional fixtures demonstrate the classification and counting rules.

Install `requirements-dev.txt`, then run `python -m pytest tests -q` and `genvm-lint check contracts/SequenceMotifIndex.py`.
