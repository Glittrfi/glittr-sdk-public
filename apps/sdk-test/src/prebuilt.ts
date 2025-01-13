import { Account, GlittrSDK, GlittrTransaction } from "@glittr-sdk/sdk"

async function deployFreeMintContract() {
    const NETWORK = 'regtest'
    const client = new GlittrSDK({
        network: NETWORK,
        apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
        glittrApi: "https://devnet-core-api.glittr.fi", // devnet
        electrumApi: "https://devnet-electrum.glittr.fi" // devnet
    })
    const account = new Account({
        network: NETWORK,
        wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
    })
    const transaction = new GlittrTransaction({
        client,
        account
    })

    const txid = await transaction.contractDeployment.freeMint(
        "GLITTR", // ticker
        18, // divisibility
        "1", // amount per mint
        "1000000" // supply cap
    )

    console.log("TXID : ", txid)
}

deployFreeMintContract()