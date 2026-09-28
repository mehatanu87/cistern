import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  recipientSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  shareAmount(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  recipientPath(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { leaf: Uint8Array,
                                                                              path: { sibling: { field: bigint
                                                                                               },
                                                                                      goes_left: boolean
                                                                                    }[]
                                                                            }];
}

export type ImpureCircuits<PS> = {
  advanceRound(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  claimTranche(context: __compactRuntime.CircuitContext<PS>,
               roundIndex_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  closePool(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  advanceRound(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  claimTranche(context: __compactRuntime.CircuitContext<PS>,
               roundIndex_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  closePool(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  advanceRound(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  claimTranche(context: __compactRuntime.CircuitContext<PS>,
               roundIndex_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  closePool(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  readonly poolLabel: string;
  readonly totalRounds: bigint;
  readonly currentRound: bigint;
  readonly recipientRoot: Uint8Array;
  usedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly totalClaims: bigint;
  readonly isOpen: boolean;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               label_0: string,
               numRounds_0: bigint,
               root_0: Uint8Array): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
