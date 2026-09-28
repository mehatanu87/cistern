import { Ledger } from "./managed/cistern/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type CisternPrivateState = {};

export const witnesses = {
  recipientSecret: ({ privateState }: WitnessContext<Ledger, CisternPrivateState>): [CisternPrivateState, Uint8Array] => [privateState, new Uint8Array(32)],
  shareAmount: ({ privateState }: WitnessContext<Ledger, CisternPrivateState>): [CisternPrivateState, bigint] => [privateState, 0n],
  recipientPath: ({ privateState }: WitnessContext<Ledger, CisternPrivateState>): [CisternPrivateState, any] => [privateState, [] as any]
};
