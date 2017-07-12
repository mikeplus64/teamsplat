// @flow
import keys from 'lodash/keys';

window.funcounter = 0;

let inactive: boolean = false;
let havingFun: boolean = false;
let funzone;

window.onfocus = () => {
  inactive = false;
  window.funcounter = 0;
};

window.onblur = () => {
  inactive = true;
  window.funcounter = 0;
};

const songs = {
  lotto: 'https://www.youtube.com/embed/n52tm3kjqgQ',
  dollDance: 'https://www.youtube.com/embed/yiWgQ1b4SsM',
  systemOfSurvival: 'https://www.youtube.com/embed/S7tgnjB9okw',
};

const names: string[] = keys(songs);

function choose(): string {
  const min = Math.floor(new Date().getMinutes() / 2);
  const ix = names[min % names.length];
  return songs[ix];
}

function fun(youtube) {
  funzone = document.getElementById('funzone');
  if (funzone && !havingFun) {
    havingFun = true;
    funzone.innerHTML = (
      `<iframe id="yt" width="560" height="315" src="${youtube}?autoplay=1&enablejsapi=1" frameborder="0"></iframe>`
    );
    setTimeout(() => {
      if (funzone) {
        funzone.style.display = 'none';
      }
    }, 6000);
  }
}

setInterval(() => {
  if (inactive) {
    window.funcounter += 1;
    // console.log('inactive', window.funcounter);
  }
  if (window.funcounter > 1440) {
    fun(choose());
  }
}, 1000);
