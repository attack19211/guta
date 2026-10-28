export interface IPInfo {
    ip: string
    hostname: string
    city: string
    region: string
    regionName: string
    country: string
    countryCode: string
    loc: string
    org: string
    isp: string
    asn: string
    as: string
    asname: string
    timezone: string
    postal: string
    vpn: boolean
    proxy: boolean
    tor: boolean
    hosting: boolean
}

export async function getIPInfo(ip?: string): Promise<IPInfo | null> {
    try {
        let url = 'https://ipinfo.io/json'
        if (ip) {
            url = `https://ipinfo.io/${ip}/json`
        }

        const response = await fetch(url)
        const data: any = await response.json()

        if (data.error || data.bogon) {
            return null
        }

        const rawOrg = String(data.org || '')

        let asn = ''
        let asname = ''
        const match = rawOrg.match(/^(AS\d+)\s+(.+)$/)
        if (match) {
            asn = match[1] ?? ''
            asname = match[2] ?? ''
        } else {
            asname = rawOrg
        }

        return {
            ip: data.ip || ip || '',
            hostname: data.hostname || '',
            city: data.city || '',
            region: data.region || '',
            regionName: data.region || '',
            country: data.country || '',
            countryCode: data.country || '',
            loc: data.loc || '',
            org: rawOrg,
            isp: asname,
            asn,
            as: asn,
            asname,
            timezone: data.timezone || '',
            postal: data.postal || '',
            vpn: Boolean(data.privacy?.vpn || data.vpn),
            proxy: Boolean(data.privacy?.proxy || data.proxy),
            tor: Boolean(data.privacy?.tor || data.tor),
            hosting: Boolean(data.privacy?.hosting || data.hosting),
        }
    } catch (error) {
        console.error('[IPINFO] Error fetching IP info:', error)
        return null
    }
}

export default getIPInfo