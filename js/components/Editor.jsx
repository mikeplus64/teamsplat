// eslint react/no-array-index-key: "off"
/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'grommet/components/Button';
import Table from 'grommet/components/Table';
import TableRow from 'grommet/components/TableRow';
import TableHeader from 'grommet/components/TableHeader';
import Spinning from 'grommet/components/icons/Spinning';
import Label from 'grommet/components/Label';
import EditIcon from 'grommet/components/icons/base/Edit';
import AddIcon from 'grommet/components/icons/base/FormAdd';
import RemoveIcon from 'grommet/components/icons/base/FormClose';
import { Set } from 'immutable';
import type { EditorState, DispatchD, MapsState } from '../types';
import { setRating } from '../actions';
import theme from './Editor.css';

const eloMax: number = 2800;
const eloMin: number = 1200;
const defaultElo: number = 1600;

class Editor extends React.PureComponent {
  props: {
    dispatch: DispatchD,
    maps: MapsState,
    editor: EditorState,
    params: { name: string },
    players: Map<string, Set<string>>,
  };

  state: {
    hover: ?string,
  } = {
    hover: null,
  };

  elo(table: string, who: string, map: string, elo: number) {
    return (
      <input
        className={theme.eloEditor}
        type="number"
        defaultValue={elo}
        onMouseEnter={() => this.setState({ hover: map })}
        onMouseLeave={() => this.setState({ hover: null })}
        onChange={(ev) => {
          const parse = parseInt(ev.target.value, 10);
          if (ev.target.value !== '' && parse) {
            this.props.dispatch(setRating({
              table,
              map,
              who,
              elo: parse,
            }));
          }
        }}
      />
    );
  }

  rows() {
    const r = [];
    const { editor: { table, name }, maps: { types }, players: allPlayers } = this.props;
    const players = allPlayers.get(name) || new Set();
    const indices: number[] = [];
    let i = 0;
    table.forEach((row, who) => {
      const ratings = [];
      types.forEach((type) => {
        const elo: number = row.get(type) || defaultElo;
        const key: string = `td-${who}-${type}`;
        ratings.push(<td key={key}>
          {this.elo(name, who, type, elo)}
        </td>);
      });
      const key: string = `tr-${who}`;
      const has: boolean = players.has(who);
      const toggle = () => {
        if (!has) {
          this.props.dispatch({
            type: 'ADD_PLAYER_TO_TEAMS',
            table: name,
            player: who,
          });
        } else {
          this.props.dispatch({
            type: 'REMOVE_PLAYER_FROM_TEAMS',
            table: name,
            player: who,
          });
        }
      };
      if (has) {
        indices.push(i);
      }
      r.push(
        <TableRow key={key}>
          <td>
            <div onClick={toggle} className={theme.who}>
              <Label className={theme.whoLabel}> {who} </Label>
              <Button
                size="xsmall"
                align="end"
                icon={has ? <RemoveIcon /> : <AddIcon />}
                onClick={toggle}
              />
            </div>
          </td>
          {ratings}
        </TableRow>,
      );
      i += 1;
    });
    return [r, indices];
  }

  header() {
    const types = this.props.maps.types;
    return ['who'].concat(types).map(content =>
      <span>
        {this.state.hover === content ? <EditIcon size="xsmall" /> : null}
        {content}
      </span>,
    );
  }

  render() {
    const { types } = this.props.maps;
    if (types.length === 0) {
      return null;
    }
    const [rows, indices] = this.rows();
    return (<div>
      {this.props.editor.loading ? <Spinning /> : null}
      <Table
        selectable
        className={theme.table}
        selected={indices}
      >
        <TableHeader labels={this.header()} />
        <tbody>
          {rows}
          <TableRow>
            <td colSpan={types.length + 1}>
              <input
                type="text"
                placeholder="Add a player ..."
                onKeyPress={(event) => {
                  if (event.key === 'Enter') {
                    const target = event.target;
                    const who: ?string = target.value;
                    if (
                      who &&
                      who !== '' &&
                      !this.props.editor.table.has(who)
                    ) {
                      this.props.dispatch(setRating({
                        table: this.props.editor.name,
                        who,
                        map: types[0],
                        elo: defaultElo,
                      })).then(() => {
                        target.value = '';
                      });
                    }
                  }
                }}
              />
            </td>
          </TableRow>
        </tbody>
      </Table>,
    </div>);
  }
}

export default connect(
  s => ({
    editor: s.editor,
    maps: s.maps,
    players: s.players,
  }),
)(Editor);
