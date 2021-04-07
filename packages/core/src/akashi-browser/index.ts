import type { Page } from 'puppeteer';
import type { Page as PageCore } from 'puppeteer-core';

export type Options = {
  username: string;
  password: string;
  company: string;
};

export type Mode = 'attendance' | 'leaving' | 'direct_advance' | 'direct_return' | 'break_begin' | 'break_end';

export type Result = {
  status: string;
  note: string;
  telework?: string;
};

const initialOptions: Options = {
  username: '',
  password: '',
  company: '',
};

const login = (page: Page | PageCore) => async (username: string, password: string, company: string): Promise<void> => {
  await page.goto('https://atnd.ak4.jp/login', {
    waitUntil: 'domcontentloaded',
  });

  await page.type('#form_login_id', username);
  await page.type('#form_password', password);
  await page.type('#form_company_id', company);
  await page.click('input[type="submit"]');
  await page.waitForNavigation();

  // ログインに成功すると /manager に遷移する
  // ログインに失敗すると /login に遷移する
  // ログインに失敗しても、空白以外は特にメッセージが出ないため、決め打ちのテキストにしている
  if (page.url() !== 'https://atnd.ak4.jp/manager') {
    throw new Error('ログインに失敗しました');
  }
};

const core = (page: Page | PageCore) => async (options: Options, mode: Mode, telework = false): Promise<Result> => {
  const { username, password, company } = {
    ...initialOptions,
    ...options,
  };

  await page.emulate({
    viewport: {
      width: 1402,
      height: 740,
    },
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
  });

  await login(page)(username, password, company);

  await page.goto('https://atnd.ak4.jp/mypage/punch', {
    waitUntil: 'domcontentloaded',
  });

  await page.click('#sound-switch [title="打刻音OFF"]');
  await page.click(`a[data-punch-type="${mode}"]`);
  await page.waitForSelector('div[data-modal-id="embossing"].is-show');
  const $status = await page.$('.p-embossing-modal__status');
  const status = await page.evaluate((element) => element.textContent, $status as any);
  const $note = await page.$('.p-embossing-modal__alert__note:last-child');
  const note = await page.evaluate((element) => element.textContent, $note as any);
  await page.click('div[data-modal-id="embossing"] .modal-button-area > div');

  const response: Result = { status, note };

  if (telework) {
    const $button = await page.$('#telework-switch > button');
    const button = await page.evaluate((element) => element.textContent, $button as any);

    if (button === 'テレワークを開始する') {
      await page.click('#telework-switch > button');
      await page.waitForSelector('div.p-toast--runtime.is-show');
      const $status = await page.$('div.p-toast--runtime.is-show');
      const status = await page.evaluate((element) => element.textContent, $status as any);
      response.telework = status;
    } else {
      response.telework = '既にテレワークを開始しています';
    }
  }

  await page.close();

  return response;
};

export const dakoku = (
  page: Page | PageCore
): {
  startWork: (options: Options) => Promise<Result>;
  startTelework: (options: Options) => Promise<Result>;
  finishWork: (options: Options) => Promise<Result>;
  startWorkDirectly: (options: Options) => Promise<Result>;
  finishWorkDirectly: (options: Options) => Promise<Result>;
  pauseWork: (options: Options) => Promise<Result>;
  restartWork: (options: Options) => Promise<Result>;
} => ({
  startWork: (options) => core(page)(options, 'attendance'),
  startTelework: (options) => core(page)(options, 'attendance', true),
  finishWork: (options) => core(page)(options, 'leaving'),
  startWorkDirectly: (options) => core(page)(options, 'direct_advance'),
  finishWorkDirectly: (options) => core(page)(options, 'direct_return'),
  pauseWork: (options) => core(page)(options, 'break_begin'),
  restartWork: (options) => core(page)(options, 'break_end'),
});
