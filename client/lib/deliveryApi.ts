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
 * Fetch all completed orders
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

    while (hasMore) {
        const response = await fetchOrdersPage(token, page, size);
        const orders = response.payload.list;

        // Filter by date range if provided
        if (fromDate && toDate) {
            const filteredOrders = orders.filter((order) => {
                const orderDate = new Date(order.creationDate);
                return orderDate >= fromDate && orderDate <= toDate;
            });
            allOrders.push(...filteredOrders);
        } else {
            // No date filter - add all orders
            allOrders.push(...orders);
        }

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
    let validOrdersCount = 0;

    orders.forEach((order) => {
        // Skip orders with missing timestamps
        if (!order.creationDate || !order.deliveredAt || !order.originPickupAt) {
            return;
        }

        // Total time: creationDate -> deliveredAt
        const orderTotalTime = getMinutesDifference(
            order.creationDate,
            order.deliveredAt
        );

        // Preparation time: creationDate -> originPickupAt
        const preparationTime = getMinutesDifference(
            order.creationDate,
            order.originPickupAt
        );

        // Delivery time: originPickupAt -> deliveredAt
        const deliveryTime = getMinutesDifference(
            order.originPickupAt,
            order.deliveredAt
        );

        // Skip orders with negative or unrealistic times (data corruption)
        // Negative times mean timestamps are in wrong order
        if (orderTotalTime < 0 || preparationTime < 0 || deliveryTime < 0) {
            console.warn(`Skipping order ${order.code} due to invalid timestamps`);
            return;
        }

        // Skip orders with unrealistic times (> 24 hours = 1440 minutes)
        if (orderTotalTime > 1440) {
            console.warn(`Skipping order ${order.code} due to unrealistic total time: ${orderTotalTime} minutes`);
            return;
        }

        validOrdersCount++;
        totalTime += orderTotalTime;
        totalPreparationTime += preparationTime;
        totalDeliveryTime += deliveryTime;

        // Count orders delivered within 60 minutes
        if (orderTotalTime <= 60) {
            onTimeCount++;
        }
    });

    // If no valid orders, return zeros
    if (validOrdersCount === 0) {
        return {
            avgTotalTime: 0,
            avgPreparationTime: 0,
            avgDeliveryTime: 0,
            onTimePercentage: 0,
            totalOrders: 0,
        };
    }

    return {
        avgTotalTime: Math.round(totalTime / validOrdersCount),
        avgPreparationTime: Math.round(totalPreparationTime / validOrdersCount),
        avgDeliveryTime: Math.round(totalDeliveryTime / validOrdersCount),
        onTimePercentage: Math.round((onTimeCount / validOrdersCount) * 100),
        totalOrders: validOrdersCount,
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
        // Skip orders with missing timestamps
        if (!order.creationDate || !order.deliveredAt) {
            return;
        }

        const totalTime = getMinutesDifference(
            order.creationDate,
            order.deliveredAt
        );

        // Skip orders with negative or unrealistic times
        if (totalTime < 0 || totalTime > 1440) {
            return;
        }

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
    // Return 0 if timestamps are missing
    if (!order.creationDate || !order.deliveredAt) {
        return 0;
    }

    const totalTime = getMinutesDifference(order.creationDate, order.deliveredAt);

    // Return 0 if time is negative or unrealistic
    if (totalTime < 0 || totalTime > 1440) {
        return 0;
    }

    return totalTime;
}
