// @flow
import { keys } from 'lodash';

window.funcounter = 0;

let inactive: boolean = false;
let havingFun: boolean = false;

const funzone = document.getElementById('funzone');

window.onfocus = () => {
  inactive = false;
  window.funcounter = 0;
};

window.onblur = () => {
  inactive = true;
  havingFun = false;
  funzone.innerHTML = '';
};

const songs = {
  lotto: 'https://www.youtube.com/embed/n52tm3kjqgQ',
  electric: 'https://www.youtube.com/embed/w323VoKky1Q',
  dollDance: 'https://www.youtube.com/embed/yiWgQ1b4SsM',
  discoShuffle: 'https://www.youtube.com/embed/NGggrr89VnA',
  shaft2: 'https://www.youtube.com/embed/FS8K9bTr_jc',
  lotto2: 'https://www.youtube.com/embed/n52tm3kjqgQ',
  quicksand: 'https://www.youtube.com/embed/pIHWJSIgRQI',
  eightyeight: 'https://www.youtube.com/embed/hn7WRJJnYJ0',
  adentro: 'https://www.youtube.com/embed/DqtcjI1_k2o',
  lotto3: 'https://www.youtube.com/embed/n52tm3kjqgQ',
};

const names: string[] = keys(songs);

function choose(): string {
  const min = Math.floor(new Date().getMinutes() / 2);
  const ix = names[min % names.length];
  return songs[ix];
}

function fun(youtube) {
  if (funzone && !havingFun) {
    havingFun = true;
    funzone.innerHTML = (
      `<iframe id="yt" width="560" height="315" src="${youtube}?autoplay=1&enablejsapi=1" frameborder="0"></iframe>`
    );
    setTimeout(() => {
      funzone.style.display = 'none';
    }, 6000);
  }
}

setInterval(() => {
  if (inactive) {
    window.funcounter += 1;
    // console.log('inactive', window.funcounter);
  }
  if (window.funcounter > 720) {
    fun(choose());
  }
}, 1000);
