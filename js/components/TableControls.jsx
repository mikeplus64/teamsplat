// @flow
import { connect } from 'react-redux';
import React from 'react';
import SearchInput from 'grommet/components/SearchInput';
import TextInput from 'grommet/components/TextInput';
import Label from 'grommet/components/Label';
import type { DispatchD } from '../types';
import { searchFor, setPassword } from '../actions';
import theme from './TableControls.css';

class TableControls extends React.PureComponent {
  props: {
    query: string,
    table: string,
    password: string,
    dispatch: DispatchD,
  };

  render() {
    return (
      <div
        style={{
          borderTop: '1px solid white',
          paddingTop: '1em',
          marginTop: '1em',
        }}
      >
        <div style={{ padding: '0 1em' }}>
          <Label size="small"> Password </Label>
        </div>
        <div style={{ padding: '0 1em' }}>
          <TextInput
            className={theme.input}
            placeHolder="Password ..."
            value={this.props.password}
            onDOMChange={(ev) => {
              this.props.dispatch(setPassword(this.props.table, ev.target.value));
            }}
          />
        </div>
        <div style={{ padding: '0 1em' }}>
          <Label size="small"> Filter </Label>
        </div>
        <div style={{ padding: '0 1em' }}>
          <SearchInput
            className={theme.search}
            placeHolder="Name ..."
            value={this.props.query}
            onDOMChange={(ev) => {
              this.props.dispatch(searchFor(ev.target.value));
            }}
            style={{ width: '100%', padding: '5px 10px' }}
          />
        </div>
      </div>
    );
  }
}

export default connect(({
  editor: { name, query },
  passwords,
}) => ({
  query,
  password: passwords.get(name),
}), null)(TableControls);

