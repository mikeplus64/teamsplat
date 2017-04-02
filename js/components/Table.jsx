// eslint react/no-array-index-key: "off"
/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import Distribution from 'grommet/components/Distribution';
import Legend from 'grommet/components/Legend';
import Label from 'grommet/components/Label';
import EditIcon from 'grommet/components/icons/base/Edit';
import Actions from 'grommet/components/icons/base/Menu';
import Button from 'grommet/components/Button';
import Menu from 'grommet/components/Menu';
import Anchor from 'grommet/components/Anchor';
import Tile from 'grommet/components/Tile';
import Tiles from 'grommet/components/Tiles';
import Box from 'grommet/components/Box';
import { Set } from 'immutable';
import type { EditorState, DispatchD, MapsState, Stats, Rating } from '../types';
import { getMaps, viewTable } from '../actions';
import findBestTeams, { makeSeries } from '../teams';
import Editor from './Editor.jsx';
import Player from './Player.jsx';
import theme from './Editor.css';

const eloMax: number = 3000;
const eloMin: number = 0;
const defaultElo: number = 1600;

function nice(x: number): number {
  return Math.floor(x * 10) / 10;
}


const nothing = [];

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
          <img src="http://www.hrwiki.org/w/images/thumb/5/51/NO_symbol_red_w-gray.png/50px-NO_symbol_red_w-gray.png" width="50" height="50" />
          <b> Oh, Child!</b>
          <img src="http://www.hrwiki.org/w/images/thumb/3/3a/warning_symbol_yellow_w-gray.png/50px-warning_symbol_yellow_w-gray.png" width="50" height="47" />
        </big>
        <br />It's the Teal Screen<br />&nbsp;of Near Death! (TSoND)&nbsp;
      </div>
    </div>
  </blockquote>,
];

function chooseErrorIndex(error: number): number {
  let r = Math.round(Math.random() * (errors.length - 1));
  while (r === error) {
    r = Math.round(Math.random() * (errors.length - 1));
  }
  return r;
}

class Table extends React.PureComponent {
  props: {
    dispatch: DispatchD,
    maps: MapsState,
    players: Set<string>,
    editor: EditorState,
    params: { name: string },
  };

  state: {
    map: ?string,
    teams: ?[Stats<Rating>, Stats<Rating>],
    error: number,
    clicked: boolean,
  } = {
    map: null,
    teams: null,
    clicked: false,
    error: 0,
  };

  componentWillMount() {
    this.props.dispatch(getMaps);
    this.props.dispatch(viewTable(this.props.params.name));
  }

  getRatings(map: string): Rating[] {
    const r: Rating[] = [];
    const { players, editor: { table } } = this.props;
    players.forEach((who) => {
      const elo = table.getIn([who, map]) || defaultElo;
      r.push({ elo, who, map });
    });
    return r;
  }

  clickMap(map: string) {
    return () => {
      this.setState({ map });
    };
  }

  teams() {
    const { clicked, error, teams } = this.state;
    if (teams != null) {
      const [t1, t2] = teams;
      const seriesT1 = t1 ? makeSeries(t1) : nothing;
      const seriesT2 = t2 ? makeSeries(t2) : nothing;
      if (seriesT2.length === 0 || seriesT1.length === 0) {
        return clicked ? errors[error] : null;
      }
      return (
        <table id="teams" style={{ width: '100%', height: '240px' }}>
          <thead>
            <tr>
              <th style={{ width: '5%' }}></th>
              <th style={{ width: '35%' }}>Team 1</th>
              <th style={{ width: '20%' }}></th>
              <th style={{ width: '35%' }}>Team 2</th>
              <th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td>
                <div id="t1-g">
                  <Legend series={seriesT1} total />
                  <Distribution className={theme.distrib} series={seriesT1} />
                </div>
              </td>
              <td className={theme.vs}><b>VS</b></td>
              <td>
                <div id="t2-g">
                  <Legend series={seriesT2} total />
                  <Distribution className={theme.distrib} series={seriesT2} />
                </div>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      );
    }
    return clicked ? errors[error] : null;
  }

  teamsScroll() {
    return (
      <div>
        {this.teams()}
      </div>
    );
  }

  mapMenu() {
    return (
      <div>
        <Menu
          label={this.state.map || 'Map'}
          inline={false}
          icon={<Actions />}
        >
          {this.props.maps.types.map(m =>
            <Anchor
              key={'map-type-' + m}
              label={m}
              onClick={this.clickMap(m)}
            />)}
        </Menu>
        <Button
          label="Generate"
          primary
          onClick={() => {
            const map = this.state.map;
            let teams = null;
            if (map != null) {
              teams = findBestTeams(this.getRatings(map), 'total');
            }
            this.setState(s => ({
              clicked: true,
              teams,
              error: chooseErrorIndex(s.error),
            }));
          }}
        />
        {this.teamsScroll()}
      </div>
    );
  }

  commas() {
    const { players } = this.props;
    const array = players.toArray();
    const r = [];
    for (let i = 0; i < array.length - 1; i += 1) {
      const a = array[i];
      r.push(<i key={`i-${a}`}>{a}</i>);
      r.push(', ');
    }
    if (array.length > 1) {
      const a = array[array.length - 1];
      r.push('and ');
      r.push(<i key={`i-${a}`}>{a}</i>);
    }
    return r;
  }

  render() {
    return (<div>
      <h2> Ratings </h2>
      <Editor />
      <h2> Generate teams </h2>
      <p>
        <b> Selected players: </b>
        {this.commas()}
      </p>
      {this.mapMenu()}
    </div>);
  }
}

export default connect(
  (s, { params: { name } }) => ({
    editor: s.editor,
    maps: s.maps,
    players: s.players.get(name) || new Set(),
  }),
)(Table);
