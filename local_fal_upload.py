#!/usr/bin/env python3
import sys
import os
import fal_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set FAL_KEY from environment
if 'FAL_KEY' in os.environ:
    os.environ['FAL_KEY'] = os.environ['FAL_KEY']

def upload_file(file_path):
    """Upload file to FAL"""
    url = fal_client.upload_file(file_path)
    print(url)
    return url

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python local_fal_upload.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    url = upload_file(file_path)