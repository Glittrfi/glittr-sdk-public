export class Header {
  private value: number;

  constructor(version: number, isCompressed: boolean) {
    if (version > 0x3f) {
      throw new Error("Version must be less than 64");
    }
    const versionShifted = version << 2;
    const reservedFlag = 0;
    const flags = ((isCompressed ? 1 : 0) << 1) | reservedFlag;
    this.value = versionShifted | flags;
  }

  getVersion(): number {
    return this.value >> 2;
  }

  isCompressed(): boolean {
    return (this.value & 2) !== 0;
  }

  isReserved(): boolean {
    return (this.value & 1) !== 0;
  }

  toBytes(): Uint8Array {
    return new Uint8Array([this.value]);
  }

  static fromBytes(bytes: Uint8Array): Header {
    const value = bytes[0];
    const header = Object.create(Header.prototype);
    header.value = value;
    return header;
  }
}
