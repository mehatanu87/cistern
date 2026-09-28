// This file is part of midnightntwrk/example-cistern.
// Copyright (C) Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Provides types and utilities for working with bulletin board contracts.
 *
 * @packageDocumentation
 */

import * as cistern from '@midnight-ntwrk/cistern-contract';

import { type ContractAddress, convertFieldToBytes } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type cisternDerivedState,
  type cisternContract,
  type cisternProviders,
  type DeployedcisternContract,
  cisternPrivateStateKey,
} from './common-types.js';
import { CompiledcisternContractContract } from '@midnight-ntwrk/cistern-contract';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { cisternPrivateState, createcisternPrivateState } from '@midnight-ntwrk/cistern-contract';

/** @internal */

/**
 * An API for a deployed bulletin board.
 */
export interface DeployedcisternAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<cisternDerivedState>;

  post: (message: string) => Promise<void>;
  takeDown: () => Promise<void>;
}

/**
 * Provides an implementation of {@link DeployedcisternAPI} by adapting a deployed bulletin board
 * contract.
 *
 * @remarks
 * The `cisternPrivateState` is managed at the DApp level by a private state provider. As such, this
 * private state is shared between all instances of {@link cisternAPI}, and their underlying deployed
 * contracts. The private state defines a `'secretKey'` property that effectively identifies the current
 * user, and is used to determine if the current user is the owner of the message as the observable
 * contract state changes.
 *
 * In the future, Midnight.js will provide a private state provider that supports private state storage
 * keyed by contract address. This will remove the current workaround of sharing private state across
 * the deployed bulletin board contracts, and allows for a unique secret key to be generated for each bulletin
 * board that the user interacts with.
 */
// TODO: Update cisternAPI to use contract level private state storage.
export class cisternAPI implements DeployedcisternAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedcisternContract,
    providers: cisternProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => cistern.ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  ...ledgerState,
                  state: ledgerState.state === cistern.State.OCCUPIED ? 'occupied' : 'vacant',
                  owner: toHex(ledgerState.owner),
                },
              },
            }),
          ),
        ),
        // ...private state...
        //    since the private state of the bulletin board application never changes, we can query the
        //    private state once and always use the same value with `combineLatest`. In applications
        //    where the private state is expected to change, we would need to make this an `Observable`.
        from(providers.privateStateProvider.get(cisternPrivateStateKey) as Promise<cisternPrivateState>),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        const hashedSecretKey = cistern.pureCircuits.publicKey(
          privateState.secretKey,
          convertFieldToBytes(32, ledgerState.sequence, 'api/src/index.ts'),
        );

        return {
          state: ledgerState.state,
          message: ledgerState.message.value,
          sequence: ledgerState.sequence,
          isOwner: toHex(ledgerState.owner) === toHex(hashedSecretKey),
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<cisternDerivedState>;

  /**
   * Attempts to post a given message to the bulletin board.
   *
   * @param message The message to post.
   *
   * @remarks
   * This method can fail during local circuit execution if the bulletin board is currently occupied.
   */
  async post(message: string): Promise<void> {
    this.logger?.info(`postingMessage: ${message}`);

    const txData = await this.deployedContract.callTx.post(message);

    this.logger?.trace({
      transactionAdded: {
        circuit: 'post',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Attempts to take down any currently posted message on the bulletin board.
   *
   * @remarks
   * This method can fail during local circuit execution if the bulletin board is currently vacant,
   * or if the currently posted message isn't owned by the owner computed from the current private
   * state.
   */
  async takeDown(): Promise<void> {
    this.logger?.info('takingDownMessage');

    const txData = await this.deployedContract.callTx.takeDown();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'takeDown',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Deploys a new bulletin board contract to the network.
   *
   * @param providers The bulletin board providers.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link cisternAPI} instance that manages the newly deployed
   * {@link DeployedcisternContract}; or rejects with a deployment error.
   */
  static async deploy(providers: cisternProviders, logger?: Logger): Promise<cisternAPI> {
    logger?.info('deployContract');

    const deployedcisternContract = await deployContract(providers, {
      compiledContract: CompiledcisternContractContract,
      privateStateId: cisternPrivateStateKey,
      initialPrivateState: createcisternPrivateState(utils.randomBytes(32)),
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedcisternContract.deployTxData.public,
      },
    });

    return new cisternAPI(deployedcisternContract, providers, logger);
  }

  /**
   * Finds an already deployed bulletin board contract on the network, and joins it.
   *
   * @param providers The bulletin board providers.
   * @param contractAddress The contract address of the deployed bulletin board contract to search for and join.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link cisternAPI} instance that manages the joined
   * {@link DeployedcisternContract}; or rejects with an error.
   */
  static async join(providers: cisternProviders, contractAddress: ContractAddress, logger?: Logger): Promise<cisternAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedcisternContract = await findDeployedContract<cisternContract>(providers, {
      contractAddress,
      compiledContract: CompiledcisternContractContract,
      privateStateId: cisternPrivateStateKey,
      initialPrivateState: await cisternAPI.getPrivateState(providers, contractAddress),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedcisternContract.deployTxData.public,
      },
    });

    return new cisternAPI(deployedcisternContract, providers, logger);
  }

  private static async getPrivateState(
    providers: cisternProviders,
    contractAddress: ContractAddress,
  ): Promise<cisternPrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(cisternPrivateStateKey);
    return existingPrivateState ?? createcisternPrivateState(utils.randomBytes(32));
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
