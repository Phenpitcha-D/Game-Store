// To parse this data:
//
//   import { Convert, GameResponse } from "./file";
//
//   const gameResponse = Convert.toGameResponse(json);

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
    categories?:  Category[];
}

export interface Category {
    gcid:          number;
    gid:           number;
    tid:           number;
    type_name:     string;
    category_name: string;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toGameResponse(json: string): GameResponse {
        return JSON.parse(json);
    }

    public static gameResponseToJson(value: GameResponse): string {
        return JSON.stringify(value);
    }
}
