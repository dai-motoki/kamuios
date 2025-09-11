const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

// .envファイルを読み込む（dotenvパッケージなしで実装）
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    try {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            }
        });
        console.log(`Loaded environment from: ${envPath}`);
    } catch (err) {
        console.log(`No .env file found at project root, using defaults`);
        // デフォルト値を設定
        process.env.PORT = process.env.PORT || '7777';
        process.env.SCAN_PATH = process.env.SCAN_PATH || path.join(__dirname, '..', 'static', 'images');
    }
}
loadEnv();

// メディアファイルの拡張子
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
const htmlExtensions  = ['html', 'htm'];

// ディレクトリをスキャンする関数
function scanDirectory(dirPath, baseDir = null, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return { files: [], folders: [] };
    
    if (!baseDir) baseDir = dirPath;
    
    const result = {
        files: [],
        folders: []
    };
    
    try {
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            // 隠しファイルやシステムファイルをスキップ
            if (item.startsWith('.') || item === 'node_modules') return;
            
            const fullPath = path.join(dirPath, item);
            const relativePath = path.relative(baseDir, fullPath);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                const subItems = scanDirectory(fullPath, baseDir, depth + 1, maxDepth);
                result.folders.push({
                    name: item,
                    path: relativePath,
                    items: subItems
                });
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase().slice(1);
                let type = 'other';
                
                if (imageExtensions.includes(ext)) type = 'image';
                else if (videoExtensions.includes(ext)) type = 'video';
                else if (audioExtensions.includes(ext)) type = 'audio';
                else if (htmlExtensions.includes(ext)) type = 'html';
                
                if (type !== 'other') {
                    result.files.push({
                        name: item,
                        path: relativePath,
                        fullPath: fullPath,
                        type: type,
                        size: stat.size,
                        modified: stat.mtime
                    });
                }
            }
        });
    } catch (err) {
        console.error('Error scanning directory:', dirPath, err);
    }
    
    return result;
}

// HTTPサーバーの作成
const server = http.createServer((req, res) => {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONS リクエストへの対応（CORS preflight）
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 設定情報のエンドポイント
    if (req.url === '/api/config') {
        if (!process.env.PORT || !process.env.SCAN_PATH) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(500);
            res.end(JSON.stringify({
                error: 'Missing required environment variables: PORT and/or SCAN_PATH'
            }));
            return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({
            port: process.env.PORT,
            scanPath: process.env.SCAN_PATH
        }));
        return;
    }
    
    // 静的ファイルの配信（画像、動画、音声）
    if (req.method === 'GET' && !req.url.startsWith('/api/')) {
        // index.htmlの配信
        if (req.url === '/' || req.url === '/index.html') {
            const indexPath = path.join(__dirname, 'index.html');
            fs.readFile(indexPath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end(data);
            });
            return;
        }
        
        // メディアファイルの配信
        if (!process.env.SCAN_PATH) {
            res.writeHead(500);
            res.end('ERROR: SCAN_PATH environment variable is not set');
            return;
        }
        const baseDir = process.env.SCAN_PATH;
        const filePath = decodeURIComponent(req.url.substring(1)); // 先頭の/を削除
        const fullPath = path.join(baseDir, filePath);
        
        // ファイルの存在確認
        fs.stat(fullPath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            // MIMEタイプの設定
            const ext = path.extname(fullPath).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.webp': 'image/webp',
                '.mp4': 'video/mp4',
                '.mov': 'video/quicktime',
                '.avi': 'video/x-msvideo',
                '.mkv': 'video/x-matroska',
                '.webm': 'video/webm',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.flac': 'audio/flac',
                '.m4a': 'audio/mp4',
                '.html': 'text/html; charset=utf-8',
                '.htm': 'text/html; charset=utf-8'
            };
            
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            
            // ファイルをストリーミング
            const stream = fs.createReadStream(fullPath);
            stream.pipe(res);
            stream.on('error', () => {
                res.writeHead(500);
                res.end('Internal server error');
            });
        });
        return;
    }
    
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url === '/api/scan' && req.method === 'GET') {
        // .envで指定された絶対パスをスキャン
        if (!process.env.SCAN_PATH) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'SCAN_PATH environment variable is not set' }));
            return;
        }
        const currentDir = process.env.SCAN_PATH;
        console.log('Scanning directory:', currentDir);
        const mediaFiles = scanDirectory(currentDir);
        
        res.writeHead(200);
        res.end(JSON.stringify({
            baseDir: currentDir,
            data: mediaFiles
        }));
    } else if (req.url === '/api/open-file' && req.method === 'POST') {
        // ファイルを開く
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { path: filePath } = JSON.parse(body);
                if (!process.env.SCAN_PATH) {
            res.writeHead(500);
            res.end('ERROR: SCAN_PATH environment variable is not set');
            return;
        }
        const baseDir = process.env.SCAN_PATH;
                const fullPath = path.join(baseDir, filePath);
                
                // macOSの場合
                if (process.platform === 'darwin') {
                    exec(`open "${fullPath}"`, (error) => {
                        if (error) {
                            console.error('Error opening file:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'Failed to open file' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
                // Windowsの場合
                else if (process.platform === 'win32') {
                    exec(`start "" "${fullPath}"`, (error) => {
                        if (error) {
                            console.error('Error opening file:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'Failed to open file' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
                // Linuxの場合
                else {
                    exec(`xdg-open "${fullPath}"`, (error) => {
                        if (error) {
                            console.error('Error opening file:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'Failed to open file' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
            } catch (err) {
                console.error('Error parsing request:', err);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
    } else if (req.url === '/api/open-folder' && req.method === 'POST') {
        // フォルダを開く
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { path: folderPath } = JSON.parse(body);
                if (!process.env.SCAN_PATH) {
            res.writeHead(500);
            res.end('ERROR: SCAN_PATH environment variable is not set');
            return;
        }
        const baseDir = process.env.SCAN_PATH;
                const fullPath = path.join(baseDir, folderPath);
                
                // macOSの場合
                if (process.platform === 'darwin') {
                    exec(`open "${fullPath}"`, (error) => {
                        if (error) {
                            console.error('Error opening folder:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'Failed to open folder' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
                // Windowsの場合
                else if (process.platform === 'win32') {
                    exec(`explorer "${fullPath}"`, (error) => {
                        if (error) {
                            console.error('Error opening folder:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'Failed to open folder' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
                // Linuxの場合
                else {
                    exec(`xdg-open "${fullPath}"`, (error) => {
                        if (error) {
                            console.error('Error opening folder:', error);
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'Failed to open folder' }));
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify({ success: true }));
                        }
                    });
                }
            } catch (err) {
                console.error('Error parsing request:', err);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

if (!process.env.PORT) {
    console.error('ERROR: PORT environment variable is not set');
    process.exit(1);
}
const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Media scanner server running at http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/scan`);
});
