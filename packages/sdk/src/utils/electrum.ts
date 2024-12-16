import { BitcoinUTXO } from "../utxo";

export const electrumFetchTxHex = async (electrumApiUrl: string, txId: string): Promise<string> => {
  try {
    const txHexFetch = await fetch(`${electrumApiUrl}/tx/${txId}/hex`);
    const txHex = await txHexFetch.text();

    return txHex;
  } catch (e) {
    throw new Error(`Error fetching TX Hex : ${e}`);
  }
}


export const electrumFetchUtxos = async (electrumApiUrl: string, address: string): Promise<BitcoinUTXO[]> => {
  try {
    const utxoFetch = await fetch(
      `${electrumApiUrl}/address/${address}/utxo`
    );
    const unconfirmedUtxos = (await utxoFetch.json()) ?? [];
    const utxos = unconfirmedUtxos.filter(
      (tx: BitcoinUTXO) => tx.status && tx.status.confirmed
    );

    return utxos;
  } catch (e) {
    throw new Error(`Error fetching UTXOS : ${e}`);
  }
}