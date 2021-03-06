// @flow
import React from 'react';
import Layer from 'grommet/components/Layer';
import theme from './Error.css';

const errors = [
  <blockquote className={theme.flamboyantError}>
    <br />
    Flamboyant System Error
    <br />
    <br />
    3rd Qtr. Projection= Bad News
  </blockquote>,
  <blockquote className={theme.flagrantError}>
    FLAGRANT SYSTEM ERROR
    <br />
    <br />
    Computer over.
    <br />
    Virus = Very Yes.
  </blockquote>,
  <blockquote className={theme.flagrantError}>
    FLAGRANT SYSTEM ERROR <br /> <br />
    The system is down. I dunno what <br />
    you did, moron, but you sure <br />
    screwed everything up good.
  </blockquote>,
  <blockquote className={theme.fakeFlagrantError}>
    FRAGRANT SYSTEM ERROR
    <br />Your brand new computer is bloke.
    <br />Please prepare to wait on hold
    <br />with tech support for several hours.
    <br />The current tech support smugness
    <br />level is RED.
  </blockquote>,
  <blockquote className={theme.tsond}>
    <div className={theme.tsondDialog}>
      <div className={theme.ohChild}>
        <big>
          <img alt="no" src="http://www.hrwiki.org/w/images/thumb/5/51/NO_symbol_red_w-gray.png/50px-NO_symbol_red_w-gray.png" width="50" height="50" />
          <b> Oh, Child!</b>
          <img alt="warning" src="http://www.hrwiki.org/w/images/thumb/3/3a/warning_symbol_yellow_w-gray.png/50px-warning_symbol_yellow_w-gray.png" width="50" height="47" />
        </big>
        <br />It{"'"}s the Teal Screen<br />&nbsp;of Near Death! (TSoND)&nbsp;
      </div>
    </div>
  </blockquote>,
];

function nextIndex(error: ?number): number {
  let r = Math.round(Math.random() * (errors.length - 1));
  while (r === error) {
    r = Math.round(Math.random() * (errors.length - 1));
  }
  return r;
}

class Error extends React.PureComponent {
  props: {
    display: ?string,
    onClose: () => void,
  };

  index: number = 0;
  render() {
    this.index = nextIndex(this.index);
    return (<div>
      <Layer
        hidden={this.props.display == null}
        align="center"
        closer
        flush
        onClose={this.props.onClose}
      >
        <div className={theme.error}>
          {errors[this.index]}
          <p className={theme.description}>
            {this.props.display}
          </p>
        </div>
      </Layer>
    </div>);
  }
}

export function error(that) {
  return (<Error
    display={that.state.error}
    onClose={() => that.setState({ error: null })}
  />);
}

export default function ErrorMaker() {
  return (<Error
    display={this.state.error}
    onClose={() => this.setState({ error: null })}
  />);
}
