// @flow
import autobind from 'core-decorators/lib/autobind';
import { connect } from 'react-redux';
import React from 'react';
import SearchInput from 'grommet/components/SearchInput';
import TextInput from 'grommet/components/TextInput';
import Button from 'grommet/components/Button';
import Menu from 'grommet/components/Menu';
import Select from 'grommet/components/Select';
import Layer from 'grommet/components/Layer';
import Actions from 'grommet/components/icons/base/Menu';
import type { DispatchD, MapsState, Team, EditorTable } from '../types';
import {
  searchFor,
  setPassword,
  setTablePassword,
  selectNames,
  deletePlayers,
  selectMap,
  computeTeams,
  setRating,
} from '../actions';
import Teams from './Teams.jsx';
import ErrorMaker from './Error.jsx';
import theme from './TableControls.css';
import { defaultElo } from '../constants';

class TableControls extends React.PureComponent {
  props: {
    query: string,
    table: string,
    password: { text: string, isSet: boolean },
    allPlayers: EditorTable,
    players: string[],
    maps: MapsState,
    dispatch: DispatchD,
  };

  state: {
    quickNames: string,
    viewingTeams: boolean,
    teams: ?[?Team, ?Team],
    newPlayerName: ?string,
    error: ?string,
  } = {
    quickNames: '',
    viewingTeams: false,
    teams: null,
    newPlayerName: null,
    error: null,
  };

  @autobind
  quickSelect() {
    this.props.dispatch(selectNames(this.props.table, this.state.quickNames));
  }

  @autobind
  deselectAll() {
    this.props.dispatch({ type: 'DROP_SELECTION' });
  }

  @autobind
  addPlayer() {
    const who = this.state.newPlayerName;
    if (
      who != null &&
      who !== ''
    ) {
      const has = this.props.allPlayers.has(who);
      if (!has) {
        this.props.dispatch(setRating({
          table: this.props.table,
          who,
          map: this.props.maps.types[0],
          elo: defaultElo,
        })).then(() => {
          this.setState({ newPlayerName: null });
        }, () => {
          this.setState({ error: 'You need to set the password to edit the table.' });
        });
      } else {
        this.setState({
          error: `Cannot add player: ${JSON.stringify(who)}.\n` +
                (has ? 'They are already in the table.' : ''),
        });
      }
    }
  }

  oxfordCommaPlayers() {
    const { players: array } = this.props;
    const r = [];
    if (array.length === 0) {
      return <span>No players selected</span>;
    }
    for (let i = 0; i < array.length - 1; i += 1) {
      const a = array[i];
      r.push(<i key={`i-${a}`}>{a}</i>);
      r.push(', ');
    }
    if (array.length > 1) {
      const a = array[array.length - 1];
      r.push('and ');
      r.push(<i key={`i-${a}`}>{a}</i>);
    } else {
      const a = array[0];
      r.push(<i key={`i-${a}`}>{a}</i>);
    }
    return <span>Selected players ({array.length}): {r}</span>;
  }

  render() {
    const { isSet: hasAuth } = this.props.password;
    return (
      <Menu
        className={theme.panel}
        primary={false}
        size="small"
      >
        {ErrorMaker.call(this)}
        {hasAuth ? null : [
          <hr key="auth-hr" />,
          <label key="auth-label" className={theme.label} htmlFor="table-password">
            Shared table password
          </label>,
          <p key="auth-help"className={theme.help}>
            If you can see this it means you cannot edit anything in this table.
          </p>,
          <TextInput
            key="auth-text-input"
            id="table-password"
            className={theme.input}
            placeHolder="Password"
            onKeyDown={(ev) => {
              if (ev.keyCode === 13) {
                this.props.dispatch(setPassword(this.props.table, ev.target.value));
              }
            }}
            onDOMChange={(ev) => {
              this.props.dispatch(setPassword(this.props.table, ev.target.value));
            }}
          />,
          <Button
            key="auth-button"
            critical
            label="Set password"
            onClick={() => {
              this.props.dispatch(setTablePassword(this.props.table));
            }}
          />,
        ]}
        <Layer
          align="center"
          hidden={!this.state.viewingTeams}
          closer
          onClose={() => this.setState({ viewingTeams: false })}
        >
          <Teams
            players={this.props.players}
            teams={this.state.teams}
          />
        </Layer>
        <hr />
        <label className={theme.label} htmlFor="search">
          Search
        </label>
        <SearchInput
          id="search"
          className={theme.search}
          placeHolder="Name ..."
          value={this.props.query}
          onDOMChange={(ev) => {
            this.props.dispatch(searchFor(ev.target.value));
          }}
          style={{ width: '100%', padding: '5px 10px' }}
        />

        <label className={theme.label} htmlFor="quicksel"> Quick select </label>
        <p className={theme.help}>
          Enter names separated by spaces; hit &quot;quick select&quot;, and
          the teamsplatter will do its best to select the matching players.
        </p>
        <TextInput
          id="quicksel"
          className={theme.quick}
          value={this.state.quickNames}
          onDOMChange={(ev) => {
            this.setState({ quickNames: ev.target.value });
          }}
          onKeyDown={(ev) => {
            if (ev.keyCode === 13 && this.state.quickNames !== '') {
              this.quickSelect();
            }
          }}
          placeHolder="Names ..."
        />
        <Button label="Quick select" onClick={this.state.quickNames !== '' ? this.quickSelect : undefined} />
        <Button label="Deselect all" onClick={this.deselectAll} />
        <hr />
        <p className={theme.help}>{this.oxfordCommaPlayers()}</p>
        <label htmlFor="mapsel">Map</label>
        <Select
          id="mapsel"
          placeHolder="None"
          inline={false}
          icon={<Actions />}
          options={this.props.maps.types}
          onChange={({ option }) => this.props.dispatch(selectMap(option))}
          value={this.props.maps.selected}
        />
        <Button
          primary
          label="Generate teams"
          onClick={() => this.props.dispatch(computeTeams).then((teams) => {
            this.setState({
              viewingTeams: true,
              teams,
            });
          })}
        />
        <hr />
        <TextInput
          className={theme.input}
          placeHolder="New player name ..."
          onDOMChange={(ev) => {
            this.setState({ newPlayerName: ev.target.value });
          }}
        />
        <Button
          label="Add player"
          onClick={(this.state.newPlayerName != null &&
                    this.state.newPlayerName !== '') ?
                   this.addPlayer :
                   undefined}
          primary
        />
        <Button
          critical
          label="Delete selection"
          onClick={this.props.players.length > 0 ? (() => {
            const table = this.props.table;
            const sel: string[] = this.props.players;
            if (sel.length === 0) { return; }
            const ok: boolean = confirm(
              'Really delete ' + JSON.stringify(sel, null, 2) +
              '?\nThis cannot be undone.');
            if (ok) {
              this.props.dispatch(deletePlayers(table, sel));
            }
          }) : undefined}
        />
      </Menu>
    );
  }
}

const noPlayers = [];
export default connect(({
  editor: { name, query, table },
  players,
  maps,
  passwords,
}) => ({
  table: name, // wew 1
  allPlayers: table, // wew 2
  query,
  // below is the selected players
  // bad naming but hard to rename lol
  // in future don't bother renaming crap from the redux store
  players: (ps => (ps ? ps.toArray() : noPlayers))(players.get(name)),
  password: passwords.get(name, { text: '', isSet: false }),
  maps,
}), null)(TableControls);

