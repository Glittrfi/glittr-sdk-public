import { GlittrSDK } from "../client";
import { BalanceData } from "../client/types";
import { fetchGET } from "../utils/fetch";

// TODO change hardcode api url 
export const getAssetTickers = async (client: GlittrSDK, assets: string[]): Promise<string[]> => {
  try {
    return await Promise.all(
      assets.map(async (asset) => {
        if (!asset.includes(':')) {
          throw new Error(`Invalid asset format: ${asset}. Expected format: block:txIndex`);
        }

        const [block, txIndex] = asset.split(':');

        if (!block || !txIndex) {
          throw new Error(`Invalid asset format: ${asset}. Missing block or txIndex`);
        }

        try {
          const metadataData = await fetchGET(
            `${client.glittrApi}/blocktx/${block}/${txIndex}`,
            { Authorization: `Bearer ${client.apiKey}` }
          )
          if (!metadataData?.is_valid) {
            throw new Error(`Invalid metadata for asset ${block}:${txIndex}`);
          }

          if (!metadataData?.message?.message) {
            throw new Error(`Missing message data for asset ${block}:${txIndex}`);
          }

          const contractCreation = metadataData.message.message.contract_creation;
          const ticker = contractCreation?.contract_type?.moa?.ticker ||
            contractCreation?.contract_type?.mba?.ticker;

          if (!ticker) {
            throw new Error(`No ticker found for asset ${block}:${txIndex}`);
          }

          return ticker;

        } catch (error) {
          throw new Error(`Error processing asset ${block}:${txIndex}: ${error}`);
        }
      })
    );
  } catch (error) {
    throw new Error(`Error fetching asset metadata: ${error}`);
  }
}

export const getAssetUtxos = async (client: GlittrSDK, address: string, asset: string) => {
  try {
    // Fetch asset balance data
    const balanceData = await fetchGET(
      `${client.glittrApi}/helper/address/${address}/balance`,
      { Authorization: `Bearer ${client.apiKey}` }
    ) as BalanceData
    if (!balanceData?.balance?.utxos) {
      throw new Error('Invalid balance data format');
    }

    // Fetch UTXO values from electrum
    const utxoValuesData = await fetchGET(
      `${client.electrumApi}/address/${address}/utxo`,
      { Authorization: `Bearer ${client.apiKey}` }
    ) as Array<{
      txid: string;
      vout: number;
      value: number;
      status: {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
      }
    }>;

    // Filter utxos that contain the specified asset
    const relevantUtxos = balanceData.balance.utxos.filter((utxo) => {
      return utxo.assets && asset in utxo.assets;
    });

    return relevantUtxos.map((utxo) => {
      // Find matching UTXO value
      const utxoValue = utxoValuesData.find(
        u => u.txid === utxo.txid && u.vout === utxo.vout
      );

      if (!utxoValue) {
        throw new Error(`UTXO value not found for ${utxo.txid}:${utxo.vout}`);
      }

      return {
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxoValue?.value,
        status: utxoValue?.status,
        assetAmount: utxo.assets[asset]!
      };
    });
  } catch (error) {
    throw new Error(`Error fetching asset UTXOs: ${error}`);
  }
}

export const getGlittrAsset = async (client: GlittrSDK, txid: string, vout: number) => {
  try {
    const asset = await fetchGET(
      `${client.glittrApi}/assets/${txid}/${vout}`,
      { Authorization: `Bearer ${client.apiKey}` }
    )
    return JSON.stringify(asset)
  }
  catch (error) {
    throw new Error(`Error fetching glittr asset by utxo: ${error}`)
  }
}