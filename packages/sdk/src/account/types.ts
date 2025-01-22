import { ECPairInterface } from "ecpair"

export type P2pkhAccount = {
    address: string,
    keypair: ECPairInterface
}

export type P2wpkhAccount = {
    address: string,
    keypair: ECPairInterface
}

export type P2trAccount = {
    address: string,
    keypair: ECPairInterface
}

export type Account = P2pkhAccount | P2wpkhAccount | P2trAccount