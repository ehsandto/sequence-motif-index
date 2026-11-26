# StudioNet proofs

[Contract on StudioNet](https://explorer-studio.genlayer.com/address/0x152e8e5AbfE2650eF6D9aB5cF2D259bC82Ced59D) ·
[Pinned source](https://github.com/ehsandto/sequence-motif-index/blob/fbd3314ca9e74f0f8087509a5dc962dcc730fa7b/contracts/SequenceMotifIndex.py) ·
[Machine-readable receipts and readbacks](PROOFS.json)

All four transactions finalized with `SUCCESS`, `MAJORITY_AGREE`, and recorded validator execution. Deployed source matched the pinned repository source after line-ending normalization. Both trace readbacks matched the exact pinned source text and the expected ordered labels.

| Transaction | Agree votes | CHECK / REPAIR / CHECK occurrences | Trace digests |
| --- | --- | --- | --- |
| [Deploy](https://explorer-studio.genlayer.com/tx/0xdb4379ebf26e48c940d94291b93a587e7349040b30903ebc9782ccc5057cd1f5) | 3 | — | — |
| [Index first trace](https://explorer-studio.genlayer.com/tx/0x7ce1c68fce1e08a9605c3aa625e74eb3f1c752fb5d6332a4a29b95b283f15bd8) | 3 | 2 | 1 |
| [Index second trace](https://explorer-studio.genlayer.com/tx/0x3ffa7ff1c3112b37a2b44ba80ddb14918dcb6d2c77df4fb7cfb247115d5723a0) | 3 | 3 | 2 |
| [Replay first trace](https://explorer-studio.genlayer.com/tx/0x78db2878850030d6dff62cfb4c837f4a2732adf56d69b3cea690453d828d211d) | 3 | 3 | 2 |

REPAIR / CHECK / REPAIR occurred once in one trace digest. The proposed repair in the second trace was classified as OTHER. The fixtures are fictional maintenance descriptions. The document counter measures distinct content digests, so multiple documents from the same publisher each count separately.

`npm ci` followed by `node scripts/live.mjs --verify-only` checks receipts, source, stored traces, and current counters. The proof journal preserves the counter read taken before the second trace was indexed.
