export interface GameResponse {
    gid:         number;
    name:        string;
    price:       string;
    description: string;
    released_at: string;
    developer:   string;
    rank_score:  number;
    created_at:  string;
    updated_at:  string;
    categories:  Category[];
    images:      Image[];
}

export interface Category {
    gcid:          number;
    tid:           number;
    category_name: string;
    type_name:     string;
}

export interface Image {
    imgid:      number;
    gid:        number;
    url:        string;
    created_at: string;
}
