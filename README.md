# Glittr Client SDK

The Glittr-SDK is a JavaScript/TypeScript library that provides a simple interface for interacting with the Glittr ecosystem. It allows you to create and broadcast Glittr transactions, such as creating contracts, minting, transferring, and more.

---

## **Installation**

To use the Glittr-SDK, you'll need to install it as a dependency in your project:

```bash
npm install @glittr-sdk/sdk
```

---

## **API Key**

You need API key to be able to interact with Glittr APIs. You can go to [Glittr Dev Portal](https://dev.glittr.fi) and signup for api key.

---

## **Usage**

Here’s an example of how to use the Glittr-SDK to create and broadcast a Deploy Free Mint contract using a prebuilt transaction:

#### **Prebuilt Transaction**

```javascript
import { Account, GlittrSDK, GlittrTransaction } from "@glittr-sdk/sdk";

async function main() {
  const NETWORK = 'regtest'

  const client = new GlittrSDK({
    network: NETWORK,
    apiKey: <your api key>,
    glittrApi: "https://devnet-core-api.glittr.fi", // devnet
    electrumApi: "https://devnet-electrum.glittr.fi" // devnet
  });
  const account = new Account({
    network: NETWORK,
    wif: <your WIF key>
  });
  const transaction = new GlittrTransaction({
    account: account,
    client: client
  })

  const txid = await transaction.contractDeployment.freeMint("PONDS", 18, "100", "100000000") 
  console.log("Transaction ID:", txid);
}

main();
```

or you can use our helper functions to construct the transaction (input and output) manually:

#### **Manual Transaction**

```javascript
import { Account, addFeeToTx, BitcoinUTXO, electrumFetchNonGlittrUtxos, GlittrSDK, OpReturnMessage, Output, txBuilder } from "@glittr-sdk/sdk";

async function deployFreeMintContract() {
  const NETWORK = 'regtest'
  
  const client = new GlittrSDK({
    network: NETWORK,
    apiKey: <your api key>,
  })
  const account = new Account({
    network: NETWORK,
    wif: <your WIF key>,
  })
  
  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 18,
          live_time: 0,
          supply_cap: "1000000000",
          ticker: "FKBTC",
          mint_mechanism: { free_mint: { amount_per_mint: "10", supply_cap: "1000000000" } }
        }
      },
    },
  };

  // Helper function to fetch non Glittr UTXOs
  const utxos = await electrumFetchNonGlittrUtxos(client.electrumApi, client.apiKey, account.p2wpkh().address)
  
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 } // Output #0 should always be the OP_RETURN message
  ]

  // Helper function to include fee into the tx
  const { inputs, outputs } = await addFeeToTx(
    NETWORK,
    account.p2wpkh().address,
    utxos,
    nonFeeInputs,
    nonFeeOutputs
  )

  const txid = await client.createAndBroadcastRawTx({
    account: account.p2wpkh(),
    inputs,
    outputs
  })
  console.log("Transaction ID:", txid);
}

deployFreeMintContract()
```

---

## **Prebuilt Transaction**

The SDK provides prebuilt methods for creating Glittr transaction messages.

#### **Transfer**
```javascript
const txid = await transaction.transfer(
    [
      {
        amount: '1000',
        contractId: '108018:1',
        receiver: 'mroHGEtVBLxKoo34HSHbHdmKz1ooJdA3ew'
      }
    ]
)
```

#### **Deploy Free Mint Contract**
```javascript
const txid = await transaction.contractDeployment.freeMint("GLITTR", 18, "100", "100000000") 
```

#### **Deploy Paid Mint Contract**
```javascript
const txid = await transaction.contractDeployment.paidMint(
  "GLITTR",
  18,
  { input_asset: "raw_btc", ratio: { fixed: { ratio: [1, 1] } } },
  "1000000000"
)
```

---

## **Manual Message Build**

This SDK allows you to construct custom messages by defining them in TypeScript using our supported message format. To do this, create a new variable and cast it to the `OpReturnMessage` type.

#### **Transfer**
```typescript
  const t: OpReturnMessage = {
    transfer: {
      transfers: [
          {
            amount: "100",
            asset: [108170, 1],
            output: 1
          },
          {
            amount: "200",
            asset: [110180, 1],
            output: 2
          }
      ],
    },
  };
```

#### **Deploy Free Mint Contract**
```typescript
  const t: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 18,
          live_time: 0,
          supply_cap: 2000n.toString(),
          ticker: "GLITTR",
          mint_mechanism: {
            free_mint: {
              amount_per_mint: 10n.toString(),
              supply_cap: 2000n.toString(),
            },
          },
        },
      },
    },
  };
```

#### **Deploy Paid Mint Contract**
```typescript
  const t: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 18,
          live_time: 0,
          supply_cap: 2000n.toString(),
          ticker: "GLITTR",
          mint_mechanism: {
            purchase: {
              input_asset: "raw_btc",
              ratio: { fixed: { ratio: [1, 1] } },
            },
          },
        },
      },
    },
  };
```

---


## **APIs**

### **GlittrTransaction**

The `GlittrTransaction` class provides high-level methods for creating various types of Glittr transactions. Each method and its parameters are described below:

#### **`transfer`**

```typescript
async transaction.transfer(transfers: TransferParams[]): Promise<string>
```

- **Parameters**:
  - `transfers`: Array of transfer objects with the following structure:
    ```typescript
    type TransferParams = {
      contractId: string;    // Format: "block:txIndex"
      amount: string;        // Amount to transfer
      receiver: string;      // Receiver's address
    }
    ```
- **Returns**:
  - `Promise<string>`: Transaction ID of the broadcasted transaction

---

#### **Contract Deployment Methods**

The `contractDeployment` property provides methods for deploying different types of contracts:

##### **`freeMint`**

```typescript
async transaction.contractDeployment.freeMint(
  ticker: string,
  divisibility: number,
  amountPerMint: string,
  supplyCap?: string
): Promise<string>
```

- **Parameters**:
  - `ticker`: Token ticker symbol
  - `divisibility`: Number of decimal places
  - `amountPerMint`: Amount that can be minted per transaction
  - `supplyCap`: Optional maximum supply cap
- **Returns**:
  - `Promise<string>`: Transaction ID of the broadcasted transaction

##### **`paidMint`**

```typescript
async transaction.contractDeployment.paidMint(
  ticker: string,
  divisibility: number,
  mechanism: PurchaseBurnSwap,
  supplyCap?: string
): Promise<string>
```

- **Parameters**:
  - `ticker`: Token ticker symbol
  - `divisibility`: Number of decimal places
  - `mechanism`: Object containing:
    ```typescript
    type PurchaseBurnSwap = {
      input_asset: string;
      pay_to_key?: string;
      ratio: {
        fixed: {
          ratio: [number, number]
        }
      }
    }
    ```
  - `supplyCap`: Optional maximum supply cap
- **Returns**:
  - `Promise<string>`: Transaction ID of the broadcasted transaction

##### **`liquidityPoolInitiate`**

```typescript
async transaction.contractDeployment.liquidityPoolInitiate(
  inputAsset: [string, string],
  inputAmount: [string, string]
): Promise<string>
```

- **Parameters**:
  - `inputAsset`: Tuple of two asset IDs in format ["block:txIndex", "block:txIndex"]
  - `inputAmount`: Tuple of amounts for each asset
- **Returns**:
  - `Promise<string>`: Transaction ID of the broadcasted transaction

---

#### **Contract Call Methods**

The `contractCall` property provides methods for interacting with deployed contracts:

##### **`mint`**

```typescript
async transaction.contractCall.mint(
  contractId: string,
  receiver: string,
  oracleMessage?: OracleMessageSigned
): Promise<string>
```

- **Parameters**:
  - `contractId`: Contract ID in format "block:txIndex"
  - `receiver`: Address to receive the minted tokens
  - `oracleMessage`: Optional signed oracle message for specific mint types
- **Returns**:
  - `Promise<string>`: Transaction ID of the broadcasted transaction

---
