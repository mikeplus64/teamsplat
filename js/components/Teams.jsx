// @flow
import React from 'react';
import { connect } from 'react-redux';
import Distribution from 'grommet/components/Distribution';
import Legend from 'grommet/components/Legend';
import { makeSeries } from '../teams';
import type { Team } from '../types';
import theme from './Teams.css';

const nothing = [];

export default class Teams extends React.PureComponent {
  props: {
    teams: ?[?Team, ?Team],
    players: string[],
  };

  render() {
    const teams = this.props.teams;
    if (teams != null) {
      const [t1, t2] = teams;
      const seriesT1 = t1 ? makeSeries(t1, 0) : nothing;
      const seriesT2 = t2 ? makeSeries(t2, t2.of.length) : nothing;
      const series = [].concat(seriesT1, seriesT2);
      return (<div>
        <table id="teams" style={{ width: '640px' }}>
          <thead>
            <tr>
              <th style={{ width: '45%' }}>Team 1</th>
              <th style={{ width: '10%' }} />
              <th style={{ width: '45%' }}>Team 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div id="t1-g">
                  <Legend series={seriesT1} total />
                </div>
              </td>
              <td className={theme.vs}><b>VS</b></td>
              <td>
                <div id="t2-g">
                  <Legend series={seriesT2} total />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <Distribution
          style={{ width: '640px', height: '240px' }}
          className={theme.distrib}
          series={series}
        />
        <br />
      </div>);
    }
    return null;
  }
}
