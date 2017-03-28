/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import Label from 'grommet/components/Label';
import Button from 'grommet/components/Button';
import Meter from 'grommet/components/Meter';
import AddIcon from 'grommet/components/icons/base/FormAdd';
import RemoveIcon from 'grommet/components/icons/base/FormClose';
import type { Set } from 'immutable';
import type { DispatchD } from '../types';
import theme from './Player.css';

type Props = {
  who: string,
  players: Set<string>,
  dispatch: DispatchD,
  average: number,
  controls: ?boolean,
};

function Player(props: Props) {
  const { players, who, average, controls } = props;
  const has = players.has(who);
  return (
    <div>
      <div className={theme.who}>
        <Label className={theme.whoLabel}> {who} </Label>
        {controls ? <Button
          size="xsmall"
          align="end"
          icon={has ? <RemoveIcon /> : <AddIcon />}
          onClick={() => {
            if (!has) {
              props.dispatch({
                type: 'ADD_PLAYER_TO_TEAMS',
                player: who,
              });
            } else {
              props.dispatch({
                type: 'REMOVE_PLAYER_FROM_TEAMS',
                player: who,
              });
            }
          }}
        /> : null}
      </div>
      <Meter
        size="small"
        className={theme.eloMeter}
        min={0}
        max={3000}
        value={average}
      />
    </div>
  );
}

export default connect((s, { who }) => ({
  players: s.players,
  average: (() => {
    let values = 0;
    const elos = s.editor.table.get(who);
    const sum = elos.reduce((acc, v) => {
      values += 1;
      return acc + v;
    }, 0);
    return sum / values;
  })(),
}))(Player);
