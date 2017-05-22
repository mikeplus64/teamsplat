// @flow
import React from 'react';
import { connect } from 'react-redux';
import type { DispatchD } from '../types';
import { getTables } from '../actions';
import List from 'grommet/components/List';
import ListItem from 'grommet/components/ListItem';

const nothing = {};
class Tables extends React.PureComponent {
  props: {
    dispatch: DispatchD,
    router: { push: (url: string) => void },
  };

  state: {
    page: number,
    maxPage: ?number,
    tables: { [page: number]: string[] },
  } = {
    page: 0,
    maxPage: null,
    tables: {},
  };

  getPage(page) {
    return this.props.dispatch(getTables(page)).then((tables) => {
      if (tables.length === 0) {
        this.setState({ maxPage: this.state.page });
      } else {
        this.setState({
          page: page + 1,
          tables: {
            ...this.state.tables,
            [page]: tables,
          },
        });
      }
    });
  }

  getMore() {
    const { page, maxPage } = this.state;
    if (maxPage != null && page < maxPage) {
      this.getPage(page + 1);
    }
  }

  componentWillMount() {
    this.getPage(0);
  }

  render() {
    const flat = [];
    const { page, tables } = this.state;
    for (let i = 0; i < page; i += 1) {
      const table = tables[i];
      for (let j = 0; j < table.length; j += 1) {
        flat.push(table[j]);
      }
    }
    return (
      <List onMore={() => this.getMore()}>
        {flat.map(table =>
          <ListItem
            key={table}
            onClick={() => {
              this.props.router.push(`/table/${table}`);
            }}
          >
            {table}
          </ListItem>)}
      </List>
    );
  }
}

export default connect(() => nothing)(Tables);

