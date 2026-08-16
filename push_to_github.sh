#!/bin/bash
# 一键推送到 GitHub 脚本

echo "=== GitHub Push Script ==="
echo ""

# 检查是否已有远程仓库
if git remote get-url origin 2>/dev/null; then
    echo "Remote repository already configured:"
    git remote get-url origin
    echo ""
    read -p "Push to existing remote? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "Please run: git remote remove origin"
        exit 1
    fi
else
    echo "No remote repository configured."
    echo ""
    echo "Please create a new repository on GitHub first:"
    echo "  https://github.com/new"
    echo ""
    echo "Then run this command and paste the URL when prompted:"
    echo ""
    read -p "Repository URL: " repo_url
    
    if [ -z "$repo_url" ]; then
        echo "Error: Repository URL is required"
        exit 1
    fi
    
    git remote add origin "$repo_url"
fi

echo ""
echo "Pushing to GitHub..."
echo ""

# 推送
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Success! ==="
    echo "Repository: $(git remote get-url origin)"
    echo ""
    echo "Next steps:"
    echo "1. Open GitHub repository"
    echo "2. Click 'Code' -> 'Codespaces' -> 'New codespace'"
    echo "3. Wait for environment to start"
    echo "4. Run: cd FFmpegKitPlugin_full && ./gradlew assembleDebug"
    echo "5. Download APK and rename to .dex"
    echo "6. Push to device: adb push FFmpegMerge.dex /sdcard/ffmpeg_plugin/"
else
    echo ""
    echo "Push failed. Please check:"
    echo "1. Internet connection"
    echo "2. GitHub credentials (use Personal Access Token, not password)"
    echo "3. Repository URL is correct"
    exit 1
fi
