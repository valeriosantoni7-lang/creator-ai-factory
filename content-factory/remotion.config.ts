import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// If Remotion's own headless browser does not start on your machine, point it to
// your installed Chrome, e.g. CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if (process.env.CHROME_PATH) {
  Config.setBrowserExecutable(process.env.CHROME_PATH);
  Config.setChromeMode("chrome-for-testing");
}
