import { Transaction } from "../models/Transaction";

export class RiskAssessmentService {
    private static readonly RISK_THRESHOLDS = {
        CRITICAL: 70,
        HIGH: 50,
        MEDIUM: 30
    };

    private static readonly AMOUNT_THRESHOLDS = {
        VERY_HIGH: 50000000,
        HIGH: 20000000,
        MEDIUM: 10000000
    };

    public static assessDepositRisk(amount: number, balance: number, dailyCount: number, ipCount: number): RiskResult {
        let score = 0;
        const riskFactors: RiskFactor[] = [];

        const amountRisk = this.evaluateAmountRisk(amount);
        score += amountRisk.score;
        if (amountRisk.factor) riskFactors.push(amountRisk.factor);

        const balanceRisk = this.evaluateBalanceRisk(amount, balance);
        score += balanceRisk.score;
        if (balanceRisk.factor) riskFactors.push(balanceRisk.factor);

        const frequencyRisk = this.evaluateFrequencyRisk(dailyCount);
        score += frequencyRisk.score;
        if (frequencyRisk.factor) riskFactors.push(frequencyRisk.factor);

        const ipRisk = this.evaluateIpRisk(ipCount);
        score += ipRisk.score;
        if (ipRisk.factor) riskFactors.push(ipRisk.factor);

        const level = this.determineRiskLevel(score);
        const recommendations = this.getRecommendations(level, riskFactors);

        return {
            level,
            score,
            riskFactors,
            recommendations,
            isHighRisk: level === 'HIGH' || level === 'CRITICAL',
            isCritical: level === 'CRITICAL'
        };
    }

    private static evaluateAmountRisk(amount: number): { score: number; factor?: RiskFactor } {
        if (amount > this.AMOUNT_THRESHOLDS.VERY_HIGH) {
            return {
                score: 40,
                factor: {
                    type: 'AMOUNT',
                    severity: 'HIGH',
                    description: `Số tiền giao dịch ${amount.toLocaleString('vi-VN')}đ vượt ngưỡng rất cao`,
                    details: { amount, threshold: this.AMOUNT_THRESHOLDS.VERY_HIGH }
                }
            };
        }

        if (amount > this.AMOUNT_THRESHOLDS.HIGH) {
            return {
                score: 20,
                factor: {
                    type: 'AMOUNT',
                    severity: 'MEDIUM',
                    description: `Số tiền giao dịch ${amount.toLocaleString('vi-VN')}đ ở mức cao`,
                    details: { amount, threshold: this.AMOUNT_THRESHOLDS.HIGH }
                }
            };
        }

        if (amount > this.AMOUNT_THRESHOLDS.MEDIUM) {
            return {
                score: 10,
                factor: {
                    type: 'AMOUNT',
                    severity: 'LOW',
                    description: `Số tiền giao dịch ${amount.toLocaleString('vi-VN')}đ ở mức trung bình`,
                    details: { amount, threshold: this.AMOUNT_THRESHOLDS.MEDIUM }
                }
            };
        }

        return { score: 0 };
    }

    private static evaluateBalanceRisk(amount: number, balance: number): { score: number; factor?: RiskFactor } {
        if (balance === 0) {
            return {
                score: 10,
                factor: {
                    type: 'BALANCE',
                    severity: 'MEDIUM',
                    description: 'Ví không có số dư, giao dịch lần đầu',
                    details: { balance, amount }
                }
            };
        }

        if (amount > balance * 10) {
            return {
                score: 20,
                factor: {
                    type: 'BALANCE',
                    severity: 'HIGH',
                    description: `Số tiền giao dịch gấp ${Math.round(amount / balance)} lần số dư hiện tại`,
                    details: { balance, amount, ratio: Math.round(amount / balance) }
                }
            };
        }

        if (amount > balance * 5) {
            return {
                score: 10,
                factor: {
                    type: 'BALANCE',
                    severity: 'MEDIUM',
                    description: `Số tiền giao dịch gấp ${Math.round(amount / balance)} lần số dư hiện tại`,
                    details: { balance, amount, ratio: Math.round(amount / balance) }
                }
            };
        }

        return { score: 0 };
    }

    private static evaluateFrequencyRisk(dailyCount: number): { score: number; factor?: RiskFactor } {
        if (dailyCount >= 8) {
            return {
                score: 15,
                factor: {
                    type: 'FREQUENCY',
                    severity: 'HIGH',
                    description: `Đã thực hiện ${dailyCount} giao dịch trong ngày, gần đạt giới hạn`,
                    details: { dailyCount, limit: 10 }
                }
            };
        }

        if (dailyCount >= 5) {
            return {
                score: 8,
                factor: {
                    type: 'FREQUENCY',
                    severity: 'MEDIUM',
                    description: `Đã thực hiện ${dailyCount} giao dịch trong ngày`,
                    details: { dailyCount, limit: 10 }
                }
            };
        }

        return { score: 0 };
    }

    private static evaluateIpRisk(ipCount: number): { score: number; factor?: RiskFactor } {
        if (ipCount >= 15) {
            return {
                score: 10,
                factor: {
                    type: 'IP',
                    severity: 'MEDIUM',
                    description: `Đã có ${ipCount} yêu cầu từ IP này trong giờ`,
                    details: { ipCount, limit: 20 }
                }
            };
        }

        return { score: 0 };
    }

    private static determineRiskLevel(score: number): RiskLevel {
        if (score >= this.RISK_THRESHOLDS.CRITICAL) {
            return 'CRITICAL';
        }

        if (score >= this.RISK_THRESHOLDS.HIGH) {
            return 'HIGH';
        }

        if (score >= this.RISK_THRESHOLDS.MEDIUM) {
            return 'MEDIUM';
        }

        return 'LOW';
    }

    private static getRecommendations(level: RiskLevel, factors: RiskFactor[]): string[] {
        const recommendations: string[] = [];

        if (level === 'CRITICAL') {
            recommendations.push('Yêu cầu xác minh bảo mật bổ sung qua OTP/SMS');
            recommendations.push('Tạm thời giữ giao dịch để kiểm tra thủ công');
            recommendations.push('Thông báo cho bộ phận chống gian lận');
        }

        if (level === 'HIGH') {
            recommendations.push('Yêu cầu xác minh danh tính bổ sung');
            recommendations.push('Giới hạn số tiền giao dịch tối đa');
        }

        if (level === 'MEDIUM') {
            recommendations.push('Theo dõi và ghi nhật ký giao dịch');
        }

        for (const factor of factors) {
            if (factor.type === 'AMOUNT' && factor.severity === 'HIGH') {
                recommendations.push(`Kiểm tra nguồn tiền cho giao dịch ${factor.details.amount.toLocaleString('vi-VN')}đ`);
            }

            if (factor.type === 'BALANCE' && factor.severity === 'HIGH') {
                recommendations.push('Xác minh lịch sử giao dịch bất thường');
            }
        }

        return recommendations;
    }

    public static async assessWithExternalData(
        userId: string | number,
        amount: number,
        balance: number,
        dailyCount: number,
        ipCount: number
    ): Promise<RiskResult> {
        const result = this.assessDepositRisk(amount, balance, dailyCount, ipCount);

        const historicalData = await this.getHistoricalData(userId);
        if (historicalData) {
            result.historicalContext = historicalData;
        }

        return result;
    }

    private static async getHistoricalData(userId: string | number): Promise<any> {
        try {
            const totalDeposits = await Transaction.where('userId', userId).where('tranType', 15).where('status', 999).count();
            const totalAmount = await Transaction.where('userId', userId).where('tranType', 15).where('status', 999).sum('amount');
            const avgAmount = totalDeposits > 0 ? totalAmount / totalDeposits : 0;

            return {
                totalDeposits,
                totalAmount,
                avgAmount,
                isNewUser: totalDeposits === 0
            };
        } catch {
            return null;
        }
    }
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
    type: 'AMOUNT' | 'BALANCE' | 'FREQUENCY' | 'IP' | 'HISTORICAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    details: Record<string, any>;
}

export interface RiskResult {
    level: RiskLevel;
    score: number;
    riskFactors: RiskFactor[];
    recommendations: string[];
    isHighRisk: boolean;
    isCritical: boolean;
    historicalContext?: any;
}