// libs/browser.lib.ts

export interface BrowserInfo {
    ua: string;
    browser: any;
    cpu: any;
    device: any;
    engine: any;
    os: any;
    isChromeFamily: boolean;
    category: 'email' | 'library' | 'fetcher' | 'crawler' | 'browser' | 'cli';
    isBot: boolean;
    isProxy: boolean;
    isAICrawler: boolean;
}

export class BrowserInfoParser {
    private ua: string;

    constructor(userAgent: string) {
        this.ua = userAgent || '';
    }

    public parse(): BrowserInfo {
        const isBotDetected = this.isBot();
        const botInfo = this.parseBot();

        if (isBotDetected && botInfo.name !== 'Unknown') {
            return {
                ua: this.ua,
                browser: {
                    name: botInfo.name,
                    version: botInfo.version,
                    major: botInfo.major,
                    type: 'crawler'
                },
                cpu: {},
                device: {},
                engine: {},
                os: {},
                isChromeFamily: false,
                category: 'crawler',
                isBot: true,
                isProxy: this.isProxy(),
                isAICrawler: this.isAICrawler()
            };
        }

        const browser = this.parseBrowser();
        const cpu = this.parseCPU();
        const engine = this.parseEngine();
        const os = this.parseOS();

        return {
            ua: this.ua,
            browser: browser.name !== 'Unknown' ? browser : {},
            cpu: cpu.architecture !== 'Unknown' ? cpu : {},
            device: {},
            engine: engine.name !== 'Unknown' ? engine : {},
            os: os.name !== 'Unknown' ? os : {},
            isChromeFamily: this.isChromeFamily(),
            category: this.detectCategory(),
            isBot: isBotDetected,
            isProxy: this.isProxy(),
            isAICrawler: this.isAICrawler()
        };
    }

    private parseBot(): { name: string; version: string; major: string } {
        const ua = this.ua.toLowerCase();
        
        const bots: { pattern: RegExp; name: string }[] = [
            { pattern: /ahrefsbot\/(\d+\.?\d*)/, name: 'AhrefsBot' },
            { pattern: /googlebot\/(\d+\.?\d*)/, name: 'Googlebot' },
            { pattern: /bingbot\/(\d+\.?\d*)/, name: 'Bingbot' },
            { pattern: /slurp\/(\d+\.?\d*)/, name: 'Yahoo Slurp' },
            { pattern: /duckduckbot\/(\d+\.?\d*)/, name: 'DuckDuckBot' },
            { pattern: /baiduspider\/(\d+\.?\d*)/, name: 'Baiduspider' },
            { pattern: /yandexbot\/(\d+\.?\d*)/, name: 'YandexBot' },
            { pattern: /facebookexternalhit\/(\d+\.?\d*)/, name: 'FacebookBot' },
            { pattern: /facebot\/(\d+\.?\d*)/, name: 'Facebot' },
            { pattern: /twitterbot\/(\d+\.?\d*)/, name: 'TwitterBot' },
            { pattern: /applebot\/(\d+\.?\d*)/, name: 'AppleBot' },
            { pattern: /whatsapp\/(\d+\.?\d*)/, name: 'WhatsAppBot' },
            { pattern: /slackbot\/(\d+\.?\d*)/, name: 'SlackBot' },
            { pattern: /telegrambot\/(\d+\.?\d*)/, name: 'TelegramBot' },
            { pattern: /discordbot\/(\d+\.?\d*)/, name: 'DiscordBot' },
            { pattern: /rogerbot\/(\d+\.?\d*)/, name: 'Rogerbot' },
            { pattern: /linkedinbot\/(\d+\.?\d*)/, name: 'LinkedInBot' },
            { pattern: /embedly\/(\d+\.?\d*)/, name: 'Embedly' },
            { pattern: /quora\/(\d+\.?\d*)/, name: 'QuoraBot' },
            { pattern: /pinterest\/(\d+\.?\d*)/, name: 'PinterestBot' },
            { pattern: /skype\/(\d+\.?\d*)/, name: 'SkypeBot' },
            { pattern: /viber\/(\d+\.?\d*)/, name: 'ViberBot' },
            { pattern: /redditbot\/(\d+\.?\d*)/, name: 'RedditBot' },
            { pattern: /ia_archiver/, name: 'AlexaBot' },
            { pattern: /nutch/, name: 'Nutch' },
            { pattern: /python/, name: 'PythonBot' },
            { pattern: /perl/, name: 'PerlBot' },
            { pattern: /php/, name: 'PHPBot' },
            { pattern: /java/, name: 'JavaBot' },
            { pattern: /ruby/, name: 'RubyBot' },
            { pattern: /go-http/, name: 'GoHTTPBot' },
            { pattern: /okhttp/, name: 'OkHttpBot' },
            { pattern: /apache-httpclient/, name: 'ApacheHttpClient' },
            { pattern: /puppeteer/, name: 'Puppeteer' },
            { pattern: /playwright/, name: 'Playwright' },
            { pattern: /selenium/, name: 'Selenium' },
            { pattern: /phantomjs/, name: 'PhantomJS' },
            { pattern: /jsdom/, name: 'JSDOM' },
            { pattern: /headless_chrome/, name: 'HeadlessChrome' },
            { pattern: /headless-chrome/, name: 'HeadlessChrome' },
        ];

        for (const bot of bots) {
            const match = this.ua.match(bot.pattern);
            if (match) {
                const version = match[1] || 'Unknown';
                const major = version.split('.')[0] || 'Unknown';
                return { name: bot.name, version, major };
            }
        }

        return { name: 'Unknown', version: 'Unknown', major: 'Unknown' };
    }

    private parseBrowser(): { name: string; version: string; major: string } {
        let name: string = 'Unknown';
        let version: string = 'Unknown';
        let major: string = 'Unknown';
        const ua = this.ua;

        if (ua.includes('Edg/')) {
            name = 'Edge';
            const match = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
            name = 'Chrome';
            const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('Firefox/')) {
            name = 'Firefox';
            const match = ua.match(/Firefox\/(\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
            name = 'Safari';
            const match = ua.match(/Version\/(\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('OPR/')) {
            name = 'Opera';
            const match = ua.match(/OPR\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('Brave/')) {
            name = 'Brave';
            const match = ua.match(/Brave\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('Vivaldi/')) {
            name = 'Vivaldi';
            const match = ua.match(/Vivaldi\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }
        else if (ua.includes('MSIE') || ua.includes('Trident/')) {
            name = 'IE';
            const match = ua.match(/MSIE (\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
                major = version.split('.')[0] || 'Unknown';
            }
        }

        return { name, version, major };
    }

    private parseCPU(): { architecture: string } {
        let architecture: string = 'Unknown';
        const ua = this.ua;

        if (ua.includes('Win64') || ua.includes('x64') || ua.includes('amd64')) {
            architecture = 'amd64';
        } else if (ua.includes('WOW64') || ua.includes('x86')) {
            architecture = 'x86';
        } else if (ua.includes('arm64') || ua.includes('ARM64')) {
            architecture = 'arm64';
        } else if (ua.includes('Mac OS X')) {
            architecture = 'x64';
        } else if (ua.includes('iPhone') || ua.includes('iPad')) {
            architecture = 'arm64';
        } else if (ua.includes('Android')) {
            if (ua.includes('arm64') || ua.includes('aarch64')) {
                architecture = 'arm64';
            } else {
                architecture = 'arm';
            }
        }

        return { architecture };
    }

    private parseEngine(): { name: string; version: string } {
        let name: string = 'Unknown';
        let version: string = 'Unknown';
        const ua = this.ua;

        if (ua.includes('Edg/')) {
            name = 'Blink';
            const match = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
            }
        } else if (ua.includes('Chrome/')) {
            name = 'Blink';
            const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
            }
        } else if (ua.includes('Firefox/')) {
            name = 'Gecko';
            const match = ua.match(/Firefox\/(\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
            }
        } else if (ua.includes('Safari/')) {
            name = 'WebKit';
            const match = ua.match(/Safari\/(\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
            }
        } else if (ua.includes('Trident/')) {
            name = 'Trident';
            const match = ua.match(/Trident\/(\d+\.\d+)/);
            if (match && match[1]) {
                version = match[1];
            }
        }

        return { name, version };
    }

    private parseOS(): { name: string; version: string } {
        let name: string = 'Unknown';
        let version: string = 'Unknown';
        const ua = this.ua;

        if (ua.includes('Windows NT 10.0')) {
            name = 'Windows';
            version = '11';
        } else if (ua.includes('Windows NT 6.3')) {
            name = 'Windows';
            version = '8.1';
        } else if (ua.includes('Windows NT 6.2')) {
            name = 'Windows';
            version = '8';
        } else if (ua.includes('Windows NT 6.1')) {
            name = 'Windows';
            version = '7';
        } else if (ua.includes('Windows NT 6.0')) {
            name = 'Windows';
            version = 'Vista';
        } else if (ua.includes('Windows NT 5.1')) {
            name = 'Windows';
            version = 'XP';
        } else if (ua.includes('Mac OS X')) {
            name = 'macOS';
            const match = ua.match(/Mac OS X (\d+)[_.](\d+)/);
            if (match && match[1] && match[2]) {
                version = `${match[1]}.${match[2]}`;
            }
        } else if (ua.includes('iPhone')) {
            name = 'iOS';
            const match = ua.match(/iPhone OS (\d+)[_](\d+)[_]?(\d+)?/);
            if (match && match[1] && match[2]) {
                version = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
            }
        } else if (ua.includes('iPad')) {
            name = 'iOS';
            const match = ua.match(/iPad; CPU OS (\d+)[_](\d+)/);
            if (match && match[1] && match[2]) {
                version = `${match[1]}.${match[2]}`;
            }
        } else if (ua.includes('Android')) {
            name = 'Android';
            const match = ua.match(/Android (\d+\.\d+\.?\d?)/);
            if (match && match[1]) {
                version = match[1];
            }
        } else if (ua.includes('Linux')) {
            name = 'Linux';
            if (ua.includes('Ubuntu')) {
                version = 'Ubuntu';
            } else if (ua.includes('Debian')) {
                version = 'Debian';
            } else if (ua.includes('Fedora')) {
                version = 'Fedora';
            } else if (ua.includes('CentOS')) {
                version = 'CentOS';
            } else {
                version = 'Unknown';
            }
        } else if (ua.includes('Chrome OS')) {
            name = 'Chrome OS';
            version = 'Unknown';
        }

        return { name, version };
    }

    private isChromeFamily(): boolean {
        const chromeBrowsers: string[] = ['Chrome', 'Edge', 'Opera', 'Brave', 'Vivaldi', 'Chromium'];
        const browser = this.parseBrowser().name;
        return chromeBrowsers.includes(browser);
    }

    private detectCategory(): 'email' | 'library' | 'fetcher' | 'crawler' | 'browser' | 'cli' {
        const ua = this.ua.toLowerCase();

        if (this.isBot()) {
            return 'crawler';
        }

        if (ua.includes('outlook') || ua.includes('thunderbird') || ua.includes('mail.app') || 
            ua.includes('postbox') || ua.includes('microsoft outlook') || ua.includes('apple mail')) {
            return 'email';
        }

        if (ua.includes('axios') || ua.includes('node-fetch') || ua.includes('got ') || 
            ua.includes('request') || ua.includes('python-requests') || ua.includes('urllib') || 
            ua.includes('okhttp') || ua.includes('http-client') || ua.includes('rest-client') ||
            ua.includes('apache-httpclient')) {
            return 'library';
        }

        if (ua.includes('whatwg') || ua.includes('fetch') || ua.includes('superagent') || 
            ua.includes('undici') || ua.includes('minimal-fetch')) {
            return 'fetcher';
        }

        if (ua.includes('node.js') || ua.includes('deno') || ua.includes('bun') || 
            ua.includes('curl') || ua.includes('wget') || ua.includes('cli') ||
            ua.includes('command line') || ua.includes('terminal')) {
            return 'cli';
        }

        const browser = this.parseBrowser().name;
        if (browser !== 'Unknown') {
            return 'browser';
        }

        return 'fetcher';
    }

    private isBot(): boolean {
        const ua = this.ua.toLowerCase();
        const botPatterns: string[] = [
            'bot', 'crawler', 'spider', 'scraper', 'fetch', 'headless',
            'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
            'yandexbot', 'facebookexternalhit', 'facebot', 'twitterbot',
            'applebot', 'whatsapp', 'slackbot', 'telegrambot', 'discordbot',
            'rogerbot', 'linkedinbot', 'embedly', 'quora', 'pinterest',
            'skype', 'viber', 'redditbot', 'ia_archiver', 'alexa', 'nutch',
            'python', 'perl', 'php', 'java', 'ruby', 'go-http', 'okhttp',
            'apache-httpclient', 'puppeteer', 'playwright', 'selenium', 
            'phantomjs', 'jsdom', 'headless_chrome', 'headless-chrome', 
            'aws-lambda', 'cloudfunctions', 'ahrefsbot'
        ];
        
        return botPatterns.some(pattern => ua.includes(pattern));
    }

    private isProxy(): boolean {
        const ua = this.ua.toLowerCase();
        const proxyPatterns: string[] = [
            'proxy', 'vpn', 'tor', 'anonymizer', 'anonymous', 'private browsing',
            'incognito', 'datacenter', 'cloudflare', 'akamai', 'fastly',
            'anonymous-proxy', 'elite-proxy', 'socks', 'shadowsocks', 'v2ray'
        ];
        
        return proxyPatterns.some(pattern => ua.includes(pattern));
    }

    private isAICrawler(): boolean {
        const ua = this.ua.toLowerCase();
        const aiCrawlers: string[] = [
            'chatgpt', 'gptbot', 'claudebot', 'anthropic', 'bard', 'googlebard',
            'perplexitybot', 'cohere', 'ai crawler', 'openai', 'anthropic-ai',
            'claude-ai', 'gpt- crawler', 'chatgpt-user', 'chatgpt-plugin',
            'google-gemini', 'gemini-bot', 'meta-ai', 'llama-bot', 'mistral-ai',
            'diffbot', 'imagesift', 'ccbot', 'gptbot', 'omigili', 'facebookbot'
        ];
        
        return aiCrawlers.some(pattern => ua.includes(pattern));
    }
}

export function parseUserAgent(userAgent: string): BrowserInfo {
    const parser = new BrowserInfoParser(userAgent);
    return parser.parse();
}

export default parseUserAgent;