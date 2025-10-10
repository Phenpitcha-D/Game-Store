export interface WalletTransactions {
    success: boolean;
    data:    Datum[];
}

export interface Datum {
    wid:        number;
    uid:        number;
    oid:        null;
    type:       Type;
    amount:     string;
    note:       Note;
    created_at: Date;
}

export enum Note {
    Topup = "topup",
}

export enum Type {
    Credit = "CREDIT",
}
