// @flow
import { connect } from 'react-redux';
import React from 'react';
import SearchInput from 'grommet/components/SearchInput';
import Label from 'grommet/components/Label';
import type { DispatchD } from '../types';
import { searchFor } from '../actions';
import theme from './TableControls.css';

class TableControls extends React.PureComponent {
  props: {
    query: string,
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
          <Label size="xsmall"> Filter </Label>
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

export default connect(({ editor: { query } }) => ({
  query,
}), null)(TableControls);

