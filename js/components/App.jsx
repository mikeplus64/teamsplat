import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Header from 'grommet/components/Header';
import Grommet from 'grommet/components/App';
import Title from 'grommet/components/Title';
import Footer from 'grommet/components/Footer';
import Article from 'grommet/components/Article';

export default class App extends React.PureComponent {
  props: {
    children: ReactElement;
  };

  home() {
    return (
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/T0qagA4_eVQ"
        frameborder="0"
        allowfullscreen
      />
    );
  }

  render() {
    return (
      <Grommet>
        <Header size="small">
          <Title> Team splatter </Title>
          <Link to="/">Home</Link>
          <Link to="/table">New table</Link>
          <Link to="/tables">Table select</Link>
        </Header>
        <article>
          {this.props.children || this.home()}
        </article>
        <Footer primary appCentered size="small">
          <p>
            By{' '}
            <a href="mailto:mike@quasimal.com">Mike Ledger</a>
            {' & '}
            <a href="http://voobly.com">Kurt &quot;voidhawk&quot;</a>
          </p>
        </Footer>
      </Grommet>
    );
  }
}
