// To parse this data:
//
//   import { Convert, GetGameResponse } from "./file";
//
//   const getGameResponse = Convert.toGetGameResponse(json);

export interface GameResponse {
    gid:         number;
    name:        string;
    price:       string;
    description: string;
    released_at: string;
    developer: string;
    rank_score:  number;
    created_at:  string;
    updated_at:  string;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toGetGameResponse(json: string): GameResponse {
        return JSON.parse(json);
    }

    public static getGameResponseToJson(value: GameResponse): string {
        return JSON.stringify(value);
    }
}
