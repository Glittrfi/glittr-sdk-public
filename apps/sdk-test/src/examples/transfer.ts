import { Account, GlittrSDK, GlittrTransaction } from "@glittr-sdk/sdk";

const NETWORK = "testnet";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  // glittrApi: "https://devnet2-core-api.glittr.fi", // devnet
  // electrumApi: "https://devnet-electrum.glittr.fi" // devnet
  glittrApi: "https://testnet-core-api.glittr.fi", // testnet
  electrumApi: "https://testnet-electrum.glittr.fi" // testnet
});

const creatorAccount = new Account({
  // wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  wif: 'cU6mHpUnEn6MB3uwAhUgNvXW3ChsWZBm3AVY7cT3BnK7kVghdrTN', //unisat
  network: NETWORK,
});

const glittrTrnasaction = new GlittrTransaction({
  client,
  account: creatorAccount
})

async function transfer() {
  const txId = await glittrTrnasaction.transfer([{amount: '10', contractId: '67225:162', receiver: 'tb1pn9rs0yjryp0kcrpdl4msq8y5l2zuragwm4khn8rnfmmgandnaruqtdmvf2'}])

  console.log(txId)
}

transfer()