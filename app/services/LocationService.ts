import fs from 'fs';
import path from 'path';
import { CacheService } from './CacheService';

interface Province {
    code: string;
    name: string;
    shortName: string;
    placeType?: string;
}

interface Ward {
    code: string;
    name: string;
    provinceCode: string;
}

export class LocationService {
    private static instance: LocationService;
    private provinces: Province[] = [];
    private wards: Ward[] = [];
    private initialized: boolean = false;
    private readonly locationPath: string;

    private constructor() {
        this.locationPath = path.join(process.cwd(), 'storage', 'app', 'private', 'location');
    }

    public static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const cacheService = CacheService.getInstance();
            
            let provinces = await cacheService.get<Province[]>('location:provinces');
            let wards = await cacheService.get<Ward[]>('location:wards');

            if (provinces && wards && provinces.length > 0 && wards.length > 0) {
                this.provinces = provinces;
                this.wards = wards;
            } else {
                this.provinces = await this.loadProvincesFromFile();
                this.wards = await this.loadWardsFromFile();
                
                await cacheService.set('location:provinces', this.provinces, 86400);
                await cacheService.set('location:wards', this.wards, 86400);
            }

            this.initialized = true;
        } catch (error: any) {
            throw new Error('Hệ thống đang có lỗi, vui lòng quay lại sau.');
        }
    }

    private async loadProvincesFromFile(): Promise<Province[]> {
        const filePath = path.join(this.locationPath, 'provinces.json');
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }

    private async loadWardsFromFile(): Promise<Ward[]> {
        const filePath = path.join(this.locationPath, 'wards.json');
        
        if (!fs.existsSync(filePath)) {
            throw new Error('File wards.json không tồn tại');
        }

        const data = fs.readFileSync(filePath, 'utf-8');
        const wards = JSON.parse(data);

        if (!Array.isArray(wards)) {
            throw new Error('Dữ liệu wards không hợp lệ');
        }

        return wards;
    }

    public findProvince(code: string): Province | null {
        if (!this.initialized) {
            throw new Error('LocationService chưa được khởi tạo');
        }
        const searchCode = String(code).padStart(2, '0');
        return this.provinces.find(p => p.code === searchCode) || null;
    }

    public findWard(code: string): Ward | null {
        if (!this.initialized) {
            throw new Error('LocationService chưa được khởi tạo');
        }
        const searchCode = String(code).padStart(5, '0');
        return this.wards.find(w => w.code === searchCode) || null;
    }

    public validateAddress(provinceCode: string, wardCode: string) {
        if (!this.initialized) {
            return { valid: false, message: 'Hệ thống đang có lỗi, vui lòng quay lại sau.' };
        }

        const province = this.findProvince(provinceCode);
        if (!province) {
            return { valid: false, message: 'Tỉnh/Thành phố không hợp lệ' };
        }

        const ward = this.findWard(wardCode);
        if (!ward) {
            return { valid: false, message: 'Phường/Xã không hợp lệ' };
        }

        if (ward.provinceCode !== String(provinceCode).padStart(2, '0')) {
            return { valid: false, message: 'Phường/Xã không thuộc tỉnh/thành phố đã chọn' };
        }

        return { valid: true, province, ward };
    }

    public buildFullAddress(
        address: string = '',
        wardName: string = '',
        provinceName: string = ''
    ): string {
        const parts = [];
        
        const addr = String(address || '').trim();
        const wName = String(wardName || '').trim();
        const pName = String(provinceName || '').trim();
        
        if (addr) parts.push(addr);
        if (wName) parts.push(wName);
        if (pName) parts.push(pName);
        
        return parts.join(', ');
    }

    public parseAddressFromParts(data: {
        address?: string;
        provinceCode?: string | number;
        wardCode?: string | number;
    }): { fullAddress: string } | null {
        const { address, provinceCode, wardCode } = data;

        if (!provinceCode || !wardCode) return null;

        const provinceCodeStr = String(provinceCode).padStart(2, '0');
        const wardCodeStr = String(wardCode).padStart(5, '0');

        const validation = this.validateAddress(provinceCodeStr, wardCodeStr);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        const fullAddress = this.buildFullAddress(
            String(address || ''),
            validation.ward!.name,
            validation.province!.name
        );

        return { fullAddress };
    }

    public getProvincesForDropdown(): Array<{ value: string; label: string }> {
        if (!this.initialized) return [];
        return this.provinces.map(p => ({
            value: p.code,
            label: p.name
        }));
    }

    public getWardsForDropdown(provinceCode: string): Array<{ value: string; label: string }> {
        if (!this.initialized) return [];
        const code = String(provinceCode).padStart(2, '0');
        return this.wards
            .filter(w => w.provinceCode === code)
            .map(w => ({
                value: w.code,
                label: w.name
            }));
    }

    public async clearCache(): Promise<void> {
        const cacheService = CacheService.getInstance();
        await cacheService.del('location:provinces');
        await cacheService.del('location:wards');
        this.initialized = false;
    }

    public async reload(): Promise<void> {
        await this.clearCache();
        await this.initialize();
    }
}

export const locationService = LocationService.getInstance();