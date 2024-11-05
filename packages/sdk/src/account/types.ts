import { ECPairInterface } from "ecpair"

export type P2pkhAccount = {
    address: string,
    keypair: ECPairInterface
}