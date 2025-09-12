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

// X投稿処理
async function postToX(req, res) {
  try {
    const { text, account } = req.body;
    const mediaFile = req.file;
    
    // 共通のAPI認証情報を取得
    const apiKey = process.env.X_API_KEY;
    const apiSecret = process.env.X_API_SECRET;
    
    // アカウントに応じたアクセストークンを取得
    const accessToken = process.env[`X_ACCESS_TOKEN_${account}`];
    const accessTokenSecret = process.env[`X_ACCESS_TOKEN_SECRET_${account}`];
    
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ 
        error: 'X APIの認証情報が設定されていません' 
      });
    }
    
    if (!accessToken || !accessTokenSecret) {
      return res.status(400).json({ 
        error: `アカウント${account}の認証情報が設定されていません` 
      });
    }
    
    // OAuth 1.0a設定
    const oauth = OAuth({
      consumer: {
        key: apiKey,
        secret: apiSecret
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      }
    });
    
    const token = {
      key: accessToken,
      secret: accessTokenSecret
    };
    
    let mediaId = null;
    
    // メディアアップロード処理
    if (mediaFile) {
      try {
        // INIT
        const initUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const initData = {
          command: 'INIT',
          total_bytes: mediaFile.size,
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
        
        mediaId = initResponse.data.media_id_string;
        
        // APPEND
        const appendUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const formData = new FormData();
        formData.append('command', 'APPEND');
        formData.append('media_id', mediaId);
        formData.append('segment_index', '0');
        formData.append('media', mediaFile.buffer, {
          filename: 'video.mp4',
          contentType: mediaFile.mimetype
        });
        
        const appendRequest = {
          url: appendUrl,
          method: 'POST'
        };
        
        const appendAuth = oauth.authorize(appendRequest, token);
        
        await axios.post(appendUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            ...oauth.toHeader(appendAuth)
          }
        });
        
        // FINALIZE
        const finalizeData = {
          command: 'FINALIZE',
          media_id: mediaId
        };
        
        const finalizeRequest = {
          url: appendUrl,
          method: 'POST',
          data: finalizeData
        };
        
        const finalizeAuth = oauth.authorize(finalizeRequest, token);
        await axios.post(appendUrl, null, {
          params: { ...finalizeData, ...finalizeAuth }
        });
        
        // STATUS確認（処理中の場合）
        let processingInfo;
        do {
          const statusData = {
            command: 'STATUS',
            media_id: mediaId
          };
          
          const statusRequest = {
            url: appendUrl,
            method: 'GET',
            data: statusData
          };
          
          const statusAuth = oauth.authorize(statusRequest, token);
          const statusResponse = await axios.get(appendUrl, {
            params: { ...statusData, ...statusAuth }
          });
          
          processingInfo = statusResponse.data.processing_info;
          
          if (processingInfo && processingInfo.state === 'pending') {
            await new Promise(resolve => setTimeout(resolve, processingInfo.check_after_secs * 1000));
          }
        } while (processingInfo && processingInfo.state === 'pending');
        
      } catch (error) {
        console.error('メディアアップロードエラー:', error.response?.data || error.message);
        return res.status(500).json({ 
          error: 'メディアのアップロードに失敗しました' 
        });
      }
    }
    
    // ツイート投稿
    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const tweetData = {
      text: text || ''
    };
    
    if (mediaId) {
      tweetData.media = {
        media_ids: [mediaId]
      };
    }
    
    const tweetRequest = {
      url: tweetUrl,
      method: 'POST'
    };
    
    const tweetAuth = oauth.authorize(tweetRequest, token);
    
    const tweetResponse = await axios.post(tweetUrl, tweetData, {
      headers: {
        'Content-Type': 'application/json',
        ...oauth.toHeader(tweetAuth)
      }
    });
    
    res.json({
      success: true,
      data: tweetResponse.data
    });
    
  } catch (error) {
    console.error('X投稿エラー:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'X投稿に失敗しました', 
      details: error.response?.data || error.message 
    });
  }
}

module.exports = {
  upload,
  postToX
};