export interface GetGameTypeRes {
    success: boolean;
    count:   number;
    data:    Datum[];
}

export interface Datum {
    tid:  number;
    name: string;
}
