# akashi-dakoku

AKASHI 打刻ライブラリ

### インストール

```bash
yarn add akashi-dakoku
```


## 使い方

```js
const dakoku = require('akashi-dakoku');

const params = {
  username: USERNAME,
  password: PASSWORD,
  company: COMPANY_ID,
  puppeteerOptions: PUPPETEER_OPTIONS,
};

// 出勤打刻
await dakoku.startWork(params);

// 出勤打刻・テレワーク開始
await dakoku.startTelework(params);

// 退勤打刻
await dakoku.finishWork(params);

// 直行打刻
await dakoku.startWorkDirectly(params);

// 直帰打刻
await dakoku.finishWorkDirectly(params);

// 休憩開始
await dakoku.pauseWork(params);

// 休憩終了
await dakoku.restartWork(params);

// 例
// * note に何が入るかわかりません
// { status: '出勤', note: '' }
// { status: '休憩入り', note: '' }
```
