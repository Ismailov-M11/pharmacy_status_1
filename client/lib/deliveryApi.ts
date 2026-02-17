const API_BASE_URL = "https://api.davodelivery.uz/api";

// ============================================
// INTERFACES
// ============================================

export interface OrderCustomer {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
}

export interface OrderLocation {
    id: number;
    name: string;
    nameRu: string | null;
    favorite: boolean;
    latitude: number;
    longitude: number;
    apartment: string;
    entrance: string;
    floor: string;
    entranceCode: string | null;
    comment: string | null;
}

export interface OrderMarket {
    id: number;
    address: string;
    landmark: string;
    name: string;
    phone: string;
    latitude: number | null;
    longitude: number | null;
}

export interface OrderItem {
    id: number;
    slug: string;
    name: string;
    manufacturer: string;
    brand: string;
    quantity: number;
    price: number;
    total: number;
}

export interface OrderInvoice {
    id: number;
    marketTotal: number;
    deliveryTotal: number;
    serviceTotal: number;
    total: number;
    paid: boolean;
    paidTime: string;
    receiptUrl: string;
    courierReceiptUrl: string;
}

export interface OrderHistoryUpdater {
    id: number;
    firstName: string | null;
    lastName: string | null;
    phone: string;
}

export interface OrderHistory {
    id: number;
    oldStatus: string;
    newStatus: string;
    updater: OrderHistoryUpdater | null;
    updatedAt: string;
    description: string | null;
    marketChat: any | null;
    courierName: string | null;
    courierPhone: string | null;
}

export interface Order {
    createdBy: string;
    modifiedBy: string;
    creationDate: string;
    modifiedDate: string;
    id: number;
    code: string;
    status: string;
    customer: OrderCustomer;
    location: OrderLocation;
    market: OrderMarket;
    items: OrderItem[];
    invoice: OrderInvoice;
    source: string;
    histories: OrderHistory[];
    originEta: string;
    originAta: string;
    originPickupAt: string;
    originDistance: number;
    destinationEta: string;
    destinationAta: string;
    deliveredAt: string;
    destinationDistance: number;
}

export interface OrderListResponse {
    payload: {
        list: Order[];
        total: number;
    };
    status: string;
    code: number;
}

export interface DeliveryMetrics {
    avgTotalTime: number;
    avgPreparationTime: number;
    avgDeliveryTime: number;
    onTimePercentage: number;
    totalOrders: number;
}

export interface TimeDistribution {
    "0-30": number;
    "30-60": number;
    "60-90": number;
    "90+": number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch completed orders with pagination
 * @param token - Authorization token
 * @param page - Page number (0-indexed)
 * @param size - Number of items per page (default: 10000)
 * @returns Order list response
 */
export async function fetchOrdersPage(
    token: string,
    page: number = 0,
    size: number = 10000
): Promise<OrderListResponse> {
    const response = await fetch(`${API_BASE_URL}/order/list`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            page,
            size,
            status: "COMPLETED",
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch orders");
    }

    return response.json();
}

/**
 * Fetch all completed orders from the last 3 months
 * @param token - Authorization token
 * @param fromDate - Optional start date filter
 * @param toDate - Optional end date filter
 * @returns Array of all orders
 */
export async function fetchCompletedOrders(
    token: string,
    fromDate?: Date,
    toDate?: Date
): Promise<Order[]> {
    const allOrders: Order[] = [];
    let page = 0;
    const size = 10000;
    let hasMore = true;

    // Default to last 3 months if no dates provided
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const filterFrom = fromDate || threeMonthsAgo;
    const filterTo = toDate || now;

    while (hasMore) {
        const response = await fetchOrdersPage(token, page, size);
        const orders = response.payload.list;

        // Filter by date range
        const filteredOrders = orders.filter((order) => {
            const orderDate = new Date(order.creationDate);
            return orderDate >= filterFrom && orderDate <= filterTo;
        });

        allOrders.push(...filteredOrders);

        // Check if we need to fetch more pages
        // If we got less than size items, we've reached the end
        if (orders.length < size) {
            hasMore = false;
        } else {
            page++;
        }

        // Safety check: don't fetch more than 5 pages (50,000 orders)
        if (page >= 5) {
            console.warn("Reached maximum page limit (5 pages)");
            hasMore = false;
        }
    }

    return allOrders;
}

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate time difference in minutes
 */
function getMinutesDifference(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Calculate delivery metrics from orders
 */
export function calculateDeliveryMetrics(orders: Order[]): DeliveryMetrics {
    if (orders.length === 0) {
        return {
            avgTotalTime: 0,
            avgPreparationTime: 0,
            avgDeliveryTime: 0,
            onTimePercentage: 0,
            totalOrders: 0,
        };
    }

    let totalTime = 0;
    let totalPreparationTime = 0;
    let totalDeliveryTime = 0;
    let onTimeCount = 0;

    orders.forEach((order) => {
        // Total time: creationDate -> deliveredAt
        const orderTotalTime = getMinutesDifference(
            order.creationDate,
            order.deliveredAt
        );
        totalTime += orderTotalTime;

        // Preparation time: creationDate -> originPickupAt
        const preparationTime = getMinutesDifference(
            order.creationDate,
            order.originPickupAt
        );
        totalPreparationTime += preparationTime;

        // Delivery time: originPickupAt -> deliveredAt
        const deliveryTime = getMinutesDifference(
            order.originPickupAt,
            order.deliveredAt
        );
        totalDeliveryTime += deliveryTime;

        // Count orders delivered within 60 minutes
        if (orderTotalTime <= 60) {
            onTimeCount++;
        }
    });

    return {
        avgTotalTime: Math.round(totalTime / orders.length),
        avgPreparationTime: Math.round(totalPreparationTime / orders.length),
        avgDeliveryTime: Math.round(totalDeliveryTime / orders.length),
        onTimePercentage: Math.round((onTimeCount / orders.length) * 100),
        totalOrders: orders.length,
    };
}

/**
 * Get time distribution for chart
 */
export function getTimeDistribution(orders: Order[]): TimeDistribution {
    const distribution: TimeDistribution = {
        "0-30": 0,
        "30-60": 0,
        "60-90": 0,
        "90+": 0,
    };

    orders.forEach((order) => {
        const totalTime = getMinutesDifference(
            order.creationDate,
            order.deliveredAt
        );

        if (totalTime <= 30) {
            distribution["0-30"]++;
        } else if (totalTime <= 60) {
            distribution["30-60"]++;
        } else if (totalTime <= 90) {
            distribution["60-90"]++;
        } else {
            distribution["90+"]++;
        }
    });

    return distribution;
}

/**
 * Calculate total delivery time for a single order
 */
export function calculateOrderTotalTime(order: Order): number {
    return getMinutesDifference(order.creationDate, order.deliveredAt);
}
