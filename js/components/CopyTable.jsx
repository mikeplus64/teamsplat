/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import Box from 'grommet/components/Box';
import Button from 'grommet/components/Button';
import Form from 'grommet/components/Form';
import FormFields from 'grommet/components/FormFields';
import FormField from 'grommet/components/FormField';
import Footer from 'grommet/components/Footer';
import TextInput from 'grommet/components/TextInput';
import type { DispatchD } from '../types';
import { postCopyByFromByToByPassword } from '../api';
import { setPassword } from '../actions';
import { error } from './Error';

class NewTable extends React.PureComponent {
  props: {
    router: { push: (url: string) => void },
    dispatch: DispatchD,
  };

  state: {
    src: string,
    dest: string,
    destpw: string,
    error: null | string,
  } = {
    src: '',
    dest: '',
    destpw: '',
    error: null,
  };

  setSrc = ev => this.setState({ src: ev.target.value });
  setDest = ev => this.setState({ dest: ev.target.value });
  setDestPw = ev => this.setState({ destpw: ev.target.value });

  doCopy() {
    const { src, dest, destpw } = this.state;
    postCopyByFromByToByPassword(src, dest, destpw, () => {
      this.props.dispatch(setPassword(dest, destpw, true));
      this.props.router.push(`/table/${encodeURIComponent(dest)}`);
    }, (v) => {
      this.setState({ error: 'Could not copy table.\n' + JSON.stringify(v) });
    });
  }

  render() {
    const { src, dest, destpw } = this.state;
    return (<Box pad="medium">
      {error(this)}
      <Form>
        <p>
          Copy a table. The new table must not already exist. You do not need
          the password to access the existing table, but you will need to
          specify the password to the new one.
        </p>
        <FormFields>
          <FormField label="Source table name" htmlFor="source-table-name">
            <TextInput id="source-table-name" type="text" onDOMChange={this.setSrc} value={src} />
          </FormField>
          <FormField label="New table name" htmlFor="new-table-name">
            <TextInput id="new-table-name" type="text" onDOMChange={this.setDest} value={dest} />
          </FormField>
          <FormField label="New table password" htmlFor="new-table-name">
            <TextInput id="new-table-name" type="text" onDOMChange={this.setDestPw} value={destpw} />
          </FormField>
        </FormFields>
        <Footer pad={{ vertical: 'medium' }}>
          <Button
            primary
            label="Copy"
            onClick={() => {
              if (this.state.src !== '' && this.state.dest !== '') {
                this.doCopy(this.state.i);
              }
            }}
          />
        </Footer>
      </Form>
    </Box>);
  }
}

export default connect()(NewTable);
