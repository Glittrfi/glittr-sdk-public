import { GlittrSDK } from "../client";
import { getGlittrAsset } from "../helper/asset";
import { BitcoinUTXO } from "../utxo";
import { fetchGET } from "./fetch";

export const electrumFetchTxHex = async (
  electrumApiUrl: string,
  apiKey: string,
  txId: string
): Promise<string> => {
  try {
    const txHex = await fetchGET(`${electrumApiUrl}/tx/${txId}/hex`, {
      Authorization: `Bearer ${apiKey}`,
    });
    return txHex;
  } catch (e) {
    throw new Error(`Error fetching TX Hex : ${e}`);
  }
};

export const electrumFetchNonGlittrUtxos = async (
  client: GlittrSDK,
  address: string
): Promise<BitcoinUTXO[]> => {
  try {
    const unconfirmedUtxos =
      (await fetchGET(`${client.electrumApi}/address/${address}/utxo`, {
        Authorization: `Bearer ${client.apiKey}`,
      })) ?? [];
    const utxos = unconfirmedUtxos.filter(
      (tx: BitcoinUTXO) => tx.status && tx.status.confirmed
    );

    const nonGlittrUtxos: BitcoinUTXO[] = [];
    for (const utxo of utxos) {
      const assetString = await getGlittrAsset(client, utxo.txid, utxo.vout);
      const asset = JSON.parse(assetString);
      const assetIsEmpty =
        !asset.assets ||
        !asset.assets.list ||
        Object.keys(asset.assets.list).length === 0;

      if (assetIsEmpty && !asset.state_keys) {
        nonGlittrUtxos.push(utxo);
      }
    }

    return nonGlittrUtxos;
  } catch (e) {
    throw new Error(`Error fetching Non Glittr UTXOS : ${e}`);
  }
};
