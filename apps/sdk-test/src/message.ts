import { OpReturnMessage, txBuilder } from "@glittr-sdk/sdk";

async function manualMessage() {
  /**
   * Contract Creation
   */
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
  console.log(JSON.stringify(t));

  const tA = txBuilder.contractInstantiate({
    divisibility: 18,
    live_time: 0,
    supply_cap: 2000n.toString(),
    mint_mechanism: {
      free_mint: {
        amount_per_mint: 10n.toString(),
        supply_cap: 2000n.toString(),
      },
    },
  });
  console.log(JSON.stringify(tA));
  console.log(JSON.stringify(t) === JSON.stringify(tA));

  /**
   * Mint
   */
  const ca: OpReturnMessage = {
    contract_call: {
      contract: [100, 0],
      call_type: { mint: { pointer: 0 } },
    },
  };
  console.log(JSON.stringify(ca));

  const cM = txBuilder.contractCall({
    contract: [100, 0],
    call_type: { mint: { pointer: 0 } },
  });
  console.log(JSON.stringify(cM));
  console.log(JSON.stringify(ca) === JSON.stringify(cM));
}
manualMessage();
