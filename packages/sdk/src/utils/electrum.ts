import { BitcoinUTXO } from "../utxo";
import { fetchGET } from "./fetch";

export const electrumFetchTxHex = async (electrumApiUrl: string, apiKey: string, txId: string): Promise<string> => {
  try {
    const txHex = await fetchGET(
      `${electrumApiUrl}/tx/${txId}/hex`,
      { Authorization: `Bearer ${apiKey}` }
    )
    return txHex;
  } catch (e) {
    throw new Error(`Error fetching TX Hex : ${e}`);
  }
}


export const electrumFetchUtxos = async (electrumApiUrl: string, apiKey: string, address: string): Promise<BitcoinUTXO[]> => {
  try {
    const unconfirmedUtxos = await fetchGET(
      `${electrumApiUrl}/address/${address}/utxo`,
      { Authorization: `Bearer ${apiKey}` }
    ) ?? []
    const utxos = unconfirmedUtxos.filter(
      (tx: BitcoinUTXO) => tx.status && tx.status.confirmed
    );

    return utxos;
  } catch (e) {
    throw new Error(`Error fetching UTXOS : ${e}`);
  }
}