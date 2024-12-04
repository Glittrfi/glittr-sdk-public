# Glittr Client SDK

The Glittr-SDK is a JavaScript/TypeScript library that provides a simple interface for interacting with the Glittr ecosystem. It allows you to create and broadcast Glittr transactions, such as creating contracts, minting, transferring, and more.

---

## **Installation**

To use the Glittr-SDK, you'll need to install it as a dependency in your project:

```bash
npm install @glittr-sdk/sdk
```

---

## **Usage**

Here’s an example of how to use the Glittr-SDK to create and broadcast a transaction:

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

  const tx = txBuilder.freeMint({
    amount_per_mint: "2",
    divisibility: 18,
    live_time: 0,
    supply_cap: "2000",
    ticker: "TEST",
  });

  const txid = await client.createAndBroadcastTx({
    account: account.p2pkh(),
    tx: tx,
    outputs: [],
  });

  console.log("Transaction ID:", txid);
}

main();
```

---

## **Prebuilt Functions**

The SDK provides prebuilt methods for creating Glittr transaction messages.

#### **Create Free Mint Contract**
```javascript
const freeMintContract = txBuilder.freeMint({
  amount_per_mint: "2",
  divisibility: 18,
  live_time: 0,
  supply_cap: "2000",
  ticker: "GLTR"
});
```

### **Create Paid Mint Contract**
```javascript
const paidMintContract = txBuilder.paidMint({
  divisibility: 18,
  live_time: 0,
  supply_cap: "2000",
  ticker: "GLTR",
  payment: {
    input_asset: "raw_btc",
    ratio: {
        oracle: {
            setting: {
                pubkey: <oracle pubkey>
                asset_id: "btc",
                block_height_slippage: 5
            }
        }
    }
  }
});
```

### **Create Pool Contract**
```javascript
const poolContract = txBuilder.createPool({
  divisibility: 18,
  live_time: 0,
  supply_cap: "2000",
  assets: ["asset1", "asset2"],
  invariant: 1,
  initial_mint_restriction: 100
});
```

### **Contract Call (Mint)**
```javascript
const transferTx = txBuilder.contractCall({
  contract: [10001, 1], //block, tx
  call_type: {
      mint: { 
        pointer: 1, // 1 is op_return, 0 is specified, last is remainder
        oracle_message: <your oracle signed message> // optional
      } 
  }
});
```

### **Transfer**
```javascript
const transferTx = txBuilder.transfer({
  transfers: [
    {
        amount: "100",
        asset: [10001, 1], //block, tx
        output: 1
    }
  ]
});
```

---

## **Manual Message Build**

This SDK allows you to construct custom messages by defining them in TypeScript using our supported message format. To do this, create a new variable and cast it to the `OpReturnMessage` type.

#### **Example Free Mint Contract Creation**

```typescript
  const t: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 18,
          live_time: 0,
          supply_cap: 2000n.toString(),
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


---


## **APIs**

### **txBuilder**

The `txBuilder` class provides methods to construct various types of transactions. Each function and its parameters are described below:

---

#### **`transfer`**

```typescript
static transfer(params: TransferParams): TransferFormat
```

- **Parameters**:
  - `transfers` (`TxTypeTransfer[]`)

- **Returns**:
  - `TransferFormat`: A formatted transfer transaction.

---

#### **`contractCall`**

```typescript
static contractCall(params: ContractCallParams): ContractCallFormat
```

- **Parameters**:
  - `contract` (`BlockTxTuple`)
  - `call_type` (`CallType`)

- **Returns**:
  - `ContractCallFormat`: A formatted contract call transaction.

---

#### **`contractInstantiate`**

```typescript
static contractInstantiate(params: ContractInstantiateParams): ContractInstantiateFormat
```

- **Parameters**:
  - `divisibility` (`number`)
  - `live_time` (`BlockHeight`)
  - `supply_cap` (`U128`, optional)
  - `ticker` (`string`, optional)
  - `mint_mechanism` (`MBAMintMechanism`)
  - `burn_mechanism` (`BurnMechanism`, optional)

- **Returns**:
  - `ContractInstantiateFormat`: A formatted contract instantiation transaction.

---

#### **`freeMint`**

```typescript
static freeMint(params: FreeMintContractParams): FreeMintContractInstantiateFormat
```

- **Parameters**:
  - `amount_per_mint` (`U128`)
  - `divisibility` (`number`)
  - `live_time` (`BlockHeight`)
  - `supply_cap` (`U128`)
  - `ticker` (`string`)

- **Returns**:
  - `FreeMintContractInstantiateFormat`: A formatted free mint contract transaction.

---

#### **`paidMint`**

```typescript
static paidMint(params: PaidMintContractParams): PaidMintContractInstantiateFormat
```

- **Parameters**:
  - `divisibility` (`number`)
  - `live_time` (`BlockHeight`)
  - `supply_cap` (`U128`)
  - `ticker` (`string`)
  - `payment`:
    - `input_asset` (`InputAsset`)
    - `pay_to` (`Pubkey`)
    - `ratio` (`RatioType`)

- **Returns**:
  - `PaidMintContractInstantiateFormat`: A formatted paid mint contract transaction.

---

#### **`createPool`**

```typescript
static createPool(params: CreatePoolContractParams): CreatePoolContractInstantiateFormat
```

- **Parameters**:
  - `divisibility` (`number`)
  - `live_time` (`BlockHeight`)
  - `supply_cap` (`U128`)
  - `assets` (`[InputAsset, InputAsset]`)
  - `invariant` (`number`)
  - `initial_mint_restriction` (`number`, optional)

- **Returns**:
  - `CreatePoolContractInstantiateFormat`: A formatted create pool contract transaction.

---
