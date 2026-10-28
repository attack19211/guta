// core/validator/RulesRegistry.ts

import db from '@/config/database';
import { RuleDefinition } from './ValidatorTypes';

export const RulesRegistry: Record<string, RuleDefinition> = {
    accepted: {
        handler: (value) => ['yes', 'on', '1', 1, true, 'true'].includes(value),
        defaultMessage: (f) => `Trường ${f} phải được chấp nhận.`
    },
    accepted_if: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (!otherField || !data) return true;
            const targetVal = String(data[otherField] ?? '');
            if (otherValues.includes(targetVal)) {
                return ['yes', 'on', '1', 1, true, 'true'].includes(value);
            }
            return true;
        },
        defaultMessage: (f, [otherField, ...otherValues]) => `Trường ${f} phải được chấp nhận khi ${otherField} là ${otherValues.join(', ')}.`
    },
    boolean: {
        handler: (value) => [true, false, 1, 0, '1', '0', 'true', 'false'].includes(value),
        defaultMessage: (f) => `Trường ${f} phải có kiểu dữ liệu boolean.`
    },
    declined: {
        handler: (value) => ['no', 'off', '0', 0, false, 'false'].includes(value),
        defaultMessage: (f) => `Trường ${f} phải bị từ chối.`
    },
    declined_if: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (!otherField || !data) return true;
            const targetVal = String(data[otherField] ?? '');
            if (otherValues.includes(targetVal)) {
                return ['no', 'off', '0', 0, false, 'false'].includes(value);
            }
            return true;
        },
        defaultMessage: (f, [otherField, ...otherValues]) => `Trường ${f} phải bị từ chối khi ${otherField} là ${otherValues.join(', ')}.`
    },
    active_url: {
        handler: (value) => typeof value === 'string' && /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(value),
        defaultMessage: (f) => `Trường ${f} không phải là một URL hoạt động hợp lệ.`
    },
    alpha: {
        handler: (value) => typeof value === 'string' && /^[a-zA-ZÀ-ỹ]+$/.test(value),
        defaultMessage: (f) => `Trường ${f} chỉ được chứa chữ cái.`
    },
    alpha_dash: {
        handler: (value) => typeof value === 'string' && /^[a-zA-Z0-9_$-]+$/.test(value),
        defaultMessage: (f) => `Trường ${f} chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới.`
    },
    alpha_num: {
        handler: (value) => typeof value === 'string' && /^[a-zA-Z0-9]+$/.test(value),
        defaultMessage: (f) => `Trường ${f} chỉ được chứa chữ cái và số.`
    },
    ascii: {
        handler: (value) => typeof value === 'string' && /^[\x00-\x7F]*$/.test(value),
        defaultMessage: (f) => `Trường ${f} chỉ được chứa các ký tự ASCII 7-bit.`
    },
    confirmed: {
        handler: (value, _params, data, field) => Boolean(data && field && value === data[`${field}_confirmation`]),
        defaultMessage: (f) => `Xác nhận trường ${f} không khớp.`
    },
    current_password: {
        handler: async (value, _params, data) => {
            const userId = data ? data['auth_user_id'] : undefined;
            if (!userId) return false;
            try {
                const [rows] = (await db.execute('SELECT password FROM users WHERE id = ? LIMIT 1', [userId])) as [Record<string, any>[], any];
                return Boolean(rows[0] && rows[0].password === value);
            } catch {
                return false;
            }
        },
        defaultMessage: (f) => `Mật khẩu ${f} không chính xác.`
    },
    different: {
        handler: (value, [otherField], data) => Boolean(data && otherField && value !== data[otherField]),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải có giá trị khác với ${otherField}.`
    },
    doesnt_start_with: {
        handler: (value, params) => typeof value === 'string' && !params.some(p => value.startsWith(p)),
        defaultMessage: (f, params) => `Trường ${f} không được bắt đầu bằng: ${params.join(', ')}.`
    },
    doesnt_end_with: {
        handler: (value, params) => typeof value === 'string' && !params.some(p => value.endsWith(p)),
        defaultMessage: (f, params) => `Trường ${f} không được kết thúc bằng: ${params.join(', ')}.`
    },
    email: {
        handler: (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        defaultMessage: (f) => `Trường ${f} không đúng định dạng email.`
    },
    ends_with: {
        handler: (value, params) => typeof value === 'string' && params.some(p => value.endsWith(p)),
        defaultMessage: (f, params) => `Trường ${f} phải kết thúc bằng một trong các giá trị: ${params.join(', ')}.`
    },
    enum: {
        handler: (value, params) => params.includes(String(value)),
        defaultMessage: (f) => `Giá trị được chọn cho ${f} không hợp lệ.`
    },
    hex_color: {
        handler: (value) => typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value),
        defaultMessage: (f) => `Trường ${f} phải là mã màu Hex hợp lệ.`
    },
    in: {
        handler: (value, params) => params.includes(String(value)),
        defaultMessage: (f, params) => `Giá trị của ${f} phải nằm trong danh sách: ${params.join(', ')}.`
    },
    ip: {
        handler: (value) => typeof value === 'string' && /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/.test(value),
        defaultMessage: (f) => `Trường ${f} phải là một địa chỉ IP hợp lệ.`
    },
    json: {
        handler: (value) => {
            if (typeof value !== 'string') return false;
            try { JSON.parse(value); return true; } catch { return false; }
        },
        defaultMessage: (f) => `Trường ${f} phải là chuỗi JSON hợp lệ.`
    },
    lowercase: {
        handler: (value) => typeof value === 'string' && value === value.toLowerCase(),
        defaultMessage: (f) => `Trường ${f} phải là chữ in thường.`
    },
    mac_address: {
        handler: (value) => typeof value === 'string' && /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value),
        defaultMessage: (f) => `Trường ${f} phải là địa chỉ MAC hợp lệ.`
    },
    not_in: {
        handler: (value, params) => !params.includes(String(value)),
        defaultMessage: (f, params) => `Giá trị của ${f} không được nằm trong danh sách: ${params.join(', ')}.`
    },
    regex: {
        handler: (value, params) => {
            const patternStr = params.join(':');
            const regParts = patternStr.match(/^\/(.+)\/([a-z]*)$/);
            const regex = (regParts && regParts[1]) 
                ? new RegExp(regParts[1], regParts[2] || undefined) 
                : new RegExp(patternStr);
            return regex.test(String(value ?? ''));
        },
        defaultMessage: (f) => `Trường ${f} không đúng định dạng quy định.`
    },
    not_regex: {
        handler: (value, params) => {
            const patternStr = params.join(':');
            const regParts = patternStr.match(/^\/(.+)\/([a-z]*)$/);
            const regex = (regParts && regParts[1]) 
                ? new RegExp(regParts[1], regParts[2] || undefined) 
                : new RegExp(patternStr);
            return !regex.test(String(value ?? ''));
        },
        defaultMessage: (f) => `Trường ${f} có định dạng không hợp lệ.`
    },
    same: {
        handler: (value, [otherField], data) => Boolean(data && otherField && value === data[otherField]),
        defaultMessage: (f, [otherField]) => `Trường ${f} và ${otherField} phải giống nhau.`
    },
    starts_with: {
        handler: (value, params) => typeof value === 'string' && params.some(p => value.startsWith(p)),
        defaultMessage: (f, params) => `Trường ${f} phải bắt đầu bằng một trong các giá trị: ${params.join(', ')}.`
    },
    string: {
        handler: (value) => typeof value === 'string',
        defaultMessage: (f) => `Trường ${f} phải là một chuỗi ký tự.`
    },
    uppercase: {
        handler: (value) => typeof value === 'string' && value === value.toUpperCase(),
        defaultMessage: (f) => `Trường ${f} phải là chữ in hoa.`
    },
    url: {
        handler: (value) => {
            if (typeof value !== 'string') return false;
            try { new URL(value); return true; } catch { return false; }
        },
        defaultMessage: (f) => `Trường ${f} phải là một đường dẫn URL hợp lệ.`
    },
    ulid: {
        handler: (value) => typeof value === 'string' && /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(value),
        defaultMessage: (f) => `Trường ${f} phải là ULID hợp lệ.`
    },
    uuid: {
        handler: (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
        defaultMessage: (f) => `Trường ${f} phải là UUID hợp lệ.`
    },
    decimal: {
        handler: (value, [min, max]) => {
            if (isNaN(Number(value))) return false;
            const parts = String(value).split('.');
            const decimals = parts[1] ? parts[1].length : 0;
            const minD = Number(min || 0);
            const maxD = max ? Number(max) : minD;
            return decimals >= minD && decimals <= maxD;
        },
        defaultMessage: (f, [min, max]) => `Trường ${f} phải có từ ${min} đến ${max || min} chữ số thập phân.`
    },
    digits: {
        handler: (value, [length]) => /^\d+$/.test(String(value ?? '')) && String(value).length === Number(length),
        defaultMessage: (f, [length]) => `Trường ${f} phải gồm đúng ${length} chữ số.`
    },
    digits_between: {
        handler: (value, [min, max]) => {
            const str = String(value ?? '');
            return /^\d+$/.test(str) && str.length >= Number(min) && str.length <= Number(max);
        },
        defaultMessage: (f, [min, max]) => `Trường ${f} phải nằm trong khoảng từ ${min} đến ${max} chữ số.`
    },
    greater_than: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) > Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải lớn hơn ${otherField}.`
    },
    gt: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) > Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải lớn hơn ${otherField}.`
    },
    greater_than_or_equal: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) >= Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải lớn hơn hoặc bằng ${otherField}.`
    },
    gte: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) >= Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải lớn hơn hoặc bằng ${otherField}.`
    },
    integer: {
        handler: (value) => Number.isInteger(Number(value)),
        defaultMessage: (f) => `Trường ${f} phải là số nguyên.`
    },
    less_than: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) < Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải nhỏ hơn ${otherField}.`
    },
    lt: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) < Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải nhỏ hơn ${otherField}.`
    },
    less_than_or_equal: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) <= Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải nhỏ hơn hoặc bằng ${otherField}.`
    },
    lte: {
        handler: (value, [otherField], data) => Boolean(data && otherField && Number(value) <= Number(data[otherField])),
        defaultMessage: (f, [otherField]) => `Trường ${f} phải nhỏ hơn hoặc bằng ${otherField}.`
    },
    max_digits: {
        handler: (value, [max]) => /^\d+$/.test(String(value ?? '')) && String(value).length <= Number(max),
        defaultMessage: (f, [max]) => `Trường ${f} không được vượt quá ${max} chữ số.`
    },
    min_digits: {
        handler: (value, [min]) => /^\d+$/.test(String(value ?? '')) && String(value).length >= Number(min),
        defaultMessage: (f, [min]) => `Trường ${f} phải có tối thiểu ${min} chữ số.`
    },
    multiple_of: {
        handler: (value, [factor]) => Number(value) % Number(factor) === 0,
        defaultMessage: (f, [factor]) => `Trường ${f} phải là bội số của ${factor}.`
    },
    numeric: {
        handler: (value) => value !== undefined && value !== null && value !== '' && !isNaN(Number(value)),
        defaultMessage: (f) => `Trường ${f} phải là một số.`
    },
    min: {
        handler: (value, [minParam]) => {
            const min = Number(minParam);
            if (value === null || value === undefined || value === '') return true;
            if (typeof value === 'string' || Array.isArray(value)) return value.length >= min;
            if (typeof value === 'number') return value >= min;
            return String(value).length >= min;
        },
        defaultMessage: (f, [min]) => `Trường ${f} phải tối thiểu là ${min}.`
    },
    max: {
        handler: (value, [maxParam]) => {
            const max = Number(maxParam);
            if (value === null || value === undefined || value === '') return true;
            
            const strValue = String(value);
            return strValue.length <= max;
        },
        defaultMessage: (f, [max]) => `Trường ${f} không được vượt quá ${max} ký tự.`
    },
    between: {
        handler: (value, [minParam, maxParam]) => {
            const min = Number(minParam);
            const max = Number(maxParam);
            if (value === null || value === undefined || value === '') return true;
            
            const strValue = String(value);
            const len = strValue.length;
            return len >= min && len <= max;
        },
        defaultMessage: (f, [min, max]) => `Trường ${f} phải nằm trong khoảng từ ${min} đến ${max} ký tự.`
    },
    size: {
        handler: (value, [sizeParam]) => {
            const sz = Number(sizeParam);
            if (value === null || value === undefined || value === '') return true;
            
            const strValue = String(value);
            return strValue.length === sz;
        },
        defaultMessage: (f, [size]) => `Trường ${f} phải có đúng ${size} ký tự.`
    },
    array: {
        handler: (value) => Array.isArray(value),
        defaultMessage: (f) => `Trường ${f} phải là một mảng.`
    },
    array_keys: {
        handler: (value, params) => typeof value === 'object' && value !== null && params.every(k => k in value),
        defaultMessage: (f, params) => `Mảng ${f} phải chứa các khóa: ${params.join(', ')}.`
    },
    contains: {
        handler: (value, params) => Array.isArray(value) && params.every(p => value.includes(p)),
        defaultMessage: (f, params) => `Trường ${f} phải chứa các phần tử: ${params.join(', ')}.`
    },
    doesnt_contain: {
        handler: (value, params) => Array.isArray(value) && !params.some(p => value.includes(p)),
        defaultMessage: (f, params) => `Trường ${f} không được chứa các phần tử: ${params.join(', ')}.`
    },
    distinct: {
        handler: (value) => Array.isArray(value) && new Set(value).size === value.length,
        defaultMessage: (f) => `Mảng ${f} có các giá trị bị trùng lặp.`
    },
    in_array: {
        handler: (value, [otherArrayField], data) => Boolean(data && otherArrayField && Array.isArray(data[otherArrayField]) && (data[otherArrayField] as any[]).includes(value)),
        defaultMessage: (f, [otherArrayField]) => `Giá trị của ${f} phải tồn tại trong ${otherArrayField}.`
    },
    in_array_keys: {
        handler: (value, [otherObjectField], data) => Boolean(data && otherObjectField && typeof data[otherObjectField] === 'object' && value in (data[otherObjectField] as object)),
        defaultMessage: (f, [otherObjectField]) => `Giá trị của ${f} phải là khóa của ${otherObjectField}.`
    },
    list: {
        handler: (value) => Array.isArray(value) && Object.keys(value).every((k, i) => Number(k) === i),
        defaultMessage: (f) => `Trường ${f} phải là một danh sách phẳng.`
    },
    date: {
        handler: (value) => value !== undefined && value !== null && !isNaN(Date.parse(String(value))),
        defaultMessage: (f) => `Trường ${f} không phải là ngày tháng hợp lệ.`
    },
    after: {
        handler: (value, [dateParam], data) => {
            if (!value || !dateParam) return false;
            const targetVal = data ? data[dateParam] : undefined;
            const targetDateStr = targetVal !== undefined ? String(targetVal) : dateParam;
            return new Date(String(value)) > new Date(targetDateStr);
        },
        defaultMessage: (f, [date]) => `Trường ${f} phải là một ngày sau ${date}.`
    },
    after_or_equal: {
        handler: (value, [dateParam], data) => {
            if (!value || !dateParam) return false;
            const targetVal = data ? data[dateParam] : undefined;
            const targetDateStr = targetVal !== undefined ? String(targetVal) : dateParam;
            return new Date(String(value)) >= new Date(targetDateStr);
        },
        defaultMessage: (f, [date]) => `Trường ${f} phải là ngày sau hoặc bằng ${date}.`
    },
    before: {
        handler: (value, [dateParam], data) => {
            if (!value || !dateParam) return false;
            const targetVal = data ? data[dateParam] : undefined;
            const targetDateStr = targetVal !== undefined ? String(targetVal) : dateParam;
            return new Date(String(value)) < new Date(targetDateStr);
        },
        defaultMessage: (f, [date]) => `Trường ${f} phải là một ngày trước ${date}.`
    },
    before_or_equal: {
        handler: (value, [dateParam], data) => {
            if (!value || !dateParam) return false;
            const targetVal = data ? data[dateParam] : undefined;
            const targetDateStr = targetVal !== undefined ? String(targetVal) : dateParam;
            return new Date(String(value)) <= new Date(targetDateStr);
        },
        defaultMessage: (f, [date]) => `Trường ${f} phải là ngày trước hoặc bằng ${date}.`
    },
    date_equals: {
        handler: (value, [dateParam], data) => {
            if (!value || !dateParam) return false;
            const targetVal = data ? data[dateParam] : undefined;
            const targetDateStr = targetVal !== undefined ? String(targetVal) : dateParam;
            return new Date(String(value)).getTime() === new Date(targetDateStr).getTime();
        },
        defaultMessage: (f, [date]) => `Trường ${f} phải là ngày bằng với ${date}.`
    },
    date_format: {
        handler: (value) => value !== undefined && value !== null && !isNaN(Date.parse(String(value))),
        defaultMessage: (f) => `Trường ${f} không đúng định dạng thời gian.`
    },
    timezone: {
        handler: (value) => {
            if (typeof value !== 'string') return false;
            try { Intl.DateTimeFormat(undefined, { timeZone: value }); return true; } catch { return false; }
        },
        defaultMessage: (f) => `Trường ${f} phải là múi giờ hợp lệ.`
    },
    file: {
        handler: (value) => typeof value === 'object' && value !== null && ('buffer' in value || 'path' in value || 'originalname' in value),
        defaultMessage: (f) => `Trường ${f} phải là một tập tin.`
    },
    image: {
        handler: (value) => {
            if (typeof value !== 'object' || !value) return false;
            const mime = value.mimetype || value.type || '';
            return mime.startsWith('image/');
        },
        defaultMessage: (f) => `Trường ${f} phải là một hình ảnh.`
    },
    dimensions: {
        handler: () => true,
        defaultMessage: (f) => `Trường ${f} có kích thước hình ảnh không hợp lệ.`
    },
    encoding: {
        handler: () => true,
        defaultMessage: (f) => `Trường ${f} phải có mã hóa tập tin đúng quy định.`
    },
    extensions: {
        handler: (value, params) => {
            const name = value?.originalname || value?.name || '';
            const ext = name.split('.').pop()?.toLowerCase();
            return params.map(p => p.toLowerCase()).includes(ext);
        },
        defaultMessage: (f, params) => `Trường ${f} phải có định dạng mở rộng: ${params.join(', ')}.`
    },
    mimetypes: {
        handler: (value, params) => {
            const mime = value?.mimetype || value?.type || '';
            return params.includes(mime);
        },
        defaultMessage: (f, params) => `Trường ${f} phải là file có loại MIME: ${params.join(', ')}.`
    },
    mimes: {
        handler: (value, params) => {
            const name = value?.originalname || value?.name || '';
            const ext = name.split('.').pop()?.toLowerCase();
            return params.map(p => p.toLowerCase()).includes(ext);
        },
        defaultMessage: (f, params) => `Trường ${f} phải thuộc loại file: ${params.join(', ')}.`
    },
    exists: {
        handler: async (value, [table, column = '']) => {
            if (!table || value === undefined || value === null || value === '') return false;
            
            const targetCol = column || 'id';
            
            try {
                const query = `SELECT COUNT(*) as total FROM \`${table}\` WHERE \`${targetCol}\` = ? LIMIT 1`;
                const rows: any = await db.execute(query, [String(value).trim()]);
                const rawCount = rows?.[0] ? Object.values(rows[0])[0] : 0;
                const count = Number(rawCount ?? 0);

                return count > 0;
            } catch (error) {
                return false;
            }
        },
        defaultMessage: (f) => `Trường ${f} không tồn tại trong cơ sở dữ liệu.`
    },

    unique: {
        handler: async (value, [table, column = '']) => {
            if (!table || value === undefined || value === null || value === '') {
                return true;
            }

            const targetCol = column || 'id';
            
            try {
                const cleanVal = String(value).trim();
                const query = `SELECT COUNT(*) as total FROM \`${table}\` WHERE \`${targetCol}\` = ? LIMIT 1`;
                const rows: any = await db.execute(query, [cleanVal]);
                const rawCount = rows?.[0] ? Object.values(rows[0])[0] : 0;
                const count = Number(rawCount ?? 0);

                return count === 0;
            } catch (error) {
                return false;
            }
        },
        defaultMessage: (f) => `Trường ${f} đã tồn tại trên hệ thống.`
    },
    any_of: {
        handler: (value, params) => params.includes(String(value)),
        defaultMessage: (f) => `Trường ${f} không chứa giá trị phù hợp.`
    },
    bail: {
        handler: () => true,
        defaultMessage: () => ''
    },
    exclude: {
        handler: () => true,
        defaultMessage: () => ''
    },
    exclude_if: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && otherValues.includes(String(data[otherField]))) {
                return false;
            }
            return true;
        },
        defaultMessage: () => ''
    },
    exclude_unless: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && !otherValues.includes(String(data[otherField]))) {
                return false;
            }
            return true;
        },
        defaultMessage: () => ''
    },
    exclude_with: {
        handler: (value, [otherField], data) => {
            if (data && otherField && data[otherField] !== undefined) {
                return false;
            }
            return true;
        },
        defaultMessage: () => ''
    },
    exclude_without: {
        handler: (value, [otherField], data) => {
            if (data && otherField && data[otherField] === undefined) {
                return false;
            }
            return true;
        },
        defaultMessage: () => ''
    },
    filled: {
        handler: (value) => value !== undefined && value !== null && String(value).trim() !== '',
        defaultMessage: (f) => `Trường ${f} không được để trống khi hiện diện.`
    },
    missing: {
        handler: (value) => value === undefined,
        defaultMessage: (f) => `Trường ${f} không được truyền lên.`
    },
    missing_if: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && otherValues.includes(String(data[otherField]))) {
                return value === undefined;
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} phải bị khuyết khi ${otherField} khớp điều kiện.`
    },
    missing_unless: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && !otherValues.includes(String(data[otherField]))) {
                return value === undefined;
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} phải bị khuyết trừ khi ${otherField} khớp điều kiện.`
    },
    missing_with: {
        handler: (value, [otherField], data) => {
            if (data && otherField && data[otherField] !== undefined) return value === undefined;
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} không được có mặt khi có ${otherField}.`
    },
    missing_with_all: {
        handler: (value, params, data) => {
            if (data && params.every(p => data[p] !== undefined)) return value === undefined;
            return true;
        },
        defaultMessage: (f) => `Trường ${f} không được có mặt khi tất cả trường liên quan xuất hiện.`
    },
    nullable: {
        handler: () => true,
        defaultMessage: () => ''
    },
    present: {
        handler: (_value, _params, data, field) => Boolean(data && field && field in data),
        defaultMessage: (f) => `Trường ${f} phải có mặt trong dữ liệu gửi lên.`
    },
    present_if: {
        handler: (_value, [otherField, ...otherValues], data, field) => {
            if (data && otherField && field && otherValues.includes(String(data[otherField]))) return field in data;
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} phải có mặt khi ${otherField} khớp giá trị.`
    },
    present_unless: {
        handler: (_value, [otherField, ...otherValues], data, field) => {
            if (data && otherField && field && !otherValues.includes(String(data[otherField]))) return field in data;
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} phải có mặt trừ khi ${otherField} khớp giá trị.`
    },
    present_with: {
        handler: (_value, [otherField], data, field) => {
            if (data && otherField && field && data[otherField] !== undefined) return field in data;
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} phải có mặt khi có ${otherField}.`
    },
    present_with_all: {
        handler: (_value, params, data, field) => {
            if (data && field && params.every(p => data[p] !== undefined)) return field in data;
            return true;
        },
        defaultMessage: (f) => `Trường ${f} phải có mặt khi tất cả các trường tham chiếu xuất hiện.`
    },
    prohibited: {
        handler: (value) => value === undefined || value === null || value === '',
        defaultMessage: (f) => `Trường ${f} bị cấm truyền giá trị.`
    },
    prohibited_if: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && otherValues.includes(String(data[otherField]))) {
                return value === undefined || value === null || value === '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bị cấm khi ${otherField} khớp điều kiện.`
    },
    prohibited_if_accepted: {
        handler: (value, [otherField], data) => {
            if (data && otherField && ['yes', 'on', '1', 1, true, 'true'].includes(data[otherField])) {
                return value === undefined || value === null || value === '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bị cấm khi ${otherField} được chấp nhận.`
    },
    prohibited_if_declined: {
        handler: (value, [otherField], data) => {
            if (data && otherField && ['no', 'off', '0', 0, false, 'false'].includes(data[otherField])) {
                return value === undefined || value === null || value === '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bị cấm khi ${otherField} bị từ chối.`
    },
    prohibited_unless: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && !otherValues.includes(String(data[otherField]))) {
                return value === undefined || value === null || value === '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bị cấm trừ khi ${otherField} khớp điều kiện.`
    },
    prohibits: {
        handler: (value, params, data) => {
            if (data && value !== undefined && value !== null && value !== '') {
                return params.every(p => data[p] === undefined || data[p] === null || data[p] === '');
            }
            return true;
        },
        defaultMessage: (f, params) => `Trường ${f} cấm sự xuất hiện của: ${params.join(', ')}.`
    },
    required: {
        handler: (value) => value !== undefined && value !== null && String(value).trim() !== '',
        defaultMessage: (f) => `Trường ${f} không được bỏ trống.`
    },
    required_if: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && otherValues.includes(String(data[otherField]))) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bắt buộc khi ${otherField} phù hợp.`
    },
    required_if_accepted: {
        handler: (value, [otherField], data) => {
            if (data && otherField && ['yes', 'on', '1', 1, true, 'true'].includes(data[otherField])) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bắt buộc khi ${otherField} được đồng ý.`
    },
    required_if_declined: {
        handler: (value, [otherField], data) => {
            if (data && otherField && ['no', 'off', '0', 0, false, 'false'].includes(data[otherField])) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bắt buộc khi ${otherField} bị từ chối.`
    },
    required_unless: {
        handler: (value, [otherField, ...otherValues], data) => {
            if (data && otherField && !otherValues.includes(String(data[otherField]))) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bắt buộc trừ khi ${otherField} phù hợp.`
    },
    required_with: {
        handler: (value, [otherField], data) => {
            if (data && otherField && data[otherField] !== undefined && data[otherField] !== null && data[otherField] !== '') {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} không được bỏ trống khi ${otherField} có giá trị.`
    },
    required_with_all: {
        handler: (value, params, data) => {
            const allPresent = Boolean(data) && params.every(p => data[p] !== undefined && data[p] !== null && data[p] !== '');
            if (allPresent) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f) => `Trường ${f} bắt buộc khi tất cả trường liên quan xuất hiện.`
    },
    required_without: {
        handler: (value, [otherField], data) => {
            if (data && otherField && (data[otherField] === undefined || data[otherField] === null || data[otherField] === '')) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f, [otherField]) => `Trường ${f} bắt buộc khi ${otherField} không xuất hiện.`
    },
    required_without_all: {
        handler: (value, params, data) => {
            const allMissing = !data || params.every(p => data[p] === undefined || data[p] === null || data[p] === '');
            if (allMissing) {
                return value !== undefined && value !== null && String(value).trim() !== '';
            }
            return true;
        },
        defaultMessage: (f) => `Trường ${f} bắt buộc khi tất cả các trường tham chiếu không xuất hiện.`
    },
    required_array_keys: {
        handler: (value, params) => typeof value === 'object' && value !== null && params.every(k => k in value),
        defaultMessage: (f, params) => `Mảng ${f} thiếu các khóa bắt buộc: ${params.join(', ')}.`
    },
    sometimes: {
        handler: () => true,
        defaultMessage: () => ''
    }
};