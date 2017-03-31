import React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import Header from 'grommet/components/Header';
import Grommet from 'grommet/components/App';
import Title from 'grommet/components/Title';
import Footer from 'grommet/components/Footer';
import Article from 'grommet/components/Article';
import Quote from 'grommet/components/Quote';

export default class App extends React.PureComponent {
  props: {
    children: ReactElement;
  };

  content() {
    if (this.props.children) {
      return <article>{this.props.children}</article>;
    } else {
      return [
        <article key="home">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/T0qagA4_eVQ"
            frameborder="0"
            allowfullscreen
          />
        </article>,
        <Footer key="credit" primary appCentered size="small">
          <p>
            By{' '}
            <a href="mailto:mike@quasimal.com">mike</a> and{' '}
            <a href="http://www.voobly.com/profile/view/124274399">voidhawk</a>
          </p>
        </Footer>
      ];
    }
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
        {this.content()}
      </Grommet>
    );
  }
}
