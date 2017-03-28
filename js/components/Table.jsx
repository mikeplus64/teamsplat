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
import type { EditorState, DispatchD, MapsState } from '../types';
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
    teams: ?[Stat<Rating>, Stat<Rating>]
  } = {
    map: null,
    teams: null,
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
    const teams = this.state.teams;
    if (teams != null) {
      const [t1, t2] = teams;
      const seriesT1 = makeSeries(t1);
      const seriesT2 = makeSeries(t2);
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
                  <Distribution series={seriesT1} />
                </div>
              </td>
              <td className={theme.vs}><b>VS</b></td>
              <td>
                <div id="t2-g">
                  <Legend series={seriesT2} total />
                  <Distribution series={seriesT2} />
                </div>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      );
    }
    return null;
  }

  mapMenu() {
    return (
      <div>
        {this.teams()}
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
            if (map != null) {
              const teams = findBestTeams(this.getRatings(map), 'total');
              this.setState({ teams });
            }
          }}
        />
      </div>
    );
  }

  render() {
    return (<div>
      <h2> Ratings </h2>
      <Editor />
      <h2> Generate teams </h2>
      {this.mapMenu()}
    </div>);
  }
}

export default connect(
  s => ({
    editor: s.editor,
    maps: s.maps,
    players: s.players,
  }),
)(Table);
