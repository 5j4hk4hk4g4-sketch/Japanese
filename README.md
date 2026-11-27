# 東京初日（Tokyo Day 1）— JLPT N5 情境日語 RPG

Mobile-first、完全離線可玩（PWA）的 JLPT N5 實戰對話 RPG 小遊戲。

- 線上遊玩（GitHub Pages）：https://5j4hk4hk4g4-sketch.github.io/Japanese/

## 特色玩法
- **三大實戰關卡**（共 26 個對話節點）：
  1. **飯店 Check-in**（訂房確認、入住手續、寄放行李、`〜をお願いします`、`〜から〜まで`）
  2. **藥妝店採買**（詢問商品、個數詞 `ひとつ・ふたつ`、免稅與信用卡、`〜てもいいですか`）
  3. **車站問路實戰**（方向指引、步行時間、助詞 `で` vs `に` 精準辨析、`〜てください`）
- **三種混合挑戰**：聽力回應（支援純聽力盲聽模式）、語塊組句、助詞／量詞填空。
- **點字即查 + 三段振假名切換**：隨時切換 `漢+あ` / `あ` / `漢`，點擊句子詞彙即可開啟迷你字典卡並加入複習。
- **FSRS 錯題特訓道場**：答錯詞彙自動寫入 `localStorage` 排程，到期自動浮現複習。
- **離線真人神經網路日語語音**：預先透過 `edge-tts` 生成 80 條 MP3 並打包進 PWA 快取（支援 0.75x 慢速播放與 Web Speech API 備援）。

## 本機開發指令

```bash
npm install
npm run dev         # 啟動開發伺服器
npm run validate    # 校驗題庫、字典與語法卡引用完整性
npm test            # 執行 Vitest 單元與元件互動測試
npm run build       # 打包正式版 (base = /)
npm run build:pages # 打包 GitHub Pages 子路徑版 (base = /Japanese/)
```

### 重新生成離線語音（選配）

```bash
python -m pip install edge-tts
npm run audio:gen   # 使用 SHA-1 增量快取，只生成新增或修改的台詞
```

## 啟用 GitHub Pages 自動部署

1. Push 到 `main` 分支後，前往 GitHub Repo 的 **Settings → Pages**。
2. **Build and deployment → Source** 選擇 **GitHub Actions**。
3. Actions 跑完 `Deploy to GitHub Pages` 後即可透過 `https://5j4hk4hk4g4-sketch.github.io/Japanese/` 開玩與安裝 PWA。
