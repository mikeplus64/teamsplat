/* @flow */
import React from 'react';
import Button from 'grommet/components/Button';
import Form from 'grommet/components/Form';
import FormFields from 'grommet/components/FormFields';
import Header from 'grommet/components/Header';
import Footer from 'grommet/components/Footer';
import Heading from 'grommet/components/Heading';
import TextInput from 'grommet/components/TextInput';

export default class NewTable extends React.PureComponent {
  state: { i?: string } = {};
  render() {
    return (
      <Form>
        <Header>
          <Heading tag="h3">New table</Heading>
        </Header>
        <FormFields>
          <TextInput
            value={this.state.i || ''}
            onDOMChange={ev => this.setState({ i: ev.target.value })}
            type="text"
            placeHolder="Table name"
            onSelect={i => this.setState({ i: i.suggestion })}
          />
        </FormFields>
        <Footer pad={{ vertical: 'medium' }}>
          <Button
            primary
            label="Go"
            path={`/table/${this.state.i || 'new'}`}
          />
        </Footer>
      </Form>
    );
  }
}
