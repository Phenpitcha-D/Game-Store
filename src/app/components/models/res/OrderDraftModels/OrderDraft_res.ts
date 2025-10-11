interface DraftOrderRes {
  success: boolean;
  data: DraftOrder[];
}

interface DraftOrder {
  oid: number;
  status: string;
  total_before: string;
  total_after: string;
  created_at: string;
  paid_at: string | null;
  pid: number | null;
  items_count: number;
}

interface OrderDetailRes {
  success: boolean;
  order: {
    oid: number;
    uid: number;
    status: string;
    total_before: string;
    total_after: string;
    created_at: string;
  };
  items: Item[];
}

interface Item {
  gid: number;
  unit_price: string;
  name: string;
  image?: string;
  price?: number;
  genre?: string;
}