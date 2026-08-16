# 推送到 GitHub 指南

## 方法 1: 使用 GitHub 网页创建仓库（推荐）

### 步骤

1. **打开 GitHub**
   - 访问: https://github.com/new

2. **创建新仓库**
   - Repository name: `ffmpeg-kit-plugin`
   - Description: `EasyClick FFmpegKit video merge plugin`
   - 选择: Public（公开）或 Private（私有）
   - **不要** 勾选 "Initialize this repository with a README"
   - 点击 "Create repository"

3. **获取仓库 URL**
   - 创建后会显示仓库地址，例如：
     ```
     https://github.com/你的用户名/ffmpeg-kit-plugin.git
     ```

4. **本地配置远程仓库**
   ```bash
   cd D:/ec/tengxun
   git remote add origin https://github.com/你的用户名/ffmpeg-kit-plugin.git
   git branch -M main
   git push -u origin main
   ```

5. **如果提示输入用户名/密码**
   - 用户名: 你的 GitHub 用户名
   - 密码: 使用 Personal Access Token（不是 GitHub 密码）
   
   **生成 Token:**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 勾选: `repo` 权限
   - 生成后复制 token

---

## 方法 2: 使用 GitHub CLI（如果已安装）

```bash
# 登录 GitHub
gh auth login

# 创建仓库并推送
gh repo create ffmpeg-kit-plugin --public --source=. --push
```

---

## 方法 3: 使用 Git 图形界面

1. 打开 Git GUI 或 VS Code
2. 设置远程仓库地址
3. 推送代码

---

## 推送后的下一步

1. 打开 GitHub 仓库页面
2. 点击 `Code` → `Codespaces` → `New codespace`
3. 等待环境启动
4. 在终端执行:
   ```bash
   cd FFmpegKitPlugin_full
   ./gradlew assembleDebug
   ```
5. 下载 APK 并重命名为 `.dex`
6. 推送到设备

---

## 项目结构

```
tengxun/
├── FFmpegKitPlugin_full/      # FFmpegKit 插件项目
│   ├── app/
│   │   ├── src/main/java/com/ec/ffmpeg/
│   │   │   └── FFmpegMerge.java
│   │   ├── build.gradle
│   │   └── libs/
│   │       └── ffmpeg-kit.aar
│   ├── build.gradle
│   └── settings.gradle
├── tengxun/src/js/            # EasyClick 脚本
│   ├── _ffmpeg_merge_plugin.js
│   └── ...
└── ...
```
