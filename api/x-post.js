const multer = require('multer');
const axios = require('axios');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const FormData = require('form-data');

// Multer設定（メモリストレージ）
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 512 * 1024 * 1024 // 512MB制限
  }
});

// 設定値（Pythonスクリプトと同じ）
const CHUNK_SIZE = 2 * 1024 * 1024;  // 2MB chunks
const MAX_PROCESSING_WAIT = 300000;  // 5分（ミリ秒）
const PROCESSING_CHECK_INTERVAL = 5000; // 5秒間隔（ミリ秒）

// 遅延処理
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 環境変数の検証（動的アカウント対応）
function validateEnvironment(account) {
  const requiredVars = [
    'X_API_KEY',
    'X_API_SECRET',
    `X_ACCESS_TOKEN_${account}`,
    `X_ACCESS_TOKEN_SECRET_${account}`
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  return {
    valid: missingVars.length === 0,
    missing: missingVars
  };
}

// OAuth 1.0a認証設定（Pythonのtweepyと同じ設定）
function createOAuthConfig(account) {
  return OAuth({
    consumer: {
      key: process.env.X_API_KEY,
      secret: process.env.X_API_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64');
    }
  });
}

// アクセストークン取得
function getAccessToken(account) {
  return {
    key: process.env[`X_ACCESS_TOKEN_${account}`],
    secret: process.env[`X_ACCESS_TOKEN_SECRET_${account}`]
  };
}

// 認証テスト（Pythonのapi_v2.get_me()と同等）
async function testAuthentication(oauth, token) {
  try {
    const verifyUrl = 'https://api.twitter.com/2/users/me';
    const request = {
      url: verifyUrl,
      method: 'GET'
    };
    
    const authHeader = oauth.authorize(request, token);
    const response = await axios.get(verifyUrl, {
      headers: oauth.toHeader(authHeader)
    });
    
    return response.data.data;
  } catch (error) {
    console.error('認証テスト失敗:', error.response?.data || error.message);
    return null;
  }
}

// チャンク化動画アップロード（Pythonのupload_video_chunkedと同じロジック）
async function uploadVideoChunked(mediaFile, oauth, token) {
  try {
    console.log('🚀 動画アップロード開始');
    
    const totalBytes = mediaFile.size;
    console.log(`📊 総サイズ: ${totalBytes.toLocaleString()} bytes`);
    
    // INIT（Pythonと同じパラメータ）
    const initUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    const initData = {
      command: 'INIT',
      total_bytes: totalBytes,
      media_type: mediaFile.mimetype,
      media_category: 'tweet_video'
    };
    
    const initRequest = {
      url: initUrl,
      method: 'POST',
      data: initData
    };
    
    const initAuth = oauth.authorize(initRequest, token);
    const initResponse = await axios.post(initUrl, null, {
      params: { ...initData, ...initAuth }
    });
    
    const mediaId = initResponse.data.media_id_string;
    console.log(`🏷️ Media ID: ${mediaId}`);
    
    // APPEND（チャンク化 - Pythonと同じロジック）
    const chunks = Math.ceil(totalBytes / CHUNK_SIZE);
    console.log(`📦 ${chunks}個のチャンクに分割`);
    
    for (let i = 0; i < chunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const chunk = mediaFile.buffer.slice(start, end);
      
      console.log(`📤 チャンク ${i + 1}/${chunks} アップロード中...`);
      
      const formData = new FormData();
      formData.append('command', 'APPEND');
      formData.append('media_id', mediaId);
      formData.append('segment_index', i.toString());
      formData.append('media', chunk, {
        filename: 'video.mp4',
        contentType: mediaFile.mimetype
      });
      
      const appendRequest = {
        url: initUrl,
        method: 'POST'
      };
      
      const appendAuth = oauth.authorize(appendRequest, token);
      
      await axios.post(initUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          ...oauth.toHeader(appendAuth)
        }
      });
    }
    
    // FINALIZE（Pythonと同じ）
    console.log('📥 ファイナライズ中...');
    const finalizeData = {
      command: 'FINALIZE',
      media_id: mediaId
    };
    
    const finalizeRequest = {
      url: initUrl,
      method: 'POST',
      data: finalizeData
    };
    
    const finalizeAuth = oauth.authorize(finalizeRequest, token);
    await axios.post(initUrl, null, {
      params: { ...finalizeData, ...finalizeAuth }
    });
    
    // STATUS確認（Pythonと同じロジック）
    let processingInfo;
    let totalWaitTime = 0;
    
    do {
      const statusData = {
        command: 'STATUS',
        media_id: mediaId
      };
      
      const statusRequest = {
        url: initUrl,
        method: 'GET',
        data: statusData
      };
      
      const statusAuth = oauth.authorize(statusRequest, token);
      const statusResponse = await axios.get(initUrl, {
        params: { ...statusData, ...statusAuth }
      });
      
      processingInfo = statusResponse.data.processing_info;
      
      if (processingInfo) {
        if (processingInfo.state === 'pending' || processingInfo.state === 'in_progress') {
          const waitTime = (processingInfo.check_after_secs || 5) * 1000;
          console.log(`⏳ 処理中... ${totalWaitTime / 1000}秒経過`);
          await sleep(waitTime);
          totalWaitTime += waitTime;
          
          if (totalWaitTime > MAX_PROCESSING_WAIT) {
            throw new Error('動画処理がタイムアウトしました');
          }
        } else if (processingInfo.state === 'failed') {
          throw new Error(`動画処理に失敗: ${processingInfo.error?.message || '不明なエラー'}`);
        }
      }
    } while (processingInfo && (processingInfo.state === 'pending' || processingInfo.state === 'in_progress'));
    
    console.log('✅ アップロード完了');
    return mediaId;
    
  } catch (error) {
    console.error('❌ アップロードエラー:', error.response?.data || error.message);
    
    // Pythonと同じエラーハンドリング
    if (error.response?.status === 429) {
      throw new Error('レート制限に達しました。15分待ってから再試行してください');
    } else if (error.response?.status === 400) {
      throw new Error('動画形式がサポートされていません');
    }
    
    throw error;
  }
}

// 説明文分割（Pythonのsplit_description_by_100_charsと同じロジック）
function splitDescriptionBy100Chars(text, maxLength = 100) {
  if (!text || !text.trim()) return [];
  
  text = text.trim();
  
  // 100文字以内の場合はそのまま返す
  if (text.length <= maxLength) {
    return [text];
  }
  
  // 100文字を超える場合は、自然な区切り位置で切る
  const chunkCandidate = text.substring(0, maxLength);
  
  // 自然な区切り位置を探す（句読点、改行、スペース）
  const naturalBreaks = ['。', '！', '？', '\n', '、', '.', '!', '?', ' '];
  let bestBreak = -1;
  
  // 後ろから探して最適な区切り位置を見つける
  for (let i = chunkCandidate.length - 1; i > Math.max(0, chunkCandidate.length - 20); i--) {
    if (naturalBreaks.includes(chunkCandidate[i])) {
      bestBreak = i + 1; // 区切り文字の次の位置
      break;
    }
  }
  
  let result;
  if (bestBreak > 0) {
    // 自然な区切りが見つかった場合
    result = text.substring(0, bestBreak).trim();
  } else {
    // 自然な区切りが見つからない場合は強制的に100文字で切る
    result = chunkCandidate.trim();
  }
  
  // 1つのチャンクのみ返す（分割投稿なし）
  return result ? [result] : [];
}

// スレッド投稿（Pythonのpost_thread_with_videoと完全に同じロジック）
async function postThreadWithVideo(postTitle, videoDescription, mediaId, oauth, token, userData, enableThread) {
  try {
    const tweetIds = [];
    
    // 投稿1: メイン投稿（タイトル + 動画）
    const mainText = postTitle;
    console.log(`📝 投稿1: メイン投稿`);
    
    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const mainTweetData = {
      text: mainText
    };
    
    if (mediaId) {
      mainTweetData.media = {
        media_ids: [mediaId]
      };
    }
    
    const mainRequest = {
      url: tweetUrl,
      method: 'POST'
    };
    
    const mainAuth = oauth.authorize(mainRequest, token);
    const mainResponse = await axios.post(tweetUrl, mainTweetData, {
      headers: {
        'Content-Type': 'application/json',
        ...oauth.toHeader(mainAuth)
      }
    });
    
    const mainTweetId = mainResponse.data.data.id;
    tweetIds.push(mainTweetId);
    console.log(`✅ メイン投稿成功! ID: ${mainTweetId}`);
    
    // スレッド投稿が有効でない場合はここで終了
    if (!enableThread) {
      return {
        success: true,
        tweetIds: tweetIds,
        mainTweetId: mainTweetId,
        url: `https://twitter.com/${userData.username}/status/${mainTweetId}`
      };
    }
    
    // 投稿間隔（スパム判定回避）- Pythonと同じ
    console.log('⏱️ 投稿間隔待機中...');
    await sleep(3000);
    
    // 投稿2以降: 概要（分割投稿対応）
    if (videoDescription && videoDescription.trim()) {
      console.log(`📝 概要投稿開始 - 全文: ${videoDescription.length}文字`);
      
      // 説明文を100文字ずつに分割
      const descriptionChunks = splitDescriptionBy100Chars(videoDescription);
      
      console.log(`📝 分割結果: ${descriptionChunks.length}個の投稿に分割`);
      
      let lastTweetId = mainTweetId;
      
      for (let i = 0; i < descriptionChunks.length; i++) {
        const chunk = descriptionChunks[i];
        let tweetText = chunk;
        console.log(`📝 投稿${3 + i}: 概要（${i + 1}/${descriptionChunks.length}） - ${chunk.substring(0, 30)}...`);
        
        // 文字数の最終確認（既存コードと同じlen()計算）
        const charCount = tweetText.length;
        if (charCount > 100) {
          console.log(`⚠️ 警告: 投稿文字数が100文字を超過 (${charCount}文字)`);
          // 緊急措置: 強制的に97文字で切る
          tweetText = tweetText.substring(0, 97) + '...';
          console.log(`✂️ 緊急短縮: ${tweetText}`);
        }
        
        // 投稿実行
        try {
          const chunkData = {
            text: tweetText,
            reply: {
              in_reply_to_tweet_id: lastTweetId
            }
          };
          
          const chunkRequest = {
            url: tweetUrl,
            method: 'POST'
          };
          
          const chunkAuth = oauth.authorize(chunkRequest, token);
          const chunkResponse = await axios.post(tweetUrl, chunkData, {
            headers: {
              'Content-Type': 'application/json',
              ...oauth.toHeader(chunkAuth)
            }
          });
          
          if (chunkResponse.data.data) {
            const chunkTweetId = chunkResponse.data.data.id;
            lastTweetId = chunkTweetId;
            tweetIds.push(chunkTweetId);
            console.log(`✅ 概要投稿${i + 1}成功! ID: ${chunkTweetId}`);
            
            // スパム判定回避のための投稿間隔
            if (i < descriptionChunks.length - 1) { // 最後の投稿でない場合
              console.log('⏱️ 投稿間隔待機中...');
              await sleep(3000);
            }
          } else {
            console.log(`❌ 概要投稿${i + 1}に失敗しました`);
          }
        } catch (error) {
          console.error(`❌ 概要投稿${i + 1}でエラー:`, error.response?.data || error.message);
          // エラーが発生しても次の投稿は試行する
          continue;
        }
      }
      
      console.log(`📝 概要投稿完了: ${descriptionChunks.length}投稿`);
    } else {
      console.log('ℹ️ 概要が空のため、概要投稿をスキップします');
    }
    
    // 成功時の総括
    console.log(`🎉 スレッド投稿完了!`);
    console.log(`📅 投稿時刻: ${new Date().toLocaleString('ja-JP')}`);
    
    return {
      success: true,
      tweetIds: tweetIds,
      mainTweetId: mainTweetId,
      url: `https://twitter.com/${userData.username}/status/${mainTweetId}`
    };
    
  } catch (error) {
    console.error('❌ スレッド投稿エラー:', error.response?.data || error.message);
    
    // Pythonと同じエラーハンドリング
    if (error.response?.status === 403) {
      const errorStr = error.response?.data?.detail || '';
      if (errorStr.includes('186') || errorStr.includes('too long')) {
        throw new Error('ツイートが長すぎます（Unicode文字の重み付けを考慮）');
      } else if (errorStr.includes('187') || errorStr.includes('duplicate')) {
        throw new Error('重複ツイート - 同じ内容を最近投稿しています');
      } else if (errorStr.includes('226')) {
        throw new Error('自動化/スパムの疑い');
      } else if (errorStr.includes('261')) {
        throw new Error('アプリの書き込み権限がありません');
      }
      throw new Error(`権限エラー: ${error.response?.data?.detail || 'アクセスが拒否されました'}`);
    } else if (error.response?.status === 429) {
      throw new Error('レート制限エラー: 15分待ってから再試行してください');
    }
    
    throw error;
  }
}

// X投稿処理（メイン関数 - Pythonのmain()と同じロジック）
async function postToX(req, res) {
  try {
    const { text, description, enableThread } = req.body;
    // デフォルトアカウントIDを使用（環境変数で設定可能）
    const account = process.env.X_DEFAULT_ACCOUNT || '1';
    const mediaFile = req.file;
    
    console.log('=== X API 動画投稿 SaaS版 ===');
    console.log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`);
    
    // 環境変数の検証（Pythonと同じ）
    const validation = validateEnvironment(account || '1');
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false,
        error: `必要な環境変数が不足: ${validation.missing.join(', ')}`
      });
    }
    
    // OAuth設定（Pythonと同じ）
    const oauth = createOAuthConfig(account || '1');
    const token = getAccessToken(account || '1');
    
    // 認証テスト（Pythonのapi_v2.get_me()と同等）
    console.log('🔐 認証テスト中...');
    const userData = await testAuthentication(oauth, token);
    if (!userData) {
      return res.status(401).json({
        success: false,
        error: 'API認証に失敗しました'
      });
    }
    
    console.log(`✅ 認証成功: @${userData.username}`);
    
    // 期待されるアカウントかチェック（Pythonと同じ）
    const expectedAccounts = ['kamui_news_ja', 'kamui_news_en', 'ken_post_test_k'];
    if (!expectedAccounts.includes(userData.username)) {
      console.log(`⚠️ 期待されるアカウント(${expectedAccounts.map(acc => '@' + acc).join(', ')})と異なります: @${userData.username}`);
      console.log('💡 認証設定を確認してください');
    }
    
    // 投稿テキストを構成（Pythonと同じ）
    const postTitle = text || '';
    const videoDescription = description || '';
    const enableThreadBool = enableThread === 'true' || enableThread === true;
    
    // 免責事項は削除
    
    console.log(`📄 メイン投稿テキスト: ${postTitle}`);
    console.log(`📄 概要（全文）: ${videoDescription}`);
    console.log(`📊 概要文字数: ${videoDescription.length}`);
    console.log(`🔄 スレッド投稿: ${enableThreadBool ? '有効' : '無効'}`);
    
    // 分割処理のプレビュー（Pythonと同じ）
    if (videoDescription && videoDescription.trim()) {
      const previewChunks = splitDescriptionBy100Chars(videoDescription);
      console.log(`📝 分割プレビュー: ${previewChunks.length}個に分割予定`);
      for (let i = 0; i < Math.min(previewChunks.length, 3); i++) {
        const chunk = previewChunks[i];
        const charCount = chunk.length;
        console.log(`  ${i + 1}. (${charCount}文字) ${chunk.substring(0, 50)}...`);
      }
      if (previewChunks.length > 3) {
        console.log(`  ... 他${previewChunks.length - 3}個の投稿`);
      }
    }
    
    let mediaId = null;
    
    // 動画アップロード（Pythonと同じロジック）
    if (mediaFile) {
      console.log('\n' + '='.repeat(50));
      console.log(`📁 動画ファイル: ${mediaFile.originalname}`);
      console.log(`📊 ファイルサイズ: ${(mediaFile.size / (1024 * 1024)).toFixed(2)}MB (${mediaFile.size.toLocaleString()} bytes)`);
      console.log(`🎬 MIME Type: ${mediaFile.mimetype}`);
      
      try {
        mediaId = await uploadVideoChunked(mediaFile, oauth, token);
      } catch (error) {
        return res.status(500).json({ 
          success: false,
          error: 'メディアのアップロードに失敗しました',
          details: error.message
        });
      }
    }
    
    // スレッド投稿（Pythonと同じロジック）
    console.log('\n' + '='.repeat(50));
    try {
      const result = await postThreadWithVideo(
        postTitle,
        videoDescription,
        mediaId,
        oauth,
        token,
        userData,
        enableThreadBool
      );
      
      if (result.success) {
        console.log('\n🎉 X投稿SaaS: 投稿成功!');
        console.log('📋 投稿完了');
        res.json(result);
      } else {
        throw new Error('投稿処理に失敗しました');
      }
      
    } catch (error) {
      console.log('\n❌ X投稿SaaS: 投稿失敗');
      console.log('🔍 ログを確認し、トラブルシューティングを実施してください');
      return res.status(500).json({ 
        success: false,
        error: 'X投稿に失敗しました',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('X投稿エラー:', error);
    res.status(500).json({ 
      success: false,
      error: 'X投稿に失敗しました', 
      details: error.message 
    });
  }
}

module.exports = {
  upload,
  postToX
};