export interface GetUserLIB {
    success: boolean;
    data:    Datum[];
}

export interface Datum {
    lid:    number;
    uid:    number;
    gid:    number;
    name:   string;
    images: Array<Image | null>;
}

export interface Image {
    url:        string;
    imgid:      number;
    created_at: Date;
}
