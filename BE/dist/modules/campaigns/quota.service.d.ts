export declare const getQuota: () => Promise<{
    sentToday: number;
    dailyLimit: number;
    rateLimit: number;
}>;
export declare const checkAndIncrementQuota: (newCount: number) => Promise<void>;
//# sourceMappingURL=quota.service.d.ts.map