import { getAddressInfo } from "bitcoin-address-validation";

export function getAddressType(address: string) {
    const adddresInfo = getAddressInfo(address);
    return adddresInfo.type;
  }