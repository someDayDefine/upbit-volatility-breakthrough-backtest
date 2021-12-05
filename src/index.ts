import axios from 'axios';
import XLSX from 'xlsx';

const isDays = process.env.UNIT === 'days';
const is400 = process.env.UNIT === '400';
const coin = process.env.COIN || 'KRW-BTC';

const EXCEL_NAME = `backtest-${coin}.xlsx`;
const EXECL_PATH = `./${EXCEL_NAME}`;
const FOR_HOURS_API_PATH = '/minutes/240';
const DAYS_API_PATH = '/days';

const K = 0.5;

interface IData {
  market: string; // 'KRW-BTC',
  candle_date_time_utc: string; // '2021-11-02T04:00:00',
  candle_date_time_kst: string; // '2021-11-02T13:00:00',
  opening_price: number; // 72458000,
  high_price: number; // 73096000,
  low_price: number; // 72401000,
  trade_price: number; // 72815000,
  timestamp: number; // 1635839999149,
  candle_acc_trade_price: number; // 68165683106.96257,
  candle_acc_trade_volume: number; // 936.25558451,
  unit: number; // 240
  range: number;
  target_value: number;
  drr: number;
  crr: number;
}

let count = 0;

const caculateReverDatas = (datas: IData[]) => {
  datas.sort((a, b) => Number(new Date(a.candle_date_time_utc)) - Number(new Date(b.candle_date_time_utc)));

  for (let i = 0; i < datas.length; i++) {
    if (i === 0) {
      datas[0].range = datas[0].high_price - datas[0].low_price;
      datas[0].target_value = 0;
      datas[0].drr = 0;
      datas[0].crr = 0;
    } else {
      datas[i].range = datas[i].high_price - datas[i].low_price;
      datas[i].target_value = datas[i].opening_price + datas[i - 1].range * K;
      datas[i].drr =
        datas[i].high_price > datas[i].target_value
          ? datas[i].trade_price / 1.0005 / (datas[i].target_value * 1.0005) - 1
          : 0;
      datas[i].crr = datas[i].drr !== 0 ? (datas[i - 1].crr + 1) * (1 + datas[i].drr) - 1 : datas[i - 1].crr;
    }
  }
};

const recursiveRetriveCandles: (lastTime?: string) => Promise<IData[] | undefined> = async (lastTime) => {
  try {
    const response = await axios.get<IData[] | undefined>(
      `https://api.upbit.com/v1/candles${
        isDays || is400 ? DAYS_API_PATH : FOR_HOURS_API_PATH
      }?market=${coin}&count=200${lastTime ? `&to=${lastTime}` : ''}`
    );

    if (!response.data || response.data.length === 0) {
      console.log('추가 데이터가 없으므로 끝냄');
      return undefined;
    }

    if (count === (isDays ? 9 : is400 ? 2 : 36)) {
      // 1일봉은 200개씩 9번, 4시간봉은 200개씩 36번
      return response.data;
    }

    // 1초에 10번 call 제한이 있음. 10번마다 1초씩 쉬어주자
    if (count > 0 && count % 8 === 0) {
      await new Promise((res) => {
        setTimeout(() => {
          console.log('1초 쉬고');
          res(undefined);
        }, 1000);
      });
    }

    count++;

    let responseData = undefined;
    if (response.data.length === 200) {
      console.log(response.data[response.data.length - 1].candle_date_time_utc);
      responseData = await recursiveRetriveCandles(response.data[response.data.length - 1].candle_date_time_utc + 'Z');
    } else {
      console.log('추가 데이터가 없으므로 끝냄');
    }

    return responseData ? response.data.concat(responseData) : response.data;
  } catch (e: any) {
    console.log('에러!!!\n' + e);
    console.log('e ' + e.config);
  }
};

const exportExcel = async (datas: IData[]) => {
  let wb: XLSX.WorkBook | undefined = undefined;
  try {
    wb = XLSX.readFile(EXECL_PATH);
  } catch (e) {
    wb = XLSX.utils.book_new();
  }

  const newWorksheet = XLSX.utils.json_to_sheet(datas);

  XLSX.utils.book_append_sheet(wb, newWorksheet, isDays ? '1days' : is400 ? '400day' : '4hours');
  XLSX.writeFile(wb, EXCEL_NAME);
};

(async () => {
  const result = await recursiveRetriveCandles();
  if (result) {
    caculateReverDatas(result);

    console.log('데이터 마이닝 완료. 엑셀 작성');
    exportExcel(result);
  } else {
    console.log('error!!! no datas!!');
  }
})();
