export interface GetOrderResponse {
    success: boolean;
    message: string;
    order:   Order;
    items:   any[];
}

export interface Order {
    oid:          number;
    uid:          number;
    pid:          null;
    status:       string;
    total_before: string;
    total_after:  string;
    created_at:   string;
    paid_at:      null;
}