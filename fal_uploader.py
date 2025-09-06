#!/usr/bin/env python3
"""FAL URL アップローダー（fal-client使用）"""

import sys
import os

# .envファイルから環境変数を読み込む
from dotenv import load_dotenv
load_dotenv()

# FAL_API_KEYをFAL_KEYとして設定
if os.getenv('FAL_API_KEY'):
    os.environ['FAL_KEY'] = os.getenv('FAL_API_KEY')

import fal_client

def upload_file(file_path):
    """ファイルをFALにアップロードしてURLを返す"""
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return None
    
    try:
        # fal_clientを使用してアップロード
        url = fal_client.upload_file(file_path)
        print(f"✅ Upload successful!")
        print(f"FAL URL: {url}")
        return url
    except Exception as e:
        print(f"Error uploading to FAL: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python fal_uploader.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    url = upload_file(file_path)
    
    if url:
        sys.exit(0)
    else:
        sys.exit(1)