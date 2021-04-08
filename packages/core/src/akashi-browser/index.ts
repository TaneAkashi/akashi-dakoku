import type { Page } from 'puppeteer';
import type { Page as PageCore } from 'puppeteer-core';
import { getPunchResponse, listenPunchResponse } from './listener';

export type Options = {
  username: string;
  password: string;
  company: string;
};

export type Mode = 'attendance' | 'leaving' | 'direct_advance' | 'direct_return' | 'break_begin' | 'break_end';

export type Result = {
  status: string;
  note: string;
  time: string;
  telework?: string;
};

const initialOptions: Options = {
  username: '',
  password: '',
  company: '',
};

const emulateOptions: Parameters<Page['emulate']>[0] | Parameters<PageCore['emulate']>[0] = {
  viewport: {
    width: 1402,
    height: 740,
  },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
};

const login = (page: Page | PageCore) => async (username: string, password: string, company: string): Promise<void> => {
  // ログイン完了後、打刻ページに遷移させる
  await page.goto('https://atnd.ak4.jp/login?next=%2Fmypage%2Fpunch', {
    waitUntil: 'domcontentloaded',
  });

  await page.type('#form_login_id', username);
  await page.type('#form_password', password);
  await page.type('#form_company_id', company);
  await page.click('input[type="submit"]');
  await page.waitForNavigation();

  if (page.url() !== 'https://atnd.ak4.jp/mypage/punch') {
    // 打刻ページに遷移をしなければログインできていないはずなのでエラー
    throw new Error('ログインに失敗しました');
  }
};

const core = (page: Page | PageCore) => async (options: Options, mode: Mode, telework = false): Promise<Result> => {
  const { username, password, company } = {
    ...initialOptions,
    ...options,
  };

  await page.emulate(emulateOptions);

  await login(page)(username, password, company);

  await page.goto('https://atnd.ak4.jp/mypage/punch', {
    waitUntil: 'domcontentloaded',
  });
  listenPunchResponse(page);

  await page.click('#sound-switch [title="打刻音OFF"]');
  await page.click(`a[data-punch-type="${mode}"]`);
  await page.waitForSelector('div[data-modal-id="embossing"].is-show');
  const res = await getPunchResponse();
  await page.click('div[data-modal-id="embossing"] .modal-button-area > div');

  const response: Result = {
    status: res?.display_name ?? '',
    note: res?.alerts_type.join('/') ?? '',
    time: res?.server_time ?? '',
  };

  if (telework) {
    await page.goto('https://atnd.ak4.jp/mypage/set_telework?val=true');
    const res = await page.evaluate(() => {
      const json = JSON.parse(document.querySelector('body')!.innerText);
      return json as {
        toast: string;
        save_value: 'true' | 'false';
      };
    });
    response.telework = res.toast;
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

export const checkLogin = (page: Page | PageCore) => async (options: Options): Promise<boolean> => {
  const { username, password, company } = {
    ...initialOptions,
    ...options,
  };

  await page.emulate(emulateOptions);

  const result = await login(page)(username, password, company)
    .then(() => true)
    .catch(() => false);
  await page.close();

  return result;
};
