import puppeteer, { LaunchOptions } from 'puppeteer';

export type Options = {
  username: string;
  password: string;
  company: string;
  puppeteerOptions: LaunchOptions;
};
export type Mode = 'attendance' | 'leaving' | 'direct_advance' | 'direct_return' | 'break_begin' | 'break_end';

export type Result = {
  status: string;
  note: string;
  telework?: string;
}

const initialOptions: Options = {
  username: '',
  password: '',
  company: '',
  puppeteerOptions: {},
};

const dakoku = async (options: Partial<Options>, mode: Mode, telework: Boolean = false): Promise<Result> => {
  const { username, password, company, puppeteerOptions } = {
    ...initialOptions,
    ...options,
    puppeteerOptions: {
      ...initialOptions.puppeteerOptions,
      ...options.puppeteerOptions,
    },
  };

  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();

  await page.emulate({
    viewport: {
      width: 1402,
      height: 740,
    },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36',
  });
  await page.goto('https://atnd.ak4.jp/login', {
    waitUntil: 'domcontentloaded',
  });

  await page.type('#form_login_id', username);
  await page.type('#form_password', password);
  await page.type('#form_company_id', company);
  await page.click('input[type="submit"]');
  await page.waitForNavigation();
  await page.goto('https://atnd.ak4.jp/mypage/punch', {
    waitUntil: 'domcontentloaded',
  });
  
  await page.click(`a[data-punch-type="${mode}"]`);
  await page.waitForSelector('div[data-modal-id="embossing"].is-show');
  const $status = await page.$('.p-embossing-modal__status');
  const status = await page.evaluate(element => element.textContent, $status);
  const $note = await page.$('.p-embossing-modal__alert__note:last-child');
  const note = await page.evaluate(element => element.textContent, $note);
  await page.click('div[data-modal-id="embossing"] .modal-button-area > div');

  const response: Result = { status, note };

  if (telework) {
    const $button = await page.$('#telework-switch > button');
    const button = await page.evaluate(element => element.textContent, $status);

    if (button === 'テレワークを開始する') {
      await page.click('#telework-switch > button');
      await page.waitForSelector('div.p-toast--runtime.is-show');
      const $status = await page.$('div.p-toast--runtime.is-show');
      const status = await page.evaluate(element => element.textContent, $status);
      response.telework = status;
    } else {
      response.telework = '既にテレワークを開始しています';
    }
  }

  return response;
};

export const startWork = (options: Partial<Options>): Promise<Result> => dakoku(options, 'attendance');
export const startTelework = (options: Partial<Options>): Promise<Result> => dakoku(options, 'attendance', true);
export const finishWork = (options: Partial<Options>): Promise<Result> => dakoku(options, 'leaving');
export const startWorkDirectly = (options: Partial<Options>): Promise<Result> => dakoku(options, 'direct_advance');
export const finishWorkDirectly = (options: Partial<Options>): Promise<Result> => dakoku(options, 'direct_return');
export const pauseWork = (options: Partial<Options>): Promise<Result> => dakoku(options, 'break_begin');
export const restartWork = (options: Partial<Options>): Promise<Result> => dakoku(options, 'break_end');
