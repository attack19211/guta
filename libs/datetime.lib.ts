export class DateTime {
    private date: Date;

    constructor(date: Date | string | number = new Date()) {
        this.date = new Date(date);
    }

    /**
     * Parse chuỗi dạng YYYYMMDDHHmmss (VD: "20260807193131") thành Date
     */
    public static parseCustomDate(dateStr: string | Date): Date {
        if (dateStr instanceof Date) return dateStr;
        if (typeof dateStr !== 'string' || dateStr.length !== 14) return new Date(dateStr);

        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day = parseInt(dateStr.substring(6, 8), 10);
        const hours = parseInt(dateStr.substring(8, 10), 10);
        const minutes = parseInt(dateStr.substring(10, 12), 10);
        const seconds = parseInt(dateStr.substring(12, 14), 10);

        return new Date(year, month, day, hours, minutes, seconds);
    }

    /**
     * Khởi tạo đối tượng DateTime từ chuỗi YYYYMMDDHHmmss
     */
    public static fromCustomFormat(dateStr: string): DateTime {
        return new DateTime(DateTime.parseCustomDate(dateStr));
    }

    /**
     * Xuất ra chuỗi dạng YYYYMMDDHHmmss
     * Output: 20260807193131
     */
    public toCustomFormat(): string {
        const year = this.date.getFullYear();
        const month = this.pad(this.date.getMonth() + 1);
        const day = this.pad(this.date.getDate());
        const hours = this.pad(this.date.getHours());
        const minutes = this.pad(this.date.getMinutes());
        const seconds = this.pad(this.date.getSeconds());

        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }

    /**
     * Hàm hỗ trợ thêm số 0 vào trước chuỗi cho đủ chữ số
     */
    private pad(num: number, digits: number = 2): string {
        return String(num).padStart(digits, '0');
    }

    /**
     * Trả về đối tượng chứa thông tin múi giờ hiện tại
     */
    private getTimezoneOffsetInfo(): { sign: string; hours: string; minutes: string; formatted: string } {
        const tzo = -this.date.getTimezoneOffset();
        const sign = tzo >= 0 ? '+' : '-';
        const hours = this.pad(Math.floor(Math.abs(tzo) / 60));
        const minutes = this.pad(Math.abs(tzo) % 60);

        return {
            sign,
            hours,
            minutes,
            formatted: `${sign}${hours}:${minutes}`
        };
    }

    /**
     * Parse duration string thành milliseconds
     * Hỗ trợ: s, m, h, d
     * Ví dụ: "30s", "5m", "2h", "3d"
     */
    public static parseDuration(duration: string): number {
        if (!duration) return 0;
        
        const value = parseInt(duration);
        const unit = duration.replace(/[0-9]/g, '').toLowerCase();
        
        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return parseInt(duration) * 1000;
        }
    }

    /**
     * Parse duration string thành seconds
     */
    public static parseDurationToSeconds(duration: string): number {
        return Math.floor(DateTime.parseDuration(duration) / 1000);
    }

    /**
     * Thêm thời gian vào datetime hiện tại
     */
    public add(duration: string): DateTime {
        const ms = DateTime.parseDuration(duration);
        return new DateTime(this.date.getTime() + ms);
    }

    /**
     * Trừ thời gian từ datetime hiện tại
     */
    public subtract(duration: string): DateTime {
        const ms = DateTime.parseDuration(duration);
        return new DateTime(this.date.getTime() - ms);
    }

    /**
     * Tính khoảng cách giữa 2 datetime (trả về milliseconds)
     */
    public diff(date: DateTime | Date | string | number): number {
        const target = date instanceof DateTime ? date.date : new Date(date);
        return this.date.getTime() - target.getTime();
    }

    /**
     * Kiểm tra xem datetime có trước datetime khác không
     */
    public isBefore(date: DateTime | Date | string | number): boolean {
        const target = date instanceof DateTime ? date.date : new Date(date);
        return this.date.getTime() < target.getTime();
    }

    /**
     * Kiểm tra xem datetime có sau datetime khác không
     */
    public isAfter(date: DateTime | Date | string | number): boolean {
        const target = date instanceof DateTime ? date.date : new Date(date);
        return this.date.getTime() > target.getTime();
    }

    /**
     * Kiểm tra xem datetime có bằng datetime khác không
     */
    public isEqual(date: DateTime | Date | string | number): boolean {
        const target = date instanceof DateTime ? date.date : new Date(date);
        return this.date.getTime() === target.getTime();
    }

    /**
     * Lấy thời gian còn lại đến một datetime (trả về object)
     */
    public diffTo(date: DateTime | Date | string | number): {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        milliseconds: number;
        totalMilliseconds: number;
        isPast: boolean;
    } {
        const target = date instanceof DateTime ? date.date : new Date(date);
        const diffMs = target.getTime() - this.date.getTime();
        const isPast = diffMs < 0;
        const absDiff = Math.abs(diffMs);

        return {
            days: Math.floor(absDiff / (24 * 60 * 60 * 1000)),
            hours: Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
            minutes: Math.floor((absDiff % (60 * 60 * 1000)) / (60 * 1000)),
            seconds: Math.floor((absDiff % (60 * 1000)) / 1000),
            milliseconds: absDiff % 1000,
            totalMilliseconds: diffMs,
            isPast
        };
    }

    /**
     * Format human readable (khoảng cách thời gian)
     * Ví dụ: "2 giờ trước", "3 ngày sau"
     */
    public diffForHumans(date?: DateTime | Date | string | number): string {
        const target = date ? (date instanceof DateTime ? date.date : new Date(date)) : new Date();
        const diff = this.diff(target);
        const absDiff = Math.abs(diff);
        const isPast = diff > 0;

        const seconds = Math.floor(absDiff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        let result = '';
        if (years > 0) {
            result = `${years} năm`;
        } else if (months > 0) {
            result = `${months} tháng`;
        } else if (days > 0) {
            result = `${days} ngày`;
        } else if (hours > 0) {
            result = `${hours} giờ`;
        } else if (minutes > 0) {
            result = `${minutes} phút`;
        } else {
            result = `${seconds} giây`;
        }

        return isPast ? `${result} trước` : `sau ${result}`;
    }

    /**
     * Lấy thời gian bắt đầu của ngày (00:00:00)
     */
    public startOfDay(): DateTime {
        const date = new Date(this.date);
        date.setHours(0, 0, 0, 0);
        return new DateTime(date);
    }

    /**
     * Lấy thời gian kết thúc của ngày (23:59:59.999)
     */
    public endOfDay(): DateTime {
        const date = new Date(this.date);
        date.setHours(23, 59, 59, 999);
        return new DateTime(date);
    }

    /**
     * Lấy thời gian bắt đầu của tháng
     */
    public startOfMonth(): DateTime {
        const date = new Date(this.date.getFullYear(), this.date.getMonth(), 1);
        return new DateTime(date);
    }

    /**
     * Lấy thời gian kết thúc của tháng
     */
    public endOfMonth(): DateTime {
        const date = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0, 23, 59, 59, 999);
        return new DateTime(date);
    }

    /**
     * Lấy thời gian bắt đầu của năm
     */
    public startOfYear(): DateTime {
        const date = new Date(this.date.getFullYear(), 0, 1);
        return new DateTime(date);
    }

    /**
     * Lấy thời gian kết thúc của năm
     */
    public endOfYear(): DateTime {
        const date = new Date(this.date.getFullYear(), 11, 31, 23, 59, 59, 999);
        return new DateTime(date);
    }

    /**
     * Kiểm tra xem có phải là hôm nay không
     */
    public isToday(): boolean {
        const today = new Date();
        return this.date.getFullYear() === today.getFullYear() &&
               this.date.getMonth() === today.getMonth() &&
               this.date.getDate() === today.getDate();
    }

    /**
     * Kiểm tra xem có phải là ngày mai không
     */
    public isTomorrow(): boolean {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.date.getFullYear() === tomorrow.getFullYear() &&
               this.date.getMonth() === tomorrow.getMonth() &&
               this.date.getDate() === tomorrow.getDate();
    }

    /**
     * Kiểm tra xem có phải là ngày hôm qua không
     */
    public isYesterday(): boolean {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.date.getFullYear() === yesterday.getFullYear() &&
               this.date.getMonth() === yesterday.getMonth() &&
               this.date.getDate() === yesterday.getDate();
    }

    /**
     * Lấy tên tháng (Tiếng Việt)
     */
    public getMonthName(locale: 'vi' | 'en' = 'vi'): string {
        const monthNames = {
            vi: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
            en: ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December']
        };
        const monthIndex = this.date.getMonth();
        const names = monthNames[locale];
        if (!names) {
            return `Tháng ${monthIndex + 1}`;
        }
        return names[monthIndex] || `Tháng ${monthIndex + 1}`;
    }

    /**
     * Lấy tên thứ trong tuần (Tiếng Việt)
     */
    public getDayName(locale: 'vi' | 'en' = 'vi'): string {
        const dayNames = {
            vi: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
            en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        };
        const dayIndex = this.date.getDay();
        const names = dayNames[locale];
        if (!names) {
            return `Ngày ${dayIndex + 1}`;
        }
        return names[dayIndex] || `Ngày ${dayIndex + 1}`;
    }

    /**
     * Lấy số tuần trong năm
     */
    public getWeekNumber(): number {
        const startOfYear = new Date(this.date.getFullYear(), 0, 1);
        const diff = this.date.getTime() - startOfYear.getTime();
        return Math.ceil((diff / (24 * 60 * 60 * 1000) + startOfYear.getDay() + 1) / 7);
    }

    /**
     * Dạng ISO 8601 kèm offset địa phương (Microseconds)
     * Output: 2026-08-04T11:32:20.884183+07:00
     */
    public toISOWithOffset(): string {
        const year = this.date.getFullYear();
        const month = this.pad(this.date.getMonth() + 1);
        const day = this.pad(this.date.getDate());
        const hours = this.pad(this.date.getHours());
        const minutes = this.pad(this.date.getMinutes());
        const seconds = this.pad(this.date.getSeconds());
        const milliseconds = this.pad(this.date.getMilliseconds(), 3);
        const microseconds = '000';
        const tz = this.getTimezoneOffsetInfo().formatted;

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${microseconds}${tz}`;
    }

    /**
     * Chuẩn ISO 8601 quốc tế (UTC)
     * Output: 2026-08-04T04:32:20.884Z
     */
    public toISO(): string {
        return this.date.toISOString();
    }

    /**
     * Dạng ngày chuẩn Database (YYYY-MM-DD HH:mm:ss)
     * Output: 2026-08-04 11:32:20
     */
    public toSQL(): string {
        const year = this.date.getFullYear();
        const month = this.pad(this.date.getMonth() + 1);
        const day = this.pad(this.date.getDate());
        const hours = this.pad(this.date.getHours());
        const minutes = this.pad(this.date.getMinutes());
        const seconds = this.pad(this.date.getSeconds());

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Dạng chỉ lấy ngày (YYYY-MM-DD)
     * Output: 2026-08-04
     */
    public toDateOnly(): string {
        const year = this.date.getFullYear();
        const month = this.pad(this.date.getMonth() + 1);
        const day = this.pad(this.date.getDate());

        return `${year}-${month}-${day}`;
    }

    /**
     * Dạng ngày tháng Việt Nam (DD/MM/YYYY HH:mm:ss)
     * Output: 04/08/2026 11:32:20
     */
    public toVNFormat(): string {
        const year = this.date.getFullYear();
        const month = this.pad(this.date.getMonth() + 1);
        const day = this.pad(this.date.getDate());
        const hours = this.pad(this.date.getHours());
        const minutes = this.pad(this.date.getMinutes());
        const seconds = this.pad(this.date.getSeconds());

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * Dạng Unix Timestamp (Tính theo Giây)
     * Output: 1785817940
     */
    public toUnixTimestamp(): number {
        return Math.floor(this.date.getTime() / 1000);
    }

    /**
     * Dạng Timestamp (Tính theo Mili-giây)
     * Output: 1785817940884
     */
    public toMilliseconds(): number {
        return this.date.getTime();
    }

    /**
     * Hàm custom format tùy chỉnh bằng pattern đơn giản
     * Hỗ trợ: YYYY, MM, DD, HH, mm, ss, SSS
     * Ví dụ: format('DD-MM-YYYY HH:mm') -> 04-08-2026 11:32
     */
    public format(pattern: string): string {
        const replacements: Record<string, string> = {
            YYYY: String(this.date.getFullYear()),
            MM: this.pad(this.date.getMonth() + 1),
            DD: this.pad(this.date.getDate()),
            HH: this.pad(this.date.getHours()),
            mm: this.pad(this.date.getMinutes()),
            ss: this.pad(this.date.getSeconds()),
            SSS: this.pad(this.date.getMilliseconds(), 3)
        };

        return pattern.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, (match) => replacements[match] || match);
    }

    /**
     * Chuyển đổi sang Date object
     */
    public toDate(): Date {
        return new Date(this.date);
    }

    /**
     * Clone DateTime object
     */
    public clone(): DateTime {
        return new DateTime(this.date);
    }

    /**
     * Kiểm tra xem ngày có hợp lệ không
     */
    public isValid(): boolean {
        return !isNaN(this.date.getTime());
    }
}

/**
 * Tạo instance DateTime hiện tại
 */
export const now = () => new DateTime();

/**
 * Parse date thành DateTime
 */
export const parseDate = (date: Date | string | number) => new DateTime(date);

/**
 * Parse chuỗi định dạng YYYYMMDDHHmmss thành DateTime
 */
export const parseCustomFormat = (dateStr: string) => DateTime.fromCustomFormat(dateStr);

/**
 * Parse duration string
 */
export const parseDuration = (duration: string): number => {
    return DateTime.parseDuration(duration);
};

/**
 * Helper để lấy expiresAt từ config
 */
export const getExpiresAt = (duration: string): DateTime => {
    const ms = DateTime.parseDuration(duration);
    return new DateTime(Date.now() + ms);
};