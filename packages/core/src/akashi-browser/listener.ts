import type { HTTPResponse, Page } from 'puppeteer';
import type { Page as PageCore } from 'puppeteer-core';

/**
 * レスポンス例
 *
 * {
 *   punch_type: 'attendance',
 *   display_name: '出勤',
 *   server_time: '2021-04-09T01:23:10+09:00',
 *   num_of_alerts: null,
 *   alerts_type: [],
 *   has_overtime_exceeded: null,
 *   errors: {}
 * }
 *
 * {
 *   punch_type: 'break_begin',
 *   display_name: '私用外出開始',
 *   server_time: '2021-04-09T01:28:10+09:00',
 *   num_of_alerts: 35,
 *   alerts_type: [ '打刻忘れ', '休日出勤' ],
 *   has_overtime_exceeded: false,
 *   errors: {}
 * }
 *
 * {
 *   punch_type: 'break_end',
 *   display_name: '私用外出終了',
 *   server_time: '2021-04-09T01:28:13+09:00',
 *   num_of_alerts: 35,
 *   alerts_type: [ '打刻忘れ', '休日出勤' ],
 *   has_overtime_exceeded: false,
 *   errors: {}
 * }
 */
type PunchResponse = {
  punch_type: 'attendance' | 'leaving' | 'direct_advance' | 'direct_return' | 'break_begin' | 'break_end';
  display_name: string;
  server_time: string;
  num_of_alerts: number | null;
  alerts_type: string[];
  has_overtime_exceeded: boolean | null;
  errors: any;
};

let punchResponse: Promise<PunchResponse> | null = null;

export const listenPunchResponse = (page: Page | PageCore): void => {
  page.on('response', (response: HTTPResponse) => {
    if (response.url() === 'https://atnd.ak4.jp/mypage/punch') {
      punchResponse = response.json() as Promise<PunchResponse>;
    }
  });
};

export const getPunchResponse = (): Promise<PunchResponse> | null => {
  return punchResponse;
};
