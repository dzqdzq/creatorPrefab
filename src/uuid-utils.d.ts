declare var uuidUtils: {
    compressHex(e: string, t: boolean): string;
    compressUuid(e: string, t: boolean): string;
    decompressUuid(e: string): string;
    isUuid(e: string): boolean;
    getUuidFromLibPath(e: string): string;
    getShortUUID(e: string): string[];
    getLongUUID(e: string): string;
};

export = uuidUtils;