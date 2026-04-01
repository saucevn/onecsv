/**
 * Status Normalizer — One CSV v2
 * Map trạng thái gốc từng platform → English normalized values
 * Values: completed | cancelled | in_transit | pending | returned | unknown
 */

type Platform = "shopee" | "tiktok" | "pos_cake";

const SHOPEE_MAP: Record<string, string> = {
  // Completed
  "hoàn thành":                                                 "completed",
  "đã giao":                                                    "completed",
  "người mua xác nhận đã nhận được hàng":                       "completed",
  "đã nhận hàng":                                               "completed",
  "giao hàng thành công":                                       "completed",
  // In transit
  "đang giao":                                                   "in_transit",
  "đang giao hàng":                                             "in_transit",
  "đã vận chuyển":                                              "in_transit",
  "đang vận chuyển":                                            "in_transit",
  "đã lấy hàng":                                                "in_transit",
  "chờ lấy hàng":                                               "in_transit",
  "đã đến kho phân loại":                                       "in_transit",
  // Pending
  "chờ xác nhận":                                               "pending",
  "chờ xử lý":                                                  "pending",
  "đang xử lý":                                                 "pending",
  "chưa thanh toán":                                            "pending",
  "chờ đóng gói":                                               "pending",
  // Cancelled
  "đã hủy":                                                     "cancelled",
  "hủy":                                                        "cancelled",
  // Returned
  "trả hàng":                                                   "returned",
  "hoàn hàng":                                                  "returned",
  "đang hoàn hàng":                                             "returned",
  "trả hàng/hoàn tiền":                                         "returned",
};

const TIKTOK_MAP: Record<string, string> = {
  // Completed — EN
  "delivered":                                                   "completed",
  "completed":                                                   "completed",
  // Completed — VI
  "đã giao hàng":                                               "completed",
  "hoàn thành":                                                  "completed",
  "đã hoàn tất":                                                "completed",
  // In transit — EN
  "in transit":                                                  "in_transit",
  "shipped":                                                     "in_transit",
  "processing":                                                  "in_transit",
  "awaiting shipment":                                           "in_transit",
  "awaiting collection":                                         "in_transit",
  "partially shipped":                                           "in_transit",
  // In transit — VI (từ file thực tế)
  "đã vận chuyển":                                              "in_transit",
  "cần vận chuyển":                                             "in_transit",
  "đang vận chuyển":                                            "in_transit",
  "đang giao hàng":                                             "in_transit",
  "đang xử lý":                                                 "in_transit",
  "chờ vận chuyển":                                             "in_transit",
  "sẵn sàng giao hàng":                                         "in_transit",
  "đã đặt lấy hàng":                                            "in_transit",
  // Pending — EN
  "unpaid":                                                      "pending",
  "to process":                                                  "pending",
  "pending":                                                     "pending",
  "on hold":                                                     "pending",
  // Pending — VI
  "chờ xác nhận":                                               "pending",
  "chờ thanh toán":                                             "pending",
  "chưa thanh toán":                                            "pending",
  "chờ xử lý":                                                  "pending",
  // Cancelled — EN
  "cancelled":                                                   "cancelled",
  "canceled":                                                    "cancelled",
  // Cancelled — VI
  "đã hủy":                                                     "cancelled",
  "hủy":                                                        "cancelled",
  // Returned — EN
  "return":                                                      "returned",
  "returned":                                                    "returned",
  "refunded":                                                    "returned",
  // Returned — VI
  "trả hàng":                                                   "returned",
  "hoàn hàng":                                                  "returned",
  "đang hoàn hàng":                                             "returned",
};

const POS_MAP: Record<string, string> = {
  "đã xác nhận":                                                "completed",
  "hoàn thành":                                                  "completed",
  "đã giao":                                                    "completed",
  "đã hủy":                                                     "cancelled",
  "hủy":                                                        "cancelled",
  "đang xử lý":                                                 "pending",
  "chờ xử lý":                                                  "pending",
  "chờ xác nhận":                                               "pending",
  "đang giao":                                                   "in_transit",
  "đang vận chuyển":                                            "in_transit",
};

const PLATFORM_MAPS: Record<Platform, Record<string, string>> = {
  shopee:   SHOPEE_MAP,
  tiktok:   TIKTOK_MAP,
  pos_cake: POS_MAP,
};

export function normalizeStatus(raw: string, platform: Platform): string {
  if (!raw) return "unknown";
  const key = raw.toLowerCase().trim();
  const map = PLATFORM_MAPS[platform] ?? {};

  // 1. Exact match
  if (map[key]) return map[key];

  // 2. Partial match — key chứa pattern hoặc ngược lại
  for (const [pattern, normalized] of Object.entries(map)) {
    if (key.includes(pattern) || pattern.includes(key)) return normalized;
  }

  return "unknown";
}
