// @flow
import { keys } from 'lodash';

let inactivity: number = 0;
let inactive: boolean = false;
let havingFun: boolean = false;

window.onfocus = () => {
  inactive = false;
  inactivity = 0;
};

window.onblur = () => {
  inactive = true;
};

const songs = {
  lotto: 'https://www.youtube.com/embed/n52tm3kjqgQ',
  electric: 'https://www.youtube.com/watch?v=w323VoKky1Q',
  dollDance: 'https://www.youtube.com/watch?v=yiWgQ1b4SsM',
  discoShuffle: 'https://www.youtube.com/watch?v=NGggrr89VnA',
  shaft2: 'https://www.youtube.com/watch?v=FS8K9bTr_jc',
  quicksand: 'https://www.youtube.com/watch?v=pIHWJSIgRQI',
  eightyeight: 'https://www.youtube.com/watch?v=hn7WRJJnYJ0',
  sicilian: 'https://www.youtube.com/watch?v=XUFJfco3vBY',
  adentro: 'https://www.youtube.com/watch?v=DqtcjI1_k2o',
  duncow: 'https://www.youtube.com/watch?v=7DDAuytA_YY',
};

const names: string[] = keys(songs);

function choose(): string {
  const min = Math.floor(new Date().getMinutes() / 6);
  const ix = min % names.length;
  return songs[names[ix]];
}

function fun(youtube) {
  const funzone = document.getElementById('funzone');
  if (funzone && !havingFun) {
    havingFun = true;
    funzone.innerHTML = (
      `<iframe width="560" height="315" src="${youtube}?autoplay=1" frameborder="0"></iframe>`
    );
    setTimeout(() => {
      funzone.style.display = 'none';
    }, 6000);
  }
}

setInterval(() => {
  if (inactive) {
    inactivity += 1;
  }

  if (inactivity > 60) {
    fun(choose());
  }
}, 1000);
