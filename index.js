const puppeteer = require('puppeteer'); // Helps to cast magic on browser
require('dotenv').config(); // Helps to load secret env file

// Fetch Insta ID
const {
  INSTA_USERNAME,
  INSTA_PASSWORD,
  INSTA_ID,
} = process.env;

(async () => {
  const likedUsersDetails = [];
  let likeList = [];

  const updateLikeList = async like => new Promise(
    ((resolve) => {
      console.log(like);
      like.forEach((uname, index) => {
        const userDetail = likedUsersDetails.find(user => user.name === uname);
        if (userDetail) {
          userDetail.count += 1;
        } else {
          console.log(`New user liked: ${uname}`);
          likedUsersDetails.push({ name: uname, count: 1 });
        }
        if (index === like.length - 1) {
          console.log(likedUsersDetails);
          resolve('sdaf');
        }
      });
    }),
  );
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1280,1000'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });

  // Go to Insta login page
  await page.goto('https://instagram.com/accounts/login', {
    waitUntil: 'networkidle0',
  });

  // Check if atleast one input tag is loaded
  await page.waitFor(() => document.querySelectorAll('input').length);

  // Automagically type creds and login
  await page.type('[name=username]', INSTA_USERNAME);
  await page.type('[name=password]', INSTA_PASSWORD);
  await page.evaluate(() => {
    document.querySelector('.L3NKy').click();
  });
  await page.waitForNavigation();

  // Go to Insta login page
  await page.goto(`https://instagram.com/${INSTA_ID}`, {
    waitUntil: 'networkidle0',
  });

  // eLApa is Insta photo className in grid
  const postAvailable = await page.evaluate(() => !!(document.getElementsByClassName('eLAPa').length));
  if (!postAvailable) {
    console.log(`${INSTA_ID} : Private account (or) No posts available`);
    await browser.close();
    process.exit(0);
  }

  // Open first post
  await page.evaluate(() => {
    const posts = document.getElementsByClassName('eLAPa');
    posts[0].click();
  });
  // Wait for first post modal to load
  // ckWGn is close button class
  await page.waitForSelector('button.ckWGn');

  // Open liked ppl list
  let likeCount = 0;
  await page.evaluate(() => {
    if (!document.querySelector('div.HbPOm > span.vcOH2')) {
      likeCount = parseInt(
        (document.querySelector('div.HbPOm > button.oF4XW.sqdOP.yWX7d > span').innerText).replace(/,/g, ''),
        10,
      );
      document.querySelector('div.HbPOm > button.oF4XW.sqdOP.yWX7d').click();
    } else {
      console.log('Video post');
    }
  });
  await page.waitForSelector('div.d7ByH > a.FPmhX');
  // Debug logs
  page.on('console', consoleObj => console.log(consoleObj._text));
  await page.evaluate(() => {
    let likeListInsidePage = [];
    const scrollLikeList = setInterval(() => {
      const scrollableSection = document.querySelector('div.wwxN2.IpsJq');
      scrollableSection.scrollTop += 9999999999999999;
      likeListInsidePage = Array.prototype.slice.call(document.querySelectorAll('div.d7ByH > a.FPmhX'));
      console.log(`${likeListInsidePage.length} ${likeCount}`);
      if (likeListInsidePage.length === likeCount) {
        clearInterval(scrollLikeList);
        console.log('completed');
        scrollableSection.className += ' likeScrollCompleted';
      }
    }, 200);
  });
  await page.waitForSelector('div.likeScrollCompleted', 0);
  likeList = await page.evaluate(() => Array.prototype.slice.call(document.querySelectorAll('div.d7ByH > a.FPmhX')).map(ele => ele.innerHTML));
  // likeList = [{ name: 'sadf' }, { name: 'sadffads' }];
  await updateLikeList(likeList);
})();
