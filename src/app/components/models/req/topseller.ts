export interface Game {
    gid:           number;
    name:          string;
    price:         number;
    developer:     string;
    rank_score:    number;
    sold_count:    number;
    total_revenue: number;
    first_paid_at: Date;
    last_paid_at:  Date;
    images:        Image[];
}

export interface Image {
    imgid:      number;
    gid:        number;
    url:        string;
    created_at: Date;
}
