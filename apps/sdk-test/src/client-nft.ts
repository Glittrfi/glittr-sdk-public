import { Account, type BlockTxTuple, GlittrSDK, txBuilder } from "@glittr-sdk/sdk";

async function createFreeMintContract() {
	//const NETWORK = "testnet";
	const NETWORK = "regtest";

	const client = new GlittrSDK({
		network: NETWORK,
		electrumApi: "http://localhost:3002",
		glittrApi: "http://localhost:3001",
		// electrumApi: "https://devnet-electrum.glittr.fi",
		// glittrApi: "https://devnet-core-api.glittr.fi",
	});
	const account = new Account({
		wif: "cRcsF4gcFxgmeAScu3j8p5yt361paNXKd4gEqtw2D3fDc7ss3MKb",
		// wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
		network: NETWORK,
	});

	console.log(`User account ${account.p2pkh().address}`);

	const c = txBuilder.freeMintContractInstantiate({
		simple_asset: {
			supply_cap: "1",
			divisibility: 0,
			name: "Test",
			url: "https://test.com",
			url_hash: "0x",
			live_time: 0,
		},
		amount_per_mint: 2n.toString(),
	});

	const txid = await client.createAndBroadcastTx({
		account: account.p2pkh(),
		tx: c,
		outputs: [],
	});
	console.log("TXID : ", txid);
}

async function transfer() {
	const NETWORK = "regtest";

	const client = new GlittrSDK({
		network: NETWORK,
		electrumApi: "https://devnet-electrum.glittr.fi",
		glittrApi: "https://devnet-core-api.glittr.fi",
	});
	const creatorAccount = new Account({
		// mroHGEtVBLxKoo34HSHbHdmKz1ooJdA3ew
		wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
		network: NETWORK,
	});
	const minterAccount = new Account({
		// n3jM14MNfn1EEe1P8azEsmcPSP2BvykGLM
		wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
		network: NETWORK,
	});

	const contract: BlockTxTuple = [101869, 1];
	const tx = txBuilder.transfer({
		transfers: [
			{
				amount: "100",
				asset: contract,
				output: 1,
			},
		],
	});
	const txid = await client.createAndBroadcastTx({
		account: minterAccount.p2pkh(),
		tx: tx,
		outputs: [{ address: creatorAccount.p2pkh().address, value: 1000 }],
	});
	console.log("TXID : ", txid);
}

createFreeMintContract();
// transfer();