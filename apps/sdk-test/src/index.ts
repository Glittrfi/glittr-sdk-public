import {
  initEccLib,
  networks,
  opcodes,
  payments,
  Psbt,
  script,
  StackElement,
} from "bitcoinjs-lib";
import ECPairFactory from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";
import { TransactionBuilder } from "@glittr-sdk/sdk";

initEccLib(ecc);

async function main() {
  const t = TransactionBuilder.createFreeMintContract(2000, 2, 18, 0);

  const electrum = "http://192.145.44.30:3000";

  const glittrFlag = Buffer.from("GLITTR", "utf8"); // Prefix
  const glittrData = Buffer.from(JSON.stringify(t), "utf8");
  const embed = script.compile([106, glittrFlag, glittrData]);

  const ecpair = ECPairFactory(ecc);

  const validator = (pubkey: any, msghash: any, signature: any): boolean =>
    ecpair.fromPublicKey(pubkey).verify(msghash, signature);

  const kp = ecpair.fromWIF(
    "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj", // bcrt1p909annaahk007276ny6ldnp2d7svjzx68249ptkcp45tptang5dqpjwerv
    networks.regtest
  );
  const payment = payments["p2pkh"]({
    pubkey: kp.publicKey,
    network: networks.regtest,
  });

  // Get UTXOs with electrum api
  const utxosFetch = await fetch(
    `${electrum}/address/${payment.address!}/utxo`
  );
  const utxos = (await utxosFetch.json()) ?? [];
  const confirmedUtxos = utxos.filter(
    (tx: any) => tx?.status && tx?.status?.confirmed && tx.value > 1000
  );
  const utxo = confirmedUtxos[0];
  if (!utxo) {
    console.error(`Error No UTXO`)
  }

  // Get TX hex for nonwitness
  const txHexFetch = await fetch(`${electrum}/tx/${utxo.txid}/hex`);
  const txHex = await txHexFetch.text();

  const psbt = new Psbt({ network: networks.regtest })
    .addInput({
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: Buffer.from(txHex, "hex"),
    })
    .addOutput({
      script: embed,
      value: 0,
    })
    .addOutput({ address: payment.address!, value: utxo.value - 1000 })
    .signInput(0, kp);

  const isValid = psbt.validateSignaturesOfInput(0, validator);
  if (!isValid) throw new Error(`Signature Invalid`);

  psbt.finalizeAllInputs();
  const hex =  psbt.extractTransaction(true).toHex();

  // Broadcast tx
  const txIdFetch = await fetch(`${electrum}/tx`, {
    method: 'POST',
    headers: {
      "Content-Type": 'text-plain'
    },
    body: hex
  })
  const txId = await txIdFetch.text()

  console.log("TXID : ", txId)
}

main();
