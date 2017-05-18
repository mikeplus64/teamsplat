// @flow
import { keys } from 'lodash';
import html2canvas from 'html2canvas';

window.html2canvas = html2canvas;
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

function screenfun() {
  const body: ?HTMLElement = document.getElementById('app');
  if (body != null) {
    return html2canvas(body).then((canvas) => {
      window.canvas = canvas;
      if (document.body) {
        document.body.style.overflow = 'hidden';
      }
      const context = canvas.getContext('2d');
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      body.replaceWith(canvas);
      return {
        canvas,
        context,
        image,
      };
    });
  }
  return Promise.reject('cant make canvas body');
}

function warp() {
  screenfun().then(({ canvas, context, image }) => {
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    canvas.style.transition = '2s';
    canvas.style.margin = 'auto auto';
    setTimeout(() => {
      canvas.style.width = '0px';
      canvas.style.height = '0px';
    }, 150);
  });
}

window.warp = warp;
