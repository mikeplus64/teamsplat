// @flow
import { autobind } from 'core-decorators';
import { connect } from 'react-redux';
import React from 'react';
import SearchInput from 'grommet/components/SearchInput';
import TextInput from 'grommet/components/TextInput';
import Label from 'grommet/components/Label';
import Button from 'grommet/components/Button';
import Menu from 'grommet/components/Menu';
import type { DispatchD } from '../types';
import { searchFor, selectNames } from '../actions';
import theme from './TableControls.css';

class TableControls extends React.PureComponent {
  props: {
    query: string,
    table: string,
    dispatch: DispatchD,
  };

  state: {
    quickNames: string,
  } = {
    quickNames: '',
  };

  @autobind
  quickSelect() {
    this.props.dispatch(selectNames(this.props.table, this.state.quickNames));
  }

  @autobind
  deselectAll() {
    this.props.dispatch({ type: 'DROP_SELECTION' });
  }

  render() {
    return (
      <Menu
        className={theme.panel}
        primary={false}
        size="small"
      >
        <Label className={theme.panelHeader}> Filter </Label>
        <SearchInput
          className={theme.search}
          placeHolder="Name ..."
          value={this.props.query}
          onDOMChange={(ev) => {
            this.props.dispatch(searchFor(ev.target.value));
          }}
          style={{ width: '100%', padding: '5px 10px' }}
        />

        <Label className={theme.panelHeader}> Quick select </Label>
        <p className={theme.help}>
          Enter names separated by spaces; hit &quot;quick select&quot;, and
          the teamsplatter will do its best to select the matching players.
        </p>
        <TextInput
          className={theme.quick}
          value={this.state.quickNames}
          onDOMChange={ev => this.setState({ quickNames: ev.target.value })}
          placeHolder="Names ..."
        />
        <Button label="Quick select" onClick={this.state.quickNames !== '' ? this.quickSelect : undefined} />
        <Button label="Deselect all" onClick={this.deselectAll} />
      </Menu>
    );
  }
}

export default connect(({ editor: { name, query } }) => ({
  table: name,
  query,
}), null)(TableControls);

