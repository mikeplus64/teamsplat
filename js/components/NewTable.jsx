/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { keys } from 'lodash';
import Button from 'grommet/components/Button';
import Form from 'grommet/components/Form';
import FormFields from 'grommet/components/FormFields';
import FormField from 'grommet/components/FormField';
import Footer from 'grommet/components/Footer';
import TextInput from 'grommet/components/TextInput';
import type { OldStyleTable, DispatchD } from '../types';
import { startLoading, stopLoading, setRating } from '../actions';

class NewTable extends React.PureComponent {
  props: {
    dispatch: DispatchD
  };

  state: {
    i?: string,
    import?: string,
  } = {};

  doImports(table: string, imports: OldStyleTable) {
    this.props.dispatch(startLoading(table));
    const players = keys(imports);
    const r: Promise<any>[] = [];
    for (let i = 0; i < players.length; i += 1) {
      const who: string = players[i];
      const { boomc, boomo, open, water, nomad } = imports[who];
      const set = (map: string, eloS: string) => {
        const elo = parseInt(eloS, 10);
        if (elo) {
          return this.props.dispatch(setRating({ table, who, map, elo }));
        }
        return Promise.resolve();
      };
      r.push(Promise.all([
        set('boom (open)', boomo),
        set('boom (closed)', boomc),
        set('open', open),
        set('water', water),
        set('nomad', nomad),
      ]));
    }
    return Promise.all(r).then(() => {
      this.props.dispatch(stopLoading(table));
    }).catch(() => {
      this.props.dispatch(stopLoading(table));
    });
  }

  startImports(table: string) {
    let p = Promise.resolve();
    if (this.state.import != null && this.state.import !== '') {
      const imports: OldStyleTable = JSON.parse(this.state.import);
      if (!imports) { return p; }
      p = this.doImports(table, imports);
    }
    return p;
  }

  render() {
    return (
      <Form>
        <p>
          Trying to create a table that already exists will do nothing
          but take you to that table. Data can be imported into a new
          table as well as existing ones using this interface.
        </p>

        <FormFields>
          <FormField
            label="Table name"
            htmlFor="table-name"
          >
            <TextInput
              id="table-name"
              value={this.state.i || ''}
              onDOMChange={ev => this.setState({ i: ev.target.value })}
              type="text"
              onSelect={i => this.setState({ i: i.suggestion })}
            />
          </FormField>
          <FormField
            label="Import data"
            htmlFor="table-name"
          >
            <textarea
              placeholder="Data from older team splitter ..."
              onChange={ev => this.setState({ import: ev.target.value })}
            />
          </FormField>
        </FormFields>
        <Footer pad={{ vertical: 'medium' }}>
          <Button
            primary
            label="Go"
            onClick={() => {
              if (this.state.i && this.state.import) {
                this.startImports(this.state.i);
              }
            }}
            path={`/table/${this.state.i || 'new'}`}
          />
        </Footer>
      </Form>
    );
  }
}

export default connect()(NewTable);
