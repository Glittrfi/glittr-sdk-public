import { OpReturnMessage, txBuilder } from "@glittr-sdk/sdk";

async function manualMessage() {
  /**
   * Contract Creation
   */
  const t: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        asset: {
          asset: {
            supply_cap: 2000n.toString(),
            divisibility: 18,
            live_time: 0,
          },
          distribution_schemes: {
            free_mint: {
              supply_cap: 2000n.toString(),
              amount_per_mint: 10n.toString(),
            },
          },
        },
      },
    },
  };
  const tBuild = txBuilder.buildMessage(t);
  console.log(JSON.stringify(tBuild));

  const tA = txBuilder.freeMintContractInstantiate({
    simple_asset: {
      supply_cap: 2000n.toString(),
      divisibility: 18,
      live_time: 0,
    },
    amount_per_mint: 10n.toString(),
  });
  console.log(JSON.stringify(tA));
  console.log(JSON.stringify(tBuild) === JSON.stringify(tA));

  /**
   * Mint
   */
  const ca: OpReturnMessage = {
    contract_call: {
      contract: [100, 0],
      call_type: { mint: { pointer: 0 } },
    },
  };
  const caBuild = txBuilder.buildMessage(ca);
  console.log(JSON.stringify(caBuild));

  const caA = txBuilder.mint({ contract: [100, 0], pointer: 0 });
  console.log(JSON.stringify(caA));
  console.log(JSON.stringify(caBuild) === JSON.stringify(caA));
}
manualMessage();
