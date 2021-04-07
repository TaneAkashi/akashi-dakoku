import puppeteer, { LaunchOptions } from 'puppeteer';
import * as core from 'akashi-dakoku-core';

export type Options = {
  puppeteerOptions?: LaunchOptions;
} & core.Options;

const initialOptions: Options = {
  username: '',
  password: '',
  company: '',
  puppeteerOptions: {},
};

const dakoku = async (options: Options, mode: keyof ReturnType<typeof core.dakoku>): Promise<core.Result> => {
  const { puppeteerOptions, ...coreOptions } = {
    ...initialOptions,
    ...options,
    puppeteerOptions: {
      ...initialOptions.puppeteerOptions,
      ...options.puppeteerOptions,
    },
  };

  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  const func = core.dakoku(page)[mode];
  return func(coreOptions);
};

export const startWork = (options: Options): Promise<core.Result> => dakoku(options, 'startWork');
export const startTelework = (options: Options): Promise<core.Result> => dakoku(options, 'startTelework');
export const finishWork = (options: Options): Promise<core.Result> => dakoku(options, 'finishWork');
export const startWorkDirectly = (options: Options): Promise<core.Result> => dakoku(options, 'startWorkDirectly');
export const finishWorkDirectly = (options: Options): Promise<core.Result> => dakoku(options, 'finishWorkDirectly');
export const pauseWork = (options: Options): Promise<core.Result> => dakoku(options, 'pauseWork');
export const restartWork = (options: Options): Promise<core.Result> => dakoku(options, 'restartWork');

export const checkLogin = async (options: Options): Promise<boolean> => {
  const { puppeteerOptions, ...coreOptions } = {
    ...initialOptions,
    ...options,
    puppeteerOptions: {
      ...initialOptions.puppeteerOptions,
      ...options.puppeteerOptions,
    },
  };

  const browser = await puppeteer.launch(puppeteerOptions);
  const page = await browser.newPage();
  return core.checkLogin(page)(coreOptions);
};
