// To parse this data:
//
//   import { Convert, GetGameImageResponse } from "./file";
//
//   const getGameImageResponse = Convert.toGetGameImageResponse(json);

export interface GetGameImageResponse {
    success: boolean;
    game:    Game;
    count:   number;
    images:  Image[];
}

export interface Game {
    gid:  number;
    name: string;
}

export interface Image {
    imgid:      number;
    gid:        number;
    url:        string;
    created_at: string;
}

// Converts JSON strings to/from your types
export class Convert {
    public static toGetGameImageResponse(json: string): GetGameImageResponse {
        return JSON.parse(json);
    }

    public static getGameImageResponseToJson(value: GetGameImageResponse): string {
        return JSON.stringify(value);
    }
}
