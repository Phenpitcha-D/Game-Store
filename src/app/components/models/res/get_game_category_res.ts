export interface GameCategoryRes {
    success:    boolean;
    game:       Game;
    count:      number;
    categories: Category[];
}

export interface Category {
    gcid:          number;
    gid:           number;
    tid:           number;
    type_name:     string;
    category_name: string;
}

export interface Game {
    gid:  number;
    name: string;
}
