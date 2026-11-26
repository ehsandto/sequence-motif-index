# SequenceMotifIndex — Recurring Events Across Published Traces

**Contribution type** Builder → Intelligent Contracts

SequenceMotifIndex maintains an onchain index of recurring contiguous event patterns. Each submitted trace updates both the number of occurrences and the number of distinct trace digests containing the pattern. The index counts overlapping matches and deduplicates repeated submissions of the same bytes.

The leader and validators independently fetch the entire commit-pinned trace, verify its SHA-256, and classify each entry with an LLM. Consensus compares the full evidence and all labels in their original order. The exact label sequence determines which counters change. Ambiguous and nonqualifying entries break a pattern, so the index cannot join matching words across a gap.

In the fictional maintenance logs, the first trace contains two overlapping instances of CHECK → REPAIR → CHECK. The second contains one. The proposed repair is classified as OTHER and breaks the sequence. The resulting aggregate is three occurrences across two trace digests.

GenVM lint and four tests passed. The counting test compared 3,125 ordered traces with independent window enumeration.

StudioNet finalized the deployment, two trace registrations, and a replay with majority agreement. The live replay returned the existing digest and the counters still read three occurrences across two traces. The deployed source matched the pinned repository source.

[GitHub repository](https://github.com/ehsandto/sequence-motif-index) ·
[StudioNet deployment](https://explorer-studio.genlayer.com/address/0x152e8e5AbfE2650eF6D9aB5cF2D259bC82Ced59D) ·
[Proofs and receipts](https://github.com/ehsandto/sequence-motif-index/blob/main/LIVE_PROOFS.md)
