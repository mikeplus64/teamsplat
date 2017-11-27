// @flow
// eslint react/no-array-index-key: "off"
import React from 'react';
import autobind from 'core-decorators/lib/autobind';
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
import { Set, Map } from 'immutable';
import debounce from 'lodash/debounce';
import type { EditorState, DispatchD, MapsState, Rating } from '../types';
import { getMaps, viewTable, setRating } from '../actions';
import ErrorMaker from './Error.jsx';
import theme from './Editor.css';
import { defaultElo } from '../constants';

function cmp<T>(a: T, b: T): number {
  if (a === b) { return 0; }
  if (typeof a === 'string' && typeof b === 'string') { return a.localeCompare(b); }
  if ((a: any) < (b: any)) { return -1; }
  return 1;
}

function comparison<T, V>(
  column: T => V,
  ascending: boolean,
): (a: T, b: T) => number {
  const asc = ascending ? 1 : -1;
  return (a, b) => asc * cmp(column(a), column(b));
}
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
    ascending: boolean,
    sortIndex: number,
    waiting: Map<string, Set<string>>,
    failed: Map<string, Set<string>>,
    error: ?string,
  } = {
    hover: null,
    ascending: true,
    sortIndex: 0,
    waiting: new Map(),
    failed: new Map(),
    error: null,
  };

  componentWillMount() {
    this.props.dispatch(getMaps);
    this.props.dispatch(viewTable(this.props.params.name));
  }

  debouncedSetRating: <A> (
    rating: Rating,
    resolve: (v: any) => any,
    reject: (v: any) => any,
  ) => void = debounce(
    (r, resolve, reject) => this.props.dispatch(setRating(r)).then(resolve, reject),
    200,
  );

  eloCls(who: string, map: string) {
    const { waiting, failed } = this.state;
    if (waiting.get(who, new Set()).has(map)) {
      return theme.waiting;
    }
    if (failed.get(who, new Set()).has(map)) {
      return theme.failed;
    }
    return '';
  }

  elo(table: string, who: string, map: string, elo: number) {
    return (
      <input
        className={`${theme.eloEditor} ${theme.p0} ${this.eloCls(who, map)}`}
        type="number"
        defaultValue={elo}
        onMouseEnter={() => this.setState({ hover: map })}
        onMouseLeave={() => this.setState({ hover: null })}
        onChange={(ev) => {
          const parse = parseInt(ev.target.value, 10);
          if (ev.target.value !== '' && parse) {
            this.setState({ waiting: this.state.waiting.set(who, Set.of(map)) });
            this.debouncedSetRating({
              table,
              map,
              who,
              elo: parse,
            }, () => {
              this.setState(s => ({
                waiting: s.waiting.update(who, t => t.remove(map)),
                error: null,
              }));
            }, () => {
              this.setState(s => ({
                failed: s.failed.update(who, t => t.remove(map)),
                error: 'You need to enter the table password to edit the table.',
              }));
            });
          }
        }}
      />
    );
  }

  rows() {
    const { ascending, sortIndex } = this.state;
    const {
      editor: { searchedTable: table, name },
      maps: { types },
      players: allPlayers,
    } = this.props;
    const players = allPlayers.get(name) || new Set();
    const indices: number[] = [];

    const rows = [];
    table.forEach((row, who) => {
      const ratings = [];
      const has: boolean = players.has(who);
      types.forEach((type) => {
        const elo: number = row.get(type) || defaultElo;
        ratings.push({ type, elo });
      });
      rows.push({ who, ratings, has });
    });

    const sortMethod = sortIndex === 0 ?
      comparison(a => a.who, ascending) :
      comparison(a => a.ratings[sortIndex - 1].elo, ascending);

    const sorted = rows.sort(sortMethod);

    const renderedRows = [];
    for (let i = 0; i < sorted.length; i += 1) {
      const { who, ratings, has } = sorted[i];
      const toggleSelection = () => {
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
      if (has) { indices.push(i); }
      const columns = [<td key={`td-${who}-name`}>
        <div onClick={toggleSelection} className={theme.who}>
          <Label className={theme.whoLabel}> {who} </Label>
          <Button
            size="xsmall"
            align="end"
            icon={has ? <RemoveIcon /> : <AddIcon />}
            onClick={toggleSelection}
          />
        </div>
      </td>];
      for (let j = 0; j < ratings.length; j += 1) {
        const { type, elo } = ratings[j];
        columns.push(<td className={theme.elo} key={`td-${who}-${type}`}>
          {this.elo(name, who, type, elo)}
        </td>);
      }
      renderedRows.push(<TableRow key={`tr-${who}`} selected={has}>
        {columns}
      </TableRow>);
    }
    return [renderedRows, indices];
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

  @autobind
  onSort(sortIndex, ascending) {
    this.setState({ sortIndex, ascending });
  }

  render() {
    const { types } = this.props.maps;
    const { ascending, sortIndex } = this.state;
    if (types.length === 0) {
      return null;
    }
    const [rows, indices] = this.rows();
    return (<div className={theme.editorWrapper}>
      {this.props.editor.loading ? <Spinning /> : null}
      <Table
        className={theme.editor}
        selected={indices}
        selectable="multiple"
        scrollable
      >
        <TableHeader
          labels={this.header()}
          onSort={this.onSort}
          sortAscending={ascending}
          sortIndex={sortIndex}
        />
        <tbody>
          {rows}
        </tbody>
      </Table>
      {ErrorMaker.call(this)}
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
