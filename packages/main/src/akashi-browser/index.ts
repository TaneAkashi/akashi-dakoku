import puppeteer, { LaunchOptions } from 'puppeteer';
import core from 'akashi-dakoku-core';

export type Options = {
  puppeteerOptions?: LaunchOptions;
} & core.Options;

const initialOptions: Options = {
  username: '',
  password: '',
  company: '',
  puppeteerOptions: {},
};

const dakoku = async (options: Options, mode: core.Mode, telework: Boolean = false): Promise<core.Result> => {
  const { puppeteerOptions, ...coreOptions } = {
    ...initialOptions,
    ...options,
    puppeteerOptions: {
      ...initialOptions.puppeteerOptions,
      ...options.puppeteerOptions,
    },
  };

  const browser = await puppeteer.launch(puppeteerOptions);
  return core.dakoku(browser)(coreOptions, mode, telework);
};

export const startWork = (options: Options): Promise<core.Result> => dakoku(options, 'attendance');
export const startTelework = (options: Options): Promise<core.Result> => dakoku(options, 'attendance', true);
export const finishWork = (options: Options): Promise<core.Result> => dakoku(options, 'leaving');
export const startWorkDirectly = (options: Options): Promise<core.Result> => dakoku(options, 'direct_advance');
export const finishWorkDirectly = (options: Options): Promise<core.Result> => dakoku(options, 'direct_return');
export const pauseWork = (options: Options): Promise<core.Result> => dakoku(options, 'break_begin');
export const restartWork = (options: Options): Promise<core.Result> => dakoku(options, 'break_end');
