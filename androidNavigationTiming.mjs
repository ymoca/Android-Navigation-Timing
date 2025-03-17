import { _android } from 'playwright-core'; // playwright-coreモジュールのインポート
import { promises as fs } from 'fs';        // fsモジュールのインポート
import { format } from 'date-fns';          // date-fnsモジュールのインポート

(async() => {
  // 定数定義
  const TARGET_URL = 'https://developer.chrome.com'; // 測定対象URL
  const DATETIME_FORMAT = 'yyyyMMdd-HHmmss';  // 出力時の日時フォーマット

  // 端末一覧を取得
  const deviceList = await _android.devices();

  if(deviceList.length === 0) {
    // デバイス未接続の場合
    console.log('No Android devices found.');
    return;
  } else {
    // 端末接続ありの場合

    // 保存ファイル名を生成
    const regrex = /https?:\/\//g;
    const prefix = TARGET_URL.replaceAll(regrex,'').replaceAll('/','_');  // TARGET_URLからプレフィクス生成
    const datetime = format(new Date(), DATETIME_FORMAT);                   // 実行時刻をフォーマット
    const filename = prefix + '_' + datetime;

    // ToDo: 複数端末接続時の挙動
    // 1台目の端末に接続
    let device = deviceList[0];

    // 端末のモデル名とシリアル番号を取得
    let deviceName = await device.model() + '_' + device.serial();
    console.log('Android device ' + deviceName + ' connected.');

    // ブラウザの立ち上げ及び測定対象URLへの接続
    let context = await device.launchBrowser();
    let page = await context.newPage();
    await page.goto(TARGET_URL);

    // 測定対象URLのNavigation Timingを取得
    let navigationTiming = await page.evaluate(() => 
      JSON.stringify(performance.getEntriesByType('navigation'))
    );

    // Navigation Timingを出力(参考)
    // console.log(navigationTiming);

    // 何かに使えるかもしれないのでAndroidのTelephony関連のダンプを出力
    let telephonyInfo = device.shell('dumpsys telephony.registry');
    await fs.writeFile(deviceName + '_' + filename + '_Telephony.txt', (await telephonyInfo).toString());
    // 何かに使えるかもしれないのでAndroidのLocation関連のダンプを出力
    let locationInfo = device.shell('dumpsys location');
    await fs.writeFile(deviceName + '_' + filename + '_Location.txt', (await locationInfo).toString());

    // Navigation TimingのJSONとスクリーンショットを出力
    await fs.writeFile(deviceName + '_' + filename + '_NavigationTiming.json', navigationTiming);
    await device.screenshot({ path: deviceName + '_' + filename + '_ScreenShot.png' });

    // 開いたタブを閉じる
    await page.close();
    
    // 端末とのコネクションを切断
    await context.close();
    await device.close();
  }
})();
