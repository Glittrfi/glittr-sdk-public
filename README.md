# Glittr Client SDK

The Glittr-SDK is a JavaScript/TypeScript library that provides a simple interface for interacting with the Glittr ecosystem. It allows you to create and broadcast Glittr transactions, such as Create FT Contract, Mint, Transfer, etc.

## Installation

To use the Glittr-SDK, you'll need to install it as a dependency in your project:

```
npm install @glittr-sdk/sdk
```

## Usage

Here's an example of how to use the Glittr-SDK to create and broadcast a transaction:

```javascript
import { Account, GlittrSDK, txBuilder } from "@glittr-sdk/sdk";

async function main() {
  const NETWORK = "regtest";
  const client = new GlittrSDK({
    network: NETWORK,
    electrumApi: "https://devnet-electrum.glittr.fi",
    glittrApi: "https://devnet-core-api.glittr.fi",
  });

  const account = new Account({
    wif: "your WIF here",
    network: NETWORK,
  });

  const c = txBuilder.freeMintContractInstantiate({
    amount_per_mint: 2n.toString(),
    divisibility: 18,
    live_time: 0,
    supply_cap: 2000n.toString(),
  });

  const txid = await client.createAndBroadcastTx({
    account: account.p2pkh(),
    tx: c,
    outputs: [],
  });

  console.log("TXID : ", txid);
}

main();
```

# APIs
## GlittrSDK
### Constructor

```typescript
constructor({ network, glittrApi, electrumApi }: GlittrSDKParams)
```

**Parameters:**
- `network` (Network): The Bitcoin network to use (e.g., 'mainnet', 'testnet', 'regtest').
- `glittrApi` (string): The URL of the Glittr API endpoint.
- `electrumApi` (string): The URL of the Electrum API endpoint.

### `createAndBroadcastTx`

```typescript
async createAndBroadcastTx({
  account,
  tx,
  outputs,
  utxos,
}: CreateBroadcastTxParams): Promise<string>
```

**Parameters:**
- `account` (P2pkhAccount | P2wpkhAccount): The Bitcoin account to use for the transaction.
- `tx` (TransactionFormat): The Glittr transaction to be created and broadcast.
- `outputs` (Output[]): Additional transaction outputs (besides the Glittr-specific output).
- `utxos` (BitcoinUTXO[]): The unspent transaction outputs to use as inputs for the transaction.

**Returns:**
- `Promise<string>`: The transaction ID of the broadcasted transaction.

## Account
### Constructor

```typescript
constructor({ privateKey, wif, network }: AccountParams)
```

**Parameters:**
- `privateKey` (string, optional): The private key of the Bitcoin account.
- `wif` (string, optional): The Wallet Import Format (WIF) of the Bitcoin account.
- `network` (Network): The Bitcoin network to use (e.g., 'mainnet', 'testnet', 'regtest').

### `p2pkh`

```typescript
p2pkh(): P2pkhAccount
```

**Returns:**
- `P2pkhAccount`: An account object with a P2PKH (Pay-to-Public-Key-Hash) address and keypair.

### `p2wpkh`

```typescript
p2wpkh(): P2wpkhAccount
```

**Returns:**
- `P2wpkhAccount`: An account object with a P2WPKH (Pay-to-Witness-Public-Key-Hash) address and keypair.

## txBuilder
### `transfer`

```typescript
static transfer(params: TransferParams): TransferFormat
```

**Parameters:**
- `params` (TransferParams): Parameters for the transfer transaction.

**Returns:**
- `TransferFormat`: The transfer transaction format.

### `freeMintContractInstantiate`

```typescript
static freeMintContractInstantiate(
  params: FreeMintContractParams
): FreeMintContractInstantiateFormat
```

**Parameters:**
- `params` (FreeMintContractParams): Parameters for the Free Mint Contract Instantiate transaction.

**Returns:**
- `FreeMintContractInstantiateFormat`: The Free Mint Contract Instantiate transaction format.

### `preallocatedContractInstantiate`

```typescript
static preallocatedContractInstantiate(
  params: PreallocatedContractParams
): PreallocatedContractFormat
```

**Parameters:**
- `params` (PreallocatedContractParams): Parameters for the Preallocated Contract Instantiate transaction.

**Returns:**
- `PreallocatedContractFormat`: The Preallocated Contract Instantiate transaction format.

### `purchaseBurnSwapContractInstantiate`

```typescript
static purchaseBurnSwapContractInstantiate(
  params: PurchaseBurnContractParams
): PurchaseBurnContractFormat
```

**Parameters:**
- `params` (PurchaseBurnContractParams): Parameters for the Purchase Burn Swap Contract Instantiate transaction.

**Returns:**
- `PurchaseBurnContractFormat`: The Purchase Burn Swap Contract Instantiate transaction format.

### `mint`

```typescript
static mint(params: MintContractCallParams): MintContractCallFormat
```

**Parameters:**
- `params` (MintContractCallParams): Parameters for the Mint transaction.

**Returns:**
- `MintContractCallFormat`: The Mint transaction format.

### `buildMessage`

```typescript
static buildMessage(m: OpReturnMessage): OpReturnMessage
```

**Parameters:**
- `m` (OpReturnMessage): The OP_RETURN message to be built.

**Returns:**
- `OpReturnMessage`: The built OP_RETURN message.
