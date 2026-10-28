// src/libs/fingerprint.lib.ts

import os from "os";
import si from "systeminformation";
import crypto from "crypto";

declare const window: any;
declare const navigator: any;
declare const screen: any;
declare const localStorage: any;
declare const sessionStorage: any;
declare const indexedDB: any;
declare const performance: any;
declare const RTCPeerConnection: any;
declare const Worker: any;
declare const document: any;

type BrowserNavigator = Navigator & {
    deviceMemory?: number;
    connection?: any;
    permissions?: any;
    getBattery?: () => Promise<any>;
    mediaDevices?: any;
    userAgentData?: any;
    hardwareConcurrency?: number;
    maxTouchPoints?: number;
    cookieEnabled?: boolean;
    doNotTrack?: string | null;
    languages?: string[];
    platform?: string;
    onLine?: boolean;
};

interface DisplayInfo {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
    availWidth: number;
    availHeight: number;
    orientation: string;
    orientationAngle: number;
}

interface WebGLInfo {
    vendor: string;
    renderer: string;
    version: string;
    shadingLanguageVersion: string;
    extensions: string[];
    maxTextureSize: number;
    maxVertexAttribs: number;
    maxVertexUniforms: number;
    maxVaryingVectors: number;
    maxFragmentUniforms: number;
    maxTextureImageUnits: number;
    maxVertexTextureImageUnits: number;
    antialiasing: boolean;
}

interface AudioInfo {
    sampleRate: number;
    fftSize: number;
    fingerprint: string;
}

interface CanvasInfo {
    fingerprint: string;
    width: number;
    height: number;
    dataURL: string;
}

interface BrowserPlugin {
    name: string;
    filename: string;
    description: string;
}

interface TimezoneInfo {
    timezone: string;
    timezoneOffset: number;
    dstActive: boolean;
    dstOffset: number;
}

interface HardwareInfo {
    cores: number;
    memory: number;
    touchSupport: {
        maxTouchPoints: number;
        touchEventSupport: boolean;
    };
    deviceMemory: number | null;
    hardwareConcurrency: number | null;
    platform: string;
}

interface NetworkInfo {
    hostname: string;
    online: boolean;
}

export interface FingerprintData {
    fingerprintId: string;
    fingerprintHash: string;
    fingerprintVersion: string;
    fingerprintTimestamp: number;
    userAgent: string;
    userAgentParsed: {
        browser: string;
        version: string;
        engine: string;
        os: string;
        device: string;
        deviceType: string;
    };
    display: DisplayInfo;
    hardware: HardwareInfo;
    webgl: WebGLInfo | null;
    canvas: CanvasInfo;
    audio: AudioInfo;
    fonts: string[];
    fontsHash: string;
    plugins: BrowserPlugin[];
    pluginsHash: string;
    timezone: TimezoneInfo;
    languages: string[];
    localStorageEnabled: boolean;
    sessionStorageEnabled: boolean;
    indexedDBEnabled: boolean;
    cookiesEnabled: boolean;
    doNotTrack: string | null;
    videoCodecs: string[];
    audioCodecs: string[];
    webRTCSupport: boolean;
    webWorkerSupport: boolean;
    serviceWorkerSupport: boolean;
    timezoneOffset: number;
    network: NetworkInfo;
    sessionId: string;
    visitorId: string;
}

export interface SanitizedFingerprintData {
    fingerprintId: string;
    fingerprintHash: string;
    fingerprintVersion: string;
    fingerprintTimestamp: number;
    userAgentParsed: {
        browser: string;
        version: string;
        engine: string;
        os: string;
        device: string;
        deviceType: string;
    };
    display: {
        width: number;
        height: number;
        colorDepth: number;
        pixelDepth: number;
        availWidth: number;
        availHeight: number;
        orientation: string;
        orientationAngle: number;
    };
    hardware: {
        cores: number;
        memory: number;
        touchSupport: {
            maxTouchPoints: number;
            touchEventSupport: boolean;
        };
        deviceMemory: number | null;
        hardwareConcurrency: number | null;
        platform: string;
    };
    fontsHash: string;
    pluginsHash: string;
    timezone: TimezoneInfo;
    languages: string[];
    videoCodecs: string[];
    audioCodecs: string[];
    sessionId: string;
    visitorId: string;
    webgl: {
        vendor: string;
        renderer: string;
    } | null;
}

function hashData(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

function truncateHash(hash: string, length: number = 32): string {
    return hash.substring(0, length);
}

function parseUserAgent(ua: string): FingerprintData["userAgentParsed"] {
    let browser: string = "Unknown";
    let version: string = "Unknown";
    let engine: string = "Unknown";
    let os: string = "Unknown";
    let device: string = "Unknown";
    let deviceType: string = "desktop";

    if (ua.includes("Edg/")) {
        browser = "Edge";
        const match = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1]) version = match[1];
        engine = "Chromium";
    } else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
        browser = "Chrome";
        const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1]) version = match[1];
        engine = "Blink";
    } else if (ua.includes("Firefox/")) {
        browser = "Firefox";
        const match = ua.match(/Firefox\/(\d+\.\d+)/);
        if (match && match[1]) version = match[1];
        engine = "Gecko";
    } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
        browser = "Safari";
        const match = ua.match(/Version\/(\d+\.\d+)/);
        if (match && match[1]) version = match[1];
        engine = "WebKit";
    } else if (ua.includes("OPR/")) {
        browser = "Opera";
        const match = ua.match(/OPR\/(\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1]) version = match[1];
        engine = "Blink";
    }

    if (ua.includes("Windows NT 10.0")) {
        os = "Windows 10";
    } else if (ua.includes("Windows NT 6.3")) {
        os = "Windows 8.1";
    } else if (ua.includes("Windows NT 6.2")) {
        os = "Windows 8";
    } else if (ua.includes("Windows NT 6.1")) {
        os = "Windows 7";
    } else if (ua.includes("Mac OS X")) {
        os = "macOS";
    } else if (ua.includes("Linux")) {
        os = "Linux";
    } else if (ua.includes("Android")) {
        os = "Android";
        deviceType = "mobile";
    } else if (ua.includes("iPhone")) {
        os = "iOS";
        device = "iPhone";
        deviceType = "mobile";
    } else if (ua.includes("iPad")) {
        os = "iOS";
        device = "iPad";
        deviceType = "tablet";
    }

    return {
        browser,
        version,
        engine,
        os,
        device,
        deviceType,
    };
}

function getWebGLInfo(): WebGLInfo | null {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return null;
    }

    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        
        if (!gl) return null;
        
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        const extensions = gl.getSupportedExtensions() || [];
        
        return {
            vendor: vendor || "Unknown",
            renderer: renderer || "Unknown",
            version: gl.getParameter(gl.VERSION) || "Unknown",
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || "Unknown",
            extensions: extensions,
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
            maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
            maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
            maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
            maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
            antialiasing: gl.getContextAttributes()?.antialias || false,
        };
    } catch (error) {
        return null;
    }
}

function getCanvasFingerprint(): CanvasInfo {
    if (typeof window === "undefined" || typeof document === "undefined") {
        return {
            fingerprint: "not-available",
            width: 0,
            height: 0,
            dataURL: "",
        };
    }

    try {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
            return {
                fingerprint: "context-not-available",
                width: 0,
                height: 0,
                dataURL: "",
            };
        }
        
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 100, 50);
        ctx.fillStyle = "#069";
        ctx.fillText("Fingerprint", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Security", 4, 30);
        
        ctx.beginPath();
        ctx.arc(150, 25, 20, 0, Math.PI * 2);
        ctx.fillStyle = "#ff0000";
        ctx.fill();
        ctx.strokeStyle = "#0000ff";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(170, 10);
        ctx.quadraticCurveTo(180, 40, 190, 30);
        ctx.stroke();
        
        const dataURL = canvas.toDataURL();
        const fingerprint = truncateHash(hashData(dataURL), 16);
        
        return {
            fingerprint: fingerprint,
            width: canvas.width,
            height: canvas.height,
            dataURL: dataURL.substring(0, 100),
        };
    } catch (error) {
        return {
            fingerprint: "error",
            width: 0,
            height: 0,
            dataURL: "",
        };
    }
}

async function getAudioFingerprint(): Promise<AudioInfo> {
    if (typeof window === "undefined") {
        return { sampleRate: 0, fftSize: 0, fingerprint: "not-available" };
    }

    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gain = audioContext.createGain();
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        
        oscillator.type = "triangle";
        oscillator.frequency.value = 10000;
        gain.gain.value = 0.00001;
        
        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gain);
        gain.connect(audioContext.destination);
        
        oscillator.start(0);
        
        const fingerprint = await new Promise<string>((resolve) => {
            scriptProcessor.onaudioprocess = (event: any) => {
                const output = event.outputBuffer.getChannelData(0);
                const fingerprintData = Array.from(output.slice(0, 100)).map((v: unknown) => {
                    if (typeof v === 'number') {
                        return v.toFixed(6);
                    }
                    return '0';
                }).join(",");
                const hash = truncateHash(hashData(fingerprintData), 16);
                resolve(hash);
                
                oscillator.stop();
                audioContext.close();
            };
        });
        
        return {
            sampleRate: audioContext.sampleRate,
            fftSize: analyser.fftSize,
            fingerprint: fingerprint,
        };
    } catch (error) {
        return { sampleRate: 0, fftSize: 0, fingerprint: "error" };
    }
}

function getInstalledFonts(): string[] {
    if (typeof document === "undefined") return [];

    try {
        const baseFonts = ["monospace", "sans-serif", "serif"];
        const fontList = [
            "Arial", "Verdana", "Times New Roman", "Courier New", "Georgia",
            "Palatino", "Garamond", "Comic Sans MS", "Trebuchet MS", "Arial Black",
            "Impact", "Tahoma", "Helvetica", "Calibri", "Cambria", "Segoe UI",
            "Roboto", "Open Sans", "Lato", "Montserrat", "Source Sans Pro",
            "Merriweather", "Oswald", "Raleway", "Poppins", "PT Sans", "Ubuntu",
        ];
        
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return [];
        
        const testString = "mmmmmmmmmmlli";
        const testSize = "72px";
        
        const baseFontsMetrics: Record<string, number> = {};
        baseFonts.forEach((font) => {
            ctx.font = `${testSize} ${font}`;
            baseFontsMetrics[font] = ctx.measureText(testString).width;
        });
        
        const installedFonts: string[] = [];
        fontList.forEach((font) => {
            let isInstalled = false;
            baseFonts.forEach((baseFont) => {
                ctx.font = `${testSize} ${font}, ${baseFont}`;
                const width = ctx.measureText(testString).width;
                if (width !== baseFontsMetrics[baseFont]) {
                    isInstalled = true;
                }
            });
            if (isInstalled) installedFonts.push(font);
        });
        
        return installedFonts;
    } catch (error) {
        return [];
    }
}

function getBrowserPlugins(): BrowserPlugin[] {
    if (typeof navigator === "undefined" || !navigator.plugins) return [];

    try {
        const plugins: BrowserPlugin[] = [];
        for (let i = 0; i < navigator.plugins.length; i++) {
            const plugin = navigator.plugins[i];
            plugins.push({
                name: plugin.name || "Unknown",
                filename: plugin.filename || "Unknown",
                description: plugin.description || "Unknown",
            });
        }
        return plugins;
    } catch (error) {
        return [];
    }
}

function getTimezoneInfo(): TimezoneInfo {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
        const timezoneOffset = new Date().getTimezoneOffset();
        
        const jan = new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset();
        const jul = new Date(new Date().getFullYear(), 6, 1).getTimezoneOffset();
        const dstActive = Math.min(jan, jul) !== timezoneOffset;
        const dstOffset = dstActive ? Math.abs(jan - jul) : 0;
        
        return {
            timezone: timezone,
            timezoneOffset: -timezoneOffset,
            dstActive: dstActive,
            dstOffset: dstOffset,
        };
    } catch (error) {
        return {
            timezone: "Unknown",
            timezoneOffset: 0,
            dstActive: false,
            dstOffset: 0,
        };
    }
}

function getHardwareInfo(): HardwareInfo {
    if (typeof navigator === "undefined") {
        return {
            cores: os.cpus().length,
            memory: os.totalmem(),
            touchSupport: {
                maxTouchPoints: 0,
                touchEventSupport: false,
            },
            deviceMemory: null,
            hardwareConcurrency: null,
            platform: os.platform(),
        };
    }

    try {
        const nav = navigator as BrowserNavigator;
        return {
            cores: nav.hardwareConcurrency || os.cpus().length,
            memory: nav.deviceMemory ? nav.deviceMemory * 1024 * 1024 * 1024 : os.totalmem(),
            touchSupport: {
                maxTouchPoints: nav.maxTouchPoints || 0,
                touchEventSupport: "ontouchstart" in window,
            },
            deviceMemory: nav.deviceMemory || null,
            hardwareConcurrency: nav.hardwareConcurrency || null,
            platform: nav.platform || os.platform(),
        };
    } catch (error) {
        return {
            cores: os.cpus().length,
            memory: os.totalmem(),
            touchSupport: {
                maxTouchPoints: 0,
                touchEventSupport: false,
            },
            deviceMemory: null,
            hardwareConcurrency: null,
            platform: os.platform(),
        };
    }
}

function getDisplayInfo(): DisplayInfo {
    if (typeof screen === "undefined") {
        return {
            width: 0,
            height: 0,
            colorDepth: 0,
            pixelDepth: 0,
            availWidth: 0,
            availHeight: 0,
            orientation: "unknown",
            orientationAngle: 0,
        };
    }

    try {
        return {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            orientation: screen.orientation?.type || "unknown",
            orientationAngle: screen.orientation?.angle || 0,
        };
    } catch (error) {
        return {
            width: screen.width || 0,
            height: screen.height || 0,
            colorDepth: screen.colorDepth || 0,
            pixelDepth: screen.pixelDepth || 0,
            availWidth: screen.availWidth || 0,
            availHeight: screen.availHeight || 0,
            orientation: "unknown",
            orientationAngle: 0,
        };
    }
}

function getCodecs(): { videoCodecs: string[]; audioCodecs: string[] } {
    if (typeof document === "undefined") {
        return { videoCodecs: [], audioCodecs: [] };
    }

    try {
        const videoCodecs = ["mp4", "webm", "ogg"].filter((codec) => {
            const video = document.createElement("video");
            return video.canPlayType(`video/${codec}`) !== "";
        });
        
        const audioCodecs = ["mp3", "ogg", "wav"].filter((codec) => {
            const audio = document.createElement("audio");
            return audio.canPlayType(`audio/${codec}`) !== "";
        });
        
        return { videoCodecs, audioCodecs };
    } catch (error) {
        return { videoCodecs: [], audioCodecs: [] };
    }
}

function generateSessionId(): string {
    const randomBytes = crypto.randomBytes(32);
    return hashData(randomBytes.toString("hex"));
}

function generateVisitorId(data: any): string {
    const dataString = JSON.stringify(data);
    return truncateHash(hashData(dataString), 32);
}

export async function generateFingerprint(): Promise<FingerprintData> {
    const nav = typeof navigator !== "undefined" ? (navigator as BrowserNavigator) : null;
    const userAgent = nav?.userAgent || "server-side";
    const userAgentParsed = parseUserAgent(userAgent);
    const display = getDisplayInfo();
    const webgl = getWebGLInfo();
    const canvas = getCanvasFingerprint();
    const audio = await getAudioFingerprint();
    const fonts = getInstalledFonts();
    const fontsHash = truncateHash(hashData(fonts.join(",")), 16);
    const plugins = getBrowserPlugins();
    const pluginsHash = truncateHash(hashData(plugins.map((p) => p.name).join(",")), 16);
    const timezone = getTimezoneInfo();
    const hardware = getHardwareInfo();
    const languages = nav?.languages || (nav?.language ? [nav.language] : []);
    const { videoCodecs, audioCodecs } = getCodecs();
    
    let localStorageEnabled = false;
    let sessionStorageEnabled = false;
    let indexedDBEnabled = false;
    let cookiesEnabled = false;
    let doNotTrack: string | null = null;
    let webRTCSupport = false;
    let webWorkerSupport = false;
    let serviceWorkerSupport = false;

    if (typeof window !== "undefined") {
        try {
            localStorageEnabled = typeof localStorage !== "undefined";
            sessionStorageEnabled = typeof sessionStorage !== "undefined";
            indexedDBEnabled = typeof indexedDB !== "undefined";
            cookiesEnabled = nav?.cookieEnabled || false;
            doNotTrack = nav?.doNotTrack || null;
            webRTCSupport = typeof RTCPeerConnection !== "undefined";
            webWorkerSupport = typeof Worker !== "undefined";
            serviceWorkerSupport = "serviceWorker" in navigator;
        } catch (error) {
            // Silent fail for security
        }
    }

    const fingerprintComponents = {
        userAgent: userAgent,
        webgl: webgl?.renderer,
        canvas: canvas.fingerprint,
        audio: audio.fingerprint,
        fonts: fontsHash,
        plugins: pluginsHash,
        timezone: timezone.timezone,
        timezoneOffset: timezone.timezoneOffset,
        language: languages[0],
        screenResolution: `${display.width}x${display.height}`,
        colorDepth: display.colorDepth,
        hardwareConcurrency: hardware.hardwareConcurrency,
        deviceMemory: hardware.deviceMemory,
    };

    const fingerprintHash = hashData(JSON.stringify(fingerprintComponents));
    const sessionId = generateSessionId();
    const visitorId = generateVisitorId(fingerprintComponents);
    const timezoneOffset = -new Date().getTimezoneOffset();

    return {
        fingerprintId: truncateHash(fingerprintHash, 32),
        fingerprintHash: fingerprintHash,
        fingerprintVersion: "2.13.8",
        fingerprintTimestamp: Date.now(),
        userAgent: userAgent,
        userAgentParsed: userAgentParsed,
        display: display,
        hardware: hardware,
        webgl: webgl,
        canvas: canvas,
        audio: audio,
        fonts: fonts,
        fontsHash: fontsHash,
        plugins: plugins,
        pluginsHash: pluginsHash,
        timezone: timezone,
        languages: languages,
        localStorageEnabled: localStorageEnabled,
        sessionStorageEnabled: sessionStorageEnabled,
        indexedDBEnabled: indexedDBEnabled,
        cookiesEnabled: cookiesEnabled,
        doNotTrack: doNotTrack,
        videoCodecs: videoCodecs,
        audioCodecs: audioCodecs,
        webRTCSupport: webRTCSupport,
        webWorkerSupport: webWorkerSupport,
        serviceWorkerSupport: serviceWorkerSupport,
        timezoneOffset: timezoneOffset,
        network: {
            hostname: typeof window !== "undefined" ? window.location.hostname : os.hostname(),
            online: nav?.onLine || true,
        },
        sessionId: sessionId,
        visitorId: visitorId,
    };
}

export async function generateServerFingerprint(): Promise<Partial<FingerprintData>> {
    const cpu = await si.cpu();
    const osInfo = await si.osInfo();
    
    const serverData = {
        hostname: os.hostname(),
        platform: os.platform(),
        cpuModel: cpu.model,
        cpuCores: cpu.cores,
        totalMemory: os.totalmem(),
        osVersion: osInfo.release,
    };
    
    const fingerprintId = truncateHash(hashData(JSON.stringify(serverData)), 32);
    const sessionId = generateSessionId();
    const visitorId = generateVisitorId(serverData);
    
    return {
        fingerprintId: fingerprintId,
        fingerprintVersion: "2.0.0-server",
        fingerprintTimestamp: Date.now(),
        hardware: {
            cores: cpu.cores,
            memory: os.totalmem(),
            touchSupport: {
                maxTouchPoints: 0,
                touchEventSupport: false,
            },
            deviceMemory: null,
            hardwareConcurrency: cpu.cores,
            platform: os.platform(),
        },
        userAgent: "server-side",
        userAgentParsed: parseUserAgent("server-side"),
        display: {
            width: 0,
            height: 0,
            colorDepth: 0,
            pixelDepth: 0,
            availWidth: 0,
            availHeight: 0,
            orientation: "unknown",
            orientationAngle: 0,
        },
        network: {
            hostname: os.hostname(),
            online: true,
        },
        sessionId: sessionId,
        visitorId: visitorId,
        fingerprintHash: fingerprintId,
    };
}

export function validateFingerprint(fingerprint1: FingerprintData, fingerprint2: FingerprintData): {
    isValid: boolean;
    score: number;
    mismatches: string[];
} {
    const mismatches: string[] = [];
    let score = 100;
    
    if (fingerprint1.fingerprintHash !== fingerprint2.fingerprintHash) {
        score -= 50;
        mismatches.push("fingerprint_hash_mismatch");
    }
    
    if (fingerprint1.userAgent !== fingerprint2.userAgent) {
        score -= 20;
        mismatches.push("user_agent_mismatch");
    }
    
    if (fingerprint1.canvas.fingerprint !== fingerprint2.canvas.fingerprint) {
        score -= 30;
        mismatches.push("canvas_fingerprint_mismatch");
    }
    
    if (fingerprint1.webgl?.renderer !== fingerprint2.webgl?.renderer) {
        score -= 25;
        mismatches.push("webgl_renderer_mismatch");
    }
    
    if (fingerprint1.audio.fingerprint !== fingerprint2.audio.fingerprint) {
        score -= 20;
        mismatches.push("audio_fingerprint_mismatch");
    }
    
    if (fingerprint1.fontsHash !== fingerprint2.fontsHash) {
        score -= 15;
        mismatches.push("fonts_hash_mismatch");
    }
    
    if (fingerprint1.pluginsHash !== fingerprint2.pluginsHash) {
        score -= 15;
        mismatches.push("plugins_hash_mismatch");
    }
    
    if (fingerprint1.timezone.timezone !== fingerprint2.timezone.timezone) {
        score -= 10;
        mismatches.push("timezone_mismatch");
    }
    
    if (fingerprint1.timezoneOffset !== fingerprint2.timezoneOffset) {
        score -= 10;
        mismatches.push("timezone_offset_mismatch");
    }
    
    const isValid = score >= 70;
    
    return {
        isValid: isValid,
        score: Math.max(0, score),
        mismatches: mismatches,
    };
}

export function sanitizeFingerprintForStorage(fingerprint: FingerprintData): SanitizedFingerprintData {
    return {
        fingerprintId: fingerprint.fingerprintId,
        fingerprintHash: fingerprint.fingerprintHash,
        fingerprintVersion: fingerprint.fingerprintVersion,
        fingerprintTimestamp: fingerprint.fingerprintTimestamp,
        userAgentParsed: fingerprint.userAgentParsed,
        display: {
            width: fingerprint.display.width,
            height: fingerprint.display.height,
            colorDepth: fingerprint.display.colorDepth,
            pixelDepth: fingerprint.display.pixelDepth,
            availWidth: fingerprint.display.availWidth,
            availHeight: fingerprint.display.availHeight,
            orientation: fingerprint.display.orientation,
            orientationAngle: fingerprint.display.orientationAngle,
        },
        hardware: {
            cores: fingerprint.hardware.cores,
            memory: fingerprint.hardware.memory,
            touchSupport: fingerprint.hardware.touchSupport,
            deviceMemory: fingerprint.hardware.deviceMemory,
            hardwareConcurrency: fingerprint.hardware.hardwareConcurrency,
            platform: fingerprint.hardware.platform,
        },
        fontsHash: fingerprint.fontsHash,
        pluginsHash: fingerprint.pluginsHash,
        timezone: fingerprint.timezone,
        languages: fingerprint.languages,
        videoCodecs: fingerprint.videoCodecs,
        audioCodecs: fingerprint.audioCodecs,
        sessionId: fingerprint.sessionId,
        visitorId: fingerprint.visitorId,
        webgl: fingerprint.webgl ? {
            vendor: fingerprint.webgl.vendor,
            renderer: fingerprint.webgl.renderer,
        } : null,
    };
}

export default generateFingerprint;