// libs/metadata.lib.ts
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface FileMetadata {
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    extension: string;
    hash: string;
    sha256: string;
    md5: string;
    createdAt: Date;
    modifiedAt: Date;
    accessedAt: Date;
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
    isArchive: boolean;
    width?: number;
    height?: number;
    duration?: number;
    bitrate?: number;
    codec?: string;
    colorspace?: string;
    pages?: number;
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    language?: string;
    hasExif: boolean;
    exif?: Record<string, any>;
    gps?: {
        latitude: number;
        longitude: number;
        altitude?: number;
    };
    camera?: {
        make: string;
        model: string;
        lens: string;
        focalLength: number;
        aperture: number;
        shutterSpeed: number;
        iso: number;
        dateTaken: Date;
    };
    orientation?: number;
    hasAlpha?: boolean;
    isAnimated?: boolean;
    wordCount?: number;
    characterCount?: number;
    lineCount?: number;
    sheetCount?: number;
    worksheetNames?: string[];
    hasFormulas?: boolean;
    hasComments?: boolean;
    hasHiddenData?: boolean;
    isEncrypted?: boolean;
    isCompressed?: boolean;
    version?: string;
    metadata: Record<string, any>;
}

class MetadataExtractor {
    private static readonly IMAGE_MIMES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'image/bmp', 'image/tiff', 'image/svg+xml', 'image/x-icon'
    ];

    private static readonly VIDEO_MIMES = [
        'video/mp4', 'video/mpeg', 'video/ogg', 'video/webm',
        'video/quicktime', 'video/x-msvideo'
    ];

    private static readonly AUDIO_MIMES = [
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
        'audio/webm', 'audio/flac'
    ];

    private static readonly DOCUMENT_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'text/plain',
        'text/csv',
        'application/json',
        'application/xml',
        'text/xml'
    ];

    private static readonly ARCHIVE_MIMES = [
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-7z-compressed'
    ];

    public static async extract(buffer: Buffer, originalName: string, mimeType: string): Promise<FileMetadata> {
        const extension = path.extname(originalName).toLowerCase().replace('.', '');
        const hash = crypto.createHash('sha1').update(buffer).digest('hex').substring(0, 16);
        const md5 = crypto.createHash('md5').update(buffer).digest('hex');
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        const stats = {
            isImage: this.IMAGE_MIMES.includes(mimeType),
            isVideo: this.VIDEO_MIMES.includes(mimeType),
            isAudio: this.AUDIO_MIMES.includes(mimeType),
            isDocument: this.DOCUMENT_MIMES.includes(mimeType),
            isArchive: this.ARCHIVE_MIMES.includes(mimeType),
        };

        const metadata: FileMetadata = {
            fileName: '',
            originalName: originalName,
            mimeType: mimeType,
            size: buffer.length,
            extension: extension,
            hash: hash,
            md5: md5,
            sha256: sha256,
            createdAt: new Date(),
            modifiedAt: new Date(),
            accessedAt: new Date(),
            isImage: stats.isImage,
            isVideo: stats.isVideo,
            isAudio: stats.isAudio,
            isDocument: stats.isDocument,
            isArchive: stats.isArchive,
            hasExif: false,
            metadata: {},
            width: undefined,
            height: undefined,
            duration: undefined,
            bitrate: undefined,
            codec: undefined,
            colorspace: undefined,
            pages: undefined,
            title: undefined,
            author: undefined,
            subject: undefined,
            keywords: undefined,
            creator: undefined,
            producer: undefined,
            creationDate: undefined,
            modificationDate: undefined,
            language: undefined,
            exif: undefined,
            gps: undefined,
            camera: undefined,
            orientation: undefined,
            hasAlpha: undefined,
            isAnimated: undefined,
            wordCount: undefined,
            characterCount: undefined,
            lineCount: undefined,
            sheetCount: undefined,
            worksheetNames: undefined,
            hasFormulas: undefined,
            hasComments: undefined,
            hasHiddenData: false,
            isEncrypted: undefined,
            isCompressed: undefined,
            version: undefined
        };

        if (stats.isImage) {
            await this.extractImageMetadata(buffer, metadata);
        }

        if (stats.isVideo) {
            await this.extractVideoMetadata(buffer, metadata);
        }

        if (stats.isAudio) {
            await this.extractAudioMetadata(buffer, metadata);
        }

        if (stats.isDocument) {
            await this.extractDocumentMetadata(buffer, mimeType, extension, metadata);
        }

        if (stats.isArchive) {
            await this.extractArchiveMetadata(buffer, metadata);
        }

        try {
            await this.extractGenericMetadata(buffer, metadata);
        } catch (error) {
            // Bỏ qua lỗi
        }

        return metadata;
    }

    private static async extractImageMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
        try {
            const sharp = await import('sharp');
            const image = sharp.default(buffer);
            const imgMeta = await image.metadata();

            metadata.width = imgMeta.width;
            metadata.height = imgMeta.height;
            metadata.colorspace = imgMeta.space || 'sRGB';
            metadata.hasAlpha = imgMeta.hasAlpha || false;
            metadata.isAnimated = (imgMeta.pages && imgMeta.pages > 1) || false;
            metadata.orientation = imgMeta.orientation || 1;

            if (imgMeta.density) {
                metadata.metadata.dpi = imgMeta.density;
            }

            const entropy = this.calculateEntropy(buffer);
            metadata.hasHiddenData = entropy > 7.5;

            try {
                const exifr = await import('exifr');
                const exifData = await exifr.default.parse(buffer);

                if (exifData) {
                    metadata.hasExif = true;
                    metadata.exif = exifData;

                    if (exifData.Make || exifData.Model) {
                        metadata.camera = {
                            make: exifData.Make || 'Unknown',
                            model: exifData.Model || 'Unknown',
                            lens: exifData.LensModel || '',
                            focalLength: exifData.FocalLength || 0,
                            aperture: exifData.FNumber || 0,
                            shutterSpeed: exifData.ExposureTime || 0,
                            iso: exifData.ISO || 0,
                            dateTaken: exifData.DateTimeOriginal || exifData.CreateDate || null
                        };
                    }

                    if (exifData.latitude && exifData.longitude) {
                        metadata.gps = {
                            latitude: exifData.latitude,
                            longitude: exifData.longitude,
                            altitude: exifData.altitude
                        };
                    }

                    if (exifData.Title) metadata.title = exifData.Title;
                    if (exifData.Description) metadata.subject = exifData.Description;
                    if (exifData.Copyright) metadata.author = exifData.Copyright;
                }
            } catch (exifError) {
                // Không có EXIF
            }

        } catch (error) {
            metadata.metadata.imageError = 'Không thể đọc metadata ảnh';
        }
    }

    private static async extractVideoMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
        try {
            const tempFile = path.join(process.cwd(), 'storage', 'temp', `video_${Date.now()}.tmp`);
            const dir = path.dirname(tempFile);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(tempFile, buffer);

            try {
                const { stdout } = await execAsync(
                    `ffprobe -v quiet -print_format json -show_format -show_streams "${tempFile}"`
                );

                const data = JSON.parse(stdout);

                if (data.format) {
                    metadata.duration = data.format.duration ? parseFloat(data.format.duration) : undefined;
                    metadata.bitrate = data.format.bit_rate ? parseInt(data.format.bit_rate) : undefined;
                    metadata.title = data.format.tags?.title || undefined;
                    metadata.author = data.format.tags?.artist || data.format.tags?.author || undefined;
                    metadata.creationDate = data.format.tags?.creation_time ? new Date(data.format.tags.creation_time) : undefined;

                    if (data.format.tags?.comment) {
                        metadata.metadata.comment = data.format.tags.comment;
                    }
                }

                if (data.streams && data.streams.length > 0) {
                    const videoStream = data.streams.find((s: any) => s.codec_type === 'video');
                    const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

                    if (videoStream) {
                        metadata.width = videoStream.width || undefined;
                        metadata.height = videoStream.height || undefined;
                        metadata.codec = videoStream.codec_name || undefined;
                        metadata.colorspace = videoStream.pix_fmt || undefined;
                        metadata.hasAlpha = videoStream.pix_fmt?.includes('a') || false;
                        metadata.metadata.videoCodec = videoStream.codec_long_name || undefined;
                        metadata.metadata.frameRate = videoStream.r_frame_rate || undefined;
                    }

                    if (audioStream) {
                        metadata.codec = metadata.codec || audioStream.codec_name;
                        metadata.metadata.audioCodec = audioStream.codec_long_name || undefined;
                        metadata.metadata.sampleRate = audioStream.sample_rate ? parseInt(audioStream.sample_rate) : undefined;
                        metadata.metadata.channels = audioStream.channels || undefined;
                    }
                }

            } catch (ffprobeError) {
                metadata.metadata.ffprobeError = 'FFprobe không khả dụng hoặc lỗi';
            } finally {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }

        } catch (error) {
            metadata.metadata.videoError = 'Không thể đọc metadata video';
        }
    }

    private static async extractAudioMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
        try {
            const tempFile = path.join(process.cwd(), 'storage', 'temp', `audio_${Date.now()}.tmp`);
            const dir = path.dirname(tempFile);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(tempFile, buffer);

            try {
                const { stdout } = await execAsync(
                    `ffprobe -v quiet -print_format json -show_format -show_streams "${tempFile}"`
                );

                const data = JSON.parse(stdout);

                if (data.format) {
                    metadata.duration = data.format.duration ? parseFloat(data.format.duration) : undefined;
                    metadata.bitrate = data.format.bit_rate ? parseInt(data.format.bit_rate) : undefined;
                    metadata.title = data.format.tags?.title || undefined;
                    metadata.author = data.format.tags?.artist || data.format.tags?.author || undefined;
                    metadata.creationDate = data.format.tags?.creation_time ? new Date(data.format.tags.creation_time) : undefined;
                }

                if (data.streams && data.streams.length > 0) {
                    const audioStream = data.streams.find((s: any) => s.codec_type === 'audio');

                    if (audioStream) {
                        metadata.codec = audioStream.codec_name || undefined;
                        metadata.metadata.audioCodec = audioStream.codec_long_name || undefined;
                        metadata.metadata.sampleRate = audioStream.sample_rate ? parseInt(audioStream.sample_rate) : undefined;
                        metadata.metadata.channels = audioStream.channels || undefined;
                        metadata.metadata.bitDepth = audioStream.bits_per_sample || undefined;
                    }
                }

            } catch (ffprobeError) {
                metadata.metadata.ffprobeError = 'FFprobe không khả dụng hoặc lỗi';
            } finally {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            }

        } catch (error) {
            metadata.metadata.audioError = 'Không thể đọc metadata audio';
        }
    }

    private static async extractDocumentMetadata(
        buffer: Buffer,
        mimeType: string,
        extension: string,
        metadata: FileMetadata
    ): Promise<void> {
        try {
            const content = buffer.toString('utf-8');

            if (mimeType === 'application/pdf' || extension === 'pdf') {
                try {
                    const pdfParse = await import('pdf-parse');
                    const pdfData = await pdfParse.default(buffer);

                    metadata.pages = pdfData.numpages || 0;
                    metadata.wordCount = pdfData.text ? pdfData.text.split(/\s+/).length : 0;
                    metadata.metadata.textPreview = pdfData.text ? pdfData.text.substring(0, 500) : '';

                    if (pdfData.info) {
                        metadata.title = pdfData.info.Title || undefined;
                        metadata.author = pdfData.info.Author || undefined;
                        metadata.subject = pdfData.info.Subject || undefined;
                        metadata.keywords = pdfData.info.Keywords ? pdfData.info.Keywords.split(',') : undefined;
                        metadata.creator = pdfData.info.Creator || undefined;
                        metadata.producer = pdfData.info.Producer || undefined;
                        metadata.isEncrypted = pdfData.info.Encrypted || false;
                        metadata.version = pdfData.info.PDFVersion || undefined;
                        metadata.creationDate = pdfData.info.CreationDate ? new Date(pdfData.info.CreationDate) : undefined;
                        metadata.modificationDate = pdfData.info.ModDate ? new Date(pdfData.info.ModDate) : undefined;
                        metadata.metadata.hasFormFields = pdfData.info.Form ? true : false;
                    }

                } catch (pdfError) {
                    metadata.metadata.pdfError = 'Không thể đọc metadata PDF';
                }
            }

            if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
                try {
                    const mammoth = await import('mammoth');
                    const result = await mammoth.default.extractRawText({ buffer });
                    const docxMeta = await mammoth.default.extractMetadata({ buffer });

                    if (result.value) {
                        metadata.wordCount = result.value.split(/\s+/).length || 0;
                        metadata.characterCount = result.value.length || 0;
                        metadata.lineCount = result.value.split('\n').length || 0;
                        metadata.metadata.textPreview = result.value.substring(0, 500);
                    }

                    if (docxMeta) {
                        metadata.title = docxMeta.title || undefined;
                        metadata.author = docxMeta.author || undefined;
                        metadata.subject = docxMeta.subject || undefined;
                        metadata.keywords = docxMeta.keywords ? docxMeta.keywords.split(',') : undefined;
                        metadata.creator = docxMeta.creator || undefined;
                        metadata.metadata.comments = docxMeta.comments || undefined;
                        metadata.metadata.lastModifiedBy = docxMeta.lastModifiedBy || undefined;
                        metadata.metadata.revision = docxMeta.revision || undefined;
                        metadata.isEncrypted = docxMeta.encrypted || false;
                        metadata.creationDate = docxMeta.created ? new Date(docxMeta.created) : undefined;
                        metadata.modificationDate = docxMeta.modified ? new Date(docxMeta.modified) : undefined;
                    }

                } catch (docxError) {
                    metadata.metadata.docxError = 'Không thể đọc metadata DOCX';
                }
            }

            if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || extension === 'xlsx') {
                try {
                    const xlsx = await import('xlsx');
                    const workbook = xlsx.default.read(buffer, { type: 'buffer' });

                    metadata.sheetCount = workbook.SheetNames.length || 0;
                    metadata.worksheetNames = workbook.SheetNames || [];

                    let totalRows = 0;
                    let hasFormulas = false;
                    let hasComments = false;

                    for (const sheetName of workbook.SheetNames) {
                        const sheet = workbook.Sheets[sheetName];
                        const jsonData = xlsx.default.utils.sheet_to_json(sheet);
                        totalRows += jsonData.length;

                        for (const cellKey in sheet) {
                            if (cellKey.startsWith('!')) continue;
                            const cell = sheet[cellKey];
                            if (cell?.f) hasFormulas = true;
                            if (cell?.c) hasComments = true;
                        }
                    }

                    metadata.wordCount = totalRows;
                    metadata.hasFormulas = hasFormulas;
                    metadata.hasComments = hasComments;
                    metadata.metadata.totalRows = totalRows;

                    const hasHiddenSheets = workbook.Workbook?.Sheets?.some((s: any) => s.Hidden) || false;
                    metadata.metadata.hasHiddenSheets = hasHiddenSheets;

                } catch (xlsxError) {
                    metadata.metadata.xlsxError = 'Không thể đọc metadata XLSX';
                }
            }

            if (mimeType === 'application/json' || extension === 'json') {
                try {
                    const parsed = JSON.parse(content);
                    metadata.metadata.isValidJson = true;
                    metadata.metadata.keys = typeof parsed === 'object' ? Object.keys(parsed) : [];
                    metadata.metadata.isArray = Array.isArray(parsed);
                    metadata.metadata.arrayLength = Array.isArray(parsed) ? parsed.length : 0;

                    const hasEscapedChars = /\\u[0-9a-fA-F]{4}/.test(content);
                    const hasComments = /\/\*|\*\//.test(content) || /\/\//.test(content);
                    const hasTrailingCommas = /,\s*}/.test(content) || /,\s*]/.test(content);

                    metadata.metadata.hasEscapedChars = hasEscapedChars;
                    metadata.metadata.hasComments = hasComments;
                    metadata.metadata.hasTrailingCommas = hasTrailingCommas;

                } catch (jsonError) {
                    metadata.metadata.isValidJson = false;
                    metadata.metadata.jsonError = 'JSON không hợp lệ';
                }
            }

            if (mimeType === 'text/plain' || extension === 'txt') {
                metadata.wordCount = content.split(/\s+/).length || 0;
                metadata.characterCount = content.length || 0;
                metadata.lineCount = content.split('\n').length || 0;
                metadata.metadata.textPreview = content.substring(0, 500);
                metadata.language = this.detectLanguage(content);
            }

            if (mimeType === 'text/csv' || extension === 'csv') {
                const lines = content.split('\n').filter(line => line.trim());
                metadata.lineCount = lines.length || 0;
                metadata.metadata.header = lines.length > 0 ? lines[0].split(',').map((h: string) => h.trim()) : [];
                metadata.metadata.rowCount = lines.length > 1 ? lines.length - 1 : 0;
                metadata.metadata.delimiter = this.detectCsvDelimiter(content);
            }

        } catch (error) {
            metadata.metadata.documentError = 'Không thể đọc metadata tài liệu';
        }
    }

    private static async extractArchiveMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
        try {
            const yauzl = await import('yauzl');
            const tempFile = path.join(process.cwd(), 'storage', 'temp', `archive_${Date.now()}.zip`);
            const dir = path.dirname(tempFile);

            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(tempFile, buffer);

            let fileCount = 0;
            let totalSize = 0;
            let hasEncrypted = false;

            await new Promise<void>((resolve, reject) => {
                yauzl.default.open(tempFile, { lazyEntries: true }, (err: any, zipfile: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    zipfile.readEntry();
                    zipfile.on('entry', (entry: any) => {
                        fileCount++;
                        totalSize += entry.uncompressedSize || 0;
                        if (entry.isEncrypted) hasEncrypted = true;
                        zipfile.readEntry();
                    });

                    zipfile.on('end', () => {
                        resolve();
                    });

                    zipfile.on('error', (err: any) => {
                        reject(err);
                    });
                });
            });

            metadata.metadata.fileCount = fileCount;
            metadata.metadata.totalUncompressedSize = totalSize;
            metadata.isEncrypted = hasEncrypted;
            metadata.isCompressed = true;

            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }

        } catch (error) {
            metadata.metadata.archiveError = 'Không thể đọc metadata archive';
            metadata.isCompressed = true;
        }
    }

    private static async extractGenericMetadata(buffer: Buffer, metadata: FileMetadata): Promise<void> {
        try {
            metadata.metadata.fileSignature = this.detectFileSignature(buffer);

            const mimeType = metadata.mimeType;
            if (mimeType.includes('font') || metadata.extension === 'ttf' || metadata.extension === 'otf') {
                metadata.metadata.isFont = true;
                metadata.metadata.fontFamily = this.extractFontName(buffer);
            }

            const isEncrypted = this.detectEncryption(buffer);
            if (isEncrypted) {
                metadata.isEncrypted = true;
            }

        } catch (error) {
            // Bỏ qua lỗi
        }
    }

    private static detectFileSignature(buffer: Buffer): string {
        const signatures: Record<string, string> = {
            '89504E47': 'PNG',
            'FFD8FF': 'JPEG',
            '47494638': 'GIF',
            '52494646': 'WEBP',
            '25504446': 'PDF',
            '504B0304': 'ZIP/DOCX/XLSX/PPTX',
            '504B0506': 'ZIP (empty)',
            '504B0708': 'ZIP (spanned)',
            '1F8B08': 'GZIP',
            '7F454C46': 'ELF',
            '4D5A': 'EXE/DLL'
        };

        const hex = buffer.subarray(0, 4).toString('hex').toUpperCase();
        const partialHex = buffer.subarray(0, 2).toString('hex').toUpperCase();

        for (const [key, value] of Object.entries(signatures)) {
            if (hex.startsWith(key) || partialHex.startsWith(key)) {
                return value;
            }
        }

        return 'UNKNOWN';
    }

    private static detectLanguage(text: string): string {
        const patterns: Record<string, RegExp> = {
            'vi': /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i,
            'en': /[a-zA-Z]/,
            'zh': /[\u4e00-\u9fff]/,
            'ja': /[\u3040-\u30ff\u31f0-\u31ff]/,
            'ko': /[\uac00-\ud7af]/
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) {
                return lang;
            }
        }

        return 'unknown';
    }

    private static detectCsvDelimiter(content: string): string {
        const firstLine = content.split('\n')[0] || '';
        const delimiters = [',', ';', '\t', '|'];

        let bestDelimiter = ',';
        let maxCount = 0;

        for (const delim of delimiters) {
            const count = firstLine.split(delim).length;
            if (count > maxCount) {
                maxCount = count;
                bestDelimiter = delim;
            }
        }

        return bestDelimiter;
    }

    private static calculateEntropy(buffer: Buffer): number {
        const counts = new Array(256).fill(0);
        for (const byte of buffer) {
            counts[byte]++;
        }

        let entropy = 0;
        const length = buffer.length;

        for (const count of counts) {
            if (count === 0) continue;
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    private static detectEncryption(buffer: Buffer): boolean {
        const entropies = [];
        const blockSize = Math.min(buffer.length, 1024);

        for (let i = 0; i < Math.min(buffer.length, 10240); i += blockSize) {
            const block = buffer.subarray(i, i + blockSize);
            const entropy = this.calculateEntropy(block);
            entropies.push(entropy);
        }

        const avgEntropy = entropies.reduce((a, b) => a + b, 0) / entropies.length;
        return avgEntropy > 7.8;
    }

    private static extractFontName(buffer: Buffer): string | undefined {
        try {
            const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 4096));
            const match = text.match(/name\s+([a-zA-Z0-9\s\-]+)/i);
            return match ? match[1].trim() : undefined;
        } catch {
            return undefined;
        }
    }
}

export const metadataExtractor = MetadataExtractor;