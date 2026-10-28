import { Base } from '@/core/models/Base';

export class User extends Base {
    public static override tableName = 'users';

    public static override fillable = [
        'userId',
        'username',
        'email',
        'phoneNumber',
        'password',
        'nickName',
        'shopName',
        'gender',
        'dateOfBirth',
        'avatar',
        'coverImage',
        'bio',
        'role',
        'isActived',
        'isVerified',
        'isBanned',
        'rejectReason',
        'identify',
        'ipAddress',
        'language',
        'currency',
        'lastLoginDevice',
        'lastLogin',
        'lastPasswordChange',
        'vipLevel',
        'vipPoint',
        'brokerId',
        'groups',
        'version',
    ];

    public static override hidden = [
        'lastPasswordChange',
        'lastLoginDevice',
        'lastLogin',
        'password',
        'version',
        'deletedAt',
    ];

    public static override casts = {
        'isActived': 'boolean',
        'isVerified': 'boolean',
        'isBanned': 'boolean',
        'vipLevel': 'string',
        'vipPoint': 'number',
        'brokerId': 'number',
        'groups': 'json',
        'dateOfBirth': 'number',
        'lastLogin': 'date',
        'lastPasswordChange': 'date',
    } as const;
}