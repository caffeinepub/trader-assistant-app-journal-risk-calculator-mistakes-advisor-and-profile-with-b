import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SubscriptionState {
    trialActive: boolean;
    paidStart?: Time;
    plan?: SubscriptionPlan;
    trialStart: Time;
}
export type Time = bigint;
export interface PaymentMethod {
    id: bigint;
    name: string;
    description: string;
    enabled: boolean;
}
export interface Discount {
    id: bigint;
    code: string;
    enabled: boolean;
    percentage: number;
    validUntil: Time;
}
export interface Suggestion {
    suggestion: string;
    category: string;
}
export interface TradeEntry {
    tradeDate: Time;
    riskAmount: number;
    takeProfit: number;
    riskReward: number;
    session: string;
    stopLoss: number;
    tradingPair: string;
    outcome: boolean;
}
export interface MistakeEntry {
    id: bigint;
    tradeDate: Time;
    description: string;
    suggestion: Suggestion;
    category: MistakeCategory;
}
export interface UserProfile {
    username: string;
    dateJoined: Time;
    userId: bigint;
    fullName: string;
}
export enum MistakeCategory {
    tradeTiming = "tradeTiming",
    positionSizing = "positionSizing",
    riskManagement = "riskManagement",
    emotionalControl = "emotionalControl",
    overtrading = "overtrading"
}
export enum SubscriptionPlan {
    pro = "pro",
    premium = "premium",
    basic = "basic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminActivateSubscription(user: Principal, plan: SubscriptionPlan): Promise<void>;
    adminCancelSubscription(user: Principal): Promise<void>;
    adminCreateDiscount(code: string, percentage: number, validUntil: Time): Promise<Discount>;
    adminCreatePaymentMethod(name: string, description: string): Promise<PaymentMethod>;
    adminDeleteDiscount(id: bigint): Promise<void>;
    adminDeletePaymentMethod(id: bigint): Promise<void>;
    adminGetAllDiscounts(): Promise<Array<Discount>>;
    adminGetAllPaymentMethods(): Promise<Array<PaymentMethod>>;
    adminRemoveUser(user: Principal): Promise<void>;
    adminUpdateDiscount(id: bigint, code: string, percentage: number, validUntil: Time, enabled: boolean): Promise<void>;
    adminUpdatePaymentMethod(id: bigint, name: string, description: string, enabled: boolean): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelTrial(): Promise<void>;
    createMistakeEntry(category: MistakeCategory, description: string, tradeDate: Time): Promise<MistakeEntry>;
    createTradeEntry(tradeDate: Time, session: string, tradingPair: string, stopLoss: number, takeProfit: number, riskReward: number, riskAmount: number, outcome: boolean): Promise<TradeEntry>;
    createUserProfile(fullName: string, username: string): Promise<UserProfile>;
    deleteMistakeEntry(mistakeId: bigint): Promise<void>;
    deleteTradeEntry(index: bigint): Promise<void>;
    findUserById(targetId: bigint): Promise<[Principal, UserProfile] | null>;
    getActiveDiscounts(): Promise<Array<Discount>>;
    getAllMistakes(): Promise<Array<MistakeEntry>>;
    getAllTradeDates(): Promise<Array<Time>>;
    getAllTrades(): Promise<Array<TradeEntry>>;
    getAllUserData(): Promise<Array<[Principal, UserProfile, Array<TradeEntry>, Array<MistakeEntry>, SubscriptionState | null]>>;
    getAllUsersWithIds(): Promise<Array<[Principal, UserProfile]>>;
    getAnalytics(startDate: Time | null, endDate: Time | null): Promise<{
        totalTrades: bigint;
        grossProfit: number;
        totalPL: number;
        losingTrades: bigint;
        winningTrades: bigint;
        grossLoss: number;
        accuracy: number;
    }>;
    getCallerPlan(): Promise<{
        __kind__: "trial";
        trial: null;
    } | {
        __kind__: "expired";
        expired: null;
    } | {
        __kind__: "paid";
        paid: SubscriptionPlan;
    } | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyProfitForDate(date: Time): Promise<number>;
    getEnabledPaymentMethods(): Promise<Array<PaymentMethod>>;
    getSubscriptionState(): Promise<SubscriptionState | null>;
    getTradesByDateRange(startDate: Time, endDate: Time): Promise<Array<TradeEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isUserRegistered(user: Principal): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    selectSubscriptionPlan(plan: SubscriptionPlan): Promise<void>;
    updateMistakeEntry(mistakeId: bigint, description: string): Promise<void>;
    updateTradeEntry(index: bigint, entry: TradeEntry): Promise<void>;
}
